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
  var sheet = SpreadsheetApp.getActiveSpreadsheet();
  var orgSheet = sheet.getSheetByName('org_info')

  var row = sheet.getActiveCell().getRow();
  var org_values = orgSheet.getSheetValues(2, 1, 1, 3);
  var values = sheet.getSheetValues(row, 1, 1, 14);
  
  var t = HtmlService.createTemplateFromFile('widget_template');
  t.stype = 'application/ld+json';
  t.org_url = org_values[0][2];
  t.logo_image = org_values[0][1];
  t.max_rating = org_values[0][0];
  t.speaker_image = values[0][5];
  t.title = values[0][1];
  t.speaker = values[0][3];
  t.speaker_context = values[0][6];
  t.link = values[0][11];
  t.date = values[0][12];
  t.fact = values[0][1];
  t.fact_date = values[0][2];
  
    // TODO: could we do the surrounding quotes in CSS?
  rating_text = values[0][9]
  t.rating_text = values[0][9];

  rating_description = values[0][8];
  rating_image = values[0][10];
  
  rating_number = values[0][7];
  if (rating_number != null && rating_number > 0) {
    t.rating_num = rating_number;
  }
  else {
    t.rating_num = -1;
  }
  
  // Organisation image plus, if available, rating image.
  // Goes in the top right-hand corner.
  // TODO: use rating_description when no rating_image specified?
  if (rating_image != "") {
    t.rating_summary = '<img src="' + rating_image + '"><img src="' + t.logo_image + '">';
  } else if (rating_text != "") {
      t.rating_summary = '<b>Rating:</b> ' + rating_text + '<img src="' + t.logo_image + '">'
  }
  else {
      t.rating_summary = '<b>Rating:</b> ' + rating_description + '<img src="' + t.logo_image + '">';
  }
  
  t.shareable_image = getShareableImage(t.speaker, t.title, t.speaker_image, rating_image).image_url;

  output = t.evaluate().getContent();
  
  var html = HtmlService.createTemplateFromFile('menu_template');
  html.div_html = output;
  var html_out = html.evaluate()
      .setSandboxMode(HtmlService.SandboxMode.IFRAME)
      .setWidth(400)
      .setHeight(300);
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
    "payload": payload
  }
  
  Logger.log(url);
  var response = UrlFetchApp.fetch(url, options);
  var responseText = response.getContentText();
  return JSON.parse(response.getContentText());
}