# AI WebShield extension

This is a Chrome Manifest V3 extension. It requests `activeTab` and `scripting` so it can inspect the current HTTP/HTTPS tab only after the user opens the popup and selects **Scan this page**. It does not inject code into every website automatically.

## Scan flow

1. The user starts a scan from the extension popup.
2. `content.js` inspects page text and form structure locally. The risk classifier never reads form field values or password values.
3. `background.js` takes the active page URL from Chrome’s message sender metadata, removes query strings, fragments, credentials, and long token-like path segments, then asks the loopback `server.py` endpoint for a reputation check.
4. When configured, `server.py` uses `GOOGLE_SAFE_BROWSING_API_KEY` to call Google Safe Browsing v5. The key is not bundled in the extension.
5. The combined result updates the popup, toolbar badge, and round page indicator. An unavailable API result is shown as unknown unless local page rules find a warning signal.

The scanner sends only the sanitized URL to the local service. The server binds to `127.0.0.1`, suppresses request logs, caches results according to the API response, and serves the sample pages. The URL’s hostname and remaining path are sent to Google when the API key is configured. Form text and page text are not sent.

## Permissions

- `activeTab` and `scripting` — scan a page only after the user invokes the extension.
- `storage` — save user-reported hostnames locally and retain the existing form-review flow.
- `http://127.0.0.1/*` and `http://localhost/*` — communicate with the local scanner and serve the sample pages.

For setup and limitations, see the root [`README.md`](../README.md).
