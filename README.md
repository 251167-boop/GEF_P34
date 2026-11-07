# AI WebShield — Junior Secondary Edition

AI WebShield is a student-built Chrome extension prototype that demonstrates two online-safety ideas: pausing before sharing possible personal information, and checking a page when there is a clear reason for caution. It uses browser-local, explainable rules and fictional sample pages to make its behavior easy to demonstrate.

> **Prototype scope:** This build works only on the included sample pages served from `localhost` or `127.0.0.1`. It is not a live phishing detector, does not protect arbitrary websites, and does not connect to a Jetson AGX Orin server or remote threat-intelligence service.

## Features

- **Privacy review before form submission:** Checks supported non-password text fields for email addresses, eight-digit number-like strings, and a synthetic HKID-style demo marker.
- **Student-controlled masking:** Shows the detected categories and offers a suggested mask. Students can apply or undo masks, continue with the original text, or cancel submission. The extension does not silently change text.
- **Password-field exclusion:** Password field values are skipped and are never read by the privacy-pattern checker.
- **Website safety signal:** A floating green, yellow, or red button appears at the bottom-right of demo pages. Green and yellow explanations briefly appear, then can be reopened by clicking the button. A red signal opens a warning with a Go back option.
- **Demo blacklist and reporting:** Fictional reserved `.test` hostnames are included as blacklist examples. A reported hostname is saved in Chrome's local extension storage on the current browser.

## How it works

The extension uses Chrome Manifest V3. Its content script runs only on pages served from `localhost` and `127.0.0.1`, as restricted in [`src/manifest.json`](src/manifest.json). Form-text checks and page-risk rules run in the browser. The demo does not send form content or reports to a server.

The traffic-light signal is a teaching aid, not a guarantee. An unfamiliar page requesting contact or sign-in information may receive yellow; red is reserved for the demo's explicit blacklist or other configured high-risk sample signals. The examples use fictional hostnames and synthetic data.

## Setup procedure

### Requirements

- Google Chrome (the extension uses Chrome Manifest V3).
- Python 3, used only to serve the included sample pages locally.
- A copy of this repository on your computer. You can download the repository ZIP from GitHub and extract it, or clone it with Git:

  ```sh
  git clone https://github.com/251167-boop/GEF_P34.git
  cd GEF_P34
  ```

### Load the extension into Chrome

1. Open `chrome://extensions` in Chrome.
2. Turn on **Developer mode** using the switch near the top-right corner.
3. Select **Load unpacked**.
4. Browse to the project folder and choose its `src/` directory (the folder containing `manifest.json`).
5. Confirm that **AI WebShield — Local Demo** appears in the extensions list and is enabled.

The extension is intentionally restricted to pages served from `localhost` or `127.0.0.1`. It will not run on ordinary websites or on pages opened directly as `file://` URLs.

### Start the sample website

1. Open Terminal (or another command prompt) in the project folder, the directory that contains `samples/`.
2. Start the local web server:

   ```sh
   python3 -m http.server 8000 --bind 127.0.0.1 --directory samples
   ```

3. In Chrome, visit `http://127.0.0.1:8000/site-warning.html`.
4. Open the other scenarios by replacing `site-warning.html` with `site-safe.html`, `site-caution.html`, `site-high-risk.html`, `site-lookalike.html`, or `privacy-check.html`.
5. After changing or reloading the extension from `chrome://extensions`, reload the sample page so Chrome runs the updated content script.
6. When finished, return to the Terminal window and press **Ctrl+C** to stop the server.

Use only the included fictional examples and synthetic values. Do not enter real passwords or personal information into the demo forms.

### Troubleshooting

- **Chrome says the manifest is missing:** In **Load unpacked**, select the `src/` folder itself, not the repository root.
- **The safety button does not appear:** Make sure the page address starts with `http://127.0.0.1:8000/` or `http://localhost:8000/`, then reload the page.
- **A code change is not visible:** Open `chrome://extensions`, select the extension's reload icon, and reload the sample page.
- **The sample page will not open:** Check that the Python server is still running in Terminal and that the command was started from the project folder.

## Privacy

- Form values are checked in the browser and are not sent to a remote service.
- Password values are not inspected.
- The extension does not persistently store entered form text.
- When a user reports a page, only its hostname is stored in Chrome local extension storage on that device. Reports are not shared or uploaded.
- The extension requests localhost host access for the demo and the `storage` permission for the local report list.

## Project contents

- [`src/`](src/) — unpacked Chrome extension.
- [`samples/`](samples/) — fictional localhost demo pages.
- [`tests/manual-test-cases.md`](tests/manual-test-cases.md) — manual scenarios and expected behavior.
- [`docs/`](docs/) — project scope, architecture notes, implementation records, QA status, and the formatted submission report.
- [`output/pdf/ai-webshield-project-poster.pdf`](output/pdf/ai-webshield-project-poster.pdf) — project poster.
- [`output/ai-webshield-source.zip`](output/ai-webshield-source.zip) — packaged source and project materials.

## Limitations and next steps

The rules are small and explainable, but they may miss threats or produce false alarms. No detection accuracy or false-positive/false-negative rate has been measured, and interactive Chrome QA remains pending. The original proposal describes a Jetson AGX Orin local server and AI-assisted analysis; these are future ideas and are not implemented in this prototype. Before expanding coverage, test the extension with synthetic data, document observed results, and review permissions and privacy requirements.

## License

No license has been specified yet. Ask the project owner before reusing or redistributing this work.
