# AI WebShield — Junior Secondary Edition

AI WebShield is a student-built Chrome extension prototype for on-demand page checks. It combines local, explainable page signals with an optional Google Safe Browsing URL reputation lookup. It is an educational prototype, not a guarantee of protection.

## What it checks

- **URL reputation:** When the local scanner is configured, the active page URL is checked against Google Safe Browsing v5. A confirmed list match produces a red warning.
- **Page signals:** Local rules look for credential forms on unencrypted HTTP, password forms using GET, forms sending data to a different site, known brand names used on unrelated login hosts, punycode or IP-address login hosts, urgent account language, and sign-in pages requesting several personal-data categories.
- **Privacy review:** After scanning a page, the extension can review supported non-password text fields when a form is submitted. It suggests masks for email-like text, eight-digit numbers, and the synthetic `FAKE-HKID-001` test marker. Password values are skipped, and the user chooses whether to mask, undo, continue, or cancel.
- **Local reports:** “Report this site” stores the hostname in this browser’s extension storage. Reports are not shared.

The scan is started by clicking the extension and choosing **Scan this page**. It checks only the active HTTP or HTTPS tab after that action; it does not monitor every tab or block navigation. The extension uses Chrome’s temporary `activeTab` permission rather than requesting access to every website at install time.

## How reputation lookup works

The extension sends a sanitized page URL to the local `server.py` process. The local service uses the API key from `GOOGLE_SAFE_BROWSING_API_KEY` to call Google Safe Browsing v5. Query strings, fragments, credentials, and long token-like path segments are removed before lookup. The remaining URL path and hostname are still shared with Google for the reputation check. Page text and form contents are not sent.

If the API key is missing or the service is unreachable, local rules still run, but the result is shown as **unknown** when they find no warning signals. “No match” means only that no Safe Browsing match was returned; it does not prove the site is safe. Google documents Safe Browsing for non-commercial use; use Web Risk for commercial products. See the [Safe Browsing v5 API](https://developers.google.com/safe-browsing/reference/rest/v5/urls/search) and its [usage overview](https://developers.google.com/safe-browsing/reference).

## Setup procedure

### Requirements

- Google Chrome with Manifest V3 support.
- Python 3 (no additional Python packages are required).
- A Google Safe Browsing API key for live URL reputation checks. This is optional; local page rules can run without it.

### Load the extension

1. Download and extract this repository or clone it:

   ```sh
   git clone https://github.com/251167-boop/GEF_P34.git
   cd GEF_P34
   ```

2. Open `chrome://extensions` in Chrome and turn on **Developer mode**.
3. Select **Load unpacked** and choose the repository’s `src/` folder (the one containing `manifest.json`).
4. Confirm **AI WebShield** appears in the extensions list.

### Start the local scanner and sample site

The local server serves the sample pages and provides the private API-key proxy. Start it from the repository root, where `server.py` is located.

To run local page rules only, start the server without an API key:

```sh
python3 server.py
```

For Safe Browsing URL checks, create a key in a Google Cloud project with the Safe Browsing API enabled. Set it in the current Terminal session, then start the server:

**macOS or Linux**

```sh
export GOOGLE_SAFE_BROWSING_API_KEY="YOUR_API_KEY"
python3 server.py
```

**Windows PowerShell**

```powershell
$env:GOOGLE_SAFE_BROWSING_API_KEY="YOUR_API_KEY"
python server.py
```

Keep this Terminal window open. The key is read from the environment and is not stored in the extension or repository. Do not paste it into a source file or commit it to GitHub.

### Scan a page

1. Open a sample page at `http://127.0.0.1:8000/site-warning.html`, or open a regular HTTP/HTTPS website.
2. Click the AI WebShield extension icon.
3. Review the privacy note and choose **Scan this page**.
4. Review the result in the popup and the round signal at the bottom-right of the page. Red warnings offer **Go back** and **Report this site** actions.
5. To try the form privacy review, scan first, then enter synthetic test values and submit the sample form.
6. When finished, stop the server with **Ctrl+C**.

The sample pages contain fictional example addresses for teaching. The scanner checks the real address in Chrome’s address bar (for local samples, that is `127.0.0.1`), not a hostname printed in the page.

### Common setup questions

- **Why is the reputation result unknown?** Check that `server.py` is running and that `GOOGLE_SAFE_BROWSING_API_KEY` is set in the same Terminal session. Local page rules still work when reputation lookup is unavailable.
- **Why can’t Chrome scan this page?** Chrome restricts extension access to internal browser pages and some protected pages. Try a regular `http://` or `https://` tab, click the extension, and start the scan there.
- **Why do I get a 404 for a sample page?** Start `python3 server.py` from the repository root. It serves the `samples/` folder automatically. If port 8000 is already in use, stop the other server with **Ctrl+C** first.
- **Why doesn’t the privacy prompt appear?** Click the extension and scan that page before submitting a form. The extension injects its page checks only after you request a scan.
- **How do I apply an extension code change?** Open `chrome://extensions`, click the extension’s reload icon, and reload the webpage.

## Privacy and limitations

- The page-risk rules inspect page text and form metadata locally; they do not read typed form values. Password values are never read.
- The separate form privacy prompt reads supported non-password field values only when a form is submitted, to suggest a mask. It does not send or persist those values.
- The sanitized URL path and hostname are sent to Google Safe Browsing when an API key is configured. Long token-like path segments, query strings, and fragments are removed first.
- The rules can produce false alarms and miss threats. Reputation data also may not include every unsafe page. A clean result is not a safety guarantee.
- This prototype reports risk but does not block navigation, continuously monitor tabs, or scan pages before the user requests it.

## Project contents

- [`src/`](src/) — unpacked Chrome extension.
- [`server.py`](server.py) — loopback sample server and Safe Browsing API proxy.
- [`samples/`](samples/) — fictional sample pages.
- [`tests/manual-test-cases.md`](tests/manual-test-cases.md) — synthetic-data manual scenarios.
- [`docs/`](docs/) — project scope, architecture notes, implementation records, and submission materials.
- [`output/pdf/ai-webshield-project-poster.pdf`](output/pdf/ai-webshield-project-poster.pdf) — project poster.
- [`output/ai-webshield-source.zip`](output/ai-webshield-source.zip) — packaged project files.

## License

No license has been specified yet. Ask the project owner before reusing or redistributing this work.
