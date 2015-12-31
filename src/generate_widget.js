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
  
  rating_number = values[0][7];
  
  rating_text = values[0][9].toString().toUpperCase();
  rating_description = values[0][8];
  rating_image = values[0][10];
  
  if (rating_number != null && rating_number > 0) {
    t.rating_num = rating_number;
  }
  else {
    t.rating_num = -1;
  }
  
  if (rating_text != "") {
    r1= '<h2>Rating: ' + rating_text + '<\/h2>';
    r2= '<img src=\"' + rating_image + '\" alt=\"Rating\">';
    t.rating_text_with_label = '<h2>Rating: ' + rating_text + '<\/h2>';
    t.rating_summary = '<img src=\"' + rating_image + '\" alt=\"Rating\">';
  }
  else if (rating_description != "") {
    t.rating_summary = '<h3>Rating: ' + rating_description + '<\/h3>';
    t.rating_text_with_label = '';
  }
  else { t.rating_text_with_label = ''; t.rating_summary = values[0][11]; }
  
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
