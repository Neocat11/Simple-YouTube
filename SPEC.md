# Simple-YouTube Specification

Status: Draft
Last updated: 2026-04-30

## Overview

Simple-YouTube is a Chrome extension for reducing YouTube dependency by removing visual hooks from YouTube browsing surfaces.

The first product goal is intentionally narrow: hide video thumbnails and Shorts thumbnails while preserving enough textual context to let the user choose intentionally. The extension should make YouTube quieter, not replace YouTube, track the user, or introduce a new content recommendation layer.

The project is planned as a public open-source GitHub repository.

## Product Principles

- Keep the extension single-purpose: reduce YouTube visual distraction.
- Prefer privacy by design: no analytics, no external network requests, no collection of browsing history.
- Use the minimum required Chrome permissions.
- Preserve user agency: titles, channel names, and channel icons should remain visible where possible.
- Keep UI minimal. The MVP should include only a popup toggle for enabling or disabling Simple-YouTube.
- Expect YouTube DOM changes and make selector logic easy to test and update.

## Target Browser

- Chrome desktop
- Manifest V3

Other Chromium browsers and Firefox are out of scope for the MVP, but the implementation should avoid unnecessary Chrome-only coupling where it does not add value.

## MVP Scope

### In Scope

- Hide thumbnails for normal horizontal YouTube videos.
- Hide thumbnails for Shorts cards and Shorts shelves.
- Preserve visible text metadata where possible:
  - video title
  - channel name
  - channel icon
  - basic metadata such as view count and published date when already shown by YouTube
- Apply behavior across YouTube surfaces loaded by initial page load, infinite scroll, and single-page app navigation.
- Provide a Chrome extension popup with one enable/disable toggle.
- Persist the enabled/disabled state across page reloads and browser restarts.
- Use static content scripts and CSS for `https://www.youtube.com/*`.
- Include automated tests for selector and DOM behavior before expanding coverage.

### Out of Scope for MVP

- Blocking or redirecting `/shorts/...` player pages.
- Disabling the YouTube video player on `/watch`.
- Removing the entire Shorts section.
- Syncing settings across devices.
- Multiple user-configurable settings beyond the single enable/disable toggle.
- Blocking channels, keywords, comments, ads, or recommendations.
- Modifying YouTube search behavior.
- Supporting mobile YouTube or YouTube apps.

## Behavior Requirements

### Normal Video Cards

On YouTube browsing surfaces, video thumbnail imagery should be hidden.

The extension should not hide:

- title text
- channel name
- channel avatar/icon
- duration text if it remains meaningful without the thumbnail
- badges such as live/upcoming/member-only when not technically tied to thumbnail removal

If a thumbnail container includes overlays that become visually confusing after image removal, the implementation may hide those overlays as part of the thumbnail area.

### Shorts Cards

For the MVP, Shorts cards should remain as title-first text entries rather than being fully removed.

The extension should:

- hide Shorts thumbnail imagery
- keep the Shorts title visible when YouTube exposes it
- keep channel identity visible when YouTube exposes it
- avoid redirecting or blocking direct `/shorts/...` navigation in the MVP

### Player Pages

On `/watch`, the main video player must remain usable.

On `/shorts/...`, the MVP does not guarantee a distraction-free player experience. Direct Shorts page blocking is a future feature.

### Popup Toggle

The extension popup should provide a single setting:

- Label: `SIMPLE YOUTUBEを有効化？`
- Control: on/off toggle
- Default: on

When the toggle is on, Simple-YouTube behavior is applied to YouTube pages.

When the toggle is off:

- thumbnail hiding should be removed or disabled
- newly loaded YouTube content should remain in the normal YouTube state
- the main page should not require a full browser restart

A page reload is acceptable for the first implementation if live restoration creates avoidable complexity, but the preferred behavior is immediate re-application/removal on the active YouTube tab.

### YouTube SPA Navigation

YouTube behaves like a single-page application. Moving between pages often changes the URL and DOM without a full page reload.

The extension must therefore re-apply its rules after:

- initial page load
- client-side navigation
- infinite-scroll content insertion
- dynamic replacement of renderer elements

## MutationObserver Policy

MutationObserver is the primary mechanism for reacting to DOM changes after the content script has loaded.

Working understanding:

- It can detect newly inserted or changed DOM nodes.
- It can cover infinite loading because YouTube appends more video renderers to the page.
- It can cover most SPA transitions because YouTube replaces or mutates page content during navigation.
- It does not inherently understand URL changes. If URL-specific behavior is added later, the extension should also listen for YouTube navigation events or compare `location.href` after observed changes.
- It should not be used as a reason to scan the entire document repeatedly without limits.

