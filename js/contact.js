// ===========================================================
// MoveMitra — Enquiry form + OTP verification + Google Sheets
// ===========================================================
//
// HOW THIS WORKS RIGHT NOW (demo mode):
//   - When the user submits the form, a 4-digit OTP is generated
//     in the browser and shown in an alert + the browser console
//     (since there's no SMS backend connected yet).
//   - Once the user types the correct OTP, the enquiry is sent to
//     your Google Sheet via the Apps Script Web App URL below.
//
// TO GO LIVE WITH REAL SMS OTP:
//   Replace the sendOtp() function's body with a call to your SMS
//   provider (MSG91 / Twilio Verify / Firebase Phone Auth). These
//   require a server (Apps Script, Cloud Function, or any small
//   Node/PHP endpoint) because OTP secrets can't live in
//   client-side JS. See the comment block at the bottom of this
//   file for a ready MSG91 example.
//
// TO CONNECT YOUR GOOGLE SHEET:
//   1. Open script.google.com → New Project, paste the Apps Script
//      code from movemitra/google-apps-script.js (included in this
//      project folder), then Deploy > Web app (execute as "Me",
//      access "Anyone").
//   2. Copy the deployment URL and paste it below as SHEET_WEBAPP_URL.
// ===========================================================

const SHEET_WEBAPP_URL = "PASTE_YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE";

