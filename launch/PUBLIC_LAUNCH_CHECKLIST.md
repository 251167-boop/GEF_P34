# Public launch checklist

## Product and service

- [ ] Choose whether the public extension will use local-only signals or a hosted reputation service. The current extension calls `127.0.0.1`; this works only when each user has the local Python service running.
- [ ] Keep any service API key on the server. Never embed it in the extension, ZIP, repository, or public documentation. Rotate keys that have been shared.
- [ ] Confirm the intended use fits the provider's terms. Google Safe Browsing is for non-commercial use; commercial use requires a suitable alternative such as Web Risk.
- [ ] Decide what should happen when reputation lookup is unavailable and clearly explain that a green signal is not a guarantee of safety.

## Privacy and permissions

- [ ] Publish a privacy policy describing local page analysis, URL sanitization, third-party URL checks, locally stored reports, retention, and deletion.
- [ ] Make the data disclosures visible before installation and in the Chrome Web Store listing. Explain that site access is needed for automatic scanning.
- [ ] Review whether broad access to all HTTP/HTTPS pages is necessary for the single purpose. Request no broader access than the release features require.
- [ ] Complete the Chrome Web Store privacy/data-use declarations and permissions justification.

## Store assets and submission

- [ ] Prepare a clean ZIP from the contents of `extension/`, with `manifest.json` at the ZIP root.
- [ ] Prepare the public listing: name, short and detailed descriptions, category, language, support contact, and privacy-policy URL.
- [ ] Add required extension icons, listing screenshots, and other store artwork.
- [ ] Review the package for demo-only behavior, secrets, sample data, debug artifacts, and claims that imply guaranteed protection.
- [ ] Test the release package in a clean Chrome profile, including permissions, automatic scanning, unavailable service behavior, and reporting.
- [ ] Register a Chrome Web Store developer account, upload the ZIP, select public distribution, and submit it for review.

## Current known blockers

- The current reputation server binds to `127.0.0.1` and is not a public service.
- The extension requests host access across ordinary HTTP and HTTPS websites for automatic scanning.
- A privacy policy, final store listing, artwork, and clean release package still need to be prepared.
- Do not include the API key previously shared in conversation; rotate it before any public launch.
