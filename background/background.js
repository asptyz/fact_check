chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
  if (request.action === "fact_check") {
    const apiKey = "YOUR_GEMINI_FLASH_API_KEY"; // Replace with actual API key
    const response = await fetch("https://api.gemini.com/v1/fact-check", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
      body: JSON.stringify({ text: request.text })
    });
    const data = await response.json();
    sendResponse({ result: data.result });
  }
  return true;
});