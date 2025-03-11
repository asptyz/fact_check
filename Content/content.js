function getCaptions() {
  let captions = document.querySelector(".ytp-caption-segment");
  return captions ? captions.innerText : "";
}

function checkFact() {
  let text = getCaptions();
  if (text) {
    chrome.runtime.sendMessage({ action: "fact_check", text: text }, (response) => {
      displayFactCheck(response.result);
    });
  }
}

function displayFactCheck(result) {
  let overlay = document.getElementById("fact-check-overlay");
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.id = "fact-check-overlay";
    document.body.appendChild(overlay);
  }
  overlay.innerText = result;
}

setInterval(checkFact, 5000);