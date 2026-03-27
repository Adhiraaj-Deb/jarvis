
Personal / Portfolio Project — Confidential
PRODUCT REQUIREMENTS DOCUMENT
Jarvis
Always-On AI Voice Assistant
Android · Web · Chrome Extension

Version 1.0 — Initial Release
Date March 2026
Author Personal / Portfolio Project
Status Active Development
Platform Android (Primary) · Web · Chrome Extension

JARVIS — Product Requirements Document | v1.0 | March 2026

Personal / Portfolio Project — Confidential
1. Product Overview
1.1 Vision
Jarvis is a personal, always-on AI voice assistant that can hear you, understand you, and take
real action — not just answer questions. It operates continuously on Android and the web,
controlling apps, navigating the phone, playing music, and managing browser tabs through
natural voice commands.

1.2 Problem Statement
Existing voice assistants (Google Assistant, Siri) are locked to proprietary models, tightly
sandboxed, and cannot be customized or extended freely. Developers and power users have no
open, composable layer to build on top of.
Jarvis solves this by combining:
• Free, open AI models (GLM-4.5, LLaMA 3.5 Instruct, Qwen 2.5) that can be swapped
and combined
• True always-on listening via hardware wake word detection (Picovoice Porcupine)
• Deep OS-level control on Android via Accessibility Service
• Spotify integration via official SDK and Web API
• Browser tab control via Chrome Extension
• High-quality voice output via ElevenLabs TTS

1.3 Goals for v1
• Goal 1: Ship a fully functional always-on Android app with wake word support
• Goal 2: Achieve reliable phone and app control via Accessibility Service
• Goal 3: Integrate Spotify with full playback, search, and queue control
• Goal 4: Deploy web version to Vercel with HTTPS for Spotify OAuth
• Goal 5: Build a Chrome Extension for tab management from the web assistant
• Goal 6: Support ElevenLabs TTS and Google Translate TTS as voice engines

1.4 Non-Goals for v1
• iOS support — Apple&#39;s sandboxing makes OS-level control infeasible
• Custom wake word training — using Porcupine built-in keywords first
• On-device AI inference — all models are API-based for now

JARVIS — Product Requirements Document | v1.0 | March 2026

Personal / Portfolio Project — Confidential
• Multi-user / cloud sync — single-user personal tool

JARVIS — Product Requirements Document | v1.0 | March 2026

Personal / Portfolio Project — Confidential
2. Target Users
Jarvis v1 is a personal-use and portfolio project. The primary user is the developer themselves.
The secondary audience is technical evaluators (recruiters, collaborators) who will review the
project.
Primary User Secondary User Future User
Developer (you) — daily driver,
always-on on personal Android
phone

Technical recruiters and
collaborators evaluating the
portfolio project

Power users who want a
customizable, open-source AI
assistant on Android

JARVIS — Product Requirements Document | v1.0 | March 2026

Personal / Portfolio Project — Confidential
3. System Architecture
3.1 High-Level Components
Jarvis is composed of five distinct layers that work together:
Layer 1 — Input: Wake Word + Speech-to-Text

• Picovoice Porcupine (React Native SDK) — always-on wake word detection, runs locally
on-device, negligible battery impact
• Web Speech API — used on web version for STT (browser-native, free)
• Whisper API (fallback) — for higher accuracy STT on Android if needed
Layer 2 — AI Brain: Multi-Model Router
• GLM-4.5 Free — primary model via Zhipu API (free tier)
• LLaMA 3.5 Instruct — via Groq or Together AI free tier
• Qwen 2.5 — via Alibaba Cloud free tier
• All API keys secured server-side on Vercel, never in client bundle
• Router selects model based on task type and availability
Layer 3 — Action Engine: What Jarvis Can Do

• Android Accessibility Service — reads screen, simulates taps, types text, scrolls, swipes,
opens apps
• Android Foreground Service — keeps the app alive always, even with screen off
• Spotify App Remote SDK — direct playback control when Spotify is installed
• Spotify Web API — search, queue management, playlist control via Vercel backend
• Chrome Extension — tab open/close/switch, page control, postMessage bridge to web
app
Layer 4 — Output: Text-to-Speech

• ElevenLabs TTS — primary voice engine, high-quality neural voice
• Google Translate TTS — fallback, free, no API key required
Layer 5 — Backend: Vercel Serverless

JARVIS — Product Requirements Document | v1.0 | March 2026

Personal / Portfolio Project — Confidential
• Handles Spotify OAuth flow (Authorization Code, not Implicit)
• Proxies all AI model API calls to keep keys off the client
• Serves the web version of Jarvis over HTTPS (required for wake word + mic)

3.2 Data Flow
Voice → Porcupine detects wake word → STT converts speech → AI model receives prompt +
screen context → model returns JSON action → Action Engine executes → TTS speaks result
back to user

JARVIS — Product Requirements Document | v1.0 | March 2026

Personal / Portfolio Project — Confidential
4. Features &amp; Requirements
4.1 Feature List
Priority: P0 = must ship, P1 = ship in v1 if possible, P2 = post-v1
Feature Description Priority Status
Wake Word Always-on &#39;Hey Jarvis&#39; detection via
Porcupine, works screen-off

P0 In Progress

Speech-to-Text Convert user voice to text after wake word

triggers

P0 Done

Multi-Model AI Route queries to GLM-4.5, LLaMA 3.5, or

Qwen 2.5

P0 Done

ElevenLabs TTS High-quality voice response via ElevenLabs

neural TTS

P0 Done

Google TTS Fallback TTS using Google Translate voice

engine

P0 Done

Phone App Control Open apps, tap buttons, type text via

Accessibility Service

P0 Not Started

Screen Reading Read current screen UI tree to give AI

context

P0 Not Started

Spotify Playback Play/pause/skip/search via Spotify App

Remote + Web API

P0 In Progress

Spotify OAuth Secure auth flow via Vercel backend with

token refresh

P0 Not Started

Tab Control (Web) Open, close, switch browser tabs via

Chrome Extension

P1 Not Started

Always-On Service Android Foreground Service keeps Jarvis

alive in background

P0 Not Started

Vercel Deploy Web version deployed with HTTPS on

Vercel

P0 Not Started

App Navigation Navigate within apps (e.g. go to Spotify

Search tab)

P1 Not Started
Notifications Read and interact with Android notifications P1 Not Started
Custom Wake Word Train custom Porcupine keyword model P2 Not Started
On-device STT Whisper running locally, no API needed P2 Not Started

JARVIS — Product Requirements Document | v1.0 | March 2026

Personal / Portfolio Project — Confidential
5. Detailed Feature Specifications
5.1 Wake Word Detection
Library Picovoice Porcupine (React Native SDK)
Wake Phrase &quot;Hey Jarvis&quot; or closest available built-in keyword
Runs On On-device, no internet needed for detection
Trigger Starts STT capture, plays earcon sound to confirm
Screen State Works screen-off via Foreground Service
Known Issue Porcupine on web requires HTTPS — fix by deploying to Vercel

5.2 Multi-Model AI Router
The router selects a model per request based on priority, rate limit status, and task type. All
calls go through the Vercel backend — never directly from the client.
• GLM-4.5 Free — default for general queries and phone control reasoning
• LLaMA 3.5 Instruct — fallback if GLM rate limited, good for instruction following
• Qwen 2.5 — tertiary fallback, strong at multi-step tasks
• AI always receives: user query + current screen contents + available actions
• AI always returns: structured JSON with action type, target, and next steps

5.3 Phone App Control (Accessibility Service)
This is the core differentiator of Jarvis on Android. The Accessibility Service gives Jarvis the
ability to see and control everything on screen.

What it can do:
• Read full UI tree of any app on screen
• Find and tap any button, link, or element by text or position
• Type text into any focused input field
• Perform swipe and scroll gestures
• Open any installed app by package name
• Trigger system actions: back, home, recents, notifications

What it cannot do:

JARVIS — Product Requirements Document | v1.0 | March 2026

Personal / Portfolio Project — Confidential
• Control banking/financial apps (they detect and block Accessibility access)
• Work on iOS — Apple does not expose equivalent APIs
• Control other accessibility services
Setup: User must manually enable the service in Settings → Accessibility → Jarvis → Enable.
The app deep-links them there on first launch. This permission cannot be granted
programmatically.

5.4 Spotify Integration
Auth Method OAuth 2.0 Authorization Code Flow (via Vercel /api/spotify/callback)
Redirect URI https://your-app.vercel.app/callback (HTTPS required)
App Remote SDK Controls Spotify app directly if installed (play, pause, skip, seek)
Web API Search tracks, manage queue, get playback state, control playlists
Token Storage Access token + refresh token stored securely, auto-refreshed
Voice Commands &quot;Play [song] by [artist]&quot;, &quot;Skip&quot;, &quot;Add to queue&quot;, &quot;Pause&quot;

5.5 Tab Control — Chrome Extension
A companion Chrome Extension bridges the web version of Jarvis to browser tab management.
• Opens new tabs to any URL on command
• Switches focus between open tabs by title or domain
• Closes specified tabs
• Web app and extension communicate via chrome.runtime.sendMessage
• Extension manifest uses Manifest V3 (required by Chrome Web Store)

5.6 Voice Output
Primary Engine ElevenLabs TTS — neural voice, configurable voice ID
Fallback Engine Google Translate TTS — free, no key, slightly robotic
Selection User can switch in settings, or it falls back automatically if ElevenLabs

fails

Latency Target &lt; 1.5 seconds from AI response to first audio byte
Audio Output Android AudioManager / Web Audio API

JARVIS — Product Requirements Document | v1.0 | March 2026

Personal / Portfolio Project — Confidential
6. Technical Stack
6.1 Android App
Framework React Native (reuse web AI logic in JS)
Wake Word Picovoice Porcupine React Native SDK
Accessibility Native Kotlin module — AccessibilityService + GestureDescription
Always-On react-native-foreground-service (Android Foreground Service)
Spotify Spotify Android App Remote SDK (Kotlin native module)
TTS react-native-tts + ElevenLabs REST API
STT React Native Voice or Whisper API
RN Bridge Native Kotlin modules bridged to JS via NativeModules

6.2 Web App
Hosting Vercel (required for HTTPS + serverless functions)
Frontend React or vanilla JS (existing codebase)
STT Web Speech API (browser-native, free)
Wake Word Picovoice Porcupine Web SDK (requires HTTPS)
Tab Control Chrome Extension via postMessage / chrome.runtime

6.3 Backend (Vercel Serverless Functions)
Spotify OAuth /api/spotify/auth — redirect to Spotify; /api/spotify/callback —

exchange code

AI Proxy /api/ai — receives prompt, selects model, calls API, returns response
Token Refresh /api/spotify/refresh — silently refreshes expired access tokens
Env Vars All secrets (SPOTIFY_CLIENT_SECRET, ELEVENLABS_KEY, etc.) in

Vercel dashboard

6.4 Chrome Extension
Manifest Manifest V3

JARVIS — Product Requirements Document | v1.0 | March 2026

Personal / Portfolio Project — Confidential
Permissions tabs, activeTab, scripting
Communication chrome.runtime.sendMessage ↔ web app via content script
Actions openTab(url), closeTab(id), switchTab(id), listTabs()

JARVIS — Product Requirements Document | v1.0 | March 2026

Personal / Portfolio Project — Confidential
7. Android Permissions
The following permissions are required in AndroidManifest.xml:
Permission Grant Method Used For
BIND_ACCESSIBILITY_SERVICE User (manual in
Settings)

Screen reading and UI control
RECORD_AUDIO Runtime prompt Microphone for wake word + STT
FOREGROUND_SERVICE Auto at install Always-on background operation
QUERY_ALL_PACKAGES Auto at install Opening any installed app by

name

INTERNET Auto at install AI API calls, Spotify, ElevenLabs
RECEIVE_BOOT_COMPLETED Auto at install Auto-start Jarvis after phone

reboot

JARVIS — Product Requirements Document | v1.0 | March 2026

Personal / Portfolio Project — Confidential
8. Build Milestones
Recommended build order — each phase unblocks the next.
Phase Milestone Key Deliverables Target
Phase 1 Vercel Deploy +
Spotify OAuth

Deploy web app to Vercel, set up Spotify
OAuth callback, fix Porcupine on HTTPS

Week 1

Phase 2 Android Shell +
Foreground Service

React Native app, Foreground Service
always-on, mic permissions, wake word
working

Week 2

Phase 3 Accessibility
Service (Core)

Kotlin AccessibilityService, screen reading,
tap/type/swipe, open apps by voice

Week 3–4

Phase 4 Spotify Full
Integration

App Remote SDK, Web API search/queue,
OAuth token refresh, voice commands

Week 4–5

Phase 5 Chrome Extension Manifest V3 extension, tab open/close/switch,

bridge to web Jarvis

Week 5

Phase 6 Polish + Portfolio Error handling, onboarding flow, demo video,

GitHub README, live demo link

Week 6


JARVIS ANDROID — Master Build Documentv1.0 | March 2026 | Claude Sonnet 4.6 + Google Antigravity

Personal Project — Not for distribution
MASTER BUILD DOCUMENT — ANDROID APP
JARVIS
Always-On AI Voice Assistant
Full tech stack | Complete build guide | Claude Sonnet 4.6 prompts

Document Type Master Build Reference — Android App
AI Coding Model Claude Sonnet 4.6 (via Google Antigravity IDE)
Target Device Realme / Oppo Android (also works on all Android 10+)
Version 1.0 — March 2026
Website Status Existing — STT, AI models, TTS, Spotify tab open, chat UI built
Wake Word NOT yet built — first Android-only feature to build
Purpose Sole reference for building and understanding the entire project

JARVIS ANDROID — Master Build Documentv1.0 | March 2026 | Claude Sonnet 4.6 + Google Antigravity

Personal Project — Not for distribution
1. Project Overview
1.1 What Jarvis Is
Jarvis is a personal, always-on AI voice assistant that runs permanently on an Android phone. Unlike
Google Assistant or Siri, Jarvis is fully open and composable — it uses free AI models, can be fully
customised, and can actually control every app on the phone through Android&#39;s Accessibility Service. It
listens continuously for a wake word, understands natural speech, takes real actions on the phone, and
speaks responses back using a high-quality neural voice.

1.2 What Already Exists (Website Version)
The website version is partially built. The following features are already working and must
be PORTED or RE-USED in the Android app — not rebuilt from scratch.

Speech-to-Text Working on web via Web Speech API — Android will use react-

native-voice instead

AI Model Integration GLM-4.5 Free, LLaMA 3.5 Instruct, and Qwen 2.5 — all API calls

already written, reuse the logic

ElevenLabs TTS Working on web — Android will call same ElevenLabs REST API,

play via react-native-sound

Google Translate TTS Fallback TTS — same URL pattern works on Android WebView or

native fetch

Spotify Tab Opening Opens Spotify in a new browser tab — Android replaces this with

Spotify App Remote SDK

Chat UI Basic chat interface — Android gets a new React Native UI but

same conversation logic

1.3 What the Android App Adds
• Always-on wake word detection via Picovoice Porcupine — works even with screen off
• Android Accessibility Service — reads the screen and controls any app by simulating taps,
swipes, and text input
• Android Foreground Service — keeps Jarvis alive in background permanently, survives screen-
off and app switching
• Spotify App Remote SDK — controls the Spotify Android app directly, no browser needed
• Full phone navigation — open apps, go back, go home, read notifications, interact with any UI
element
• Realme / Oppo battery optimisation bypass — specific steps needed for this device family

JARVIS ANDROID — Master Build Documentv1.0 | March 2026 | Claude Sonnet 4.6 + Google Antigravity

