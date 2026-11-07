// Fictional reserved .test addresses for the local demonstration only.
// These entries are never navigated to or checked through a network service.
globalThis.AI_WEBSHIELD_DEMO_SCAM_LINKS = Object.freeze([
  Object.freeze({
    url: 'https://school-portai.example.test/login',
    reason: 'One-character lookalike of the fictional school-portal demo address.',
  }),
  Object.freeze({
    url: 'https://free-prize-claim.example.test/redeem',
    reason: 'Fictional prize-claim phishing example used only as a blacklist fixture.',
  }),
]);
