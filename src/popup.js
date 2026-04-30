(function () {
  const storageKey = "enabled";
  const toggle = document.getElementById("enabled-toggle");

  function setToggle(value) {
    toggle.checked = Boolean(value);
  }

  chrome.storage.local.get({ [storageKey]: true }, (result) => {
    setToggle(result[storageKey]);
  });

  toggle.addEventListener("change", () => {
    chrome.storage.local.set({ [storageKey]: toggle.checked });
  });
})();

