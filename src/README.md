# AI WebShield extension

This is a Chrome Manifest V3 extension. It runs `content.js` on ordinary HTTP/HTTPS pages at `document_idle`, so page scanning starts automatically. Chrome asks for permission to read websites you visit. Internal and protected browser pages are excluded by Chrome.

## Scan flow

1. The content script displays the round signal with a spinner and starts a scan when the page loads. The popup can request a fresh scan.
2. `content.js` inspects page text and form structure locally. The risk classifier never reads form field values or password values.
3. `background.js` takes the active page URL from Chrome’s message sender metadata, removes query strings, fragments, credentials, and long token-like path segments, then asks the loopback `server.py` endpoint for a reputation check.
4. When configured, `server.py` uses `GOOGLE_SAFE_BROWSING_API_KEY` to call Google Safe Browsing v5. The key is not bundled in the extension.
5. The combined result updates the popup, toolbar badge, and round page indicator. If reputation is unavailable and local rules find no warning signal, the indicator is green with an explanation that the reputation check could not be confirmed.

The scanner sends only the sanitized URL to the local service. The server binds to `127.0.0.1`, suppresses request logs, caches results according to the API response, and serves the sample pages. The URL’s hostname and remaining path are sent to Google when the API key is configured. Form text and page text are not sent.

## Permissions

- `scripting` — inject the page scanner again when the user requests a popup rescan.
- `http://*/*` and `https://*/*` — run the page scanner automatically on ordinary web pages.
- `storage` — save user-reported hostnames locally and retain the existing form-review flow.
- `http://127.0.0.1/*` and `http://localhost/*` — communicate with the local scanner and serve the sample pages.

For setup and limitations, see the root [`README.md`](../README.md).