Implementation guidance:

- Run an initial pass immediately.
- Observe `document.documentElement` or `document.body` with `childList: true` and `subtree: true`.
- Batch work with `requestAnimationFrame`, microtask scheduling, or a small debounce.
- Process only relevant added nodes and their descendants where practical.
- Mark processed elements with an extension-owned data attribute, such as `data-simple-youtube-processed`, if JS mutation is needed.
- Keep CSS as the first line of defense to reduce thumbnail flash.

## Technical Approach

### Manifest

Use Manifest V3.

Expected initial manifest shape:

```json
{
  "manifest_version": 3,
  "name": "Simple-YouTube",
  "version": "0.1.0",
  "description": "Hide YouTube thumbnails and reduce Shorts distractions.",
  "permissions": ["storage"],
  "action": {
    "default_popup": "popup.html"
  },
  "content_scripts": [
    {
      "matches": ["https://www.youtube.com/*"],
      "css": ["content.css"],
      "js": ["content.js"],
      "run_at": "document_start"
    }
  ],
  "host_permissions": ["https://www.youtube.com/*"]
}
```

The MVP should not request broad permissions such as `<all_urls>`, `tabs`, `history`, `webRequest`, or `scripting` unless a concrete requirement appears.

The `storage` permission is acceptable in the MVP because it is needed to persist the single enable/disable toggle. Prefer `chrome.storage.local` unless there is a clear reason to sync this state across browsers.

### Content Script

The content script should:

- apply DOM classifications that CSS alone cannot express safely
- detect Shorts links using URL/path semantics such as `/shorts/`
- read the enabled/disabled state before applying visual changes
- respond to popup state changes without requiring a browser restart
- handle YouTube dynamic rendering via MutationObserver
- avoid remote code, eval, or injected third-party scripts

### Popup

The popup should:

- contain only one toggle and one short label in the MVP
- read the current enabled/disabled state from `chrome.storage.local`
- write changes to `chrome.storage.local`
- notify the active YouTube tab or otherwise cause the content script to re-apply the current state
- avoid analytics, external resources, and unnecessary styling dependencies

Initial label text:

```text
SIMPLE YOUTUBEを有効化？
```

### CSS

CSS should:

- hide thumbnail images and thumbnail media containers
- avoid hiding channel avatars
- avoid hiding the main player
- use extension-owned classes or attributes where JS classification is needed

### Selector Strategy

Prefer stable semantic signals:

- links whose path starts with `/shorts/`
- YouTube renderer elements such as `ytd-video-renderer`, `ytd-rich-item-renderer`, `ytd-compact-video-renderer`, `ytd-reel-item-renderer`
- thumbnail containers such as `ytd-thumbnail`, `yt-thumbnail-view-model`, and `a#thumbnail`

Avoid relying solely on:

- generated class names
- deep brittle descendant chains
- image URL patterns unless scoped to a known thumbnail container

## YouTube Surface Coverage

The project should maintain fixture coverage for these surfaces.

MVP priority:

- Home: `/`
- Search results: `/results`
- Watch page right rail: `/watch`
- Subscriptions: `/feed/subscriptions`
- Channel videos and channel Shorts tabs: `/@handle/...`, `/channel/...`
- Shorts shelves/cards embedded in normal browsing surfaces

Later coverage:

- History: `/feed/history`
- Playlists: `/playlist`
- Explore/trending: `/feed/explore`, `/feed/trending`
- Hashtag pages: `/hashtag/...`
- End screen recommendations
- Mini player related surfaces
- Direct Shorts player: `/shorts/...`

## Testing Strategy

Use test-driven development at the behavior level. Start with fixture-based tests before relying on live YouTube pages.

### Unit Tests

Test pure logic:

- identifies `/shorts/{id}` links as Shorts
- does not identify `/watch?v={id}` as Shorts
- does not identify channel links or playlist links as Shorts
- classifies thumbnail containers without classifying channel avatars
- can run the same classification twice without changing the result unexpectedly
- ignores nodes outside YouTube-like renderer structures
- maps missing stored settings to the default enabled state

### DOM Fixture Tests

Use small static HTML fixtures that represent YouTube renderer patterns.

Required fixture cases:

- home video card
- search result video
- watch right-rail recommendation
- subscription feed card
- channel video grid item
- Shorts shelf item
- playlist row
- channel avatar near a video card
- main `/watch` player area

Assertions:

