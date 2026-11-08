# Day 4 integration and QA log

> Historical QA record for the first-round localhost build. The current on-demand scanner is described in [`real-scanning-update.md`](real-scanning-update.md) and still needs interactive Chrome QA.

## What was inspected

- Opened the local fixture index and each of the safe, caution, lookalike, seeded high-risk, and privacy sample pages in the in-app browser.
- Confirmed the pages show fictional `.test` address labels and synthetic-only form labels. The forms include local `preventDefault()` handlers.
- Reviewed the extension permission manifest and source statically: host access remains limited to `localhost` and `127.0.0.1`; the storage permission is used only for locally saved reported hostnames. No remote endpoint or request for form values is present in the page-risk message.
- Checked JavaScript syntax and manifest JSON parsing.
- Added a bottom-right traffic-light control: neutral/caution explanations auto-hide after three seconds, while high-risk signals open a warning with Go back and Report this site actions.

## Result status

| Scenario group | Status | Notes |
|---|---|---|
| Local fixture pages load | Pass | All five sample pages were opened from the loopback server. |
| Pattern prompt and reversible mask | Pending interactive Chrome run | In-app browser cannot load the unpacked extension; extension UI was not exercised. |
| Neutral, caution, lookalike, and seeded risk states | Pending interactive Chrome run | The traffic-light indicator and warning actions are implemented, but extension behavior was not observed. |
| Password exclusion and no-content transmission | Static review only | Code paths were reviewed; this is not a network-panel verification. |
| Screenshot capture of extension UI | Pending | No extension screenshot was captured. |

## Findings and limits

- No measured false-positive or false-negative results are available yet. Do not claim detection accuracy.
- The one-character match uses fictional demo hosts and is not a general lookalike detector.
- Before using the poster/video for judging, load `src/` as an unpacked extension in Chrome, run cases P-01 through P-06 and W-01 through W-05 in `tests/manual-test-cases.md`, and record observed outcomes without entering real personal data.
- The server is bound to `127.0.0.1` only. It was started for fixture review and should be stopped when finished.