let generatedOtp = null;
let pendingFormData = null;
let resendTimer = null;
let resendSeconds = 30;

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('enquiry-form');
  const overlay = document.getElementById('otp-overlay');
  const otpInputs = document.querySelectorAll('.otp-inputs input');
  const otpClose = document.getElementById('otp-close');
  const otpVerifyBtn = document.getElementById('otp-verify-btn');
  const otpResendBtn = document.getElementById('otp-resend-btn');
  const otpError = document.getElementById('otp-error');
  const otpPhoneLabel = document.getElementById('otp-phone-label');
  const otpStep = document.getElementById('otp-step');
  const successStep = document.getElementById('otp-success');
  const swapBtn = document.getElementById('swap-route');

  if (!form) return; // not on contact page

  // Swap "from" / "to" fields
  if (swapBtn) {
    swapBtn.addEventListener('click', () => {
      const from = document.getElementById('from');
      const to = document.getElementById('to');
      const tmp = from.value;
      from.value = to.value;
      to.value = tmp;
    });
  }

  // Step between OTP digit boxes
  otpInputs.forEach((input, idx) => {
    input.addEventListener('input', () => {
      input.value = input.value.replace(/\D/g, '').slice(0, 1);
      if (input.value && otpInputs[idx + 1]) otpInputs[idx + 1].focus();
    });
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace' && !input.value && otpInputs[idx - 1]) {
        otpInputs[idx - 1].focus();
      }
    });
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    pendingFormData = {
      name: document.getElementById('name').value.trim(),
      email: document.getElementById('email').value.trim(),
      mobile: document.getElementById('mobile').value.trim(),
      from: document.getElementById('from').value.trim(),
      to: document.getElementById('to').value.trim(),
      moveDate: document.getElementById('moveDate')?.value || '',
      serviceType: document.getElementById('serviceType')?.value || '',
      message: document.getElementById('message')?.value.trim() || '',
    };

    openOtpModal(pendingFormData.mobile);
  });

  function openOtpModal(mobile) {
    otpStep.style.display = 'block';
    successStep.classList.remove('active');
    otpError.textContent = '';
    otpInputs.forEach(i => (i.value = ''));
    otpPhoneLabel.textContent = `+91 ${mobile}`;
    overlay.classList.add('active');
    sendOtp(mobile);
    otpInputs[0].focus();
  }

  function closeOtpModal() {
    overlay.classList.remove('active');
    clearInterval(resendTimer);
  }

  otpClose.addEventListener('click', closeOtpModal);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeOtpModal();
  });

  function sendOtp(mobile) {
    // DEMO MODE: generate locally and "deliver" via alert/console.
    generatedOtp = String(Math.floor(1000 + Math.random() * 9000));
    console.log(`[MoveMitra demo] OTP for +91${mobile}: ${generatedOtp}`);
    // Replace this alert with a real SMS API call when you go live —
    // see the MSG91 example at the bottom of this file.
    window.setTimeout(() => {
      alert(`Demo mode: your OTP is ${generatedOtp}\n(In production this will be sent by SMS instead of shown here.)`);
    }, 200);

    startResendTimer();
  }

  function startResendTimer() {
    resendSeconds = 30;
    otpResendBtn.disabled = true;
    updateResendLabel();
    clearInterval(resendTimer);
    resendTimer = setInterval(() => {
      resendSeconds--;
      updateResendLabel();
      if (resendSeconds <= 0) {
        clearInterval(resendTimer);
        otpResendBtn.disabled = false;
        otpResendBtn.textContent = 'Resend OTP';
      }
    }, 1000);
  }

  function updateResendLabel() {
    if (resendSeconds > 0) {
      otpResendBtn.textContent = `Resend OTP in ${resendSeconds}s`;
    }
  }

  otpResendBtn.addEventListener('click', () => {
    if (otpResendBtn.disabled) return;
    sendOtp(pendingFormData.mobile);
  });

  otpVerifyBtn.addEventListener('click', () => {
    const entered = Array.from(otpInputs).map(i => i.value).join('');
    if (entered.length < 4) {
      otpError.textContent = 'Please enter all 4 digits.';
      return;
    }
    if (entered !== generatedOtp) {
      otpError.textContent = 'Incorrect OTP. Please try again.';
      return;
    }
    otpError.textContent = '';
    submitToSheet(pendingFormData);
  });

  function submitToSheet(data) {
    otpVerifyBtn.disabled = true;
    otpVerifyBtn.textContent = 'Submitting...';

    const payload = {
      ...data,
      submittedAt: new Date().toISOString(),
    };

    const finish = () => {
      otpStep.style.display = 'none';
      successStep.classList.add('active');
      form.reset();
      otpVerifyBtn.disabled = false;
      otpVerifyBtn.textContent = 'Verify & Submit';
    };

    if (!SHEET_WEBAPP_URL || SHEET_WEBAPP_URL.includes('PASTE_YOUR')) {
      // No Sheet connected yet — keep a local backup so nothing is lost.
      const stored = JSON.parse(localStorage.getItem('movemitra_enquiries') || '[]');
      stored.push(payload);
      localStorage.setItem('movemitra_enquiries', JSON.stringify(stored));
      console.warn('[MoveMitra] SHEET_WEBAPP_URL not set — saved enquiry to localStorage instead.');
      finish();
      return;
    }

    fetch(SHEET_WEBAPP_URL, {
      method: 'POST',
      mode: 'no-cors', // Apps Script web apps generally require this
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload),
    })
      .then(finish)
      .catch((err) => {
        console.error('Sheet submission failed:', err);
        otpError.textContent = 'Could not submit right now. Please try again.';
        otpVerifyBtn.disabled = false;
        otpVerifyBtn.textContent = 'Verify & Submit';
      });
  }
});

// ===========================================================
// OPTIONAL: real SMS OTP via MSG91 (or similar) — example only.
// This MUST run on a server, never directly in this browser file,
// because it needs a secret API key. Drop this into a small
// Apps Script / Cloud Function endpoint and call it from sendOtp().
// ===========================================================
/*
function sendOtpViaMsg91(mobile, otp) {
  return fetch('https://control.msg91.com/api/v5/otp', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'authkey': 'YOUR_MSG91_AUTH_KEY',
    },
    body: JSON.stringify({
      mobile: `91${mobile}`,
      otp: otp,
      template_id: 'YOUR_TEMPLATE_ID',
    }),
  });
}
*/
