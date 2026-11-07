# Day 1 — MVP scope

## Workspace check

- The project folder has no `AGENTS.md` instructions and no extension implementation yet.
- The current starting materials are the project/readme documents, architecture note, manual test plan, and inert local HTML fixtures.
- This scope defines the next implementation boundary; it does not claim that any detection feature is already built or tested.

## Goal

Demonstrate two understandable safety moments for junior secondary students: pause before submitting likely personal information, and pause when a page has a concrete reason to look suspicious.

## In scope for the first demo

1. **Sensitive-information prompt:** scan text in supported, non-password fields locally for a small set of patterns (email, phone-like string, and an explicitly fake HKID-like fixture). Before submission, explain the detected category and let the student review, mask, undo, or continue.
2. **Website caution:** show a yellow caution for a test page requesting login/personal information when the demo has a reason to ask the student to check the address. Explain the reason and let the student go back or continue.
3. **Strong warning demonstration:** show red only for a deliberately seeded, clearly explainable high-confidence test case, such as a supplied known-bad fixture or a test lookalike domain paired with a login request.
4. **Student-facing explanation:** use short, calm wording that tells the student what triggered the warning and what they can do next.
5. **Evidence:** manually test safe, caution, high-risk, and privacy cases; record both correct warnings and false alarms/misses.

## Privacy rules

- Run pattern checks in the browser for the demo; do not send field contents to a server.
- Never read, transform, or store password-field values.
- Do not keep typed text, form contents, page history, or student identifiers in logs.
- Do not silently replace text. Present a proposed mask and let the student review it.
- Use only synthetic fixture values in development, screenshots, and video.
- Avoid collecting reports or creating an administrator view of individual student content in this MVP.

## Out of scope for the Nov 6 prototype

- Claims that WebShield is more accurate than Google Safe Browsing.
- Broad, automatic protection on every site or browser.
- Jetson AGX Orin server integration, cloud service, threat-feed service, or backend database.
- A general-purpose AI/ONNX classifier unless a working model and evidence already exist.
- Automatic blocking based only on an unfamiliar domain or a form asking for contact information.
- Student reporting, shared blacklist, admin dashboard, analytics, or school-wide deployment.

## Demo acceptance checklist

- [ ] A normal safe sample form can be submitted locally without a warning.
- [ ] A fake personal-data value in a supported field triggers a prompt before the demo form completes.
- [ ] The prompt shows the category, makes any mask reversible, and allows the student to decide.
- [ ] Password input is ignored by the privacy checker.
- [ ] A caution page explains its reason and offers a safe next step.
- [ ] The strongest warning is tied to explicit test evidence, not merely an unknown site.
- [ ] No sample form sends a request to the network.
- [ ] Poster/video describe the implementation honestly and name the current limits.
