document.getElementById("toggle").addEventListener("click", () => {
  chrome.storage.local.get(["enabled"], (result) => {
    let enabled = !result.enabled;
    chrome.storage.local.set({ enabled });
    document.getElementById("toggle").innerText = enabled ? "Disable Fact Checking" : "Enable Fact Checking";
  });
});