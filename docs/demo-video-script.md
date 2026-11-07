# AI WebShield — 3–5 Minute Demo Video Script

**Target runtime:** about 4 minutes at a steady speaking pace.  
**Recording:** use Chrome with the unpacked extension loaded and the local sample pages served from `127.0.0.1`. Only use the fictional sample pages and synthetic values below.

## Script and screen actions

### 0:00–0:20 — Title and introduction

**Show:** Title card: “AI WebShield — Junior Secondary Edition.” Then show the local sample index, keeping the localhost address visible.

**Say:** “Hello. This is AI WebShield, a browser-safety prototype designed to help junior secondary students pause before sharing personal information or trusting a suspicious page. I’ll demonstrate its privacy review and website safety signal using fictional sample pages.”

### 0:20–0:50 — The problem and project idea

**Show:** Briefly show the sample index and the two demo categories: privacy check and website warning.

**Say:** “Students use websites and online tools every day. It can be easy to type personal information into the wrong place, or to mistake a fake sign-in page for a real one. The original proposal imagined a Chrome extension working with a local Jetson server. This version focuses on a small browser-based demonstration that is easier to inspect and explain.”

### 0:50–1:15 — Privacy and project scope

**Show:** Open `privacy-check.html`. Point out the synthetic-data labels and password-field note. Do not type anything into the password field.

**Say:** “The extension checks a few patterns in supported text fields when a form is submitted. These include email-like text, an eight-digit number-like pattern, and a fake ID marker. Password values are skipped. For this demonstration, all sample information is fictional, and checks run in the browser.”

### 1:15–2:10 — Review and masking demonstration

**Show:** Enter `student@example.invalid` in the ordinary message field and submit. Show the category prompt. Choose **Apply masks for review**, point out the visible mask, then choose **Undo masks**. Finish with **Cancel submission** so the sample remains unchanged.

**Say:** “Here I’ve entered a made-up email address. Before the form continues, WebShield shows the type of pattern it noticed. It does not silently change the message. I can apply the suggested mask, inspect it, and undo it. I can also cancel or continue with the original text. This keeps the student in control. The extension does not store or send the typed form text.”

### 2:10–2:55 — Green and yellow signals

**Show:** Open `site-safe.html`. Show the green round button at the bottom-right and let its explanation disappear. Click the button to display the explanation again. Then open `site-caution.html`; show the yellow button and its explanation, allowing the three-second message to disappear.

**Say:** “The round button gives a quick visual signal. On this safe baseline sample, it is green. Green only means the demo did not find one of its warning signals; it is not a guarantee that a real website is safe. The explanation appears briefly, then I can click the button to read it again. This unfamiliar sample sign-in page is yellow. Asking for details alone is not proof that a page is a scam, so the message recommends checking the address rather than calling it dangerous.”

### 2:55–3:35 — Red warning and report option

**Show:** Open `site-lookalike.html` or `site-high-risk.html`. Keep the red warning visible and point out **Go back** and **Report this site**. Click **Report this site** and show the local-save confirmation. Do not navigate to any real scam link.

**Say:** “This fictional lookalike address is included in the demo blacklist, so the signal turns red and a warning appears. The student can go back or report the hostname. A report is saved only in this browser’s local extension storage; it is not uploaded or shared. The database entries use reserved fictional addresses and are for demonstration only.”

### 3:35–4:10 — Limitations and conclusion

**Show:** Return to the local sample index or show a final title card with “Local prototype • Synthetic data • Not live threat detection.”

**Say:** “AI WebShield demonstrates privacy prompts and simple, explainable website signals. This prototype only works on the supplied localhost pages. It does not connect to the Jetson server, use a trained AI model, or check live threat intelligence. Its rules may miss threats or raise false alarms, so the signals are not a guarantee of safety. The next step is to test the extension in Chrome with synthetic data and record the results. Thank you for watching.”

## Recording checklist

- Confirm Chrome is running the current unpacked extension from `src/` and the sample server is bound to `127.0.0.1`.
- Keep the localhost address bar visible, but hide unrelated tabs, bookmarks, account names, and notifications.
- Use only `student@example.invalid`, `00000000`, `FAKE-HKID-001`, and other fictional demo values. Never enter real passwords or personal information.
- Wait for the green/yellow explanation to disappear before clicking the round button to show it again.
- Speak at a calm pace, pause long enough for viewers to read each prompt, and keep the cursor still when not interacting.
- Do not describe the current prototype as a live phishing detector or claim measured accuracy.
- Export as `output/video/ai-webshield-demo.mp4` and watch the finished video once to confirm the text and audio are clear.