Personal Project — Not for distribution
1.4 Core User Flow
User says &#39;Hey Jarvis&#39; → wake word detected on-device → microphone activates → speech
captured → sent to AI model via Vercel backend → AI reads current screen + decides
action → action executed on phone → TTS speaks result → back to listening

JARVIS ANDROID — Master Build Documentv1.0 | March 2026 | Claude Sonnet 4.6 + Google Antigravity

Personal Project — Not for distribution
2. Complete Technology Stack
2.1 Android App Layer
Framework React Native 0.73+ — write most code in JavaScript/TypeScript,

call native Android via NativeModules bridge

Language (JS) JavaScript (TypeScript optional but recommended for catching

errors early)

Language (Native) Kotlin — used ONLY for the Accessibility Service, Foreground

Service, and Spotify App Remote bridge

Build Tool Gradle — Android build system, configured automatically by React

Native

Min Android Version Android 10 (API 29) — covers all modern Realme/Oppo devices
Target SDK Android 14 (API 34)
Package Name com.jarvis.assistant — set this in android/app/build.gradle

2.2 Wake Word Detection
Library @picovoice/porcupine-react-native
What it does Runs a tiny neural net entirely on-device, continuously listens for
&#39;Jarvis&#39; keyword, zero battery impact, no internet needed
Wake keyword Use built-in keyword &#39;jarvis&#39; (Picovoice has this pre-trained — no

custom training needed)

Access Key Free from console.picovoice.ai — register account, create access

key, store in .env file

How it works Porcupine processes 512-sample audio frames at 16kHz, runs
keyword detection in &lt;1ms per frame, fires onKeywordDetected
callback

Screen-off Works because it runs inside the always-on Foreground Service,

not the UI layer

2.3 Speech-to-Text (STT)
Primary Library react-native-voice — wraps Android&#39;s built-in SpeechRecognizer

API, completely free

How it works After wake word fires, STT starts recording, user speaks
command, STT returns text string when silence detected

JARVIS ANDROID — Master Build Documentv1.0 | March 2026 | Claude Sonnet 4.6 + Google Antigravity

Personal Project — Not for distribution
Language English (en-US) — can add more languages later
Fallback Whisper API (OpenAI) — if native STT quality is poor, send audio

buffer to Whisper endpoint

Timeout 8 seconds of silence ends recording automatically

2.4 AI Model Layer
All three models are called through the Vercel backend — never directly from the Android
app. This keeps API keys safe and off the device.

Model 1 — Primary GLM-4.5 Free — via Zhipu AI API (api.zhipuai.cn). Fast, good at

following instructions, generous free tier

Model 2 — Fallback 1 LLaMA 3.5 Instruct — via Groq API (api.groq.com). Fastest

inference of all three, good for simple commands

Model 3 — Fallback 2 Qwen 2.5 — via Alibaba DashScope API. Strong at multi-step

reasoning, good fallback

Router Logic Try GLM first → if 429 rate limit or timeout → try LLaMA → if fails

→ try Qwen → if all fail → respond with error TTS

Prompt Structure System prompt + current screen contents (from Accessibility) +

user query + list of available actions

Response Format AI always returns JSON: { action, target, parameters,
speech_response } — parsed and executed by action engine
API Proxy All calls go to /api/ai on Vercel — Vercel function selects model

and returns response to Android app

2.5 Text-to-Speech (TTS)
Primary —
ElevenLabs

REST API call to api.elevenlabs.io/v1/text-to-speech/{voice_id},
returns MP3 audio, played via react-native-sound

Voice ID Choose from ElevenLabs voice library — &#39;Rachel&#39; or &#39;Adam&#39;

recommended for assistant feel

Fallback — Google
TTS

Fetch from https://translate.google.com/translate_tts?ie=UTF-
8&amp;client=tw-ob&amp;tl=en&amp;q={text} — free, no key

Latency ElevenLabs: ~800ms. Google TTS: ~200ms. Switch based on

speed vs quality preference

Audio Playback react-native-sound plays the MP3/audio file returned by TTS API
Queue TTS responses are queued — if AI responds while previous TTS

is playing, new one starts after

JARVIS ANDROID — Master Build Documentv1.0 | March 2026 | Claude Sonnet 4.6 + Google Antigravity

Personal Project — Not for distribution
2.6 Android Accessibility Service (Phone Control)
Language Kotlin — must be native, cannot be done in React Native JS
Class JarvisAccessibilityService extends AccessibilityService
Capabilities Read full UI tree of any screen, tap any element, type text, scroll,

swipe, open apps, press Back/Home/Recents

Communication Kotlin service exposes methods that React Native calls via

NativeModules bridge

Screen reading getRootInActiveWindow() returns entire UI element tree —

serialised to JSON and sent to AI as context
Tap action findAccessibilityNodeInfosByText() finds element,

performAction(ACTION_CLICK) taps it

Text input Set ACTION_ARGUMENT_SET_TEXT on focused field — works

in any app&#39;s text input

Gestures GestureDescription API for swipe, scroll, long press — built on

dispatchGesture()

Blocked apps Banking apps and some system apps detect Accessibility and

block it — document as known limitation

2.7 Android Foreground Service (Always-On)
Language Kotlin — JarvisBackgroundService extends Service
Purpose Keeps Jarvis running permanently in background, even when

screen is off or user is in another app

Notification Shows persistent notification &#39;Jarvis is listening&#39; — required by

Android for foreground services

START_STICKY If Android kills the service (memory pressure), it automatically

restarts

WakeLock Acquires PARTIAL_WAKE_LOCK to keep CPU running even with

screen off — needed for wake word

Realme/Oppo note Must add app to &#39;Protected Apps&#39; in Realme/Oppo settings AND

disable battery saver for Jarvis — guide in Section 7

Boot start RECEIVE_BOOT_COMPLETED intent starts Jarvis automatically

when phone reboots

2.8 Spotify Integration

JARVIS ANDROID — Master Build Documentv1.0 | March 2026 | Claude Sonnet 4.6 + Google Antigravity

Personal Project — Not for distribution
Method 1 — App
Remote

Spotify Android SDK (spotify-app-remote-release-x.x.x.aar) —
controls Spotify app directly if installed, no browser

Method 2 — Web API REST calls to api.spotify.com — search tracks, manage queue,

get playback state

Auth OAuth 2.0 Authorization Code Flow — handled by Vercel
backend, tokens stored in Android SecureStorage
Redirect URI https://your-app.vercel.app/api/spotify/callback — must be
HTTPS, registered in Spotify Developer Dashboard

Token refresh Vercel /api/spotify/refresh endpoint auto-refreshes expired access

tokens using refresh_token

Voice commands &#39;Play [song] by [artist]&#39;, &#39;Skip&#39;, &#39;Pause&#39;, &#39;Add to queue&#39;, &#39;What&#39;s

playing?&#39;, &#39;Volume up/down&#39;

Fallback If Spotify app not installed, open Spotify Web Player URL in

Android browser

2.9 Backend — Vercel Serverless Functions
Platform Vercel — free tier, auto-deploys from GitHub, provides HTTPS

automatically

Why needed HTTPS required for Picovoice on web, Spotify OAuth needs
secure redirect URI, AI API keys must never be in app
/api/ai Receives prompt + screen context from Android app, selects AI

model, returns JSON action

/api/spotify/auth Redirects browser to Spotify OAuth consent screen
/api/spotify/callback Receives auth code from Spotify, exchanges for access+refresh

tokens, stores and returns them

/api/spotify/refresh Takes refresh token, returns new access token — called

automatically when access token expires

Environment vars SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET,
ELEVENLABS_API_KEY, GLM_API_KEY, GROQ_API_KEY,
QWEN_API_KEY

Runtime Node.js 20 — default Vercel runtime

2.10 React Native to Kotlin Bridge
Mechanism React Native NativeModules — JS calls Kotlin functions, Kotlin

fires JS events

AccessibilityModule Exposes: readScreen(), tapElement(text), typeText(text),
openApp(packageName), performGlobal(action)

JARVIS ANDROID — Master Build Documentv1.0 | March 2026 | Claude Sonnet 4.6 + Google Antigravity

Personal Project — Not for distribution
SpotifyModule Exposes: connectSpotify(), play(uri), pause(), skip(),

getPlaybackState()

ServiceModule Exposes: startService(), stopService(), isServiceRunning()
Events JS→KT NativeModules.AccessibilityModule.tapElement(&#39;Search&#39;) —

synchronous call

Events KT→JS DeviceEventEmitter.emit(&#39;onWakeWord&#39;) — Kotlin notifies JS that

wake word fired

JARVIS ANDROID — Master Build Documentv1.0 | March 2026 | Claude Sonnet 4.6 + Google Antigravity

Personal Project — Not for distribution
3. Complete Project File Structure
This is the exact folder and file layout Claude Sonnet 4.6 should create. Every file listed
here is needed.

JarvisAndroid/
├── android/ ← Native Android code (Kotlin)
│ ├── app/
│ │ ├── src/main/
│ │ │ ├── java/com/jarvis/
│ │ │ │ ├── MainActivity.kt ← App entry point
│ │ │ │ ├── MainApplication.kt ← RN application class
│ │ │ │ ├── services/
│ │ │ │ │ ├── JarvisBackgroundService.kt ← Foreground service
│ │ │ │ │ └── BootReceiver.kt ← Auto-start on boot
│ │ │ │ ├── accessibility/
│ │ │ │ │ └── JarvisAccessibilityService.kt ← Screen control
│ │ │ │ ├── modules/
│ │ │ │ │ ├── AccessibilityModule.kt ← RN bridge: accessibility
│ │ │ │ │ ├── ServiceModule.kt ← RN bridge: foreground
service
│ │ │ │ │ ├── SpotifyModule.kt ← RN bridge: Spotify
│ │ │ │ │ └── JarvisPackage.kt ← Registers all modules
│ │ │ │ └── spotify/
│ │ │ │ └── SpotifyManager.kt ← Spotify App Remote logic
│ │ │ ├── res/
│ │ │ │ ├── xml/
│ │ │ │ │ └── accessibility_service_config.xml ← Required config
│ │ │ │ └── drawable/
│ │ │ │ └── ic_notification.xml ← Notification icon
│ │ │ └── AndroidManifest.xml ← All permissions declared
here
│ │ └── build.gradle ← App dependencies
│ └── build.gradle ← Project-level gradle
│
├── src/ ← React Native JS code
│ ├── App.tsx ← Root component, navigation setup
│ ├── screens/
│ │ ├── HomeScreen.tsx ← Main chat / assistant UI
│ │ └── SettingsScreen.tsx ← API keys, voice selection, permissions
│ ├── services/
│ │ ├── wakeWord.ts ← Porcupine wake word manager
│ │ ├── stt.ts ← Speech-to-text manager
│ │ ├── aiRouter.ts ← AI model selection and calling
│ │ ├── tts.ts ← ElevenLabs + Google TTS manager
│ │ ├── actionEngine.ts ← Parses AI JSON, dispatches actions
│ │ ├── spotifyService.ts ← Spotify Web API calls
│ │ └── storageService.ts ← Secure token and config storage
│ ├── bridge/
│ │ ├── AccessibilityBridge.ts ← JS wrapper for AccessibilityModule
│ │ ├── ServiceBridge.ts ← JS wrapper for ServiceModule
│ │ └── SpotifyBridge.ts ← JS wrapper for SpotifyModule
│ ├── hooks/
│ │ └── useJarvis.ts ← Main hook: orchestrates full conversation
loop
│ ├── utils/

JARVIS ANDROID — Master Build Documentv1.0 | March 2026 | Claude Sonnet 4.6 + Google Antigravity

Personal Project — Not for distribution
│ │ └── systemPrompt.ts ← Builds AI system prompt with screen
context
│ └── constants/
│ └── config.ts ← Vercel URL, package names, timeouts
│
├── vercel-backend/ ← Deploy this to Vercel
│ └── api/
│ ├── ai.js ← AI model router endpoint
│ ├── spotify/
│ │ ├── auth.js ← Spotify OAuth redirect
│ │ ├── callback.js ← Spotify OAuth token exchange
│ │ └── refresh.js ← Token refresh endpoint
│ └── health.js ← Health check
│
├── .env ← Local env vars (NOT committed to git)
├── package.json
└── tsconfig.json

JARVIS ANDROID — Master Build Documentv1.0 | March 2026 | Claude Sonnet 4.6 + Google Antigravity

Personal Project — Not for distribution
4. AndroidManifest.xml — Complete File
This is the complete AndroidManifest.xml. Every permission and service declaration must
be present exactly as shown. Missing a single entry will cause the feature to silently fail.

&lt;?xml version=&quot;1.0&quot; encoding=&quot;utf-8&quot;?&gt;
&lt;manifest xmlns:android=&quot;http://schemas.android.com/apk/res/android&quot;
package=&quot;com.jarvis.assistant&quot;&gt;
&lt;!-- ── PERMISSIONS ───────────────────────────────────────── --&gt;
&lt;!-- Microphone: required for wake word + STT --&gt;
&lt;uses-permission android:name=&quot;android.permission.RECORD_AUDIO&quot; /&gt;
&lt;!-- Foreground service: keeps Jarvis alive in background --&gt;
&lt;uses-permission android:name=&quot;android.permission.FOREGROUND_SERVICE&quot; /&gt;
&lt;uses-permission
android:name=&quot;android.permission.FOREGROUND_SERVICE_MICROPHONE&quot; /&gt;
&lt;!-- Network: AI API calls, Spotify, ElevenLabs --&gt;
&lt;uses-permission android:name=&quot;android.permission.INTERNET&quot; /&gt;
&lt;!-- Open any installed app --&gt;
&lt;uses-permission android:name=&quot;android.permission.QUERY_ALL_PACKAGES&quot; /&gt;
&lt;!-- Auto-start after device reboot --&gt;
&lt;uses-permission android:name=&quot;android.permission.RECEIVE_BOOT_COMPLETED&quot; /&gt;
&lt;!-- Wake lock: keep CPU on when screen is off --&gt;
&lt;uses-permission android:name=&quot;android.permission.WAKE_LOCK&quot; /&gt;
&lt;!-- Vibrate for earcon feedback --&gt;
&lt;uses-permission android:name=&quot;android.permission.VIBRATE&quot; /&gt;
&lt;application
android:name=&quot;.MainApplication&quot;
android:label=&quot;Jarvis&quot;
android:usesCleartextTraffic=&quot;false&quot;
android:requestLegacyExternalStorage=&quot;true&quot;&gt;
&lt;!-- ── MAIN ACTIVITY ──────────────────────────────────── --&gt;
&lt;activity android:name=&quot;.MainActivity&quot;
android:windowSoftInputMode=&quot;adjustResize&quot;
android:exported=&quot;true&quot;&gt;
&lt;intent-filter&gt;
&lt;action android:name=&quot;android.intent.action.MAIN&quot; /&gt;
&lt;category android:name=&quot;android.intent.category.LAUNCHER&quot; /&gt;
&lt;/intent-filter&gt;
&lt;/activity&gt;
&lt;!-- ── FOREGROUND SERVICE ────────────────────────────── --&gt;
&lt;service
android:name=&quot;.services.JarvisBackgroundService&quot;

JARVIS ANDROID — Master Build Documentv1.0 | March 2026 | Claude Sonnet 4.6 + Google Antigravity

Personal Project — Not for distribution
android:foregroundServiceType=&quot;microphone&quot;
android:exported=&quot;false&quot; /&gt;
&lt;!-- ── BOOT RECEIVER ─────────────────────────────────── --&gt;
&lt;receiver
android:name=&quot;.services.BootReceiver&quot;
android:exported=&quot;true&quot;&gt;
&lt;intent-filter&gt;
&lt;action android:name=&quot;android.intent.action.BOOT_COMPLETED&quot; /&gt;
&lt;/intent-filter&gt;
&lt;/receiver&gt;
&lt;!-- ── ACCESSIBILITY SERVICE ─────────────────────────── --&gt;
&lt;service
android:name=&quot;.accessibility.JarvisAccessibilityService&quot;
android:permission=&quot;android.permission.BIND_ACCESSIBILITY_SERVICE&quot;
android:exported=&quot;true&quot;&gt;
&lt;intent-filter&gt;
&lt;action
android:name=&quot;android.accessibilityservice.AccessibilityService&quot; /&gt;
&lt;/intent-filter&gt;
&lt;meta-data
android:name=&quot;android.accessibilityservice&quot;
android:resource=&quot;@xml/accessibility_service_config&quot; /&gt;
&lt;/service&gt;
&lt;/application&gt;
&lt;/manifest&gt;

JARVIS ANDROID — Master Build Documentv1.0 | March 2026 | Claude Sonnet 4.6 + Google Antigravity

Personal Project — Not for distribution
5. Complete Kotlin Source Files
Copy these files exactly into the paths shown in Section 3. Do not rename classes or
packages — the NativeModules bridge depends on exact names.

5.1 JarvisBackgroundService.kt
This is the always-on service. It runs permanently, holds the WakeLock, and starts Porcupine wake
word detection. It communicates wake word events back to React Native via DeviceEventEmitter.
package com.jarvis.assistant.services
import android.app.*
import android.content.Intent
import android.os.*
import android.util.Log
import androidx.core.app.NotificationCompat
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.modules.core.DeviceEventManagerModule
import ai.picovoice.porcupine.*
class JarvisBackgroundService : Service() {
private val CHANNEL_ID = &quot;jarvis_channel&quot;
private val TAG = &quot;JarvisService&quot;
private var wakeLock: PowerManager.WakeLock? = null
private var porcupineManager: PorcupineManager? = null
override fun onCreate() {
super.onCreate()
createNotificationChannel()
}
override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
val notification = buildNotification()
startForeground(1, notification)
acquireWakeLock()
startWakeWordDetection()
return START_STICKY
}
private fun startWakeWordDetection() {
try {
porcupineManager = PorcupineManager.Builder()
.setAccessKey(BuildConfig.PICOVOICE_ACCESS_KEY)
.setKeyword(Porcupine.BuiltInKeyword.JARVIS)
.build(applicationContext) { keywordIndex -&gt;
Log.d(TAG, &quot;Wake word detected!&quot;)
sendWakeWordEvent()
}
porcupineManager?.start()
Log.d(TAG, &quot;Porcupine started&quot;)

JARVIS ANDROID — Master Build Documentv1.0 | March 2026 | Claude Sonnet 4.6 + Google Antigravity

Personal Project — Not for distribution
} catch (e: PorcupineException) {
Log.e(TAG, &quot;Porcupine error: ${e.message}&quot;)
}
}
private fun sendWakeWordEvent() {
val reactContext = (application as? com.jarvis.assistant.MainApplication)
?.reactNativeHost?.reactInstanceManager?.currentReactContext
reactContext?.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.ja
va)
?.emit(&quot;onWakeWord&quot;, null)
}
private fun acquireWakeLock() {
val pm = getSystemService(POWER_SERVICE) as PowerManager
wakeLock = pm.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK,
&quot;Jarvis::WakeLock&quot;)
wakeLock?.acquire()
}
private fun buildNotification(): Notification {
val intent = Intent(this, com.jarvis.assistant.MainActivity::class.java)
val pi = PendingIntent.getActivity(this, 0, intent,
PendingIntent.FLAG_IMMUTABLE)
return NotificationCompat.Builder(this, CHANNEL_ID)
.setContentTitle(&quot;Jarvis&quot;)
.setContentText(&quot;Listening for &#39;Hey Jarvis&#39;...&quot;)
.setSmallIcon(android.R.drawable.ic_btn_speak_now)
.setContentIntent(pi)
.setOngoing(true)
.build()
}
private fun createNotificationChannel() {
val channel = NotificationChannel(CHANNEL_ID, &quot;Jarvis&quot;,
NotificationManager.IMPORTANCE_LOW)
getSystemService(NotificationManager::class.java).createNotificationChannel(channe
l)
}
override fun onDestroy() {
porcupineManager?.stop()
porcupineManager?.delete()
wakeLock?.release()
super.onDestroy()
}
override fun onBind(intent: Intent?): IBinder? = null
}

