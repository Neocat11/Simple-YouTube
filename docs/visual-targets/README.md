# Visual Targets

These images describe the intended Simple-YouTube browsing shape.

## Explorer List Target

`explorer-list-target.png` is the current visual reference for all video listing surfaces. The same target is copied per surface so visual reviews can attach actual screenshots next to the intended shape:

- `home-target.png` for authenticated Home video rows
- `search-target.png` for Search result video rows
- `watch-target.png` for Watch page recommendation rows
- `shorts-target.png` for Shorts rows/cards where title metadata is available

The target is a compact details-list layout:

- no thumbnail footprint in the normal row layout
- one content item per row
- channel avatar remains visible
- title remains the primary text
- channel and metadata remain visible where YouTube exposes them
- YouTube's own `ytd-video-preview` may appear on hover/focus as an overlay, without shifting or corrupting rows
- duration and thumbnail badges are hidden

## Implementation Notes

Do not reveal the original thumbnail container on row hover. YouTube injects its own `ytd-video-preview` element during hover preview. Revealing both the original thumbnail and the preview element causes duplicate preview surfaces and can visually corrupt the list.
