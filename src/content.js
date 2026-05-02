(function () {
  const core = globalThis.SimpleYouTubeCore;
  const storageKey = "enabled";
  let enabled = true;
  let scheduled = false;

  core.setEnabledClass(document, enabled);

  function apply(rootNode) {
    core.setEnabledClass(document, enabled);
    core.setPageTypeClass(document, globalThis.location);
    core.setChannelTabClass(document, globalThis.location);

    if (enabled) {
      core.markProcessed(rootNode || document.documentElement);
    }
  }

  function scheduleApply(rootNode) {
    if (scheduled) {
      return;
    }

    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      apply(rootNode);
    });
  }

  function readInitialState() {
    if (!globalThis.chrome?.storage?.local) {
      apply(document.documentElement);
      return;
    }

    chrome.storage.local.get({ [storageKey]: true }, (result) => {
      enabled = core.getStoredEnabled(result);
      apply(document.documentElement);
    });
  }

  function observePage() {
    const observer = new MutationObserver((mutations) => {
      if (!enabled) {
        return;
      }

      const addedElement = mutations
        .flatMap((mutation) => Array.from(mutation.addedNodes))
        .find((node) => node.nodeType === Node.ELEMENT_NODE);

      if (addedElement) {
        scheduleApply(addedElement);
      }
    });

    observer.observe(document.documentElement, {
      childList: true,
      subtree: true
    });
  }

  if (globalThis.chrome?.storage?.onChanged) {
    chrome.storage.onChanged.addListener((changes, areaName) => {
      if (areaName !== "local" || !changes[storageKey]) {
        return;
      }

      enabled = core.getStoredEnabled({ enabled: changes[storageKey].newValue });
      apply(document.documentElement);
    });
  }

  readInitialState();
  observePage();
})();
