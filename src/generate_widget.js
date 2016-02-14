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
  var org_values = orgSheet.getSheetValues(2, 1, 1, 3);
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
  rating_text = values[0][9]
  t.rating_text = values[0][9];
  // "Sheet1" page, "RatingDescription" column  
  rating_description = values[0][8];
  // "Sheet1" page, "RatingImage" column    
  rating_image = values[0][10];
  // "Sheet1" page, "Rating" column    
  rating_number = values[0][7];
  
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
  //t.shareable_image = getShareableImage(t.speaker, t.title, t.speaker_image, rating_image).image_url;

  // Get the final HTML
  output = t.evaluate().getContent();
  
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
  getShareableImage("Martin O'Malley", "this is a \"fake\" test", "http://static.politifact.com.s3.amazonaws.com/politifact%2Fmugs%2Ftrump_1.jpg", "http://static.politifact.com.s3.amazonaws.com/rulings%2Ftom-pantsonfire.gif");
}

function getShareableImage(speaker, statement, speakerImage, ratingImage){
  var encodedSpeaker = encodeURIComponent(speaker);
  var encodedStatement = encodeURIComponent(statement);
  var encodedSpeakerImage = encodeURIComponent(speakerImage);
  var encodedRatingImage = encodeURIComponent(ratingImage);
  
  var payload = {
      "@context": "http://schema.org",
      "@type": ["Review", "ClaimReview"],
      "datePublished": "2014-07-23",
      "url": "http://www.politifact.com/texas/statements/2014/jul/23/rick-perry/rick-perry-claim-about-3000-homicides-illegal-immi/",
      "author": {
        "@type": "Organization",
        "url": "http://www.politifact.com/"
      },
      "claimReviewed": "More than 3,000 homicides were committed by \"illegal aliens\" over the past six years.",
      "claimReviewSiteLogo": "http://static.politifact.com/mediapage/jpgs/politifact-logo-big.jpg",
      "reviewRating": {
        "@type": "Rating",
        "ratingValue": 1,
        "bestRating": 6,
        "image": "http://static.politifact.com.s3.amazonaws.com/rulings/tom-pantsonfire.gif"
      },
      "itemReviewed": {
        "@type": "CreativeWork",
        "author": {
          "@type": "Person",
          "name": "Rich Perry",
          "title": "Former Governor of Texas",
          "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/15/Gov._Perry_CPAC_February_2015.jpg/440px-Gov._Perry_CPAC_February_2015.jpg",
          "sameAs": [
            "https://en.wikipedia.org/wiki/Rick_Perry",
            "https://rickperry.org/"
          ]
        },
        "datePublished": "2014-07-17",
        "sourceName": "The St. Petersburg Times"
      }
    }
  
  var url = "https://fact-reporter.herokuapp.com/generate";
  var options = {
    "method": "post",
    "payload": JSON.stringify(payload)
  }
  
  var response = UrlFetchApp.fetch(url, options);
  var responseText = response.getContentText();
  Logger.log(responseText);

  return JSON.parse(response.getContentText());
}

// found here http://forums.shopify.com/categories/2/posts/29259

var getOrdinal = function(n) {
   var s=["th","st","nd","rd"],
       v=n%100;
   return n+(s[(v-20)%10]||s[v]||s[0]);
}