(function (root, factory) {
  const api = factory();

  if (typeof module === "object" && module.exports) {
    module.exports = api;
    return;
  }

  root.SimpleYouTubeCore = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  const ENABLED_CLASS = "simple-youtube-enabled";
  const PROCESSED_ATTR = "data-simple-youtube-processed";

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

  function markProcessed(rootNode) {
    if (!rootNode || rootNode.nodeType !== 1) {
      return 0;
    }

    const elements = [];

    if (isProcessableElement(rootNode)) {
      elements.push(rootNode);
    }

    rootNode
      .querySelectorAll?.("ytd-video-renderer, ytd-rich-item-renderer, ytd-compact-video-renderer, ytd-grid-video-renderer, ytd-playlist-video-renderer, ytd-reel-item-renderer, yt-lockup-view-model, ytm-shorts-lockup-view-model")
      .forEach((element) => elements.push(element));

    elements.forEach((element) => {
      element.setAttribute(PROCESSED_ATTR, "true");
      if (Array.from(element.querySelectorAll?.("a[href]") || []).some((anchor) => isShortsUrl(anchor.getAttribute("href")))) {
        element.setAttribute("data-simple-youtube-shorts", "true");
      }
    });

    return elements.length;
  }

  function isProcessableElement(element) {
    return element.matches?.(
      "ytd-video-renderer, ytd-rich-item-renderer, ytd-compact-video-renderer, ytd-grid-video-renderer, ytd-playlist-video-renderer, ytd-reel-item-renderer, yt-lockup-view-model, ytm-shorts-lockup-view-model"
    );
  }

  return {
    ENABLED_CLASS,
    PROCESSED_ATTR,
    getStoredEnabled,
    isShortsUrl,
    markProcessed,
    setEnabledClass
  };
});

