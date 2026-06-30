# MoveMitra Website

A 4-page transport company website (Home, Services, About Us, Contact) built with plain HTML/CSS/JS, themed on your logo's blue + green palette.

## Files
```
index.html              Home page
services.html           Services page (Home Stuff / Vehicle / Small Goods)
about.html               About Us page (offices, story, values, map)
contact.html             Enquiry form with OTP verification
css/style.css            Shared styles
js/script.js              Shared nav + scroll animation behaviour
js/contact.js             Enquiry form, OTP flow, Google Sheet submission
google-apps-script.js     Paste-in script to receive form data into a Sheet
images/logo.png           Your logo
```

## Running it
Just open `index.html` in a browser — no build step needed. For local testing with the OTP/fetch flow behaving like production, serve the folder with any static server, e.g. `python3 -m http.server`.

## OTP verification — current state
Right now OTP runs in **demo mode**: a 4-digit code is generated in the browser and shown via `alert()` + the console, since there's no SMS backend wired up yet. This lets you test the full flow (enter code → verify → see success state) without any external account.

To send a **real SMS OTP**, you need a provider like MSG91, Twilio Verify, or Firebase Phone Auth — these require a server because the API key can't live in browser JS. The cleanest path with your stack:
1. Sign up for MSG91 (popular for Indian numbers) or similar.
2. Add an OTP-sending function to a small server — easiest is another Apps Script `doPost`, or a Cloud Function.
3. In `js/contact.js`, replace the `sendOtp()` body with a `fetch()` call to that endpoint. A commented MSG91 example is at the bottom of `js/contact.js`.

## Google Sheets — setup steps
1. Create a Google Sheet with header row: `Timestamp | Name | Email | Mobile | From | To | Move Date | Service Type | Message`.
2. In the Sheet: **Extensions → Apps Script**, delete the placeholder code, paste in `google-apps-script.js`.
3. **Deploy → New deployment → Web app**. Set "Execute as: Me" and "Who has access: Anyone". Deploy.
4. Copy the Web App URL Google gives you.
5. Open `js/contact.js` and paste that URL into the `SHEET_WEBAPP_URL` constant near the top.

Until you do this, submitted enquiries are safely kept in the browser's `localStorage` (key `movemitra_enquiries`) so nothing is lost — you'll see a console warning reminding you to connect the Sheet.

## Customizing
- Phone numbers, addresses, and emails are placeholders — search for `+91 99999`, `hello@movemitra.in`, and the Indore/Bhopal addresses across the HTML files and update them.
- The Google Map embeds use a generic area search query — swap in your exact address or a Place ID for a pinned marker.
- Colors and fonts live as CSS variables at the top of `css/style.css` if you want to adjust the palette later.
