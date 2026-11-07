# Manual test cases — synthetic data only

Use the local pages in `samples/`. All inputs below are fictional test strings. Never substitute a student's real details, real account credentials, or a real HKID.

| ID | Area | Setup / input | Expected result | Privacy / safety check |
|---|---|---|---|---|
| P-01 | Safe baseline | On `privacy-check.html`, submit ordinary text: `Please help me plan a study schedule.` | No sensitive-data prompt; local demo confirms submission was intercepted locally. | No network request is made by the sample page. |
| P-02 | Email-like pattern | Enter `student@example.invalid` in the message field. | A pre-submit prompt identifies an email-like value and offers a visible proposed mask. | Text is not silently changed; student can undo or cancel. |
| P-03 | Phone-like pattern | Enter the synthetic fixture `00000000` in the message field. | A pre-submit prompt identifies a phone-like pattern, with a note that pattern detection can be wrong. | Do not persist the input in logs. |
| P-04 | HKID-like fixture | Enter `FAKE-HKID-001` in the dedicated demo field. | The demo-specific fake-ID marker triggers a prompt; it is clearly labeled as a test fixture. | Do not present the fixture as a valid or real identifier. |
| P-05 | Password exclusion | Enter `example-only-passphrase` in the password field. | The password field is ignored; no password-value warning or masking occurs. | Confirm the checker never reads, transmits, or logs the password value. |
| P-06 | Reversible mask | Use P-02, choose mask, then undo before confirming. | Original text is restored; no hidden submission occurs. | The user remains in control of the final text. |
| W-01 | Safe page | Open `site-safe.html`. | Green button appears bottom-right. Explanation hides after three seconds and returns when the button is clicked. | Do not call green a guarantee of safety. |
| W-02 | Caution | Open `site-caution.html`. | Yellow button appears bottom-right. Explanation hides after three seconds and returns when clicked. | An unfamiliar form alone must not receive red; do not enter real details. |
| W-03 | Lookalike fixture | Open `site-lookalike.html` from the local server. Do not enter real details. | Red signal and warning appear with Go back and Report this site options. | The displayed `.test` URL is fictional; the extension only evaluates the fixture while the actual page is on localhost. |
| W-04 | Blacklist fixture | Open `site-high-risk.html` on localhost in the demo build. | The bundled blacklist match shows red and opens a warning with Go back and Report this site. | Entries are fictional; reported hostnames stay in this browser's local extension storage. |
| W-05 | False-positive check | Open the safe mode while the page contains an ordinary contact form. | Do not show red. Record any yellow prompt as a possible false positive for review. | Warning severity stays proportional to evidence. |
| N-01 | Offline/privacy check | Disconnect network if practical, then use both sample pages. | Local checks still run for the supported fixtures. | Browser network panel should show no field-content transmission. |
| N-02 | Form submission | Submit each sample form. | The page displays its local demo response and remains on the local page. | Form handler prevents network submission. |

## Result log template

For each run, record the case ID, pass/fail, what appeared, false alarm or miss, and a brief fix note. Do not include the entered sample text in the log.
