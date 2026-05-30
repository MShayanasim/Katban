# Privacy Policy

**Katban** — Chrome Extension  
**Last Updated:** May 30, 2026

---

## Overview

Katban is a productivity companion Chrome extension. Your privacy matters — this policy explains exactly what data the extension accesses, where it's stored, and what leaves your device.

---

## Data Collection & Storage

### What Katban Stores

All data is stored **locally on your device** using the Chrome Storage API (`chrome.storage.local`). Nothing is sent to any server owned or operated by the developer.

| Data | Purpose | Retention |
|---|---|---|
| Timer state & duration | Persist the focus timer across popup opens/closes | Cleared on session end or manual stop |
| Focus Session History | Track productivity over time (e.g. daily focus minutes) | Locally stored, automatically deletes after 60 days |
| Blocked site list | Enforce site blocking during focus sessions | Until you edit or clear it |
| Clipboard history (last 15 entries) | Display recent copy events in the popup. **All text is AES-GCM Encrypted** on your hard drive. | Until you click "Clear" |
| Tasks & To-Do List | Persist active tasks and completed tasks | Until you delete them |
| Settings & preferences | Page cat toggle, meaning cat toggle, shared cat mode, cat skin, etc. | Persistent until changed |
| Cat brain state | Track cat behavior (sleeping, dancing, etc.) | In-memory only; not persisted across browser restarts |

### What Katban Does NOT Collect

- ❌ Personal information (name, email, accounts)
- ❌ Browsing history or URLs (only checked at navigation time for site blocking, never stored)
- ❌ **Passwords or Sensitive Data:** Katban implements strict "Smart Filtering". It completely ignores anything copied from a password field, and redacts credit cards and API tokens before saving them.
- ❌ Analytics, telemetry, or usage tracking
- ❌ Cookies or fingerprinting data

---

## Third-Party Services

Katban makes external network requests for specific features:

| Service | When | What's Sent | Privacy Policy |
|---|---|---|---|
| [Free Dictionary API](https://dictionaryapi.dev/) | When you double-click a word on a page | The selected word only | [dictionaryapi.dev](https://dictionaryapi.dev/) |
| **Katban AI Worker** (Cloudflare/Groq/Gemini) | When you submit a message in the Rant Chat | The text you typed in the chat box | Handled via Cloudflare Workers and processed ephemerally by Groq/Google. |

No other external requests are made. There are no ads, no trackers, and no background analytics components.

---

## Permissions Explained

| Permission | Reason |
|---|---|
| `storage` | Store timer state, clipboard history, and user settings locally. |
| `tabs` | Send messages between the popup, background worker, and content scripts. Required to broadcast timer state and cat behavior to all tabs. |
| `scripting` | Inject the content script that powers the page cat, definition bubble, and site blocker. |
| `alarms` | Run background timers for the Pomodoro clock and cat idle/prop behaviors. |
| `*://*/*` (host permissions) | Inject content scripts on all pages so the cat, definition lookup, and site blocking work everywhere. |

---

## Data Sharing

Katban does **not** share, sell, or transmit any user data to third parties. All processing happens locally in your browser.

---

## Children's Privacy

Katban does not knowingly collect any personal information from children under 13. The extension does not collect personal information from anyone.

---

## Changes to This Policy

If this policy is updated, the "Last Updated" date at the top will be revised. Continued use of the extension after changes constitutes acceptance of the revised policy.

---

## Contact

If you have any questions about this privacy policy, please contact the developer:

**Shayan Asim**

