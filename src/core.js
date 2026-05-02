(function (root, factory) {
  const api = factory();

  if (typeof module === "object" && module.exports) {
    module.exports = api;
    return;
  }

  root.SimpleYouTubeCore = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  const ENABLED_CLASS = "simple-youtube-enabled";
  const PAGE_CLASS_PREFIX = "simple-youtube-page-";
  const PROCESSED_ATTR = "data-simple-youtube-processed";
  const RENDERER_SELECTOR = [
    "ytd-video-renderer",
    "ytd-rich-item-renderer",
    "ytd-compact-video-renderer",
    "ytd-grid-video-renderer",
    "ytd-playlist-video-renderer",
    "ytd-reel-item-renderer",
    "yt-lockup-view-model",
    "ytm-shorts-lockup-view-model"
  ].join(", ");
  const THUMBNAIL_CONTAINER_SELECTOR = [
    "ytd-thumbnail",
    "yt-thumbnail-view-model",
    "a#thumbnail",
    ".ytLockupViewModelContentImage",
    ".shortsLockupViewModelHostThumbnailParentContainer"
  ].join(", ");
  const THUMBNAIL_MEDIA_SELECTOR = [
    "img",
    "picture",
    "video",
    "yt-image",
    "yt-img-shadow",
    ".yt-core-image",
    ".ytCoreImageHost"
  ].join(", ");

  function isShortsUrl(value) {
    if (!value || typeof value !== "string") {
      return false;
    }

    try {
      const url = new URL(value, "https://www.youtube.com");
      return url.hostname.endsWith("youtube.com") && url.pathname.startsWith("/shorts/");
    } catch (_error) {
      return false;
    }
  }

  function getStoredEnabled(storageValue) {
    if (!storageValue || typeof storageValue.enabled !== "boolean") {
      return true;
    }

    return storageValue.enabled;
  }

  function setEnabledClass(documentRef, enabled) {
    if (!documentRef || !documentRef.documentElement) {
      return;
    }

    documentRef.documentElement.classList.toggle(ENABLED_CLASS, Boolean(enabled));
  }

  function getPageType(locationLike) {
    const pathname = locationLike?.pathname || "/";

    if (pathname === "/" || pathname === "") {
      return "home";
    }

    if (pathname === "/results") {
      return "search";
    }

    if (pathname === "/watch") {
      return "watch";
    }

    if (pathname.startsWith("/shorts/")) {
      return "shorts";
    }

    if (pathname.startsWith("/feed/subscriptions")) {
      return "subscriptions";
    }

    if (pathname.startsWith("/feed/you")) {
      return "you";
    }

    if (pathname.startsWith("/feed/history")) {
      return "history";
    }

    if (pathname.startsWith("/@") || pathname.startsWith("/channel/") || pathname.startsWith("/c/")) {
      return "channel";
    }

    if (pathname === "/playlist") {
      return "playlist";
    }

    return "other";
  }

  function setPageTypeClass(documentRef, locationLike) {
    if (!documentRef || !documentRef.documentElement) {
      return;
    }

    const pageType = getPageType(locationLike);
    const classList = documentRef.documentElement.classList;

    Array.from(classList)
      .filter((className) => className.startsWith(PAGE_CLASS_PREFIX))
      .forEach((className) => classList.remove(className));

    classList.add(`${PAGE_CLASS_PREFIX}${pageType}`);
  }

  function markProcessed(rootNode) {
    if (!rootNode || rootNode.nodeType !== 1) {
      return 0;
    }

    const elements = [];

    if (isProcessableElement(rootNode)) {
      elements.push(rootNode);
    }

    rootNode.querySelectorAll?.(RENDERER_SELECTOR).forEach((element) => elements.push(element));

    elements.forEach((element) => {
      element.setAttribute(PROCESSED_ATTR, "true");
      if (Array.from(element.querySelectorAll?.("a[href]") || []).some((anchor) => isShortsUrl(anchor.getAttribute("href")))) {
        element.setAttribute("data-simple-youtube-shorts", "true");
      }
    });

    return elements.length;
  }

  function isProcessableElement(element) {
    return element.matches?.(RENDERER_SELECTOR);
  }

  function getThumbnailContainers(rootNode) {
    return Array.from(rootNode?.querySelectorAll?.(scopeSelector(RENDERER_SELECTOR, THUMBNAIL_CONTAINER_SELECTOR)) || []);
  }

  function getThumbnailMedia(rootNode) {
    return getThumbnailContainers(rootNode).flatMap((container) => {
      const media = [];

      if (container.matches?.(THUMBNAIL_MEDIA_SELECTOR)) {
        media.push(container);
      }

      media.push(...Array.from(container.querySelectorAll?.(THUMBNAIL_MEDIA_SELECTOR) || []));
      return media;
    });
  }

  function scopeSelector(parentSelector, childSelector) {
    const parents = parentSelector.split(",").map((selector) => selector.trim());
    const children = childSelector.split(",").map((selector) => selector.trim());

    return parents
      .flatMap((parent) => children.map((child) => `${parent} ${child}`))
      .join(", ");
  }

  return {
    ENABLED_CLASS,
    PAGE_CLASS_PREFIX,
    PROCESSED_ATTR,
    RENDERER_SELECTOR,
    THUMBNAIL_CONTAINER_SELECTOR,
    THUMBNAIL_MEDIA_SELECTOR,
    getThumbnailContainers,
    getThumbnailMedia,
    getStoredEnabled,
    getPageType,
    isShortsUrl,
    markProcessed,
    setPageTypeClass,
    setEnabledClass
  };
});
