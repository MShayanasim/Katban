<![CDATA[# 🐱 Katban

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
- **Transparency on Hover** — Move your cursor over the cat and it becomes transparent so it doesn't get in the way.

### ⏱️ Focus Timer (Pomodoro)
A flexible Pomodoro-style focus timer built into the popup.

- Custom duration via `MM:SS` input or just minutes.
- Type `-` for an unlimited stopwatch that counts up.
- Automatic 5-minute break after each focus session.
- **Site Blocking** — Add domains (e.g. `reddit.com, youtube.com`) to block during focus sessions. Blocked pages show a fullscreen overlay with a stern cat telling you to get back to work.

### 📋 Clipboard History
Automatically tracks your last 5 copy events across all tabs.

- Timestamps for each entry.
- Text preview in the popup.
- Clear history with one click.
- **Judgmental Cat** — Copy more than 500 characters and the cat gives you a snarky comment like _"Copy-paste engineer spotted."_

### 📖 Word Definitions
Double-click any English word on a page to see its definition in a floating bubble, complete with a sneaking cat peeking over the top.

### ⚙️ Settings
- **Page Cat** — Toggle the corner cat on/off.
- **Meaning Cat** — Toggle the cat on the definition bubble.
- **Shared Cat** — Sync a single cat brain across all tabs (instead of per-tab).
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
| `Ctrl+Shift+Q` (Windows/Linux) | Open Katban popup |
| `Cmd+Shift+Q` (Mac) | Open Katban popup |

---

## Permissions

| Permission | Why |
|---|---|
| `storage` | Save timer state, clipboard history, settings, and cat style. |
| `tabs` | Broadcast messages to content scripts across all tabs. |
| `scripting` | Inject content scripts for the page cat and site blocking. |
| `alarms` | Run the Pomodoro timer tick and cat idle/prop timers in the background. |
| `*://*/*` (host) | Inject the corner cat and definition bubble on all web pages. |

See the [Privacy Policy](Privacy%20Policy.md) for full details on data handling.

---

## Project Structure

```
├── manifest.json       Chrome extension manifest (MV3)
├── background.js       Service worker — timer, cat brain, clipboard, site blocking
├── content.js          Injected page script — cat rendering, interactions, definitions
├── content.css         Injected styles — cat animations, states, definition bubble
├── popup.html          Extension popup — timer UI, clipboard list, settings
├── popup.js            Popup logic — timer controls, settings, eye tracking
├── popup.css           Popup styles
├── README.md           This file
└── Privacy Policy.md   Privacy policy
```

---

## Credits

Made by **Shayan Asim**.

Dictionary definitions powered by the [Free Dictionary API](https://dictionaryapi.dev/).
]]>
