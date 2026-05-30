# 🐱 Katban

A cat-themed productivity companion for Chrome. Focus timer, clipboard tracker, and in-page reading assistant — all supervised by a pixelated cat that reacts to everything you do.

---

## Features

### 🐾 Interactive Page Cat
A pixel-art cat sits in the corner of every page, watching your cursor and reacting to your behavior in real time.

- **Eye Tracking** — Pupils follow your mouse across the page.
- **Proximity Reactions** — Get too close and the cat gets scared.
- **Typing Dance** — The cat bobs and dances while you type, then gets exhausted if you keep going.
- **Password Peeking** — Focus a password field and the cat sneaks over to spy on what you're typing.
- **Sleep Mode** — Leave the page idle and the cat falls asleep with animated Zs.
- **Scroll Bobbing** — The cat bounces subtly as you scroll the page.
- **Prop Interactions** — The cat occasionally hops into a cardboard box on its own.
- **Laser Pointer** — Click the laser icon to make the cat chase a red dot across your screen.
- **Treat Mode** — Drop a virtual treat anywhere on the page for the cat to run and eat.
- **Transparency on Hover** — Move your cursor over the cat and it becomes transparent so it doesn't get in the way.

### ⏱️ Focus Timer (Pomodoro) & Site Blocker
A flexible Pomodoro-style focus timer built into the popup.

- Custom duration via `MM:SS` input or just minutes.
- Type `-` for an unlimited stopwatch that counts up.
- Automatic 5-minute break after each focus session.
- **Site Blocking** — Add domains (e.g. `reddit.com, youtube.com`) to block during focus sessions. Blocked pages show a fullscreen overlay with a stern cat telling you to get back to work.

### 💬 Katban AI (Rant Chat)
Need to vent? Katban features an integrated AI chat window where you can rant, complain, or seek emotional support.

- Powered by a custom **Cloudflare Worker** routing requests to **Groq (LLaMA 3.1)** with a fallback to **Google Gemini**.
- Katban responds with emotional validation and comforting support in-character.
- Fully rate-limited and sanitized to protect your API quotas.

### ✅ Task Manager
Keep track of what you're working on right now.

- Add tasks to your To-Do list.
- Click "▶ Start" to mark a task as Active. 
- The Active Task floats globally on the page so you never forget what you're doing.

### 📋 Secure Clipboard History
Automatically tracks your copy events across all tabs.

- **Smart Filtering:** Katban completely ignores passwords copied from `<input type="password">` fields.
- **Sensitive Data Scanner:** Credit cards and API tokens are redacted before they are ever saved.
- **AES-GCM Encryption:** All history items are fully encrypted on your hard drive and only decrypted when you open the Katban popup.
- **Judgmental Cat** — Copy more than 500 characters and the cat gives you a snarky comment like _"Copy-paste engineer spotted."_

### 📖 Word Definitions
Double-click any English word on a page to see its definition in a floating bubble, complete with a sneaking cat peeking over the top.

### ⚙️ Settings
- **Page Cat** — Toggle the corner cat on/off.
- **Meaning Cat** — Toggle the cat on the definition bubble.
- **Shared Cat** — Sync a single cat brain across all tabs (instead of per-tab).
- **Never Sleep** — Prevent the cat from falling asleep when you are idle.
- **Mute Sounds** — Mute the popup/bounce sound effects.
- **Cat Style** — Choose from Primary, Pink, Black, Orange, or Custom Tabby skins.

---

## Installation

1. Clone or download this repository.
2. Open Chrome and go to `chrome://extensions`.
3. Enable **Developer mode** (top right).
4. Click **Load unpacked** and select the project folder.
5. Pin the Katban extension from the extensions menu.

---

## Keyboard Shortcut

| Shortcut | Action |
|---|---|
| `Ctrl+Shift+K` (Windows/Linux) | Open Katban popup |
| `Cmd+Shift+K` (Mac) | Open Katban popup |

---

## Permissions

| Permission | Why |
|---|---|
| `storage` | Save timer state, encrypted clipboard history, tasks, settings, and cat style. |
| `tabs` | Broadcast messages to content scripts across all tabs. |
| `scripting` | Inject content scripts for the page cat and site blocking. |
| `alarms` | Run the Pomodoro timer tick and cat idle/prop timers in the background. |
| `*://*/*` (host) | Inject the corner cat and definition bubble on all web pages. |

See the [Privacy Policy](Privacy.md) for full details on data handling.

---

## Project Structure

```text
├── manifest.json       Chrome extension manifest (MV3)
├── background.js       Service worker — timer, cat brain, clipboard, site blocking
├── content.js          Injected page script — cat rendering, interactions, definitions
├── content.css         Injected styles — cat animations, states, definition bubble
├── popup.html          Extension popup — timer UI, clipboard list, chat interface
├── popup.js            Popup logic — timer controls, chat, eye tracking
├── popup.css           Popup styles
├── crypto.js           AES-GCM encryption wrapper for secure storage
├── katban-ai-worker/   Cloudflare Worker source for the Groq/Gemini AI backend
├── README.md           This file
└── Privacy.md          Privacy policy
```

---

## Credits

Made by **Shayan Asim**.

Dictionary definitions powered by the [Free Dictionary API](https://dictionaryapi.dev/).