5.2 JarvisAccessibilityService.kt
The most powerful component. This service reads the screen and executes actions. It exposes a
companion object so AccessibilityModule can call its methods from the React Native bridge.

JARVIS ANDROID — Master Build Documentv1.0 | March 2026 | Claude Sonnet 4.6 + Google Antigravity

Personal Project — Not for distribution
package com.jarvis.assistant.accessibility
import android.accessibilityservice.AccessibilityService
import android.accessibilityservice.GestureDescription
import android.graphics.Path
import android.os.Bundle
import android.util.Log
import android.view.accessibility.AccessibilityEvent
import android.view.accessibility.AccessibilityNodeInfo
import org.json.JSONArray
import org.json.JSONObject
class JarvisAccessibilityService : AccessibilityService() {
companion object {
var instance: JarvisAccessibilityService? = null
private set
fun isRunning() = instance != null
// Called by AccessibilityModule from React Native
fun readScreen(): String {
val root = instance?.rootInActiveWindow ?: return &quot;{}&quot;
return serializeNode(root).toString()
}
fun tapElement(text: String): Boolean {
val root = instance?.rootInActiveWindow ?: return false
val nodes = root.findAccessibilityNodeInfosByText(text)
if (nodes.isNullOrEmpty()) return false
nodes.first().performAction(AccessibilityNodeInfo.ACTION_CLICK)
return true
}
fun tapByViewId(viewId: String): Boolean {
val root = instance?.rootInActiveWindow ?: return false
val nodes = root.findAccessibilityNodeInfosByViewId(viewId)
if (nodes.isNullOrEmpty()) return false
nodes.first().performAction(AccessibilityNodeInfo.ACTION_CLICK)
return true
}
fun typeText(text: String): Boolean {
val root = instance?.rootInActiveWindow ?: return false
val focused = root.findFocus(AccessibilityNodeInfo.FOCUS_INPUT) ?:
return false
val args = Bundle()
args.putCharSequence(AccessibilityNodeInfo.ACTION_ARGUMENT_SET_TEXT_CHARSEQUENCE,
text)
focused.performAction(AccessibilityNodeInfo.ACTION_SET_TEXT, args)
return true
}
fun scrollDown(): Boolean {
val root = instance?.rootInActiveWindow ?: return false
root.performAction(AccessibilityNodeInfo.ACTION_SCROLL_FORWARD)
return true
}

JARVIS ANDROID — Master Build Documentv1.0 | March 2026 | Claude Sonnet 4.6 + Google Antigravity

Personal Project — Not for distribution
fun performGlobal(action: String): Boolean {
val svc = instance ?: return false
return when (action) {
&quot;BACK&quot; -&gt; svc.performGlobalAction(GLOBAL_ACTION_BACK)
&quot;HOME&quot; -&gt; svc.performGlobalAction(GLOBAL_ACTION_HOME)
&quot;RECENTS&quot; -&gt; svc.performGlobalAction(GLOBAL_ACTION_RECENTS)
&quot;NOTIFS&quot; -&gt; svc.performGlobalAction(GLOBAL_ACTION_NOTIFICATIONS)
else -&gt; false
}
}
fun tapAt(x: Float, y: Float) {
val path = Path().apply { moveTo(x, y) }
val stroke = GestureDescription.StrokeDescription(path, 0, 100)
val gesture = GestureDescription.Builder().addStroke(stroke).build()
instance?.dispatchGesture(gesture, null, null)
}
private fun serializeNode(node: AccessibilityNodeInfo): JSONObject {
val obj = JSONObject()
obj.put(&quot;text&quot;, node.text?.toString() ?: &quot;&quot;)
obj.put(&quot;desc&quot;, node.contentDescription?.toString() ?: &quot;&quot;)
obj.put(&quot;class&quot;, node.className?.toString() ?: &quot;&quot;)
obj.put(&quot;clickable&quot;, node.isClickable)
obj.put(&quot;editable&quot;, node.isEditable)
obj.put(&quot;viewId&quot;, node.viewIdResourceName ?: &quot;&quot;)
val bounds = android.graphics.Rect()
node.getBoundsInScreen(bounds)
obj.put(&quot;bounds&quot;,
&quot;${bounds.left},${bounds.top},${bounds.right},${bounds.bottom}&quot;)
val children = JSONArray()
for (i in 0 until node.childCount) {
node.getChild(i)?.let { children.put(serializeNode(it)) }
}
obj.put(&quot;children&quot;, children)
return obj
}
}
override fun onServiceConnected() {
instance = this
Log.d(&quot;JarvisA11y&quot;, &quot;Accessibility Service connected&quot;)
serviceInfo = serviceInfo.apply {
eventTypes = AccessibilityEvent.TYPES_ALL_MASK
feedbackType = FEEDBACK_GENERIC
flags = DEFAULT
notificationTimeout = 100
}
}
override fun onAccessibilityEvent(event: AccessibilityEvent) {
// Available for monitoring — not needed for basic control
}
override fun onInterrupt() {}
override fun onDestroy() {
instance = null
super.onDestroy()

JARVIS ANDROID — Master Build Documentv1.0 | March 2026 | Claude Sonnet 4.6 + Google Antigravity

Personal Project — Not for distribution
}
}

5.3 AccessibilityModule.kt (React Native Bridge)
This is the bridge that lets JavaScript call the Kotlin Accessibility Service. Every public method here
becomes callable from React Native as NativeModules.AccessibilityModule.methodName().
package com.jarvis.assistant.modules
import com.facebook.react.bridge.*
import com.jarvis.assistant.accessibility.JarvisAccessibilityService
import com.jarvis.assistant.services.JarvisBackgroundService
import android.content.Intent
class AccessibilityModule(private val reactContext: ReactApplicationContext)
: ReactContextBaseJavaModule(reactContext) {
override fun getName() = &quot;AccessibilityModule&quot;
@ReactMethod
fun isRunning(promise: Promise) {
promise.resolve(JarvisAccessibilityService.isRunning())
}
@ReactMethod
fun readScreen(promise: Promise) {
promise.resolve(JarvisAccessibilityService.readScreen())
}
@ReactMethod
fun tapElement(text: String, promise: Promise) {
promise.resolve(JarvisAccessibilityService.tapElement(text))
}
@ReactMethod
fun typeText(text: String, promise: Promise) {
promise.resolve(JarvisAccessibilityService.typeText(text))
}
@ReactMethod
fun performGlobal(action: String, promise: Promise) {
promise.resolve(JarvisAccessibilityService.performGlobal(action))
}
@ReactMethod
fun openApp(packageName: String, promise: Promise) {
try {
val intent = reactContext.packageManager
.getLaunchIntentForPackage(packageName)
if (intent != null) {
intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
reactContext.startActivity(intent)
promise.resolve(true)
} else {

JARVIS ANDROID — Master Build Documentv1.0 | March 2026 | Claude Sonnet 4.6 + Google Antigravity

Personal Project — Not for distribution
promise.resolve(false)
}
} catch (e: Exception) {
promise.reject(&quot;OPEN_APP_ERROR&quot;, e.message)
}
}
@ReactMethod
fun tapAt(x: Float, y: Float, promise: Promise) {
JarvisAccessibilityService.tapAt(x, y)
promise.resolve(true)
}
}

5.4 ServiceModule.kt (Foreground Service Bridge)
package com.jarvis.assistant.modules
import android.content.Intent
import com.facebook.react.bridge.*
import com.jarvis.assistant.services.JarvisBackgroundService
class ServiceModule(private val reactContext: ReactApplicationContext)
: ReactContextBaseJavaModule(reactContext) {
override fun getName() = &quot;ServiceModule&quot;
@ReactMethod
fun startService(promise: Promise) {
val intent = Intent(reactContext, JarvisBackgroundService::class.java)
reactContext.startForegroundService(intent)
promise.resolve(true)
}
@ReactMethod
fun stopService(promise: Promise) {
val intent = Intent(reactContext, JarvisBackgroundService::class.java)
reactContext.stopService(intent)
promise.resolve(true)
}
}

5.5 JarvisPackage.kt (Register All Modules)
package com.jarvis.assistant.modules
import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ViewManager

JARVIS ANDROID — Master Build Documentv1.0 | March 2026 | Claude Sonnet 4.6 + Google Antigravity

Personal Project — Not for distribution
class JarvisPackage : ReactPackage {
override fun createNativeModules(ctx: ReactApplicationContext):
List&lt;NativeModule&gt; =
listOf(
AccessibilityModule(ctx),
ServiceModule(ctx),
SpotifyModule(ctx),
)
override fun createViewManagers(ctx: ReactApplicationContext):
List&lt;ViewManager&lt;*, *&gt;&gt; =
emptyList()
}

5.6 BootReceiver.kt
package com.jarvis.assistant.services
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
class BootReceiver : BroadcastReceiver() {
override fun onReceive(context: Context, intent: Intent) {
if (intent.action == Intent.ACTION_BOOT_COMPLETED) {
val serviceIntent = Intent(context,
JarvisBackgroundService::class.java)
context.startForegroundService(serviceIntent)
}
}
}

5.7 accessibility_service_config.xml
Place this file at android/app/src/main/res/xml/accessibility_service_config.xml
&lt;?xml version=&quot;1.0&quot; encoding=&quot;utf-8&quot;?&gt;
&lt;accessibility-service xmlns:android=&quot;http://schemas.android.com/apk/res/android&quot;
android:description=&quot;@string/app_name&quot;
android:accessibilityEventTypes=&quot;typeAllMask&quot;
android:accessibilityFeedbackType=&quot;feedbackGeneric&quot;
android:notificationTimeout=&quot;100&quot;
android:accessibilityFlags=&quot;flagDefault&quot;
android:canRetrieveWindowContent=&quot;true&quot;
android:canPerformGestures=&quot;true&quot; /&gt;

JARVIS ANDROID — Master Build Documentv1.0 | March 2026 | Claude Sonnet 4.6 + Google Antigravity

Personal Project — Not for distribution
6. Complete JavaScript / TypeScript Source Files
6.1 src/constants/config.ts
export const CONFIG = {
VERCEL_URL: &#39;https://your-app.vercel.app&#39;, // Replace with real URL
after deploy
PICOVOICE_KEY: process.env.PICOVOICE_ACCESS_KEY ?? &#39;&#39;,
ELEVENLABS_KEY: process.env.ELEVENLABS_API_KEY ?? &#39;&#39;,
ELEVENLABS_VOICE: &#39;EXAVITQu4vr4xnSDxMaL&#39;, // &#39;Rachel&#39; voice ID
STT_TIMEOUT_MS: 8000,
AI_TIMEOUT_MS: 15000,
// Android package names for openApp()
PACKAGES: {
spotify: &#39;com.spotify.music&#39;,
youtube: &#39;com.google.android.youtube&#39;,
whatsapp: &#39;com.whatsapp&#39;,
chrome: &#39;com.android.chrome&#39;,
maps: &#39;com.google.android.apps.maps&#39;,
camera: &#39;com.android.camera2&#39;,
settings: &#39;com.android.settings&#39;,
phone: &#39;com.android.dialer&#39;,
messages: &#39;com.google.android.apps.messaging&#39;,
}
};

