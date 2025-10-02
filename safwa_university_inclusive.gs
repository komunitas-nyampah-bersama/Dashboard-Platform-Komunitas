/**
 * Google Apps Script entry point for serving the Safwa University inclusive education page.
 * Deploy as a Web App to make the content publicly accessible.
 */
function doGet() {
  return HtmlService.createHtmlOutputFromFile('safwa_university_inclusive')
    .setTitle('Safwa University of Indonesia - Model Inovasi Pendidikan Inklusif')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}
