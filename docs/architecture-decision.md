# Architecture decision — first-round prototype

> This records the original local-only decision. The current on-demand scanning design supersedes it; see [`real-scanning-update.md`](real-scanning-update.md).

**Status:** chosen for the first demo; revisit after the submission.

## Decision

Build a Chrome Manifest V3 extension whose first-pass checks run locally in the browser. Use simple, inspectable rules for the prototype. Serve the bundled sample pages from a local-only `http://localhost` server and scope extension host access to localhost for the demo. No remote AI service, backend, threat-feed API, or Jetson server is required for this submission.

## Why this choice

- It removes server setup and connectivity dependencies from a one-week prototype schedule.
- It matches the privacy promise: sample text can be checked without sending it elsewhere.
- Simple rules are easier to demonstrate, explain, and troubleshoot than an unvalidated model.
- Local sample pages make the same scenarios repeatable for testing and video recording.

## Permission and coverage constraint

An extension can inspect page content only when its permissions allow it. Chrome does not inject extension scripts into `file://` pages by default, so serve test fixtures from localhost for extension testing rather than broadening access to local files. The first demo should request the narrowest access needed for localhost. A seeded high-risk marker in the sample fixture is a localhost-only demo switch, not a threat signal; production logic must never trust page-supplied markers. Any later feature that runs on arbitrary websites will require a clear permission decision, a plain-language disclosure, and a review of Chrome extension policies and school deployment requirements. Do not describe the local sample demo as system-wide or universal protection.

## Trade-offs and limitations

- Pattern rules can miss unusual formats and can flag ordinary text; measure both misses and false alarms.
- A form requesting personal information is not, by itself, proof of phishing.
- A rule-based prototype is not an AI classifier and should not be advertised as one.
- No live threat intelligence means the prototype cannot claim to identify newly created phishing pages generally.
- Chrome-only demo scope does not cover Edge, Safari, mobile browsers, or apps outside the browser.

## Revisit when

There is a tested extension build, observed false-positive/false-negative results, a confirmed target-device/browser list, and agreement on how permissions and school administration should work.