6.2 src/bridge/AccessibilityBridge.ts
import { NativeModules, NativeEventEmitter, DeviceEventEmitter } from &#39;react-
native&#39;;
const { AccessibilityModule } = NativeModules;
export const AccessibilityBridge = {
isRunning: (): Promise&lt;boolean&gt; =&gt; AccessibilityModule.isRunning(),
readScreen: (): Promise&lt;string&gt; =&gt; AccessibilityModule.readScreen(),
tapElement: (text: string): Promise&lt;boolean&gt; =&gt;
AccessibilityModule.tapElement(text),
typeText: (text: string): Promise&lt;boolean&gt; =&gt;
AccessibilityModule.typeText(text),
performGlobal: (action: &#39;BACK&#39;|&#39;HOME&#39;|&#39;RECENTS&#39;|&#39;NOTIFS&#39;): Promise&lt;boolean&gt;
=&gt;
AccessibilityModule.performGlobal(action),
openApp: (pkg: string): Promise&lt;boolean&gt; =&gt;
AccessibilityModule.openApp(pkg),
tapAt: (x: number, y: number): Promise&lt;boolean&gt; =&gt;
AccessibilityModule.tapAt(x, y),
onWakeWord: (cb: () =&gt; void) =&gt; {
return DeviceEventEmitter.addListener(&#39;onWakeWord&#39;, cb);
}
};

JARVIS ANDROID — Master Build Documentv1.0 | March 2026 | Claude Sonnet 4.6 + Google Antigravity

Personal Project — Not for distribution
6.3 src/services/aiRouter.ts
import { CONFIG } from &#39;../constants/config&#39;;
interface AIRequest {
userQuery: string;
screenContext: string;
conversationHistory: { role: string; content: string }[];
}
interface AIResponse {
action: string; // &#39;tap&#39; | &#39;type&#39; | &#39;open_app&#39; | &#39;global&#39; | &#39;spotify&#39; |
&#39;speak_only&#39;
target: string; // element text, package name, action name
parameters?: Record&lt;string, string&gt;;
speech_response: string; // What Jarvis says out loud
next_steps?: string[]; // Follow-up actions if multi-step
}
export async function callAI(req: AIRequest): Promise&lt;AIResponse&gt; {
const response = await fetch(`${CONFIG.VERCEL_URL}/api/ai`, {
method: &#39;POST&#39;,
headers: { &#39;Content-Type&#39;: &#39;application/json&#39; },
body: JSON.stringify(req),
signal: AbortSignal.timeout(CONFIG.AI_TIMEOUT_MS),
});
if (!response.ok) throw new Error(`AI API error: ${response.status}`);
return response.json();
}

6.4 src/services/tts.ts
import { CONFIG } from &#39;../constants/config&#39;;
import Sound from &#39;react-native-sound&#39;;
import RNFS from &#39;react-native-fs&#39;;
Sound.setCategory(&#39;Playback&#39;);
async function elevenLabsTTS(text: string): Promise&lt;void&gt; {
const url = `https://api.elevenlabs.io/v1/text-to-
speech/${CONFIG.ELEVENLABS_VOICE}`;
const resp = await fetch(url, {
method: &#39;POST&#39;,
headers: {
&#39;xi-api-key&#39;: CONFIG.ELEVENLABS_KEY,
&#39;Content-Type&#39;: &#39;application/json&#39;,
&#39;Accept&#39;: &#39;audio/mpeg&#39;,
},
body: JSON.stringify({ text, model_id: &#39;eleven_monolingual_v1&#39;,
voice_settings: { stability: 0.5, similarity_boost: 0.75 } })

JARVIS ANDROID — Master Build Documentv1.0 | March 2026 | Claude Sonnet 4.6 + Google Antigravity

Personal Project — Not for distribution
});
if (!resp.ok) throw new Error(&#39;ElevenLabs failed&#39;);
const buffer = await resp.arrayBuffer();
const path = `${RNFS.CachesDirectoryPath}/tts_${Date.now()}.mp3`;
await RNFS.writeFile(path, Buffer.from(buffer).toString(&#39;base64&#39;), &#39;base64&#39;);
return playAudio(path);
}
async function googleTTS(text: string): Promise&lt;void&gt; {
const encoded = encodeURIComponent(text);
const url = `https://translate.google.com/translate_tts?ie=UTF-8&amp;client=tw-
ob&amp;tl=en&amp;q=${encoded}`;
const path = `${RNFS.CachesDirectoryPath}/tts_${Date.now()}.mp3`;
await RNFS.downloadFile({ fromUrl: url, toFile: path }).promise;
return playAudio(path);
}
function playAudio(path: string): Promise&lt;void&gt; {
return new Promise((resolve, reject) =&gt; {
const sound = new Sound(path, &#39;&#39;, (err) =&gt; {
if (err) return reject(err);
sound.play(() =&gt; { sound.release(); resolve(); });
});
});
}
export async function speak(text: string): Promise&lt;void&gt; {
try { await elevenLabsTTS(text); }
catch { await googleTTS(text); }
}

6.5 src/services/actionEngine.ts
import { AccessibilityBridge } from &#39;../bridge/AccessibilityBridge&#39;;
import { ServiceBridge } from &#39;../bridge/ServiceBridge&#39;;
import { spotifyAction } from &#39;./spotifyService&#39;;
import { CONFIG } from &#39;../constants/config&#39;;
interface Action {
action: string;
target: string;
parameters?: Record&lt;string, string&gt;;
}
export async function executeAction(cmd: Action): Promise&lt;void&gt; {
const { action, target, parameters } = cmd;
switch (action) {
case &#39;tap&#39;:
await AccessibilityBridge.tapElement(target);
break;
case &#39;type&#39;:
await AccessibilityBridge.typeText(target);
break;

JARVIS ANDROID — Master Build Documentv1.0 | March 2026 | Claude Sonnet 4.6 + Google Antigravity

Personal Project — Not for distribution
case &#39;open_app&#39;: {
const pkg = CONFIG.PACKAGES[target as keyof typeof CONFIG.PACKAGES] ??
target;
await AccessibilityBridge.openApp(pkg);
break;
}
case &#39;global&#39;:
await AccessibilityBridge.performGlobal(target as any);
break;
case &#39;spotify&#39;:
await spotifyAction(target, parameters ?? {});
break;
case &#39;speak_only&#39;:
// No action needed — TTS handled by caller
break;
default:
console.warn(&#39;Unknown action:&#39;, action);
}
}

6.6 src/hooks/useJarvis.ts — Main Orchestration Hook
This is the brain of the JS layer. It wires everything together: wake word → STT → AI → action → TTS.
import { useEffect, useRef, useCallback } from &#39;react&#39;;
import { AccessibilityBridge } from &#39;../bridge/AccessibilityBridge&#39;;
import { ServiceBridge } from &#39;../bridge/ServiceBridge&#39;;
import { callAI } from &#39;../services/aiRouter&#39;;
import { speak } from &#39;../services/tts&#39;;
import { executeAction } from &#39;../services/actionEngine&#39;;
import Voice from &#39;@react-native-voice/voice&#39;;
export function useJarvis() {
const history = useRef&lt;{role:string;content:string}[]&gt;([]);
const listening = useRef(false);
// ── Start background service on mount ──────────────────────────
useEffect(() =&gt; {
ServiceBridge.startService();
const sub = AccessibilityBridge.onWakeWord(handleWakeWord);
return () =&gt; { sub.remove(); Voice.destroy(); };
}, []);
// ── Wake word handler ──────────────────────────────────────────
const handleWakeWord = useCallback(async () =&gt; {
if (listening.current) return;
listening.current = true;
await speak(&#39;Yes?&#39;); // earcon response
await startListening();
listening.current = false;

JARVIS ANDROID — Master Build Documentv1.0 | March 2026 | Claude Sonnet 4.6 + Google Antigravity

Personal Project — Not for distribution
}, []);
// ── STT: capture voice command ─────────────────────────────────
const startListening = (): Promise&lt;string&gt; =&gt; new Promise((resolve) =&gt; {
Voice.onSpeechResults = (e) =&gt; {
const text = e.value?.[0] ?? &#39;&#39;;
Voice.stop();
resolve(text);
processCommand(text);
};
Voice.start(&#39;en-US&#39;);
setTimeout(() =&gt; { Voice.stop(); resolve(&#39;&#39;); }, 8000);
});
// ── Full command processing pipeline ──────────────────────────
const processCommand = async (userText: string) =&gt; {
if (!userText.trim()) { await speak(&#39;Sorry, I did not catch that.&#39;); return; }
// Read current screen for AI context
const screenJson = await AccessibilityBridge.readScreen().catch(() =&gt; &#39;{}&#39;);
// Add to conversation history
history.current.push({ role: &#39;user&#39;, content: userText });
try {
const aiResult = await callAI({
userQuery: userText,
screenContext: screenJson,
conversationHistory: history.current.slice(-10), // last 10 turns
});
// Execute the action
await executeAction(aiResult);
// Speak the response
if (aiResult.speech_response) await speak(aiResult.speech_response);
// Store AI turn in history
history.current.push({ role: &#39;assistant&#39;, content: aiResult.speech_response
});
// Handle multi-step actions
if (aiResult.next_steps?.length) {
for (const step of aiResult.next_steps) {
await new Promise(r =&gt; setTimeout(r, 800)); // wait for UI to update
const stepScreen = await AccessibilityBridge.readScreen().catch(() =&gt;
&#39;{}&#39;);
const stepResult = await callAI({
userQuery: step,
screenContext: stepScreen,
conversationHistory: history.current.slice(-10),
});
await executeAction(stepResult);
}
}
} catch (err) {
await speak(&#39;Sorry, something went wrong. Please try again.&#39;);
console.error(&#39;Jarvis pipeline error:&#39;, err);

JARVIS ANDROID — Master Build Documentv1.0 | March 2026 | Claude Sonnet 4.6 + Google Antigravity

Personal Project — Not for distribution
}
};
return { processCommand };
}

JARVIS ANDROID — Master Build Documentv1.0 | March 2026 | Claude Sonnet 4.6 + Google Antigravity

Personal Project — Not for distribution
7. Vercel Backend — Complete API Files
Deploy the vercel-backend/ folder to Vercel. Set all environment variables in the Vercel
dashboard under Settings → Environment Variables before deploying.

7.1 vercel-backend/api/ai.js — AI Router
// /api/ai — receives request from Android app, routes to AI model
export default async function handler(req, res) {
if (req.method !== &#39;POST&#39;) return res.status(405).end();
const { userQuery, screenContext, conversationHistory } = req.body;
const systemPrompt = `You are Jarvis, an AI assistant controlling an Android
phone.
Current screen contents (JSON UI tree): ${screenContext}
Respond ONLY with valid JSON matching this schema exactly:
{
&quot;action&quot;: &quot;tap|type|open_app|global|spotify|speak_only&quot;,
&quot;target&quot;: &quot;element text, package name, or action&quot;,
&quot;parameters&quot;: { &quot;key&quot;: &quot;value&quot; },
&quot;speech_response&quot;: &quot;What you say out loud&quot;,
&quot;next_steps&quot;: [&quot;follow up action if needed&quot;]
}
Actions: tap=click element by text, type=input text, open_app=launch app by name,
global=BACK|HOME|RECENTS|NOTIFS, spotify=play|pause|skip|search, speak_only=just
talk.`;
const messages = [
...(conversationHistory || []),
{ role: &#39;user&#39;, content: userQuery }
];
// Try GLM-4.5 first
try {
const r = await fetch(&#39;https://open.bigmodel.cn/api/paas/v4/chat/completions&#39;,
{
method: &#39;POST&#39;,
headers: { &#39;Authorization&#39;: `Bearer ${process.env.GLM_API_KEY}`,
&#39;Content-Type&#39;: &#39;application/json&#39; },
body: JSON.stringify({ model: &#39;glm-4-flash&#39;, messages:
[{ role: &#39;system&#39;, content: systemPrompt }, ...messages] })
});
if (r.ok) {
const d = await r.json();
return res.json(JSON.parse(d.choices[0].message.content));
}
} catch {}
// Fallback: LLaMA via Groq
try {
const r = await fetch(&#39;https://api.groq.com/openai/v1/chat/completions&#39;, {
method: &#39;POST&#39;,

JARVIS ANDROID — Master Build Documentv1.0 | March 2026 | Claude Sonnet 4.6 + Google Antigravity

Personal Project — Not for distribution
headers: { &#39;Authorization&#39;: `Bearer ${process.env.GROQ_API_KEY}`,
&#39;Content-Type&#39;: &#39;application/json&#39; },
body: JSON.stringify({ model: &#39;llama-3.1-8b-instant&#39;, messages:
[{ role: &#39;system&#39;, content: systemPrompt }, ...messages] })
});
if (r.ok) {
const d = await r.json();
return res.json(JSON.parse(d.choices[0].message.content));
}
} catch {}
// Fallback: Qwen
try {
const r = await
fetch(&#39;https://dashscope.aliyuncs.com/api/v1/services/aigc/text-
generation/generation&#39;, {
method: &#39;POST&#39;,
headers: { &#39;Authorization&#39;: `Bearer ${process.env.QWEN_API_KEY}`,
&#39;Content-Type&#39;: &#39;application/json&#39; },
body: JSON.stringify({ model: &#39;qwen-turbo&#39;, input: { messages:
[{ role: &#39;system&#39;, content: systemPrompt }, ...messages] } })
});
if (r.ok) {
const d = await r.json();
return res.json(JSON.parse(d.output.text));
}
} catch {}
res.status(503).json({ action: &#39;speak_only&#39;, target: &#39;&#39;,
speech_response: &#39;All AI models are unavailable right now. Please try again.&#39;
});
}

7.2 vercel-backend/api/spotify/auth.js
export default function handler(req, res) {
const params = new URLSearchParams({
client_id: process.env.SPOTIFY_CLIENT_ID,
response_type: &#39;code&#39;,
redirect_uri: process.env.SPOTIFY_REDIRECT_URI,
scope: &#39;user-read-playback-state user-modify-playback-state streaming&#39;,
show_dialog: &#39;true&#39;,
});
res.redirect(`https://accounts.spotify.com/authorize?${params}`);
}

7.3 vercel-backend/api/spotify/callback.js
export default async function handler(req, res) {
const { code } = req.query;
if (!code) return res.status(400).send(&#39;No code&#39;);
const body = new URLSearchParams({

JARVIS ANDROID — Master Build Documentv1.0 | March 2026 | Claude Sonnet 4.6 + Google Antigravity

Personal Project — Not for distribution
grant_type: &#39;authorization_code&#39;,
code,
redirect_uri: process.env.SPOTIFY_REDIRECT_URI,
});
const r = await fetch(&#39;https://accounts.spotify.com/api/token&#39;, {
method: &#39;POST&#39;,
headers: {
&#39;Content-Type&#39;: &#39;application/x-www-form-urlencoded&#39;,
&#39;Authorization&#39;: &#39;Basic &#39; + Buffer.from(
`${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
).toString(&#39;base64&#39;),
},
body,
});
const tokens = await r.json();
// Return tokens to app — app stores them in SecureStorage
res.json({ access_token: tokens.access_token, refresh_token:
tokens.refresh_token,
expires_in: tokens.expires_in });
}

7.4 vercel-backend/api/spotify/refresh.js
export default async function handler(req, res) {
const { refresh_token } = req.body;
if (!refresh_token) return res.status(400).send(&#39;No refresh token&#39;);
const body = new URLSearchParams({
grant_type: &#39;refresh_token&#39;,
refresh_token,
});
const r = await fetch(&#39;https://accounts.spotify.com/api/token&#39;, {
method: &#39;POST&#39;,
headers: {
&#39;Content-Type&#39;: &#39;application/x-www-form-urlencoded&#39;,
&#39;Authorization&#39;: &#39;Basic &#39; + Buffer.from(
`${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
).toString(&#39;base64&#39;),
},
body,
});
const data = await r.json();
res.json({ access_token: data.access_token, expires_in: data.expires_in });
}

JARVIS ANDROID — Master Build Documentv1.0 | March 2026 | Claude Sonnet 4.6 + Google Antigravity

Personal Project — Not for distribution
8. Step-by-Step Build Instructions
Follow these phases in order. Each phase builds on the previous. Do not skip ahead —
Phase 1 unblocks everything else.

Phase 1 — Vercel Deploy + Spotify Setup (Day 1)

1
Create Vercel Project
Push the vercel-backend/ folder to a GitHub repo. Go to vercel.com, create new project,
import the repo. Vercel auto-detects the api/ folder.

2
Set Environment Variables
In Vercel dashboard → Settings → Environment Variables, add: SPOTIFY_CLIENT_ID,
SPOTIFY_CLIENT_SECRET, SPOTIFY_REDIRECT_URI (https://your-
app.vercel.app/api/spotify/callback), GLM_API_KEY, GROQ_API_KEY, QWEN_API_KEY,
ELEVENLABS_API_KEY.

3
Register Spotify App
Go to developer.spotify.com/dashboard → Create App → Add redirect URI exactly matching
your Vercel callback URL. Copy Client ID and Client Secret to Vercel env vars.

4
Test OAuth Flow
Open https://your-app.vercel.app/api/spotify/auth in browser. Should redirect to Spotify login.
After login, should redirect back and return JSON tokens. If it does, Phase 1 is done.

Phase 2 — React Native Project Setup (Day 1–2)

1 Init React Native Project
Run: npx react-native init JarvisAndroid --template react-native-template-typescript

2 Install All JS Dependencies
Run in project root:

npm install @picovoice/porcupine-react-native
npm install @react-native-voice/voice
npm install react-native-sound
npm install react-native-fs
npm install @react-native-async-storage/async-storage
npm install react-native-encrypted-storage

JARVIS ANDROID — Master Build Documentv1.0 | March 2026 | Claude Sonnet 4.6 + Google Antigravity

Personal Project — Not for distribution
npm install react-native-webview

3
Add Kotlin Files
Copy all .kt files from Section 5 into the exact paths shown in Section 3. Copy
accessibility_service_config.xml to android/app/src/main/res/xml/.

4 Update AndroidManifest.xml
Replace the entire AndroidManifest.xml with the version from Section 4.

5
Register JarvisPackage
In android/app/src/main/java/com/jarvis/MainApplication.kt, add JarvisPackage() to the
getPackages() list.

6
Add Picovoice Access Key
In android/app/build.gradle, add inside defaultConfig: buildConfigField(&#39;String&#39;,
&#39;PICOVOICE_ACCESS_KEY&#39;, &#39;&quot;your-key-here&quot;&#39;)

7
Add Spotify AAR
Download spotify-app-remote-release-x.x.x.aar from Spotify developer docs. Place in
android/app/libs/. Add to android/app/build.gradle: implementation(name:&#39;spotify-app-remote-
release-x.x.x&#39;, ext:&#39;aar&#39;)

Phase 3 — Copy JS Source Files (Day 2)

1 Copy All Source Files
Copy every file from Section 6 into the paths shown in Section 3. Do not rename anything.

2
Update config.ts
Replace VERCEL_URL with your actual Vercel URL. Replace ELEVENLABS_VOICE with
your chosen voice ID from elevenlabs.io/voice-library.

3
Wire useJarvis into App.tsx
In src/App.tsx, import and call useJarvis() at the root level so the wake word listener starts
when the app mounts.

Phase 4 — First Build + Test on Device (Day 2–3)

1 Connect Physical Device
Connect Realme/Oppo phone via USB. Enable Developer Options: Settings → About Phone

JARVIS ANDROID — Master Build Documentv1.0 | March 2026 | Claude Sonnet 4.6 + Google Antigravity

Personal Project — Not for distribution
→ tap Build Number 7 times → back → Developer Options → USB Debugging ON.

2 Build and Install
Run: npx react-native run-android

3
Grant Permissions
On first launch: grant Microphone permission. Then go to Settings → Accessibility → Installed
Services → Jarvis → Enable. App will deep-link you there.

4
Realme/Oppo Battery Fix
This is critical — Realme/Oppo will kill the Foreground Service within minutes without this. Go
to: Settings → Battery → Battery Optimisation → All Apps → Jarvis → Don&#39;t Optimise. Also:
Settings → App Management → Jarvis → Battery Saver → No Restrictions. Also: Settings →
Privacy → Special App Access → Protected Apps → Enable Jarvis.

5
Test Wake Word
Say &#39;Hey Jarvis&#39; with screen off. You should hear &#39;Yes?&#39; response. If it fires, the whole pipeline
is working.

Phase 5 — Phone Control Testing (Day 3–4)

1
Test Basic Commands
Say &#39;Hey Jarvis, open Spotify&#39;. Spotify should open. Say &#39;Hey Jarvis, go back&#39;. Should press
back button.

2 Test Screen Reading
Say &#39;Hey Jarvis, what&#39;s on my screen?&#39;. Jarvis should describe the current app&#39;s UI elements.

3 Test Tap by Text
Open any app with buttons. Say &#39;Hey Jarvis, tap [button name]&#39;. Should tap the button.

4
Test Spotify
Open Spotify app. Say &#39;Hey Jarvis, play Blinding Lights by The Weeknd&#39;. Should search and
play.

JARVIS ANDROID — Master Build Documentv1.0 | March 2026 | Claude Sonnet 4.6 + Google Antigravity

Personal Project — Not for distribution
9. Claude Sonnet 4.6 Prompts for Google Antigravity
These are the exact prompts to paste into Antigravity IDE with Claude Sonnet 4.6. Use
them in order. Each prompt is self-contained and includes all necessary context so the
model does not need prior conversation history.

Prompt 1 — Initialize React Native Project + File Structure
PASTE THIS FIRST INTO ANTIGRAVITY

You are building an Android app called Jarvis — an always-on AI voice assistant.
Initialize a React Native 0.73 TypeScript project called JarvisAndroid.
Create this exact folder structure inside src/:
src/screens/HomeScreen.tsx
src/screens/SettingsScreen.tsx
src/services/wakeWord.ts
src/services/stt.ts
src/services/aiRouter.ts
src/services/tts.ts
src/services/actionEngine.ts
src/services/spotifyService.ts
src/services/storageService.ts
src/bridge/AccessibilityBridge.ts
src/bridge/ServiceBridge.ts
src/bridge/SpotifyBridge.ts
src/hooks/useJarvis.ts
src/utils/systemPrompt.ts
src/constants/config.ts
Also create these Android Kotlin files:
android/app/src/main/java/com/jarvis/assistant/services/JarvisBackgroundService.kt
android/app/src/main/java/com/jarvis/assistant/services/BootReceiver.kt
android/app/src/main/java/com/jarvis/assistant/accessibility/JarvisAccessibilitySe
rvice.kt
android/app/src/main/java/com/jarvis/assistant/modules/AccessibilityModule.kt
android/app/src/main/java/com/jarvis/assistant/modules/ServiceModule.kt
android/app/src/main/java/com/jarvis/assistant/modules/SpotifyModule.kt
android/app/src/main/java/com/jarvis/assistant/modules/JarvisPackage.kt
android/app/src/main/res/xml/accessibility_service_config.xml
Leave files empty for now with a // TODO comment. Just create the structure.
Then install these npm packages:
@picovoice/porcupine-react-native
@react-native-voice/voice
react-native-sound
react-native-fs
@react-native-async-storage/async-storage
react-native-encrypted-storage

JARVIS ANDROID — Master Build Documentv1.0 | March 2026 | Claude Sonnet 4.6 + Google Antigravity

Personal Project — Not for distribution
Prompt 2 — Kotlin: Foreground Service + Boot Receiver
PASTE THIS SECOND

Write the complete Kotlin source for these two files in the Jarvis Android
project.
Package name is com.jarvis.assistant.
FILE 1: android/.../services/JarvisBackgroundService.kt
- Extends Service
- Creates a persistent foreground notification (channel ID: jarvis_channel,
importance LOW, title &#39;Jarvis&#39;, text &#39;Listening for Hey Jarvis&#39;)
- Acquires PARTIAL_WAKE_LOCK so CPU stays on with screen off
- Returns START_STICKY from onStartCommand
- Initialises PorcupineManager with BuiltInKeyword.JARVIS and
BuildConfig.PICOVOICE_ACCESS_KEY
- When Porcupine fires onKeywordDetected, emits &#39;onWakeWord&#39; event via
DeviceEventManagerModule.RCTDeviceEventEmitter to React Native
- Stops and deletes PorcupineManager in onDestroy, releases WakeLock
- onBind returns null
FILE 2: android/.../services/BootReceiver.kt
- Extends BroadcastReceiver
- On ACTION_BOOT_COMPLETED, calls context.startForegroundService() with
Intent pointing to JarvisBackgroundService
Use Kotlin idiomatic style. Add inline comments explaining each block.
Import everything explicitly — do not use star imports.

Prompt 3 — Kotlin: Accessibility Service
PASTE THIS THIRD

Write the complete Kotlin source for JarvisAccessibilityService.kt.
Package: com.jarvis.assistant.accessibility
Requirements:
- Extends AccessibilityService
- Companion object stores instance: JarvisAccessibilityService? (set in
onServiceConnected,
cleared in onDestroy)
- Companion object exposes these static methods callable from the RN bridge:
fun isRunning(): Boolean
fun readScreen(): String — serialises rootInActiveWindow to JSON string.
Each node: { text, desc, class, clickable, editable, viewId, bounds,
children[] }
fun tapElement(text: String): Boolean — findAccessibilityNodeInfosByText,
ACTION_CLICK first result
fun tapByViewId(viewId: String): Boolean — findAccessibilityNodeInfosByViewId,
ACTION_CLICK

JARVIS ANDROID — Master Build Documentv1.0 | March 2026 | Claude Sonnet 4.6 + Google Antigravity

Personal Project — Not for distribution
fun typeText(text: String): Boolean — findFocus(FOCUS_INPUT), ACTION_SET_TEXT
fun scrollDown(): Boolean — ACTION_SCROLL_FORWARD on root
fun performGlobal(action: String): Boolean — map BACK/HOME/RECENTS/NOTIFS to
global actions
fun tapAt(x: Float, y: Float) — GestureDescription with 100ms stroke
- onServiceConnected: set instance = this, configure serviceInfo with
eventTypes=TYPES_ALL_MASK, feedbackType=FEEDBACK_GENERIC,
notificationTimeout=100,
canRetrieveWindowContent=true, canPerformGestures=true
- onAccessibilityEvent: empty body (not needed for control)
- onInterrupt: empty body
Add null safety everywhere. Use try/catch in serializeNode to skip broken nodes.
Add a depth limit of 8 in serializeNode to prevent stack overflow on complex
screens.

Prompt 4 — Kotlin: RN Bridge Modules
PASTE THIS FOURTH

Write three React Native bridge modules for the Jarvis Android app.
Package: com.jarvis.assistant.modules
MODULE 1: AccessibilityModule.kt
- Extends ReactContextBaseJavaModule, getName() returns &#39;AccessibilityModule&#39;
- @ReactMethod functions (all async with Promise):
isRunning(promise) — calls JarvisAccessibilityService.isRunning()
readScreen(promise) — calls JarvisAccessibilityService.readScreen()
tapElement(text: String, promise) — calls
JarvisAccessibilityService.tapElement(text)
typeText(text: String, promise) — calls
JarvisAccessibilityService.typeText(text)
performGlobal(action: String, promise) — calls
JarvisAccessibilityService.performGlobal(action)
openApp(packageName: String, promise) — gets launch intent, adds
FLAG_ACTIVITY_NEW_TASK, starts activity
tapAt(x: Float, y: Float, promise) — calls JarvisAccessibilityService.tapAt(x,
y)
MODULE 2: ServiceModule.kt
- getName() returns &#39;ServiceModule&#39;
- startService(promise): calls
reactContext.startForegroundService(Intent(JarvisBackgroundService))
- stopService(promise): calls
reactContext.stopService(Intent(JarvisBackgroundService))
MODULE 3: JarvisPackage.kt
- Implements ReactPackage
- createNativeModules returns listOf(AccessibilityModule(ctx), ServiceModule(ctx),
SpotifyModule(ctx))
- createViewManagers returns emptyList()
Also write a stub SpotifyModule.kt with getName() = &#39;SpotifyModule&#39; and
empty @ReactMethod stubs for: connectSpotify, play(uri, promise), pause(promise),

JARVIS ANDROID — Master Build Documentv1.0 | March 2026 | Claude Sonnet 4.6 + Google Antigravity

Personal Project — Not for distribution
skip(promise), getPlaybackState(promise).

Prompt 5 — TypeScript: Core Services
PASTE THIS FIFTH

Write the complete TypeScript source for these Jarvis service files.
The Vercel backend URL is stored in CONFIG.VERCEL_URL from
src/constants/config.ts.
FILE 1: src/constants/config.ts
Export a CONFIG object with:
VERCEL_URL, PICOVOICE_KEY, ELEVENLABS_KEY, ELEVENLABS_VOICE
(&#39;EXAVITQu4vr4xnSDxMaL&#39;),
STT_TIMEOUT_MS (8000), AI_TIMEOUT_MS (15000),
PACKAGES object mapping app names to Android package names for:
spotify, youtube, whatsapp, chrome, maps, camera, settings, phone, messages
FILE 2: src/bridge/AccessibilityBridge.ts
Wrap NativeModules.AccessibilityModule in typed async functions.
Also export onWakeWord(cb) that uses DeviceEventEmitter.addListener(&#39;onWakeWord&#39;,
cb).
FILE 3: src/bridge/ServiceBridge.ts
Wrap NativeModules.ServiceModule: startService(), stopService(), both return
Promise&lt;boolean&gt;.
FILE 4: src/services/aiRouter.ts
callAI(req: {userQuery, screenContext, conversationHistory}) fetches POST to
CONFIG.VERCEL_URL/api/ai with AbortSignal.timeout(AI_TIMEOUT_MS).
Returns AIResponse: { action, target, parameters, speech_response, next_steps }.
FILE 5: src/services/tts.ts
speak(text): tries ElevenLabs REST API first (POST to api.elevenlabs.io/v1/text-
to-speech/{voiceId},
returns MP3, write to RNFS.CachesDirectoryPath, play with react-native-sound).
On any error, falls back to Google Translate TTS URL pattern, downloads and plays
same way.
FILE 6: src/services/actionEngine.ts
executeAction(cmd: {action, target, parameters}) — switch on action type:
tap -&gt; AccessibilityBridge.tapElement(target)
type -&gt; AccessibilityBridge.typeText(target)
open_app -&gt; look up CONFIG.PACKAGES[target] or use target directly -&gt; openApp()
global -&gt; AccessibilityBridge.performGlobal(target)
spotify -&gt; call spotifyAction(target, parameters) from spotifyService
speak_only -&gt; no-op

Prompt 6 — TypeScript: Main Orchestration Hook

JARVIS ANDROID — Master Build Documentv1.0 | March 2026 | Claude Sonnet 4.6 + Google Antigravity

Personal Project — Not for distribution
PASTE THIS SIXTH

Write src/hooks/useJarvis.ts — the main orchestration hook for the Jarvis Android
app.
This hook wires together the entire pipeline:
Wake word → STT → AI → Action → TTS
Requirements:
- On mount: call ServiceBridge.startService(), subscribe to
AccessibilityBridge.onWakeWord()
- On unmount: remove listener, call Voice.destroy()
- handleWakeWord: guard with a listening ref to prevent re-entry.
If already listening, return. Otherwise set listening=true, call speak(&#39;Yes?&#39;),
then call startListening(), then set listening=false.
- startListening: start Voice.start(&#39;en-US&#39;), return Promise&lt;string&gt; that resolves
on first Voice.onSpeechResults or after STT_TIMEOUT_MS of silence.
After getting text, call processCommand(text).
- processCommand(userText):
1. Return early + speak error if userText is empty
2. Call AccessibilityBridge.readScreen() with catch fallback to &#39;{}&#39;
3. Push { role: &#39;user&#39;, content: userText } to history ref (capped at 20
entries)
4. Call callAI({ userQuery, screenContext, conversationHistory: last 10 })
5. Call executeAction(aiResult)
6. Call speak(aiResult.speech_response) if non-empty
7. Push assistant turn to history
8. For each step in aiResult.next_steps: wait 800ms, readScreen, callAI,
executeAction
9. Wrap everything in try/catch, speak error message on failure
- Return { processCommand } so screens can also trigger commands manually
- Keep the hook testable — no direct UI side effects inside it

Prompt 7 — Vercel Backend
PASTE THIS SEVENTH

Write the complete Vercel serverless API for the Jarvis backend.
All files go in the api/ folder of the vercel-backend/ directory.
FILE 1: api/ai.js
POST endpoint. Body: { userQuery, screenContext, conversationHistory }.
Build a system prompt that includes the screen context JSON and instructs the
model
to respond ONLY with valid JSON matching:
{ action: string, target: string, parameters: object, speech_response: string,
next_steps: string[] }
Try GLM-4.5 (open.bigmodel.cn/api/paas/v4/chat/completions, model: glm-4-flash,
auth: Bearer GLM_API_KEY) first.
Fallback to LLaMA 3.1 (api.groq.com, model: llama-3.1-8b-instant, auth: Bearer
GROQ_API_KEY).
Fallback to Qwen (dashscope.aliyuncs.com, model: qwen-turbo, auth: Bearer

JARVIS ANDROID — Master Build Documentv1.0 | March 2026 | Claude Sonnet 4.6 + Google Antigravity

Personal Project — Not for distribution
QWEN_API_KEY).
Parse JSON from each response with try/catch. If all fail, return 503 with
speak_only fallback.
FILE 2: api/spotify/auth.js
GET endpoint. Redirects to Spotify OAuth URL with client_id, response_type=code,
redirect_uri (from env), scope=&#39;user-read-playback-state user-modify-playback-
state streaming&#39;.
FILE 3: api/spotify/callback.js
GET endpoint. Takes code from query. POSTs to accounts.spotify.com/api/token with
grant_type=authorization_code, code, redirect_uri.
Auth header: Basic base64(CLIENT_ID:CLIENT_SECRET). Returns JSON with
access_token,
refresh_token, expires_in.
FILE 4: api/spotify/refresh.js
POST endpoint. Takes refresh_token from body. POSTs to Spotify token endpoint with
grant_type=refresh_token. Returns new access_token and expires_in.

Prompt 8 — AndroidManifest + Build Config
PASTE THIS EIGHTH

Update the Android project configuration for the Jarvis app.
TASK 1: Replace android/app/src/main/AndroidManifest.xml with a complete manifest
that includes ALL of these exactly:
Permissions: RECORD_AUDIO, FOREGROUND_SERVICE, FOREGROUND_SERVICE_MICROPHONE,
INTERNET, QUERY_ALL_PACKAGES, RECEIVE_BOOT_COMPLETED, WAKE_LOCK, VIBRATE
Activity: MainActivity with adjustResize windowSoftInputMode
Service: JarvisBackgroundService with foregroundServiceType=&#39;microphone&#39;
Service: JarvisAccessibilityService with BIND_ACCESSIBILITY_SERVICE permission
and meta-data pointing to @xml/accessibility_service_config
Receiver: BootReceiver with BOOT_COMPLETED intent filter
TASK 2: In android/app/src/main/res/xml/accessibility_service_config.xml create
the config with: accessibilityEventTypes=&#39;typeAllMask&#39;,
feedbackType=&#39;feedbackGeneric&#39;,
canRetrieveWindowContent=&#39;true&#39;, canPerformGestures=&#39;true&#39;,
notificationTimeout=&#39;100&#39;
TASK 3: In android/app/build.gradle add inside defaultConfig:
buildConfigField &#39;String&#39;, &#39;PICOVOICE_ACCESS_KEY&#39;, &#39;&quot;REPLACE_WITH_YOUR_KEY&quot;&#39;
Also add in dependencies:
implementation(name:&#39;spotify-app-remote-release-0.8.0&#39;, ext:&#39;aar&#39;)
implementation &#39;com.google.code.gson:gson:2.10&#39;
TASK 4: In MainApplication.kt, add JarvisPackage() to the getPackages() list.

Prompt 9 — Home Screen UI

JARVIS ANDROID — Master Build Documentv1.0 | March 2026 | Claude Sonnet 4.6 + Google Antigravity

Personal Project — Not for distribution
PASTE THIS NINTH

Write src/screens/HomeScreen.tsx for the Jarvis Android app.
Design a dark-themed UI (background #0A0A0F) that looks like a premium AI
assistant.
Components to include:
1. A pulsing circle animation that glows blue (#1D4ED8) when listening,
purple (#7C3AED) when processing, and dim when idle.
2. A scrollable chat log showing conversation turns:
- User messages: right-aligned, dark blue bubble
- Jarvis messages: left-aligned, dark gray bubble with a &#39;J&#39; avatar
3. A status bar at the top showing: &#39;Idle&#39; / &#39;Listening...&#39; / &#39;Thinking...&#39; /
&#39;Speaking...&#39;
4. A manual mic button at the bottom (for testing without wake word)
5. A settings gear icon top-right that navigates to SettingsScreen
State to manage:
- messages: {role, content, timestamp}[]
- status: &#39;idle&#39; | &#39;listening&#39; | &#39;thinking&#39; | &#39;speaking&#39;
Wire it to useJarvis() hook. When useJarvis fires, update the messages array
and status indicator. The manual mic button calls useJarvis&#39;s processCommand
after capturing STT via Voice.start().
Use React Native StyleSheet. No external UI libraries. Keep it self-contained.

Prompt 10 — Realme/Oppo Battery Bypass + First Launch Setup
PASTE THIS TENTH

Write the first-launch onboarding flow for the Jarvis Android app.
This is specifically designed for Realme and Oppo devices.
Create src/screens/OnboardingScreen.tsx with these 5 steps shown sequentially:
STEP 1: Microphone Permission
Show explanation text. Button calls PermissionsAndroid.request(RECORD_AUDIO).
Only proceed to step 2 when granted.
STEP 2: Accessibility Service
Explain what it does (read screen, control apps). Button opens:
Linking.openSettings() or Intent to Settings.ACTION_ACCESSIBILITY_SETTINGS.
Poll AccessibilityBridge.isRunning() every 2 seconds. When true, proceed to step
3.
STEP 3: Battery Optimisation (Realme/Oppo specific)
Show these exact manual steps as numbered instructions:
1. Settings → Battery → Battery Optimisation → All Apps → Jarvis → Don&#39;t
Optimise

JARVIS ANDROID — Master Build Documentv1.0 | March 2026 | Claude Sonnet 4.6 + Google Antigravity

Personal Project — Not for distribution
2. Settings → App Management → Jarvis → Battery Saver → No Restrictions
3. Settings → Privacy → Special App Access → Protected Apps → Enable Jarvis
Include a &#39;Done, Continue&#39; button — cannot auto-verify this one.
STEP 4: Spotify Connection
Explain Spotify integration. Button opens Linking.openURL to Vercel
/api/spotify/auth.
App listens for deep link callback with tokens, stores in EncryptedStorage.
Show &#39;Connected&#39; when tokens received, &#39;Skip for now&#39; option also available.
STEP 5: Test Wake Word
Instruction: &#39;Say Hey Jarvis now to test&#39;. Subscribe to
AccessibilityBridge.onWakeWord().
When it fires, show a green checkmark and &#39;Wake word working!&#39; message.
Button: &#39;Finish Setup&#39; → navigate to HomeScreen.
Store completion state in AsyncStorage key &#39;onboarding_complete&#39;.
In App.tsx, check this key on launch and skip to HomeScreen if already done.

JARVIS ANDROID — Master Build Documentv1.0 | March 2026 | Claude Sonnet 4.6 + Google Antigravity

Personal Project — Not for distribution
10. Known Issues, Gotchas, and Fixes
10.1 Realme / Oppo Specific
⚠ Realme and Oppo run ColorOS / RealmeUI which has one of the most aggressive app-
kill systems of any Android variant. Without the fixes below, the Foreground Service will be
killed within 5–15 minutes.

Issue Cause Fix
Foreground Service
killed after ~10 min

ColorOS battery killer Steps in Onboarding Phase 4 —
all three settings must be set

Wake word stops
firing after screen off

CPU throttled by device PARTIAL_WAKE_LOCK in
JarvisBackgroundService
prevents this — verify it is
acquired

Accessibility Service
auto-disabled

ColorOS security feature on
some builds

Re-enable in Settings →
Accessibility. Consider showing a
persistent notification reminder

Microphone blocked
during calls

System reserves mic for call Detect via

AudioManager.MODE_IN_CALL
and queue commands until call
ends

App not starting on
boot

Device requires &#39;Protected
Apps&#39; toggle

Explicitly guide user to Settings
→ Privacy → Special App Access
→ Protected Apps

10.2 Porcupine Wake Word
Issue Cause Fix
&#39;BuiltInKeyword.JAR
VIS&#39; not found

Old Porcupine version —
keyword added later

Update to latest
@picovoice/porcupine-react-
native. Min version: 3.0.0

&#39;Invalid access key&#39;
error

Key not set in BuildConfig Verify buildConfigField in
build.gradle and rebuild — not
just reload JS

Wake word fires in
music/background
noise

Sensitivity too high PorcupineManager.Builder().setS
ensitivities(floatArrayOf(0.5f)) to
reduce false positives

Wake word never
fires

Mic permission not granted at
OS level

Check
PermissionsAndroid.RESULTS.G
RANTED — also check if another

JARVIS ANDROID — Master Build Documentv1.0 | March 2026 | Claude Sonnet 4.6 + Google Antigravity

Personal Project — Not for distribution

app is holding mic

10.3 Accessibility Service
Issue Cause Fix
readScreen() returns
empty {}

Service not yet connected or
was killed

Check isRunning() before calling
readScreen() — guide user to re-
enable if false

tapElement() returns
false

Element text not found on
screen (case sensitive)

Try content description as
fallback: add tapByViewId() as
second attempt

Banking apps blank
screen

App detects Accessibility and
hides content

Known limitation — document for
user, no fix available

typeText() does
nothing

No input field is focused Tap the input field first with
tapElement(), then call typeText()

Gestures not working canPerformGestures not set in

service config

Verify
accessibility_service_config.xml
has canPerformGestures=&#39;true&#39;

10.4 Spotify Integration
Issue Cause Fix
OAuth redirect fails Redirect URI mismatch URI in Spotify Dashboard must
match EXACTLY — no trailing
slash, same casing

App Remote not
connecting

Spotify app not installed or not
logged in

Check
SpotifyAppRemote.isSpotifyInstall
ed() first — fall back to Web API if
false

&#39;Premium required&#39;
error

Playback control needs Spotify
Premium

Spotify App Remote playback
requires Premium — document
clearly for user

Token expired mid-
session

Access token lasts only 1 hour Call /api/spotify/refresh before
any API call if expires_at is within
5 minutes

10.5 AI Model Issues
Issue Cause Fix
AI returns plain text Model ignoring JSON Add &#39;IMPORTANT: respond

JARVIS ANDROID — Master Build Documentv1.0 | March 2026 | Claude Sonnet 4.6 + Google Antigravity

Personal Project — Not for distribution
not JSON instruction ONLY with raw JSON, no
markdown, no backticks&#39; to
system prompt

JSON parse error
crashing app

Model added markdown code
fences

In Vercel ai.js, strip ```json and ```
from response before
JSON.parse()

AI taps wrong
element

Screen JSON too large, AI
loses context

Limit serializeNode depth to 8,
filter out non-clickable/non-visible
nodes

Rate limit 429 on
GLM

Free tier limit hit Router falls back to Groq
automatically — verify
GROQ_API_KEY is set in Vercel

JARVIS ANDROID — Master Build Documentv1.0 | March 2026 | Claude Sonnet 4.6 + Google Antigravity

Personal Project — Not for distribution
11. Environment Variables Reference
Never commit these to git. Set Vercel ones in the dashboard. Set Android-only ones in
android/app/build.gradle as buildConfigField strings.

11.1 Vercel Dashboard Variables
SPOTIFY_CLIENT_ID From Spotify Developer Dashboard → Your App → Settings
SPOTIFY_CLIENT_SE
CRET

From Spotify Developer Dashboard → Your App → Settings (keep
secret)
SPOTIFY_REDIRECT_
URI

https://your-app.vercel.app/api/spotify/callback — exact match
required

GLM_API_KEY From console.zhipuai.cn → API Keys
GROQ_API_KEY From console.groq.com → API Keys → Create Key
QWEN_API_KEY From dashscope.console.aliyun.com → API-KEY
ELEVENLABS_API_K
EY

From elevenlabs.io → Profile → API Key

11.2 Android Build Variables (android/app/build.gradle)
PICOVOICE_ACCESS
_KEY

From console.picovoice.ai → AccessKey — set as
buildConfigField in build.gradle

11.3 Runtime Secure Storage (EncryptedStorage on device)
spotify_access_token Short-lived Spotify access token — refreshed automatically
spotify_refresh_token Long-lived Spotify refresh token — stored permanently
spotify_expires_at Unix timestamp when access token expires — compared before

each API call

JARVIS ANDROID — Master Build Documentv1.0 | March 2026 | Claude Sonnet 4.6 + Google Antigravity

Personal Project — Not for distribution
12. package.json Dependencies
This is the complete list of npm packages. All are needed. Do not add others unless
specifically required.

{
&quot;name&quot;: &quot;JarvisAndroid&quot;,
&quot;version&quot;: &quot;1.0.0&quot;,
&quot;dependencies&quot;: {
&quot;react&quot;: &quot;18.2.0&quot;,
&quot;react-native&quot;: &quot;0.73.6&quot;,
// Wake word
&quot;@picovoice/porcupine-react-native&quot;: &quot;^3.0.2&quot;,
// Speech-to-text
&quot;@react-native-voice/voice&quot;: &quot;^3.2.4&quot;,
// Audio playback (for TTS output)
&quot;react-native-sound&quot;: &quot;^0.11.2&quot;,
// File system (save TTS audio files)
&quot;react-native-fs&quot;: &quot;^2.20.0&quot;,
// Secure token storage
&quot;react-native-encrypted-storage&quot;: &quot;^4.0.3&quot;,
// General async storage
&quot;@react-native-async-storage/async-storage&quot;: &quot;^1.21.0&quot;,
// WebView (for Spotify OAuth flow inside app)
&quot;react-native-webview&quot;: &quot;^13.8.6&quot;,
// Navigation
&quot;@react-navigation/native&quot;: &quot;^6.1.17&quot;,
&quot;@react-navigation/native-stack&quot;: &quot;^6.9.26&quot;,
&quot;react-native-screens&quot;: &quot;^3.29.0&quot;,
&quot;react-native-safe-area-context&quot;: &quot;^4.9.0&quot;
},
&quot;devDependencies&quot;: {
&quot;@babel/core&quot;: &quot;^7.20.0&quot;,
&quot;@babel/preset-typescript&quot;: &quot;^7.23.0&quot;,
&quot;@types/react&quot;: &quot;^18.2.6&quot;,
&quot;@types/react-native&quot;: &quot;^0.73.0&quot;,
&quot;typescript&quot;: &quot;5.0.4&quot;
}
}

JARVIS ANDROID — Master Build Documentv1.0 | March 2026 | Claude Sonnet 4.6 + Google Antigravity

Personal Project — Not for distribution


JARVIS
Personal AI Voice Assistant
Product Requirements Document  |  v1.0  |  March 2026

Project	Jarvis — Always-On AI Voice Assistant
Owner	Synalpy (Personal Project)
Version	1.0 — Initial PRD
Target Platforms	Web App (Chrome/Edge) + Android APK via Capacitor JS
Build Approach	Web first → Capacitor wraps to APK. Both developed in parallel.
Cost Target	Near-zero for personal use (free tier APIs primarily)

 
SECTION 1 — PROJECT VISION & GOALS

1. Project Vision & Goals
1.1 Vision Statement
Jarvis is a personal always-on AI voice assistant inspired by the Iron Man AI system. Unlike commercial assistants such as Google Assistant or Alexa, Jarvis is a fully custom, user-owned assistant that prioritises voice accuracy, intelligent intent understanding, and real phone control. It runs on an always-listening wake-word pipeline and only activates its full AI stack when the user says the configured keyword.

1.2 Core Problem Being Solved
Existing voice assistants like Google Gemini Assistant suffer from:
•	Poor speech recognition accuracy, especially for natural spoken commands and Indian English accents
•	Inability to perform complex multi-step instructions in a single voice command
•	No user control over the AI model, voice, or pipeline
•	Always sending data to the cloud with no transparency
•	Inability to be customised — you get what Google or Apple ships

1.3 Project Goals
•	Build a fully functional AI voice assistant with a custom wake word ('Jarvis')
•	Achieve far superior speech recognition accuracy compared to stock assistants
•	Enable real Android phone control — opening apps, playing music, reading content
•	Support both online and limited offline operation modes
•	Use a hybrid TTS system to preserve ElevenLabs API quota for high-value responses
•	Keep running costs at or near zero for personal daily use
•	Build as a web app first for easy demo/testing, then package as an Android APK

1.4 Success Criteria
Metric	Target	Notes
Wake word accuracy	>99% on-device	Porcupine handles this
STT accuracy	>95% on spoken commands	Deepgram Nova-2 target
Command response time	<2.5 seconds end-to-end	Wake → spoken reply
Daily API cost	₹0 for personal use	Free tier models via OpenRouter
Offline capability	8+ command types offline	Time, date, local music, apps
ElevenLabs quota usage	<5,000 chars/day	Hybrid TTS preserves quota

 
SECTION 2 — SYSTEM ARCHITECTURE

2. System Architecture
2.1 Architecture Overview
Jarvis is built as a five-layer pipeline. Each layer has a clear single responsibility. Layers are modular — any individual layer's implementation can be swapped without affecting the rest of the pipeline.

Layer	Name	Responsibility
Layer 1	Wake Word Detection	Runs always-on, offline. Detects the keyword 'Jarvis' and activates the pipeline.
Layer 2	Speech-to-Text (STT)	Transcribes spoken audio to text after wake word fires.
Layer 3	Intent & AI Brain	Parses the transcribed text. Routes to offline handler or online AI model based on connectivity and command type.
Layer 4	Action Engine	Executes the parsed intent — opens apps, plays media, reads content, searches the web, etc.
Layer 5	Text-to-Speech (TTS)	Converts AI response text to audio and plays it back to the user via a three-tier hybrid system.

2.2 Request Flow — Online Mode
This is the primary operating mode when internet is available:

Step 1 — Wake word detected by Porcupine (offline, always running)
Step 2 — Microphone activates, Whisper.cpp begins capturing audio
Step 3 — Audio stream sent to Deepgram Nova-2 for transcription (online, fast)
Step 4 — Transcribed text sent to Intent Router
Step 5 — Intent Router determines command complexity:
◦	Simple/short command → routed to Qwen 3 4B via OpenRouter
◦	Complex command (search, define, read, multi-step) → routed to Llama 3.3 70B via OpenRouter
Step 6 — AI model returns structured JSON response containing intent, action, and reply text
Step 7 — Action Engine executes the intent (opens app, searches web, reads file, etc.)
Step 8 — TTS layer evaluates reply text length and routes to appropriate voice engine
Step 9 — Audio plays back to user

2.3 Request Flow — Offline Mode
Triggered automatically when no internet connection is detected:

Step 1 — Wake word detected (Porcupine, always offline)
Step 2 — Whisper.cpp captures and transcribes audio locally
Step 3 — Intent Router checks against offline command pattern library
Step 4a — If pattern match found: execute locally (get time, open app, etc.)
Step 4b — If no pattern match: respond 'I need an internet connection for that'
Step 5 — Web Speech API delivers voice response (offline TTS)

2.4 Platform Parallelism — Web & Mobile
The project is developed as a web app and Android APK simultaneously using a single shared codebase. This is possible because Capacitor JS wraps the web app in a native Android shell and provides plugins that bridge web APIs to native device capabilities.

Context	Details
Shared codebase	100% of React/JS code is identical between web and mobile builds
Web-specific behaviour	Uses browser Web APIs for mic access, Web Speech API for TTS, runs in Chrome/Edge
Mobile-specific behaviour	Capacitor plugins handle background mic, app launching, file system, and native audio
Build difference	Web: vite build + serve. Mobile: vite build → npx cap sync → Android Studio → APK
Demo workflow	Run web version for rapid testing of all AI and voice features. APK tested separately for native phone control.
Environment variables	Single .env file used by both builds. Vite injects at build time.

 
SECTION 3 — FULL TECHNOLOGY STACK

3. Full Technology Stack
3.1 Frontend Framework
Technology	Details
React 18	Core UI framework. Manages component state, pipeline state machine, and renders the assistant interface.
Vite	Build tool and dev server. Handles .env injection, hot module reload, and production bundling.
Tailwind CSS	Utility-first CSS. Used for the assistant UI — waveform visualiser, status indicators, settings panel.
JavaScript (ES2022)	Primary language. No TypeScript to keep build simple and AI-assisted coding frictionless.

3.2 Wake Word Detection — Layer 1
Technology	Details
Porcupine by Picovoice	Primary wake word engine. Runs 100% on-device using WebAssembly in the browser and native SDK in Capacitor. Zero latency, zero battery drain. Custom 'Jarvis' wake word trained via Picovoice Console (free).
Porcupine Web SDK	@picovoice/porcupine-web npm package. Works identically in browser and Capacitor.
Accuracy target	False positive rate <1 per hour. False negative rate <1%. These are Porcupine's published benchmarks.
Always-on behaviour	Porcupine runs in a Web Worker (browser) or Capacitor Background Runner plugin (mobile) so it keeps listening even when the app is backgrounded on Android.

3.3 Speech-to-Text — Layer 2
Technology	Details
Deepgram Nova-2 (online)	Primary STT for online mode. REST/WebSocket API. Latency typically 150–300ms. Significantly more accurate than Google STT for natural speech and Indian English. $200 free credit on signup covers months of personal use.
Deepgram JS SDK	@deepgram/sdk npm package. Used for both one-shot transcription and streaming audio.
Whisper.cpp via WASM (offline)	Fallback STT for offline mode. The 'tiny' or 'small' model runs in-browser via whisper-wasm. No internet required. Accuracy lower than Deepgram but vastly better than Web Speech API.
Audio capture	Web: navigator.mediaDevices.getUserMedia(). Mobile: Capacitor Microphone plugin for background mic access.
Audio format	16kHz mono WAV/PCM. Both Deepgram and Whisper prefer this format. Captured via AudioContext and ScriptProcessorNode.

3.4 AI Brain & Intent Engine — Layer 3
3.4.1 AI Models via OpenRouter
Model	Details
Primary: Llama 3.3 70B (free)	Model ID: meta-llama/llama-3.3-70b-instruct:free. Used for complex commands — web search, definitions, summarisation, multi-step tasks. 66K context. Supports tool use. Free with 200 requests/day limit.
Secondary: Qwen 3 4B (free)	Model ID: qwen/qwen3-4b:free. Used for simple commands — open app, set timer, play music, get time. 41K context. Faster response due to smaller size. Preserves Llama quota.
OpenRouter endpoint	https://openrouter.ai/api/v1/chat/completions — OpenAI-compatible. Model is specified per-request via the 'model' field.
Rate limits	20 requests/minute, 200 requests/day per model. For personal use this is ample. Both models have separate quotas.
Fallback	If Llama rate limit hit, route complex queries to Qwen 3 4B as fallback before failing.

3.4.2 Intent Router Logic
The Intent Router sits between STT output and AI model selection. It performs two functions:

Function 1 — Offline check: Does the command match an offline pattern?
◦	If yes: skip AI entirely, execute locally
◦	If no: check connectivity, route to AI

Function 2 — Complexity routing: Which AI model should handle this command?
◦	Simple commands (open app, play music, set alarm, get time/date) → Qwen 3 4B
◦	Complex commands (search, define, summarise, read, translate, explain) → Llama 3.3 70B

3.4.3 Structured AI Output Format
All AI model calls are given a system prompt that instructs the model to return a JSON object exclusively. This ensures the app can parse and execute intents programmatically. The JSON schema is:

AI Response JSON Schema
{   "intent": "open_app | play_music | search_web | read_content | define_word | set_alarm | get_time | get_date | general_reply | unknown",   "action": {     "type": "app_launch | media_play | web_search | tts_read | device_api | none",     "target": "spotify | youtube | chrome | ...",     "query": "search term or song name",     "url": "optional direct URL"   },   "reply": "The spoken text Jarvis will say back to the user",   "reply_length": "short | medium | long",   "requires_internet": true | false }

3.5 Action Engine — Layer 4
Action Type	Implementation
Open app (Android)	Capacitor App Launcher plugin: AppLauncher.openUrl(). Supports deep links for Spotify, YouTube, WhatsApp, Maps, Camera, Calculator, Settings, and any app with a registered URI scheme.
Open app (Web)	window.open() with relevant URL. Limited to browser-accessible web apps.
Play music on Spotify	Spotify URI deep link: spotify:search:{query} or spotify:track:{id}. Opens Spotify app directly to the song/artist.
Play local music	Capacitor Filesystem + Audio plugin reads and plays locally stored audio files. Works offline.
Web search	Opens default browser with Google search URL: https://www.google.com/search?q={query}. Optionally fetches top result and reads it back via TTS.
Read content (book/article)	File content passed to AI for summarisation or read verbatim via ElevenLabs TTS. Supports PDF text extraction via pdf.js.
Set alarm/timer	Capacitor Local Notifications plugin sets a native Android alarm or timer.
Get time/date	JavaScript Date object. Pure offline. No API needed.
Toggle device settings	Capacitor Device plugin for screen brightness. Network plugin for connectivity info.
Make phone call	Capacitor App plugin with tel: URI scheme.
Send WhatsApp message	Deep link: whatsapp://send?phone={number}&text={message}

3.6 Text-to-Speech — Layer 5 (Hybrid System)
The TTS system uses three engines in a priority hierarchy. The routing decision is based on the reply_length field in the AI JSON response and a character count threshold.

Tier	Engine	When Used
Tier 1 (instant)	Web Speech API (SpeechSynthesis)	reply_length = 'short' OR character count < 80. Filler words: 'On it', 'Done', 'Opening Spotify now', time/date replies. Zero API cost, works offline, instant.
Tier 2 (mid-quality)	Kokoro TTS (ONNX WebAssembly)	reply_length = 'medium' OR 80–400 characters. Moderate quality responses. Free, offline, no quota. Slight robotic quality acceptable for mid-length output.
Tier 3 (premium)	ElevenLabs API	reply_length = 'long' OR >400 characters. Definitions, article summaries, book reading, detailed explanations. Natural human voice. 10,000 chars/month free tier preserved for high-value moments.

TTS Component	Details
ElevenLabs SDK	@eleven-labs/elevenlabs-js npm package. Voice ID configurable. Model: eleven_turbo_v2 for lowest latency.
Kokoro ONNX	kokoro-js npm package. Runs model entirely in browser via onnxruntime-web. ~82M model size. No server needed.
Web Speech API	Browser-native window.speechSynthesis. No install or API key. Voice selection depends on device OS voices installed.
Quota tracking	App tracks ElevenLabs characters used in localStorage. Displays remaining quota in settings panel. Alerts user when <2,000 chars remain.

 
SECTION 4 — OFFLINE MODE SPECIFICATION

4. Offline Mode Specification
4.1 Design Principle
Offline mode does not use any AI model. Instead it uses a deterministic pattern matcher — a predefined library of command templates that map spoken phrases to local device actions. This is intentional: offline mode needs to be instant, reliable, and require zero API calls.

4.2 Offline Command Library
Command Category	Example Phrases	Action
Current time	'what time is it', 'what's the time', 'time'	Read device clock via new Date()
Current date	'what's today's date', 'what day is it', 'date today'	Read device date via new Date()
Current day	'what day is it today', 'what's the day'	Read day of week via Date.toLocaleDateString()
Open app	'open [app name]', 'launch [app name]'	AppLauncher deep link to app
Play local music	'play music', 'play some music', 'shuffle music'	Capacitor audio plays from local storage
Pause/stop music	'stop music', 'pause', 'stop'	Pause active audio playback
Set alarm	'set an alarm for [time]'	Capacitor Local Notifications
Set timer	'set a timer for [X] minutes'	Countdown via setTimeout + notification
Flashlight	'turn on torch', 'flashlight on/off'	Capacitor Camera plugin torch mode
Volume	'volume up/down', 'mute'	Capacitor Device plugin

4.3 Offline Pattern Matching Implementation
The pattern matcher uses fuzzy keyword matching, not exact string matching. This accounts for slight STT variations in the transcribed text. Implementation logic:

1. Normalise transcribed text: lowercase, strip punctuation, trim whitespace
2. Check against keyword groups for each command category
3. If confidence score > 0.75, execute matched command
4. If no match or confidence < 0.75, check connectivity
5. If online: route to AI. If offline: respond 'I need an internet connection for that.'

4.4 Connectivity Detection
The app monitors network state in real time using the Capacitor Network plugin (mobile) and navigator.onLine API (web). The pipeline automatically switches between online and offline mode as connectivity changes. A small status indicator in the UI shows the current mode.

 
SECTION 5 — API KEYS, SECURITY & ENVIRONMENT

5. API Keys, Security & Environment
5.1 Environment Variables
All API keys are stored in a single .env file at the project root. This file is never committed to version control. Vite injects the values at build time, making them available as import.meta.env.VITE_* throughout the application.

Required .env variables
VITE_OPENROUTER_KEY=sk-or-xxxxxxxxxxxxxxxx VITE_ELEVENLABS_KEY=xx-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx VITE_PORCUPINE_KEY=xxxx (from Picovoice Console, free) VITE_DEEPGRAM_KEY=xxxx (from Deepgram Console, free credit) VITE_ELEVENLABS_VOICE_ID=xxxx (chosen voice ID from ElevenLabs)

5.2 Security Model
Scenario	Security Assessment
Local web demo (localhost)	Safe. Keys in browser bundle but only accessible on your machine. No public exposure.
APK on personal phone only	Acceptable. APK can be decompiled but since it's not distributed, risk is near-zero.
Keys committed to GitHub	NEVER DO THIS. .env must be in .gitignore before first commit.
Deployed to public web URL	Not recommended with current setup. Would require a backend proxy (Supabase Edge Functions or Cloudflare Workers) to hold keys server-side.
APK distributed to others	Requires backend proxy. Out of scope for v1.

5.3 .gitignore Requirements
Minimum .gitignore entries
.env .env.local .env.*.local node_modules/ dist/ android/ ios/

 
SECTION 6 — UI / UX SPECIFICATION

6. UI / UX Specification
6.1 Design Philosophy
The Jarvis UI is minimal and ambient. It exists to show pipeline state and give the user control — it is not meant to be interacted with by tapping during normal use. The primary interface IS the voice. The screen is secondary.

6.2 Main Screen Components
Component	Description
Central orb / waveform	Large animated circle in the centre of the screen. States: idle (slow pulse, dark), listening (bright, active waveform animation), processing (spinning), speaking (waveform synced to audio output).
Status text	Single line below the orb. Shows current pipeline state: 'Listening for Jarvis...', 'Heard: open Spotify', 'Thinking...', 'Speaking'.
Transcript display	Last spoken command shown in text. Last AI response shown below it. Fades after 8 seconds.
Mode indicator	Small pill badge: 'Online' (green) or 'Offline' (amber). Top-right corner.
ElevenLabs quota bar	Thin progress bar at bottom. Shows remaining free tier characters. Turns red below 2,000.
Settings gear icon	Top-left. Opens slide-up panel for wake word sensitivity, TTS preferences, voice selection, API key status.

6.3 Orb State Machine
State	Visual	Trigger
Dormant	Dark navy, very slow pulse (4s cycle)	App open, wake word not yet detected
Activated	Bright blue, fast pulse (0.5s), border glow	Wake word 'Jarvis' detected
Listening	Animated waveform, mic icon visible	Microphone actively capturing speech
Processing	Rotating arc spinner overlay	STT complete, waiting for AI response
Speaking	Waveform synced to audio amplitude	TTS audio playing
Offline	Amber tint on all states	No internet detected
Error	Red pulse, error icon	API failure or no match

6.4 Responsive Design
The web app is designed mobile-first (375px minimum width) but also works on desktop browsers for development and demo purposes. When used on desktop, the orb is centred with max-width constraints. The Capacitor APK targets portrait orientation only (Android manifest: portrait lock).

 
SECTION 7 — CAPACITOR MOBILE BUILD

7. Capacitor Mobile Build
7.1 How Capacitor Works
Capacitor JS is a cross-platform native runtime. It wraps the Vite-built web app in an Android WebView, then adds a plugin bridge that lets JavaScript call native Android APIs. The result is a real APK that installs and runs like any Android app, but runs the same React code as the web version.

7.2 Required Capacitor Plugins
Plugin	Purpose
@capacitor/app	App lifecycle, background state, and URL scheme handling for deep links
@capacitor/app-launcher	Opens external apps via URI schemes (Spotify, YouTube, WhatsApp, etc.)
@capacitor/microphone	Requests and manages microphone permissions for voice capture
@capacitor/network	Monitors connectivity state for online/offline mode switching
@capacitor/local-notifications	Sets alarms and timers that fire even when app is backgrounded
@capacitor/filesystem	Reads local audio files and documents for playback and content reading
@capacitor/device	Gets device info, manages volume control and screen brightness
@capacitor-community/background-runner	Keeps Porcupine wake word detection running when app is in background — critical for always-on behaviour
@capacitor/camera	Accesses torch/flashlight for 'turn on flashlight' commands

7.3 Android Permissions Required
The following permissions must be declared in AndroidManifest.xml:
•	RECORD_AUDIO — microphone access for STT
•	INTERNET — all online API calls
•	FOREGROUND_SERVICE — background wake word detection
•	RECEIVE_BOOT_COMPLETED — restart background listener after phone reboot
•	VIBRATE — feedback on wake word detection
•	POST_NOTIFICATIONS — alarm and timer notifications
•	CAMERA — torch/flashlight control

7.4 Build Pipeline
Step 1: npm run build (Vite builds web app to /dist with env variables baked in)
Step 2: npx cap sync (copies dist to Android project, syncs plugins)
Step 3: npx cap open android (opens Android Studio)
Step 4: Build APK in Android Studio (Build → Build Bundle/APK → Build APK)
Step 5: Transfer APK to phone via USB or Google Drive and install

Important Note on Parallel Development
When developing web and mobile in parallel: run the web version with npm run dev for rapid feature testing. Run the Capacitor build only when testing native phone features (app launching, background mic, notifications). This saves significant build time during development.

 
SECTION 8 — DATA MANAGEMENT & STATE

8. Data Management & State
8.1 Application State
The app uses React's built-in useState and useReducer hooks for all state management. No external state library (Redux, Zustand) is needed given the linear nature of the pipeline. The core state object tracks:

State Variable	Description
pipelineState	Enum: dormant | activated | listening | processing | speaking | error
isOnline	Boolean. Updated by Capacitor Network plugin listener.
lastTranscript	String. The most recent STT output. Displayed in UI.
lastReply	String. The most recent AI reply text. Displayed in UI.
elevenLabsCharsUsed	Number. Persisted to localStorage. Tracks monthly quota usage.
activeModel	String. Currently selected AI model ID (Llama or Qwen).
conversationHistory	Array. Last 6 turns of conversation context sent to AI for continuity.
ttsMode	Enum: webspeech | kokoro | elevenlabs. Reflects which engine is active.

8.2 Persistence Strategy
Data	Storage Method
ElevenLabs quota tracking	localStorage key: jarvis_el_chars_used. Resets on 1st of each month.
User preferences	localStorage key: jarvis_preferences. Stores TTS tier preference, wake sensitivity, chosen voice.
Conversation history	In-memory only (React state). Not persisted — resets on app close for privacy.
API keys	.env file (build time). Never stored in localStorage or any runtime storage.
Command history log	Optional: localStorage key: jarvis_command_log. Last 50 commands for debugging. Can be disabled in settings.

 
SECTION 9 — ERROR HANDLING & EDGE CASES

9. Error Handling & Edge Cases
9.1 Error Scenarios & Responses
Error	Cause	Handling
STT failure	Deepgram API timeout or network error	Retry once. If fails: fall back to Whisper.cpp offline transcription.
AI API rate limit (429)	Hit OpenRouter 200/day limit	Switch to other free model. If both exhausted: inform user via Web Speech.
AI API timeout	OpenRouter >5s response	Abort request, inform user: 'That took too long, please try again.'
ElevenLabs quota exhausted	10,000 chars/month used	Automatically downgrade to Kokoro for all responses until month resets.
Wake word false positive	Porcupine triggers on similar word	5-second listen window. If no speech detected, return to dormant quietly.
App not installed (deep link)	User asks to open app not on device	Jarvis replies: 'I couldn't find [app] on your phone.'
No mic permission	User denied microphone access	UI shows permission request prompt. Voice response: 'I need microphone access to work.'
Offline + no pattern match	Unrecognised command while offline	Reply: 'I need an internet connection for that.'
JSON parse failure from AI	Model returns non-JSON response	Fallback: treat entire response as reply text, no action executed.

9.2 Graceful Degradation Order
When primary services fail, Jarvis degrades gracefully in this order:
STT: Deepgram → Whisper.cpp → Web Speech Recognition API
AI: Llama 3.3 70B → Qwen 3 4B → Offline pattern matcher → Failure response
TTS: ElevenLabs → Kokoro → Web Speech API → Silent (text only on screen)

 
SECTION 10 — FEATURE SPECIFICATIONS

10. Feature Specifications
10.1 Feature: Custom Wake Word
Attribute	Details
Wake word	'Jarvis' (trained via Picovoice Console)
Engine	Porcupine v3 WebAssembly
Sensitivity	Configurable 0.0–1.0 in settings. Default: 0.7. Higher = more sensitive but more false positives.
Response latency	<100ms from keyword end to pipeline activation
Background operation	Web: Web Worker. Mobile: Capacitor Background Runner. Continues when screen off.
Visual feedback	Orb pulses once brightly when wake word detected
Audio feedback	Optional: short chime sound on activation (configurable in settings)

10.2 Feature: Book/Article Reading
Attribute	Details
Trigger phrases	'Read me this article', 'Read this document', 'Read [filename]'
Supported formats	Plain text (.txt), PDF (text extraction via pdf.js), web URLs (fetch + extract readable content via Readability.js)
TTS engine used	ElevenLabs for natural reading voice (content is always 'long' category)
Playback controls	Voice commands: 'pause', 'resume', 'stop reading', 'read faster', 'read slower'
Speed control	ElevenLabs stability and similarity_boost parameters. Kokoro speed multiplier for non-ElevenLabs reading.
Chapter/section navigation	'skip to next section', 'go back' — works on content with heading structure

10.3 Feature: Spotify Integration
Attribute	Details
Trigger phrases	'Play [song] by [artist]', 'Open Spotify', 'Play [playlist]', 'Play [genre] music'
Implementation	Spotify URI deep link scheme. Format: spotify:search:{query} or spotify:track:{id}
Requires Spotify installed	Yes on mobile. Web version opens open.spotify.com instead.
Playback confirmation	Jarvis replies: 'Playing [song] on Spotify' before launching
No Spotify API needed	Deep links open Spotify directly — no OAuth or Spotify API credentials required for basic play commands

10.4 Feature: Conversation Context
Attribute	Details
Context window	Last 6 turns (3 user + 3 assistant) sent with each AI request
Purpose	Enables follow-up questions: 'Jarvis, what is photosynthesis?' then 'Jarvis, explain that in simpler terms'
Context reset	Manually: 'Jarvis, start over' or 'Jarvis, forget that'. Automatically: on app close.
Token management	Context is trimmed oldest-first if total token count approaches model limit

 
SECTION 11 — DEVELOPMENT PHASES

11. Development Phases
Phase 1 — Foundation (Web)
Goal: Basic voice pipeline working end-to-end in the browser.
•	Set up React + Vite project with Tailwind CSS
•	Implement Porcupine wake word detection in a Web Worker
•	Implement microphone capture and audio streaming
•	Integrate Deepgram Nova-2 for STT
•	Integrate OpenRouter with Qwen 3 4B for simple intent parsing
•	Implement Web Speech API TTS for basic responses
•	Build minimal UI: orb, status text, transcript display
•	Configure .env and .gitignore

Phase 2 — Intelligence (Web)
Goal: Full AI capability and all TTS tiers working.
•	Integrate Llama 3.3 70B via OpenRouter for complex commands
•	Implement Intent Router with complexity detection logic
•	Integrate ElevenLabs TTS SDK
•	Integrate Kokoro TTS via ONNX WebAssembly
•	Implement three-tier TTS routing logic
•	Implement conversation context (last 6 turns)
•	Build offline pattern matcher with all offline command types
•	Add connectivity detection and online/offline mode switching
•	ElevenLabs quota tracking in localStorage

Phase 3 — Actions (Web)
Goal: All action types working in the web demo context.
•	Implement web search action (open Google in new tab)
•	Implement content reading (URL fetch + Readability.js + ElevenLabs)
•	Implement Spotify deep link launching
•	Implement all offline device commands (time, date, timer via browser)
•	Full error handling across all failure scenarios
•	Settings panel: TTS preferences, sensitivity, quota display

Phase 4 — Mobile (Capacitor)
Goal: Full feature parity on Android APK with native phone control.
•	Install Capacitor and initialise Android project
•	Install and configure all required Capacitor plugins
•	Migrate microphone from Web API to Capacitor Microphone plugin
•	Configure Capacitor Background Runner for always-on Porcupine
•	Test and verify all deep link app launches on real Android device
•	Configure AndroidManifest.xml with all required permissions
•	Test background operation (screen off, app backgrounded)
•	Build debug APK, install on phone, full end-to-end test
•	Build release APK for personal distribution

 
SECTION 12 — COMPLETE DEPENDENCY LIST

12. Complete Dependency List
12.1 npm Dependencies
Package	Version	Purpose
react	^18.0.0	Core UI framework
react-dom	^18.0.0	React DOM renderer
vite	^5.0.0	Build tool and dev server
@vitejs/plugin-react	^4.0.0	Vite React plugin
tailwindcss	^3.4.0	Utility CSS framework
@picovoice/porcupine-web	latest	Wake word detection
@deepgram/sdk	^3.0.0	Speech-to-text API client
openai	^4.0.0	OpenAI-compatible client for OpenRouter
@eleven-labs/elevenlabs-js	latest	ElevenLabs TTS client
kokoro-js	latest	Offline Kokoro TTS via ONNX
onnxruntime-web	^1.18.0	ONNX runtime for Kokoro in browser
pdfjs-dist	^4.0.0	PDF text extraction for book reading
@mozilla/readability	latest	Article text extraction from URLs
@capacitor/core	^6.0.0	Capacitor core runtime
@capacitor/cli	^6.0.0	Capacitor CLI tools
@capacitor/android	^6.0.0	Capacitor Android platform
@capacitor/app	^6.0.0	App lifecycle plugin
@capacitor/app-launcher	^6.0.0	App launching plugin
@capacitor/microphone	^6.0.0	Native microphone plugin
@capacitor/network	^6.0.0	Network connectivity plugin
@capacitor/local-notifications	^6.0.0	Alarms and timers
@capacitor/filesystem	^6.0.0	Local file access
@capacitor/device	^6.0.0	Device info and controls
@capacitor/camera	^6.0.0	Torch/flashlight access
@capacitor-community/background-runner	latest	Background JS execution

 
SECTION 13 — COST ANALYSIS

13. Cost Analysis
13.1 Monthly Cost Estimate (Personal Daily Use)
Service	Free Tier	Estimated Monthly Cost
OpenRouter (Llama 3.3 70B)	200 requests/day = 6,000/month	₹0
OpenRouter (Qwen 3 4B)	200 requests/day = 6,000/month	₹0
Porcupine wake word	Unlimited for non-commercial	₹0
Deepgram STT	$200 credit on signup (~2 years at personal use)	₹0 for ~24 months
ElevenLabs TTS	10,000 chars/month	₹0 (with hybrid TTS preserving quota)
Kokoro TTS	Fully open source, offline	₹0
Web Speech API	Browser built-in	₹0
Capacitor + plugins	Open source	₹0
TOTAL	—	₹0/month

Cost Overflow Scenario
If ElevenLabs free tier is exceeded (very heavy use of book reading), the app automatically falls back to Kokoro TTS — cost remains ₹0. If OpenRouter daily limits are hit, the app uses the fallback model before failing gracefully. The architecture is designed so that the app never breaks on a free tier limit — it always degrades to a working (if reduced quality) state.

 
SECTION 14 — CONSTRAINTS & LIMITATIONS

14. Known Constraints & Limitations
14.1 Technical Constraints
•	iOS is not a target for v1. Capacitor supports iOS but Apple's restrictions on background mic access and app launching make the always-on model significantly more complex on iPhone. Android only for mobile.
•	Web Speech API voice quality varies by OS. On Windows it sounds robotic. On Android (Chrome) it sounds better. This is acceptable since it's only used for short filler responses.
•	Kokoro TTS model download (~82MB) happens once on first use. There may be a few seconds of loading on first Kokoro response. Subsequent uses are instant.
•	OpenRouter free models may be removed without notice. The model ID is a single config variable so switching to a different free model is a one-line change.
•	Deepgram $200 credit is not truly 'free forever' — it will eventually run out at which point Whisper.cpp becomes the primary STT. Whisper accuracy is lower but sufficient for command recognition.
•	Spotify deep links require the Spotify app to be installed on the Android device. There is no API-based playback control in v1.
•	The 200 requests/day limit on OpenRouter free models means very heavy use (200+ voice commands in a day) would exhaust the quota. For personal use this is extremely unlikely.
14.2 Scope Exclusions (v1)
•	iOS / iPhone support
•	Multi-user support
•	Cloud sync of conversation history
•	Custom voice training (ElevenLabs voice clone)
•	Smart home device control (Philips Hue, etc.)
•	Calendar integration
•	Email/SMS reading and composing
•	Backend proxy server (required only if distributing to others)

End of Document
JARVIS PRD v1.0  |  Synalpy  |  March 2026

