# Day 3 — Local page-risk signals

> Historical implementation note: the localhost-only classifier, seeded warning, and bundled blacklist described here have been replaced. See [`real-scanning-update.md`](real-scanning-update.md) for current scan behavior.

## What was added

- The popup and toolbar badge report a page signal: neutral, caution, or high risk.
- A round bottom-right safety button shows green, yellow, or red. Green and yellow explanations auto-hide after three seconds and can be reopened by clicking; red opens a warning with Go back and Report this site actions.
- An unfamiliar sample page with sign-in or contact fields gets a yellow caution. The extension checks only input type and `autocomplete` metadata; it never reads field values for this decision.
- A sample URL whose first domain label is one character different from a known fictional demo host gets a red warning only when that page also requests sign-in/contact details.
- The explicit seeded high-risk fixture continues to get a red warning.
- Bundled fictional `.test` blacklist entries and user-reported demo hostnames produce red. Reports are stored only in Chrome local storage.
- Added `samples/site-lookalike.html` so the combined lookalike and sign-in signal can be demonstrated on localhost.

## Safety and limits

- The classifier returns a neutral localhost-only message on all non-localhost pages; the extension manifest also limits access to localhost and 127.0.0.1.
- Sample URL metadata is page-controlled, so it is used only inside the localhost demo boundary. Never trust this marker on real websites.
- The one-character rule is a teaching example. It can miss real impersonation and can produce false positives; it is not a reputation service, machine-learning detector, or guarantee that a page is safe.
- No page text or input values are sent to a service or stored by this feature.

## Manual review

Use `tests/manual-test-cases.md` cases W-01 through W-05 with the local pages. Day 3 changes were reviewed statically; the extension was not launched as part of this edit.
