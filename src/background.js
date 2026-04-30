chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get({ enabled: true }, (result) => {
    if (typeof result.enabled !== "boolean") {
      chrome.storage.local.set({ enabled: true });
    }
  });
});

