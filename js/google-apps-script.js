/**
 * MoveMitra — Google Apps Script
 * ------------------------------------------------------------
 * SETUP:
 * 1. Create a new Google Sheet. Add a header row in this exact order:
 *    Timestamp | Name | Email | Mobile | From | To | Move Date | Service Type | Message
 * 2. In the Sheet, go to Extensions > Apps Script.
 * 3. Delete any starter code and paste this file in.
 * 4. Click Deploy > New deployment > Select type "Web app".
 *      - Execute as: Me
 *      - Who has access: Anyone
 * 5. Copy the Web App URL it gives you and paste it into
 *    js/contact.js as SHEET_WEBAPP_URL.
 * ------------------------------------------------------------
 */

function doPost(e) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    const data = JSON.parse(e.postData.contents);

    sheet.appendRow([
      new Date(),
      data.name || '',
      data.email || '',
      data.mobile || '',
      data.from || '',
      data.to || '',
      data.moveDate || '',
      data.serviceType || '',
      data.message || '',
    ]);

    return ContentService
      .createTextOutput(JSON.stringify({ result: 'success' }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ result: 'error', message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
