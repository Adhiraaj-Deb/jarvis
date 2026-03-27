# JARVIS — AI Voice Assistant · Logic & Architecture Documentation

**Version:** 1.0 | **Project:** Synalpy · Personal | **Build Date:** March 2026

---

## Table of Contents
1. [Project Overview](#1-project-overview)
2. [Repository Structure](#2-repository-structure)
3. [Five-Layer Pipeline](#3-five-layer-pipeline)
4. [Service Layer Deep Dive](#4-service-layer-deep-dive)
5. [Intelligence Engine](#5-intelligence-engine)
6. [React Hooks — State Machine](#6-react-hooks--state-machine)
7. [UI Components](#7-ui-components)
8. [Offline Mode](#8-offline-mode)
9. [API Keys & Environment Variables](#9-api-keys--environment-variables)
10. [Known Model Expiry — Qwen 3 4B](#10-known-model-expiry--qwen-3-4b)
11. [Porcupine Wake Word Setup](#11-porcupine-wake-word-setup)
12. [TTS Tier System](#12-tts-tier-system)
13. [ElevenLabs Quota Tracking](#13-elevenlabs-quota-tracking)
14. [Cost Model](#14-cost-model)
15. [Capacitor Android Migration Path](#15-capacitor-android-migration-path)
16. [Error Handling & Graceful Degradation](#16-error-handling--graceful-degradation)
17. [Conversation Context](#17-conversation-context)
18. [Keyboard Shortcuts](#18-keyboard-shortcuts)

---

## 1. Project Overview

Jarvis is a personal, always-on AI voice assistant built to match or exceed the quality of commercial assistants (Google Assistant, Siri) while remaining fully under user ownership and costing ₹0/month for personal daily use.

**Design philosophy:** The voice IS the interface. The screen exists only to show pipeline state. No typing, no app-switching, no GUI menus during normal use.

**Core differentiators over commercial assistants:**
- Uses Deepgram Nova-2 for STT — significantly more accurate than Google STT, especially for Indian English accents and naturally spoken commands
- Dual AI models: Llama 3.3 70B for complex reasoning, Qwen 3 4B for fast simple commands
- Hybrid 3-tier TTS preserves ElevenLabs quota for high-value moments
- Fully offline capable for 12+ command types with zero network calls
- Fully open — user controls every model, every voice, every sensitivity setting

---

## 2. Repository Structure

```
jarvis/
├── .env                     # API keys (never commit)
├── .env.example             # Template — copy and fill
├── .gitignore
├── index.html               # SPA entry point, Google Fonts
├── vite.config.js           # Vite + Tailwind v4 + COOP/COEP headers
├── package.json
│
├── public/
│   ├── favicon.svg          # Blue orb J logo
│   └── wakeword/            # Place your .ppn file here (Porcupine)
│
└── src/
    ├── main.jsx             # React DOM root
    ├── App.jsx              # Layout, keyboard shortcuts, mic init
    ├── index.css            # All styles — dark space glassmorphism
    │
    ├── services/            # External API wrapper layer
    │   ├── deepgramService.js     # STT — Deepgram Nova-2
    │   ├── openrouterService.js   # AI — Llama + Qwen via OpenRouter
    │   ├── elevenLabsService.js   # TTS Tier 3 — ElevenLabs
    │   ├── webSpeechService.js    # TTS Tier 1 — Browser SpeechSynthesis
    │   └── ttsService.js          # Hybrid TTS router (all tiers)
    │
    ├── engine/              # Intelligence layer — no React dependencies
    │   ├── intentRouter.js        # Simple vs complex command classifier
    │   ├── offlineCommands.js     # Offline pattern matcher (12+ commands)
    │   └── actionEngine.js        # Executes intents (open URLs, timers, etc.)
    │
    ├── hooks/               # React state + side effects
    │   ├── usePipeline.js         # Core state machine (THE main hook)
    │   ├── useAudioCapture.js     # Mic access + MediaRecorder + silence detection
    │   └── useElevenLabsQuota.js  # localStorage quota tracker
    │
    └── components/          # UI components
        ├── Orb.jsx                # Canvas-animated state orb
        ├── StatusText.jsx         # Single-line pipeline state label
        ├── TranscriptDisplay.jsx  # User/Jarvis text with auto-fade
        ├── ModeIndicator.jsx      # Online/Offline badge
        ├── QuotaBar.jsx           # ElevenLabs quota progress bar
        └── SettingsPanel.jsx      # Slide-up settings drawer
```

---

## 3. Five-Layer Pipeline

The entire voice assistant runs as a linear five-layer pipeline. Each layer has a single responsibility and can be swapped independently.

```
┌─────────────────────────────────────────────────┐
│   LAYER 1 — WAKE WORD                          │
│   Porcupine (offline WASM) OR button click     │
│   → triggers pipeline activation               │
└────────────────────┬────────────────────────────┘
                     │ "Jarvis" detected
┌────────────────────▼────────────────────────────┐
│   LAYER 2 — SPEECH-TO-TEXT                     │
│   Online:  Deepgram Nova-2 (REST API)          │
│   Offline: Web Speech Recognition API          │
│   → produces transcript string                 │
└────────────────────┬────────────────────────────┘
                     │ "open spotify and play..."
┌────────────────────▼────────────────────────────┐
│   LAYER 3 — INTENT & AI BRAIN                  │
│   1. Check offline patterns first              │
│   2. Route simple → Qwen 3 4B                  │
│   3. Route complex → Llama 3.3 70B             │
│   → returns structured JSON response           │
└────────────────────┬────────────────────────────┘
                     │ { intent, action, reply }
┌────────────────────▼────────────────────────────┐
│   LAYER 4 — ACTION ENGINE                      │
│   open_app → window.open()                     │
│   search_web → Google search URL               │
│   set_alarm → setTimeout + notification        │
│   play_music → Spotify URL deep link           │
└────────────────────┬────────────────────────────┘
                     │ action executed
┌────────────────────▼────────────────────────────┐
│   LAYER 5 — TEXT-TO-SPEECH                     │
│   Tier 1: Web Speech API  (<80 chars)          │
│   Tier 2: (Kokoro — reserved for future)       │
│   Tier 3: ElevenLabs API  (>400 chars)         │
│   → spoken audio plays to user                 │
└─────────────────────────────────────────────────┘
```

---

## 4. Service Layer Deep Dive

### `deepgramService.js` — STT

**Why Deepgram Nova-2?** Deepgram's Nova-2 model outperforms Google Cloud STT and AWS Transcribe for conversational speech. It has lower Word Error Rate (WER) on Indian English and faster latency (~150–300ms). The $200 free credit is effectively 24+ months of personal use.

**Implementation:**
- Sends the recorded audio Blob as a raw binary body to the REST endpoint
- Uses `smart_format=true` for automatic punctuation and capitalisation
- 10-second AbortSignal timeout prevents the pipeline from hanging
- Detects STT failure and falls back to Web Speech Recognition API automatically

### `openrouterService.js` — AI Brain

**Why two OpenRouter keys?** The user provided two separate API keys (likely two accounts or two projects). This gives two separate 200 req/day quotas per model — effectively 400+ useful daily requests before any limit is hit. The system automatically falls back from Llama to Qwen on 429 errors.

**System prompt strategy:** The system prompt forces the model to return ONLY a valid JSON object matching a strict schema. This enables programmatic execution of intents. A `response_format: { type: 'json_object' }` parameter is also sent to OpenRouter to enforce this at the API level.

**Fallback chain:** Llama 3.3 70B (complex) → Qwen 3 4B (simple) → error message via Web Speech

### `elevenLabsService.js` — Premium TTS

Uses the `/v1/text-to-speech/{voice_id}/stream` endpoint with `eleven_turbo_v2` model for lowest latency. Returns an audio stream converted to a Blob URL, played via the native `Audio` API. Automatically revokes the blob URL after playback to prevent memory leaks.

**Default voice:** Rachel (`21m00Tcm4TlvDq8ikWAM`). Change `VITE_ELEVENLABS_VOICE_ID` in `.env` to any voice from your ElevenLabs account.

### `webSpeechService.js` — Free TTS

The browser's `SpeechSynthesis` API. Zero cost, works offline, instant. Prefers a Google or Male-named voice for a slightly deeper tone. Rate is set at 1.05x (slightly faster than default) and pitch at 0.95 (slightly deeper). This is used for all short replies and as the fallback when ElevenLabs fails or quota is exhausted.

### `ttsService.js` — Hybrid Router

Routing logic:
```
reply_length == 'short' OR chars < 80  → Tier 1 (Web Speech)
reply_length == 'medium'               → Tier 1 (Web Speech)
reply_length == 'long' OR chars > 400  →
  quota available + key configured     → Tier 3 (ElevenLabs)
  else                                 → Tier 1 (Web Speech, graceful fallback)
```

---

## 5. Intelligence Engine

### `intentRouter.js` — Complexity Classifier

Classifies each transcript as `'simple'` or `'complex'` using keyword matching:

- **Simple keywords** (→ Qwen 3 4B): `open`, `launch`, `play`, `stop`, `time`, `date`, `call`, `volume`, `mute`, etc.
- **Complex keywords** (→ Llama 3.3 70B): `search`, `define`, `explain`, `how to`, `why`, `translate`, `summarise`, `write`, etc.

Complex keywords are checked first — a phrase like "search for and open the Spotify app" has both "search" (complex) and "open" (simple), but is correctly routed to Llama.

As a heuristic fallback: commands under 5 words are classified as simple.

### `offlineCommands.js` — Pattern Matcher

12 offline command categories are handled with pure JavaScript — no network, no AI:

| Command | Example Phrases | Action |
|---|---|---|
| Time | "what time is it", "current time" | `new Date().toLocaleTimeString()` |
| Date | "today's date", "what date" | `new Date().toLocaleDateString()` |
| Day | "what day is it" | Day of week from Date |
| Play music | "play music", "shuffle music" | Opens Spotify web |
| Stop music | "stop", "pause music" | Pauses audio (web limited) |
| Open Spotify | "open Spotify" | `window.open()` |
| Open YouTube | "open YouTube" | `window.open()` |
| Open Maps | "open maps" | `window.open()` |
| Open WhatsApp | "open WhatsApp" | `window.open()` |
| Open Gmail | "open email" | `window.open()` |
| Set timer | "set a timer for 5 minutes" | `setTimeout` |
| Volume | "volume up", "mute" | Logged (requires Capacitor on mobile) |

**Fuzzy matching:** Text is normalised (lowercase, strip punctuation) and each keyword is scored as `hits / totalTokens`. A confidence threshold of 0.75 is required before a match fires.

### `actionEngine.js` — Executor

Executes the action field from the AI JSON response:

- **`open_app`** — looks up a URL map (Spotify, YouTube, WhatsApp, Maps, Gmail, Calculator) and calls `window.open()`
- **`play_music`** — opens Spotify web search for the requested song/artist
- **`search_web`** — opens Google with the query
- **`set_alarm`** — parses minutes/seconds/hours from the query and uses `setTimeout` to fire a callback

On Android with Capacitor, `window.open()` is replaced with `AppLauncher.openUrl()` for native app launching.

---

## 6. React Hooks — State Machine

### `usePipeline.js` — Core State Machine

This is the central nervous system of the app. It manages the full pipeline lifecycle:

```
States: dormant → activated → listening → processing → speaking → dormant
                                                              ↘ error → dormant
```

**State transitions:**

1. `activatePipeline()` called (button click or wake word)
2. State → `activated` (brief visual flash, 200ms delay for user feedback)
3. `startRecording()` begins — state → `listening`
4. Silence detected → recording stops → audio Blob handed off
5. `transcribeAudio(blob)` called — state → `processing`
6. `matchOfflineCommand(transcript)` checked first — if matched, skip AI
7. If online: `getComplexity()` → `callAI()` — still in `processing`
8. `executeAction(aiResponse)` runs (opens URLs, sets timers)
9. `speak(reply, replyLength)` called — state → `speaking`
10. TTS ends callback → state → `dormant`

**Conversation History:** Stored in a `useRef` (not state — never triggers re-renders). Last 12 messages (6 turns) are passed with each AI call for context continuity. Reset on "start over" / "forget that" voice commands.

### `useAudioCapture.js` — Mic Management

- Requests `getUserMedia` with 16kHz mono audio optimised for speech
- Uses `MediaRecorder` with 100ms chunks for smooth streaming
- Runs a `requestAnimationFrame` loop reading `AnalyserNode` byte time-domain data
- Computes RMS (Root Mean Square) amplitude each frame — fed to the Orb for waveform visualisation
- Silence detection: RMS below 0.01 for 1.5 consecutive seconds auto-stops recording
- Hard max of 10 seconds to prevent infinite recording if silence threshold isn't met

### `useElevenLabsQuota.js` — Quota Tracker

- Stores `jarvis_el_chars_used` and `jarvis_el_reset_month` in localStorage
- On each read, checks if the stored month differs from the current month — if so, resets the counter (auto-monthly reset)
- Free tier limit: 10,000 chars/month
- Alert threshold: 2,000 chars remaining

---

## 7. UI Components

### `Orb.jsx` — Animated Canvas Orb

The orb is drawn on an HTML5 Canvas using `requestAnimationFrame` for smooth 60fps animation. Each pipeline state has a distinct visual profile:

| State | Color | Animation |
|---|---|---|
| Dormant | Deep navy/blue | Slow 4s pulse |
| Activated | Bright cyan | Fast 0.4s pulse, border flash |
| Listening | Green | Waveform bars radiating outward, amplitude-reactive |
| Processing | Purple | Rotating arc spinner overlay |
| Speaking | Blue | Waveform bars synced to TTS amplitude |
| Error | Red | Fast 0.3s pulse |

The canvas is 320×320 logical pixels, rendered at `240px × 240px` CSS size. The orb is interactive — click to activate (when dormant) or interrupt (when active).

### `SettingsPanel.jsx` — Slide-Up Drawer

Implemented as a fixed-position bottom sheet that translates from `translateY(110%)` to `translateY(0)` with a CSS transition. Includes:
- API key status indicators (derived from `import.meta.env`)
- Wake word sensitivity slider (saved to localStorage)
- TTS tier preference radio buttons (Auto / Web Speech only / ElevenLabs always)
- AI model information with Qwen deprecation warning
- Conversation context turn count
- Recent command log (last 50, clearable)

---

## 8. Offline Mode

Offline mode is automatic — the `usePipeline` hook monitors `navigator.onLine` and the `online`/`offline` window events in real time using `useEffect`.

**Offline command flow:**
1. Wake word / button → recording begins
2. STT: falls back to Web Speech Recognition (browser-native, works offline)
3. `matchOfflineCommand(transcript)` called — pure Js, no network
4. If matched: execute locally, respond via Web Speech TTS
5. If not matched: reply "I need an internet connection for that"

**The ModeIndicator badge** (top right) shows Online (green) or Offline (amber) at all times.

---

## 9. API Keys & Environment Variables

All keys are stored in `.env` at the project root. Vite injects them at build time as `import.meta.env.VITE_*`. **Never commit `.env` to git** — `.gitignore` excludes it.

| Variable | Service | Required |
|---|---|---|
| `VITE_OPENROUTER_KEY_LLAMA` | Llama 3.3 70B | Yes |
| `VITE_OPENROUTER_KEY_QWEN` | Qwen 3 4B | Yes |
| `VITE_LLAMA_MODEL_ID` | Llama model ID | Yes |
| `VITE_QWEN_MODEL_ID` | Qwen model ID | Yes |
| `VITE_DEEPGRAM_KEY` | Deepgram Nova-2 | Yes |
| `VITE_ELEVENLABS_KEY` | ElevenLabs TTS | Optional |
| `VITE_ELEVENLABS_VOICE_ID` | ElevenLabs voice | Optional |
| `VITE_PORCUPINE_KEY` | Porcupine SDK | Optional |

If ElevenLabs is omitted, all TTS falls back to Web Speech. If Porcupine is omitted, the wake word is button/keyboard only (fully functional, just no "Jarvis" keyword listening).

---

## 10. Known Model Expiry — Qwen 3 4B

> ⚠️ **Qwen 3 4B (`qwen/qwen3-4b:free`) is scheduled for removal from OpenRouter on 2026-03-29.**

To switch to a replacement model:
1. Go to [openrouter.ai/models?q=free](https://openrouter.ai/models?q=free)
2. Pick any free model (e.g. `google/gemma-3-4b-it:free` or `mistralai/mistral-7b-instruct:free`)
3. Update `VITE_QWEN_MODEL_ID` in your `.env` file
4. Restart the dev server — no code changes needed

The model ID is a single `.env` variable by design, specifically to allow painless model swapping without touching code.

---

## 11. Porcupine Wake Word Setup

The app currently runs without Porcupine (button-only activation). To enable "Jarvis" wake word:

### Step 1 — Get Porcupine access key
- Create free account at [console.picovoice.ai](https://console.picovoice.ai/)
- Copy your access key
- Add to `.env`: `VITE_PORCUPINE_KEY=your_key_here`

### Step 2 — Place your trained model
- You should have downloaded a `.ppn` file from Picovoice Console after training "Jarvis"
- Place the file at: `public/wakeword/jarvis_en_wasm_v3_0_0.ppn`
  (or update the path in a future `porcupineWorker.js` implementation)

### Step 3 — Install SDK
```bash
npm install @picovoice/porcupine-web
```

### Step 4 — Add to usePipeline
The Porcupine integration slot is reserved in `usePipeline.js`. When the key is present and worker is active, it calls `activatePipeline()` automatically on keyword detection. The worker runs in a Web Worker thread so it doesn't block the main UI thread.

**Web Worker sketch for Porcupine:**
```js
// src/workers/porcupineWorker.js
import { PorcupineWorker } from '@picovoice/porcupine-web'

let porcupine = null

self.onmessage = async ({ data }) => {
  if (data.type === 'START') {
    porcupine = await PorcupineWorker.create(
      data.accessKey,
      [{ label: 'Jarvis', ppn: '/wakeword/jarvis_en_wasm_v3_0_0.ppn' }],
      (keywordIndex) => {
        if (keywordIndex === 0) self.postMessage({ type: 'WAKE' })
      }
    )
    await porcupine.startProcessing()
  }
  if (data.type === 'STOP') porcupine?.release()
}
```

---

## 12. TTS Tier System

Three tiers exist in a priority hierarchy. The routing decision is made in `ttsService.js`:

### Tier 1 — Web Speech API (SpeechSynthesis)
- **When:** `reply_length === 'short'` OR `chars < 80`
- **Examples:** "It's 10:30 PM.", "Opening Spotify.", "Done.", "Timer set."
- **Cost:** ₹0. Works offline. Zero latency.
- **Why not for everything:** Quality is robotic, especially on Windows. Acceptable only for short confirmations.

### Tier 2 — Reserved (Kokoro TTS)
- **Status:** Reserved for future implementation
- **What it would do:** Kokoro runs an ONNX neural TTS model in the browser via `onnxruntime-web`, giving significantly better quality than Web Speech with no API cost. The model is ~82MB and downloads once.
- **Why not now:** The `kokoro-js` npm package had API instability at build time. Added to roadmap.
- **When implemented:** Will handle `reply_length === 'medium'` (80–400 chars).

### Tier 3 — ElevenLabs API
- **When:** `reply_length === 'long'` OR `chars > 400` AND quota available AND key configured
- **Examples:** Definitions, article summaries, step-by-step explanations, reading content
- **Cost:** 10,000 chars/month free. Quota tracked in localStorage.
- **Model used:** `eleven_turbo_v2` (lowest latency, high quality)
- **Fallback:** If quota exhausted or API fails → Tier 1 (Web Speech)

---

## 13. ElevenLabs Quota Tracking

Implemented in `useElevenLabsQuota.js` as pure localStorage functions (not a React hook) so `ttsService.js` can call them without React context.

```
localStorage keys:
  jarvis_el_chars_used    — running total of chars sent this month
  jarvis_el_reset_month   — "YYYY-M" string of the last reset month
```

On each `getCharsUsed()` call, the module checks if the stored month matches the current month. If not, it resets the counter to 0 — fully automatic monthly reset without any cron job or server.

The quota bar (`QuotaBar.jsx`) refreshes every 5 seconds while the app is open, and on every window focus event.

---

## 14. Cost Model

| Service | Free Tier | Monthly Cost |
|---|---|---|
| OpenRouter (Llama 3.3 70B) | 200 req/day (6,000/month) | ₹0 |
| OpenRouter (Qwen 3 4B) | 200 req/day (6,000/month) | ₹0 |
| Deepgram Nova-2 | $200 free credit (~24 months) | ₹0 |
| ElevenLabs TTS | 10,000 chars/month | ₹0 |
| Web Speech API | Browser-native, unlimited | ₹0 |
| Porcupine Wake Word | Non-commercial unlimited | ₹0 |
| **TOTAL** | | **₹0/month** |

**Cost overflow safety:** Every API layer has a graceful fallback to a free alternative. The app cannot "break" due to a quota limit — it always degrades to a working (reduced quality) state.

---

## 15. Capacitor Android Migration Path

The codebase is designed from day one to be nearly identical for web and Android. The following changes are needed when wrapping with Capacitor:

### Changes Required
| Web (current) | Android (Capacitor) |
|---|---|
| `navigator.mediaDevices.getUserMedia` | `@capacitor/microphone` plugin |
| `window.open()` for apps | `@capacitor/app-launcher` deep links |
| `setTimeout` for timers | `@capacitor/local-notifications` |
| `navigator.onLine` | `@capacitor/network` plugin |
| Web Worker (Porcupine) | `@capacitor-community/background-runner` |

### Migration Steps
```bash
npm install @capacitor/core @capacitor/cli @capacitor/android
npx cap init
npx cap add android
npm run build
npx cap sync
npx cap open android
# Build APK in Android Studio
```

### Platform Detection Pattern
```js
import { Capacitor } from '@capacitor/core'
const isNative = Capacitor.isNativePlatform()
// Use isNative ? nativeAction() : webAction()
```

All action engine functions are structured to accept this pattern — no major refactoring required.

---

## 16. Error Handling & Graceful Degradation

| Error | Cause | Behaviour |
|---|---|---|
| Mic permission denied | User blocks mic | UI error state, voice prompt if TTS works |
| Deepgram timeout | Network slow | Auto-retry via Web Speech Recognition |
| OpenRouter 429 | Rate limit hit | Llama → Qwen fallback → error message |
| OpenRouter timeout (>15s) | Slow inference | AbortSignal fires, user told to retry |
| ElevenLabs quota | >10K chars/month | Automatic downgrade to Web Speech |
| ElevenLabs API failure | Server error | Immediate fallback to Web Speech |
| AI returns non-JSON | Model misbehaves | Raw text treated as `general_reply` |
| No speech detected | Silence after activation | Silent return to dormant (no error) |
| App not installed (deep link) | App missing | Browser opens web equivalent instead |
| Offline + no offline match | Unknown command | "I need an internet connection for that" |

---

## 17. Conversation Context

The last 6 conversation turns (3 user + 3 assistant messages) are sent with every AI call. This enables multi-turn interactions:

> "Jarvis, what is photosynthesis?" → detailed explanation  
> "Jarvis, explain that in simpler terms" → follow-up using context  
> "Jarvis, start over" → context cleared, fresh start

**Implementation:** Context is stored in a `useRef` array in `usePipeline.js`. It is **never persisted** — resets when the app is closed or when the user says "start over / forget that". This is intentional for privacy.

**Token management:** The context is always sliced to the last 12 messages before sending, then the oldest turns are trimmed naturally as new ones are added.

---

## 18. Keyboard Shortcuts

| Key | Action |
|---|---|
| `Space` | Activate pipeline (dormant) or interrupt (active) |
| `Esc` | Interrupt pipeline, close settings panel |

Shortcuts are registered in `App.jsx` via `window.addEventListener('keydown')`. The Space shortcut is only active when `document.body` is the target (prevents firing while typing in settings inputs).

---

*Jarvis v1.0 · Built with React 18 + Vite + Tailwind CSS · March 2026*  
*Deepgram Nova-2 · OpenRouter (Llama 3.3 70B + Qwen 3 4B) · ElevenLabs · Web Speech API*
