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

function createShareableImage(){
  var xhr = new XMLHttpRequest();
  xhr.open("GET", "https://fact-reporter.herokuapp.com/generate?statement=Canadian-born%20Ted%20Cruz%20%22has%20had%20a%20double%20passport.%22&speaker=Donald%20Trump&image=http://static.politifact.com.s3.amazonaws.com/politifact%2Fmugs%2Ftrump_1.jpg&rating=1", true);
  xhr.onload = function (e) {
    if (xhr.readyState === 4) {
      if (xhr.status === 200) {
        console.log(xhr.responseText);
      } else {
        console.error(xhr.statusText);
      }
    }
  };
  xhr.onerror = function (e) {
    console.error(xhr.statusText);
  };
  xhr.send(null);

}