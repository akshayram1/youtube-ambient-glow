# LumaBloom

**Let every frame light the room.**

LumaBloom is a Manifest V3 extension for Chrome and Brave that adds cinematic, video-synced ambient lighting to YouTube™. It samples 20 video-edge zones locally and spreads their colors across the page with adjustable spread, intensity, color boost, response, and smoothing.

No backend, remote scripts, analytics, or frame uploads.

## Install
1. Extract this ZIP.
2. Open chrome://extensions (or brave://extensions).
3. Turn on Developer mode.
4. Click Load unpacked and select the `youtube-ambient-glow` folder containing manifest.json.
5. Refresh YouTube™, play a video, and click the LumaBloom icon to adjust the glow.

The ZIP is source code, not a Chrome Web Store signed package; do not drag the ZIP onto the extensions page.

## Behavior and limitations
- Supports regular youtube.com watch pages, including theater view. Shorts, embeds, mobile YouTube, and other websites are outside v1 scope.
- Stops sampling on pause and keeps the last color. Stops in hidden tabs; resumes on return.
- Hides in fullscreen because there is no page background outside the video.
- Handles YouTube navigation without a full page reload. Refresh an already-open tab after installation or reloading the extension.
- Temporarily hides YouTube's built-in ambient effect while the extension is active.
- Normal sampling uses a tiny 64×36 canvas. If browser cross-origin restrictions prevent reading pixels, it displays the blurred canvas directly instead; zone extraction and smoothing are unavailable in this fallback. Protected video may not produce usable frames. The extension never bypasses DRM or origin protections.
- YouTube may change its page markup; this extension may need selector/CSS updates over time.

## Privacy
The only permission is `storage`, used for local settings. Content scripts run only on `https://www.youtube.com/*`. No screen capture or browsing-history permission is requested. See [PRIVACY.md](PRIVACY.md).

## Brand

- Product name: **LumaBloom**
- Store title: **LumaBloom – Ambient Glow**
- Tagline: **Let every frame light the room.**

YouTube is a trademark of Google LLC. LumaBloom is an independent extension and is not affiliated with, endorsed by, or sponsored by Google LLC.

## Sources
- https://developer.chrome.com/docs/extensions/develop/concepts/content-scripts
- https://developer.chrome.com/docs/extensions/reference/api/storage
- https://developer.mozilla.org/en-US/docs/Web/API/HTMLVideoElement/requestVideoFrameCallback
- https://developer.mozilla.org/en-US/docs/Web/HTML/How_to/CORS_enabled_image
