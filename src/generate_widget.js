function onInstall(e) {
  onOpen(e);
  // Perform additional setup as needed.
}

function onOpen(e) {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu('Fact Widget')
      .addItem('Create Widget', 'createWidget')
      .addSeparator()
      .addToUi();
}

function createWidget() {
  // Retreive the spreadsheet currently open
  // Everything will break unless "Sheet1" is open, which contains the facts
  var sheet = SpreadsheetApp.getActiveSpreadsheet();
  // Go to the second sheet, which contains the various organizations' info
  var orgSheet = sheet.getSheetByName('org_info')

  // This gets all the cells of the fact selected
  var row = sheet.getActiveCell().getRow();
  // This, for now, defaults to the top organization in "org_info"
  var org_values = orgSheet.getSheetValues(2, 1, 1, 4);
  // Get the values for the selected fact
  // To add more values, increase this number
  var values = sheet.getSheetValues(row, 1, 1, 15);
  
  // Create the widget from the "widget_template.html" file
  var t = HtmlService.createTemplateFromFile('widget_template');
  // No idea what this is
  t.stype = 'application/ld+json';
  
  // TODO: put these in order, so we can easily add fields without
  // screwing up the column numbers. 
  
  // "org_info" page, "OrgURL" column
  t.org_url = org_values[0][2];
  // "org_info" page, "LogoImage" column
  t.logo_image = org_values[0][1];
  // "org_info" page, "MaxRating" column
  t.max_rating = org_values[0][0];
  // "org_info" page, "TwitterHandle" column
  t.twitter_handle = org_values[0][4];
  // "Sheet1" page, "SpeakerImage" column
  t.speaker_image = values[0][5];
  // "Sheet1" page, "Statement" column  
  t.title = values[0][1];
  // "Sheet1" page, "Speaker" column  
  t.speaker = values[0][3];
  // "Sheet1" page, "InfoSource" column  
  t.speaker_context = values[0][6];
  // "Sheet1" page, "Link" column  
  t.link = values[0][11];
  // "Sheet1" page, "PubDate" column  
  t.date = values[0][12];
  // "Sheet1" page, "Statement" column (again?)  
  t.fact = values[0][1];
  // "Sheet1" page, "Date" column
  // Convert date to format 'Friday, September 21, 2015  
  var date = new Date(values[0][2]);
  var ordinal_day = getOrdinal(date.getDay());
  
  t.fact_date = Utilities.formatDate(date, 'EST', "EEEEEEE, MMMMMM '"+ordinal_day+"', yyyy");
  // "Sheet1" page, "SpeakerTitle" column
  Logger.log(values);
  t.speaker_title = values[0][14]; 
  // "Sheet1" page, "SourceName" colum
  t.source_name = values[0][13]
  // "Sheet1" page, "RatingText" column...twice
  var rating_text = values[0][9]
  t.rating_text = values[0][9];
  // "Sheet1" page, "RatingDescription" column  
  var rating_description = values[0][8];
  // "Sheet1" page, "RatingImage" column    
  var rating_image = values[0][10];
  // "Sheet1" page, "Rating" column    
  var rating_number = values[0][7];
  
  // Check to make sure the rating is not higher than the most allowed
  // by the organization
  if (rating_number != null && rating_number > 0) {
    t.rating_num = rating_number;
  }
  else {
    // This should probably fail spectacularly instead of random number
    t.rating_num = -1;
  }
  
  // Organization image plus, if available, rating image.
  // Goes in the top right-hand corner.
  // TODO: use rating_description when no rating_image specified?
  t.rating_summary = "help"
  if (rating_image != "") {
     t.rating_summary = '<img src="' + rating_image + '"><img src="' + t.logo_image + '">';
  } else if (rating_text != "") {
      t.rating_summary = '<b>Rating:</b> ' + rating_text + '<img src="' + t.logo_image + '">'
  }
  else {
      t.rating_summary = '<b>Rating:</b> ' + rating_description + '<img src="' + t.logo_image + '">';
  }
  
  // Get the shareable image for the sharing links
  var share_object = getShareableImage(t.link, t.speaker, t.speaker_title, t.title, t.speaker_image, rating_image, t.org_url, t.twitter_handle, t.logo_image, t.max_rating, rating_number, t.source_name, t.date);
  t.shareable_image = share_object['image_url'];
  t.shareable_link = share_object['share_url'];
  
  // Get the final HTML
  var output = t.evaluate().getContent();
  
  // Make the box to show the code for embedding
  var html = HtmlService.createTemplateFromFile('menu_template');
  html.div_html = output;
  var html_out = html.evaluate()
      .setSandboxMode(HtmlService.SandboxMode.IFRAME)
      .setWidth(400)
      .setHeight(300);
      
  // Show the view on the screen
  SpreadsheetApp.getUi() // Or DocumentApp or FormApp.
      .showModalDialog(html_out, 'Widget Embed Code');
}

function testGetShareableImage(){
  getShareableImage("http://www.politifact.com/truth-o-meter/statements/2016/feb/12/hillary-clinton/did-bernie-sanders-call-president-barack-obama-wea/",
                    "Hillary Clinton", "Democratic Presidential Candidate", "Says Sen. Bernie Sanders has called President Barack Obama \"weak. He's called him a disappointment.\"",
                    "http://static.politifact.com.s3.amazonaws.com/politifact%2Fmugs%2Fclinton_mug.jpg",
                    "http://static.politifact.com.s3.amazonaws.com/rulings%2Ftom-halftrue.gif",
                    "http://www.politifact.com", "@politifact", "http://static.politifact.com/mediapage/jpgs/politifact-logo-big.jpg",
                    "6", "3", "PBS Democratic debate", "2016-2-14");
}

function getShareableImage(url, speaker, speaker_title, statement, speakerImage, ratingImage, org_url, twitter, logo_image, max_rating, rating_number, source_name, date_published){
  var current_date = new Date();
  
  var payload = {
      "@context": "http://schema.org",
      "@type": ["Review", "ClaimReview"],
      "datePublished": current_date.getYear() + "-" + current_date.getMonth() + "-" + current_date.getDay()+1,
      "url": url,
      "author": {
        "@type": "Organization",
        "url": org_url,
        "twitter": twitter
      },
      "claimReviewed": statement,
      "claimReviewSiteLogo": logo_image,
      "reviewRating": {
        "@type": "Rating",
        "ratingValue": rating_number,
        "bestRating": max_rating,
        "image": ratingImage
      },
      "itemReviewed": {
        "@type": "CreativeWork",
        "author": {
          "@type": "Person",
          "name": speaker,
          "title": speaker_title,
          "image": speakerImage,
          "sameAs": [
            "https://en.wikipedia.org/wiki/Rick_Perry",
            "https://rickperry.org/"
          ]
        },
        "datePublished": date_published,
        "sourceName": source_name
      }
    }

  var requestURL = "https://fact-reporter.herokuapp.com/generate";
  var options = {
    "method": "post",
    "payload": JSON.stringify(payload)
  }
  //Logger.log(JSON.stringify(payload));

  var response = UrlFetchApp.fetch(requestURL, options);
  //var responseText = response.getContentText();
  //Logger.log(responseText);

  return JSON.parse(response.getContentText());
}

// found here http://forums.shopify.com/categories/2/posts/29259

var getOrdinal = function(n) {
   var s=["th","st","nd","rd"],
       v=n%100;
   return n+(s[(v-20)%10]||s[v]||s[0]);
}