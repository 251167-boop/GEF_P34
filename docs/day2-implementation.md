# Day 2 implementation notes

## Delivered

- Chrome Manifest V3 unpacked extension in `src/`.
- Narrow localhost host access for `localhost` and `127.0.0.1`.
- Neutral `LOC` toolbar badge and popup describing the active scope and privacy behavior.
- In-browser checks for email-like strings, eight-digit number-like strings, and the synthetic `FAKE-HKID-###` marker in supported non-password fields.
- Pre-submit review with proposed redaction tokens, apply-and-review, undo, explicit continuation with original text, and cancel.
- Text remains in page/browser memory only; originals are retained temporarily for the active review so undo works, then released. The extension has no network endpoint, persistence permission, or logging path for form values.

## Not included in this day

- Traffic-light website risk scoring, typo-squat matching, threat intelligence, or any claim to detect phishing generally.
- Automatic blocking based on unfamiliarity or a login form.
- Support outside localhost, other browsers, administrative reports, or production deployment.

## Important accuracy note

The eight-digit matcher is intentionally broad so the synthetic `00000000` test value demonstrates a warning. It is not a reliable phone-number classifier and may flag harmless numbers. Keep that limitation in the poster and demo until testing justifies a narrower rule.

## Testing status

Manual cases are documented in `tests/manual-test-cases.md`. They have not been executed against Chrome in this work session.
