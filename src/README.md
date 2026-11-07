# Extension source — local prototype

This folder is an unpacked Chrome Manifest V3 extension. Keep the Day 1 scope and architecture decision in `docs/` as the acceptance boundary. It requests host access only to `localhost` and `127.0.0.1`. The `storage` permission saves only explicitly reported demo hostnames in Chrome local storage.

## Open the demo locally

1. Serve the repository's `samples/` directory with a local-only static server, for example: `python3 -m http.server 8000 --bind 127.0.0.1 --directory samples`.
2. Open `http://127.0.0.1:8000/site-warning.html` in Chrome.
3. In Chrome, open `chrome://extensions`, turn on Developer mode, choose **Load unpacked**, and select this `src/` folder.
4. Open `site-safe.html`, `site-caution.html`, `site-lookalike.html`, `privacy-check.html`, and `site-high-risk.html` through the local server to exercise the demo flows.

The seeded high-risk marker and entries in `demo-scam-database.js` are fictional local presentation fixtures, not threat intelligence. Database matching runs only on localhost sample pages. A report saves the hostname in this browser's local extension storage; it is not uploaded or shared. The rule set is intentionally broad and may flag ordinary eight-digit strings. Entered text is not sent to or persistently stored by the extension.

## Current implementation boundary

- Sensitive-pattern checks run at form submission for supported text inputs and textareas.
- Password input values are excluded from scanning.
- The review prompt supports masking, undo, explicit one-time continuation with original text, and cancellation.
- A round bottom-right button shows green, yellow, or red. Green/yellow explanations appear for three seconds on page load, then only when the button is clicked. Red opens a warning with **Go back** and **Report this site** actions.
- Simple, explainable risk signals run only on localhost sample pages: unfamiliar sign-in/contact forms show yellow caution, a one-character lookalike plus such a form shows red, and bundled or locally reported hostnames show red. These are demo rules, not threat intelligence or general phishing detection.
- The bundled blacklist contains reserved fictional `.test` links. **Report this site** saves the current demo hostname in this browser's local extension storage; reports are not uploaded or shared.
