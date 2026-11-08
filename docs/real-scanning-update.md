# Real-scanning implementation update

## Current behavior

The extension no longer uses page-supplied test markers or a bundled fictional blacklist to assign website risk. A user opens the extension and chooses **Scan this page**. Chrome grants temporary `activeTab` access for that tab, and the extension injects its page scanner only after the user’s request.

The scanner evaluates page and form structure locally. Signals include password fields on non-loopback HTTP pages, password forms using GET, off-site form actions, known brand names on unrelated login hosts, punycode and IP-address login hosts, urgent account language alongside a login form, and sign-in forms requesting several personal-data categories. These rules are heuristics and can be wrong.

When configured, the extension also asks `server.py` to check the sanitized active-tab URL using Google Safe Browsing v5. The local server binds only to `127.0.0.1`, reads the API key from `GOOGLE_SAFE_BROWSING_API_KEY`, suppresses URL request logs, and caches a lookup result for the duration returned by the service. It does not receive page text or form values. The reputation service receives the URL hostname and remaining path after query strings, fragments, credentials, and long token-like path segments have been removed.

## Signal meaning

- **Red:** a Safe Browsing match, a hostname reported locally by the user, or a strong local signal such as a password submitted over unencrypted HTTP.
- **Yellow:** a heuristic combination deserves review, such as an urgent login request or an off-site form action.
- **Green:** the API returned no list match and local rules found no strong warning pattern. This is not a guarantee that the page is safe.
- **Gray / unknown:** reputation lookup could not run and local rules found no strong warning pattern.

The extension warns but does not block navigation. It scans only when invoked by the user; it does not monitor all tabs or run before the scan is requested. Google’s Safe Browsing API is for non-commercial use. Commercial deployment would need a different service such as Web Risk and a separate privacy and permissions review.

## Setup and validation status

See the root `README.md` for API-key setup and local server instructions. This implementation update has not yet completed interactive Chrome QA with a configured Safe Browsing API key. Do not claim measured accuracy or comprehensive protection until representative false-positive and false-negative evaluation is completed.