- thumbnail image or thumbnail media is hidden
- title remains visible
- channel name remains visible
- channel icon remains visible
- main video player remains visible
- Shorts card title remains visible
- repeated processing is idempotent
- disabled mode leaves fixture thumbnails visible
- toggling from disabled to enabled hides fixture thumbnails
- toggling from enabled to disabled restores or stops applying thumbnail hiding

### MutationObserver Tests

Required cases:

- newly appended video card is processed
- newly appended Shorts card is processed
- replacing a page container processes new content
- processing is batched rather than triggered excessively for many small mutations
- observer does not hide newly appended content while disabled

### End-to-End Tests

Use Playwright or Puppeteer with Chromium and the unpacked extension.

Initial E2E should use local fixture pages because live YouTube is unstable and may vary by account, region, experiment, login state, and date.

Required E2E assertions:

- extension loads under Manifest V3
- content script applies to a local or controlled YouTube-like page when served under a test host if possible
- popup opens and shows the single enable/disable toggle
- toggling off disables thumbnail hiding on the active YouTube-like page
- toggling on re-enables thumbnail hiding on the active YouTube-like page

Manual smoke tests on real YouTube should be documented separately and run before releases.

### Additional Test Ideas

- dark mode and light mode visual sanity
- narrow viewport sanity, even though mobile YouTube is out of scope
- logged-out YouTube
- logged-in YouTube
- Japanese and English UI labels
- slow network or late image load
- YouTube page refresh after SPA navigation
- extension disable/re-enable behavior
- browser restart or extension reload preserves the popup toggle state
- Chrome Web Store package scan for accidental remote code URLs
- permission regression check to prevent broad permissions from being added silently

## OSS Documentation Policy

### Required at Initial Public Release

- `README.md`
- `LICENSE`
- `PRIVACY.md`

Rationale:

- A README and license are baseline GitHub open-source hygiene.
- Without a license, public source is viewable and forkable on GitHub, but reuse rights remain unclear.
- A privacy document is worth including even if the extension collects no data, because Chrome extensions operate in a sensitive trust context and Chrome Web Store privacy disclosures must match actual behavior.

### Recommended but Can Be Short

- `CONTRIBUTING.md`

For this project, a long contribution guide is unnecessary at the start. However, a short file is useful because maintaining the extension will largely mean updating YouTube selectors and fixtures. The initial version can simply explain:

- add or update a fixture when changing selector behavior
- keep permissions minimal
- do not add analytics or external requests
- run tests before opening a pull request
- include before/after notes for affected YouTube surfaces

### Optional Later

- `SECURITY.md`
- `CODE_OF_CONDUCT.md`
- issue templates
- pull request template

`SECURITY.md` becomes more important before a Chrome Web Store release or once outside users install the extension.

## Privacy Requirements

The MVP must:

- collect no personal data
- collect no browsing history
- send no data to external servers
- use no analytics
- use no remote configuration
- store only the local enabled/disabled setting

If settings are expanded later, prefer local storage and document exactly what is stored.

## Chrome Web Store Considerations

- The extension should remain single-purpose.
- Permissions must be limited to YouTube.
- The store listing must describe the behavior plainly.
- Privacy disclosures must match the code and `PRIVACY.md`.
- All executable code must be bundled with the extension.
- Avoid obfuscation. Minification is acceptable only if source remains understandable in the repository and build output is reviewable.

## Future Features

Potential post-MVP features:

- optional `/shorts/...` redirect or block screen
- per-surface controls, such as hide thumbnails on Home but not Search
- blur mode instead of full hide
- temporary reveal on hover or key press
- options page
- Firefox support

Future features should be evaluated against the single-purpose principle before implementation.

## Initial Acceptance Criteria

The MVP is acceptable when:

- thumbnails are hidden on the priority surfaces listed above
- title and channel identity remain visible in fixture tests
- the main `/watch` player remains visible
- Shorts cards keep title-first presentation instead of disappearing entirely
- dynamically inserted cards are processed
- popup toggle exists and persists its state locally
- disabling the toggle prevents Simple-YouTube visual changes from being applied
- tests cover unit, fixture DOM, and MutationObserver behavior
- manifest permissions are limited to YouTube
- the repository includes README, LICENSE, and PRIVACY docs before public release

## Research Notes

Sources consulted during initial planning:

- Chrome Extensions content scripts documentation
- Chrome Extensions end-to-end testing documentation
- Chrome Extensions Puppeteer testing documentation
- Chrome Web Store best practices
- Chrome Web Store quality guidelines FAQ
- Chrome Web Store user data FAQ
- GitHub repository best practices
- GitHub repository licensing documentation
- Choose a License
- Existing YouTube focus/blocking extensions and public descriptions
