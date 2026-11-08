# AI WebShield: Easy Browser Protection Powered by Local Edge AI

> Historical report for the first-round submission build. It predates the on-demand scanning update documented in [`real-scanning-update.md`](real-scanning-update.md).

## Abstract (50 words)

AI WebShield is a Chrome extension prototype helping secondary students notice privacy and website-safety risks. It checks non-password form text locally for email, eight-digit numbers, and a fake HKID pattern and evaluates localhost demo pages using explainable rules and a fictional blacklist. It demonstrates privacy-aware browsing without claiming universal protection.

## Objective, background, and motivation

- Secondary students use browsers for study and online tools, and may expose personal details or encounter phishing pages.
- The original proposal presents a Chrome extension linked to a Jetson AGX Orin local server for privacy filtering and traffic-light website warnings.
- The objective is to demonstrate understandable prompts that help students pause before sharing likely personal information or trusting suspicious demo pages.
- The prototype aims to support privacy by checking text in-browser and never inspecting password values.
- Green, yellow, and red signals provide an immediate visual explanation and a simple next step.
- The project is an educational prototype; it does not claim comprehensive or live phishing protection.

## Methodology

- A Chrome Manifest V3 extension injects its content script only into the included localhost and 127.0.0.1 sample pages.
- Before a sample form submits, supported non-password text fields are checked locally for email, eight-digit number-like strings, and a synthetic HKID marker.
- When a pattern is found, the student can review a suggested mask, undo it, continue with the original text, or cancel; password values are skipped.
- Website signals use sample-page metadata, form-field metadata, a simple lookalike rule, and a bundled blacklist of fictional reserved `.test` hosts.
- A floating traffic-light control explains green or yellow signals briefly; a red signal opens a warning with a Go back action.
- A student can report a hostname, which is saved in Chrome local storage on that device; no text or report is sent to a remote service.
- Unlike the original architecture proposal, this submission build does not connect to the Jetson AGX Orin, FastAPI, or a trained AI model.

## Results and application

- The prototype includes privacy-review prompts, reversible masking, and password-value exclusion in its form-handling flow.
- It includes green, yellow, and red website signals, a local demo blacklist, and a report action that stores hostnames in the browser.
- Fictional localhost sample pages provide repeatable scenarios for a safe baseline, an unfamiliar sign-in page, a lookalike, a seeded warning, and privacy checks.
- The tool can be demonstrated as a browser-safety learning aid for junior secondary students using synthetic information only.
- The implementation is limited to the supplied localhost fixtures; it does not query live threat intelligence or protect arbitrary websites.
- No measured accuracy, false-positive rate, or false-negative rate is available; interactive Chrome QA remains pending.

## Discussion and conclusion

AI WebShield turns two common online safety concerns into a small, explainable browser demonstration. The implementation prioritizes local processing and student choice, while its localhost-only scope and unvalidated rules limit real-world protection claims.

- **Privacy:** checks run in the browser; password values are skipped, and entered form text is not uploaded or persistently stored.
- **Transparency:** prompts state the signal and let the student choose whether to mask, continue, cancel, or leave.
- **Scope:** the current build uses local fixtures and fictional blacklist entries, not the Jetson server or live threat feeds in the original proposal.
- **Reliability:** simple rules can miss threats or raise false alarms; the prototype has no measured detection performance.
- **Next step:** run and document interactive Chrome scenarios with synthetic data, then consider Jetson integration only after the prototype behavior and privacy requirements are validated.

## References

- Project author. (2026). *Project Proposal: AI WebShield: Easy Browser Protection Powered by Local Edge AI*. Original proposal supplied for this project.
- Project implementation notes and manual scenarios: `docs/architecture-decision.md`, `docs/day3-implementation.md`, and `tests/manual-test-cases.md`.

