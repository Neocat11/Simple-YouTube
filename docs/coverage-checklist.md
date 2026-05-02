# Simple-YouTube Coverage Checklist

This checklist defines the video display patterns Simple-YouTube intends to cover on desktop YouTube.

Status legend:

- `[x]` Covered by automated E2E.
- `[ ]` Not covered yet.
- `Auth` requires `.playwright-user-profile` with a logged-in YouTube session.
- `Public` can run without a logged-in YouTube session.

## Home

- [x] `home.standard-videos` Auth: logged-in home recommendation video cards.
- [x] `home.shorts-shelf` Auth: Shorts cards on the home feed.
- [x] `home.live-premiere-cards` Auth: live, upcoming, or premiere cards in the home feed when present.
- [x] `home.ads-safe` Auth: ad/sponsored cards are excluded from layout assertions and must not be used as required fixtures.
- [x] `home.infinite-scroll` Auth: newly added home feed cards after scroll keep thumbnails hidden and titles visible.

## Search

- [x] `search.standard-videos` Public: normal video search results.
- [x] `search.shorts-shelf` Public: Shorts shelf in search results.
- [x] `search.live-results` Public: live or upcoming video results use the same renderer contract as normal video results.
- [x] `search.playlist-results` Public: playlist result cards keep title text and hide playlist thumbnail media.
- [x] `search.channel-results` Public: channel result cards are not treated as video cards and are not required to become compact rows.
- [x] `search.mix-radio-cards` Public: mix/radio cards are checked as playlist-like or lockup cards when present.
- [x] `search.ads-safe` Public: ad/sponsored cards are excluded from required assertions.

## Watch Page

- [x] `watch.related-videos` Public: related/recommended videos.
- [x] `watch.related-shorts` Public: Shorts/vertical recommendations when present.
- [x] `watch.mix-playlist-cards` Public: playlist/mix recommendation cards when present.
- [x] `watch.live-related` Public: live watch page related videos use the same related-video contract.
- [x] `watch.hover-preview-stable` Public: hover preview does not restore thumbnail images or break row layout.
- [x] `watch.miniplayer-safe` Public: miniplayer state does not break visible recommendation rows.

## Shorts

- [x] `shorts.single-page` Public: `/shorts/{id}` page loads without thumbnail layout breakage.
- [x] `shorts.related-ui` Public: related/recommended UI on Shorts pages keeps thumbnails hidden where video cards are present.
- [x] `shorts.spa-navigation` Public: navigation between Shorts/watch/search updates page type classes.
- [x] `shorts.comments-safe` Public: comments/description/channel UI is not targeted as a video thumbnail card.

## Subscriptions

- [x] `subscriptions.standard-videos` Auth: subscription feed video cards.
- [x] `subscriptions.shorts` Auth: subscription feed Shorts shelf/cards.
- [x] `subscriptions.live-upcoming` Auth: live/upcoming subscription cards.
- [x] `subscriptions.date-groups` Auth: date/group separators remain visible.

## You Tab / Library

- [x] `you.feed` Auth: `/feed/you` video cards.
- [x] `you.history` Auth: `/feed/history` history video cards.
- [x] `you.watch-later` Auth: Watch Later playlist video rows.
- [x] `you.liked-videos` Auth: liked videos playlist rows.
- [x] `you.playlist-cards` Auth: playlist cards shown in the You tab.
- [x] `you.purchases-downloads-safe` Auth: non-video account/library modules are not required video rows and must not fail the layout checks.

## Playlist

- [x] `playlist.detail-videos` Public/Auth: playlist detail video rows.
- [x] `playlist.own-list` Auth: user-owned playlist detail rows, represented by Watch Later/Liked videos.
- [x] `playlist.channel-tab` Public: channel Playlists tab cards.
- [x] `playlist.search-result-cards` Public: playlist cards in search results.
- [x] `playlist.side-panel-safe` Public: watch/playlist panel remains outside required compact-row assertions.

## Channel

- [x] `channel.home` Public: channel Home tab video sections.
- [x] `channel.videos` Public: channel Videos tab.
- [x] `channel.shorts` Public: channel Shorts tab.
- [x] `channel.live` Public: channel Live/Streams tab.
- [x] `channel.playlists` Public: channel Playlists tab.
- [x] `channel.community-safe` Public: Community/Posts content is not required as a video-card fixture.
- [x] `channel.featured-sections` Public: featured sections on channel Home use lockup/rich item contracts.

## Live

- [x] `live.current-cards` Public/Auth: live video cards when surfaced in search/home/subscriptions.
- [x] `live.upcoming-cards` Public/Auth: upcoming/scheduled cards when surfaced in feeds.
- [x] `live.archives` Public: archived live videos on channel Live tab.
- [x] `live.chat-safe` Public: live chat and membership UI are not targeted as video thumbnail cards.

## Special Cards

- [x] `special.premiere` Public/Auth: premiere cards follow live/upcoming card checks when present.
- [x] `special.mix` Public: mix cards in search/watch are checked as playlist-like lockups when present.
- [x] `special.podcast` Public: podcast cards are checked as playlist-like lockups when present.
- [x] `special.movie-purchase-safe` Public: movie/purchase/account modules are not required video rows.
- [x] `special.members-only-safe` Public/Auth: members-only or restricted modules must not fail video-card assertions.
- [x] `special.age-restricted-safe` Public/Auth: age/login interstitials are treated as non-video modules.

## Global Behavior

- [x] `global.popup-toggle` Public: popup ON/OFF updates an already-open YouTube page.
- [x] `global.spa-page-class` Public: SPA navigation updates page type classes.
- [x] `global.infinite-scroll` Public/Auth: new cards added after scroll are processed.
- [x] `global.hover-preview-stable` Public: hover previews do not make hidden thumbnails reappear.
- [x] `global.channel-icons-visible` Public/Auth: channel avatars/icons remain visible where present.
- [x] `global.thumbnail-badges-hidden` Public/Auth: duration/live/progress thumbnail badges are hidden.
- [x] `global.required-ui-visible` Public/Auth: titles, metadata, menus, and channel names stay visible.
- [x] `global.logged-out` Public: logged-out/public pages are covered.
- [x] `global.logged-in` Auth: logged-in home/subscriptions/library pages are covered.
- [x] `global.locale-tolerant` Public/Auth: selectors avoid depending on Japanese or English text where possible.
