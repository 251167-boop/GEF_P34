# Manual review cases — use synthetic data only

Start `python3 server.py` from the repository root. Load `src/` as an unpacked extension. Page-risk checks start automatically when each page loads. Use **Rescan this page** in the popup to repeat one. Do not substitute a real student’s personal details or account credentials.

| ID | Area | Setup / input | Expected result | Privacy / safety check |
|---|---|---|---|---|
| P-01 | Safe baseline | Scan `privacy-check.html`; submit ordinary text: `Please help me plan a study schedule.` | No sensitive-data prompt; sample form confirms its local submit handler ran. | No form value is sent to the reputation service. |
| P-02 | Email-like pattern | Enter `student@example.invalid` in the message field. | Pre-submit review identifies email-like text and offers a visible mask. | Text is not silently changed; user can undo or cancel. |
| P-03 | Number-like pattern | Enter the synthetic fixture `00000000`. | Pre-submit review flags the eight-digit pattern, which may be a false positive. | Do not persist or log the entered value. |
| P-04 | HKID demo marker | Enter `FAKE-HKID-001` in the dedicated sample field. | The synthetic marker triggers the pre-submit review. | Do not present the fixture as a valid or real HKID. |
| P-05 | Password exclusion | Enter a synthetic password in the sample password field. | Password value is excluded from the form-pattern review. | Confirm the checker never reads, sends, or logs the password value. |
| P-06 | Reversible mask | Use P-02, choose mask, then undo before confirming. | Original text is restored; no hidden submission occurs. | User remains in control of the final value. |
| W-01 | Local sample page | Open `site-safe.html`. | Page checks run on load and show green when no strong warning signal is found, including if the reputation lookup is unavailable. | The scan checks the actual `127.0.0.1` page URL, not the fictional address printed in the page. |
| W-02 | Urgent sign-in heuristics | Scan `site-high-risk.html` from the local server. | The page’s urgent account language alongside a password form should produce caution. It must not be treated as a real threat-list match. | The sample is HTTP loopback; the rule intentionally ignores that local transport for credential-risk scoring. |
| W-03 | Confirmed threat match | With a valid API key, scan Google’s documented Safe Browsing test URL, `http://testsafebrowsing.appspot.com/s/malware.html`. | API response should return a threat match and WebShield should show red. | This is a designated test URL; never use a real suspected malware page for a manual demonstration. |
| W-04 | API unavailable | Stop the local server or start it without `GOOGLE_SAFE_BROWSING_API_KEY`, then open a page with no local risk signals. | Result is green with a message that reputation could not be confirmed; the message must not call the page safe. | Do not present green as proof that the site is safe. |
| W-05 | Local report | On a red result, select **Report this site**. | Hostname is added to this browser’s local list and will be red on a later scan. | Reports are not uploaded or shared. |
| W-06 | Heuristic severity | Use a synthetic test page with a password form submitting over HTTP, or a GET password form. | Local rules show high risk and explain the signal. | Do not enter any real account data. |
| N-01 | URL privacy | Scan a page whose URL has a harmless query, fragment, and a long token-like path segment. | Lookup request omits query and fragment and redacts long token-like path segments. | Verify no form values or page text are sent to the API. |

Record pass/fail, visible result, and any false alarm or miss. Do not write entered sample values into the result log.
