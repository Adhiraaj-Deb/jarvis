# Jarvis known limitations & error log

## 1. Spotify Web vs Native Playback
**The Problem:** When asking Jarvis to "Play Shape of You on Spotify", Jarvis successfully opens Spotify but does not automatically click the "Play" button.
**The Cause:** Modern web browsers (Chrome, Edge, Safari) have extremely strict auto-play policies and Cross-Origin Resource Sharing (CORS) rules. A web application running on `localhost` or a web domain cannot reach into the `spotify.com` DOM and programmatically click buttons on behalf of the user. 
**The Mitigation:** The AI currently constructs a direct deep-link to the Spotify Search page for the requested song (`https://open.spotify.com/search/[Song Name]`). The user must manually click play once the page opens.
**The Future Fix:** When this web app is ported to an Android APK using Capacitor JS (as outlined in Phase 4 of the PRD), `window.open` will be replaced heavily with native device Intents (`@capacitor/app-launcher`), which can trigger native background playback on the OS level without opening a browser tab.

## 2. OpenRouter API Network Instability
**The Problem:** Occasional "I'm having trouble connecting to my brain right now" errors, especially during peak hours.
**The Cause:** High-end free models on OpenRouter (like Llama 3.3 70B Free or GLM 4.5 Air Free) are heavily rate-limited and subjected to massive global traffic. This frequently results in HTTP 502 (Bad Gateway) or HTTP 429 (Too Many Requests) errors.
**The Mitigation:** 
1. **Retry Loop:** A 3-attempt exponential backoff retry loop was added to the fetch request in `openrouterService.js`. If the API drops the connection, Jarvis silently waits 600ms and tries again before giving up, absorbing most transient errors.
2. **Model Fallback:** If the primary "Complex" model hard-fails after 3 retries, the code automatically re-routes the exact same prompt to the "Simple" model to ensure the user still gets a response.
