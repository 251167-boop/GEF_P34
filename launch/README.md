# AI WebShield — launch workspace

This folder is a separate working copy for preparing a Chrome Web Store release. The original student demo remains in the project root. Make launch-specific changes under `launch/` so demo behavior stays intact.

## Extension source

`extension/` is the current Chrome extension source copied from the demo's `src/` folder. Its `manifest.json` is at the package root. When ready to create a store upload, zip the **contents** of `extension/` so `manifest.json` appears at the top level of the ZIP.

This is a starting copy, not a publish-ready release. Its current URL reputation feature expects the separate loopback Python service and a locally configured Safe Browsing API key. A public release needs a deliberate service plan before users can rely on that feature.

See [`PUBLIC_LAUNCH_CHECKLIST.md`](PUBLIC_LAUNCH_CHECKLIST.md) for remaining launch decisions.
