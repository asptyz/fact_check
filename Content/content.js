// content.js - Main script that runs on YouTube pages

// Global state
const state = {
  isEnabled: true,
  isVideoPlaying: false,
  currentVideo: null,
  processingInterval: null,
  transcriptChunks: [],
  videoFrames: [],
  factCheckResults: [],
  processingFrequency: 5000, // Process every 5 seconds
  overlayVisible: true
};

// Initialize when the page is fully loaded
window.addEventListener('load', initializeFactChecker);

// Initialize fact checker
function initializeFactChecker() {
  console.log('Initializing YouTube Fact-Checker');
  
  // Check if we're on a YouTube video page
  if (window.location.hostname.includes('youtube.com') && window.location.pathname.includes('/watch')) {
    setupVideoObserver();
    injectUI();
    setupEventListeners();
    
    // Start monitoring if a video is already playing
    const video = document.querySelector('video');
    if (video) {
      state.currentVideo = video;
      startMonitoring();
    }
  }
}

// Set up MutationObserver to detect when a new video loads
function setupVideoObserver() {
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.addedNodes) {
        const video = document.querySelector('video');
        if (video && video !== state.currentVideo) {
          state.currentVideo = video;
          startMonitoring();
        }
      }
    }
  });
  
  observer.observe(document.body, { childList: true, subtree: true });
}

// Start monitoring video content
function startMonitoring() {
  if (!state.currentVideo || !state.isEnabled) return;
  
  // Stop any existing processing
  stopMonitoring();
  
  // Set up event listeners for the video
  state.currentVideo.addEventListener('play', handleVideoPlay);
  state.currentVideo.addEventListener('pause', handleVideoPause);
  
  // If video is already playing, start processing
  if (!state.currentVideo.paused) {
    handleVideoPlay();
  }
}

// Stop monitoring video content
function stopMonitoring() {
  if (state.processingInterval) {
    clearInterval(state.processingInterval);
    state.processingInterval = null;
  }
  
  if (state.currentVideo) {
    state.currentVideo.removeEventListener('play', handleVideoPlay);
    state.currentVideo.removeEventListener('pause', handleVideoPause);
  }
  
  state.isVideoPlaying = false;
}

// Handle video play event
function handleVideoPlay() {
  state.isVideoPlaying = true;
  
  // Start processing content at regular intervals
  state.processingInterval = setInterval(() => {
    processVideoContent();
  }, state.processingFrequency);
  
  // Also process immediately when play starts
  processVideoContent();
}

// Handle video pause event
function handleVideoPause() {
  state.isVideoPlaying = false;
  if (state.processingInterval) {
    clearInterval(state.processingInterval);
    state.processingInterval = null;
  }
}

// Process video content (audio and visual)
async function processVideoContent() {
  if (!state.currentVideo || !state.isVideoPlaying) return;
  
  try {
    // Capture the current frame
    const frameData = await captureVideoFrame(state.currentVideo);
    
    // Attempt to get transcript from YouTube
    const transcriptSegment = await getYouTubeTranscript(state.currentVideo.currentTime);
    
    // If we don't have a transcript, we'll need to use speech recognition
    // For this demo, we'll focus on using YouTube's transcript when available
    
    // If we have content to check, send it to the background script
    if (transcriptSegment || frameData) {
      chrome.runtime.sendMessage({
        action: 'checkFact',
        data: {
          textContent: transcriptSegment || '',
          imageData: frameData,
          timestamp: state.currentVideo.currentTime
        }
      }, response => {
        if (response && response.success) {
          // Process and display the fact-checking results
          processFactCheckResults(response.result, state.currentVideo.currentTime);
        } else {
          console.error('Fact-checking failed:', response ? response.error : 'Unknown error');
        }
      });
    }
  } catch (error) {
    console.error('Error processing video content:', error);
  }
}

// Capture the current video frame as base64 data
function captureVideoFrame(videoElement) {
  return new Promise((resolve, reject) => {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = videoElement.videoWidth;
      canvas.height = videoElement.videoHeight;
      
      const ctx = canvas.getContext('2d');
      ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
      
      // Convert to base64
      const base64Data = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
      resolve(base64Data);
    } catch (error) {
      console.error('Error capturing video frame:', error);
      reject(error);
    }
  });
}

// Attempt to get transcript from YouTube's built-in transcript feature
// Note: This is a simplified implementation. YouTube doesn't provide direct API access to transcripts,
// so this would need to be enhanced with more robust methods in a production extension.
function getYouTubeTranscript(currentTime) {
  return new Promise((resolve) => {
    // For this proof of concept, we'll simulate getting the transcript
    // In a real implementation, this would need to access YouTube's transcript data
    
    // Try to find transcript container
    const transcriptElements = document.querySelectorAll('yt-formatted-string.ytd-transcript-segment-renderer');
    
    if (transcriptElements.length > 0) {
      // Find the transcript segment closest to the current time
      // This would need a more sophisticated implementation in reality
      const text = Array.from(transcriptElements)
        .slice(0, 3) // Take a few recent segments
        .map(el => el.textContent)
        .join(' ');
      
      resolve(text);
    } else {
      // If no transcript is available
      resolve(null);
    }
  });
}

// Process and display fact-checking results
function processFactCheckResults(results, timestamp) {
  if (!results || !results.claims) return;
  
  // Add timestamp to each result
  const timestampedResults = {
    ...results,
    timestamp,
    videoTime: formatTime(timestamp)
  };
  
  // Add to our results array
  state.factCheckResults.push(timestampedResults);
  
  // Update the UI with the new results
  updateFactCheckUI(timestampedResults);
}

// Update the UI with fact-checking results
function updateFactCheckUI(results) {
  const overlay = document.getElementById('fact-checker-overlay');
  if (!overlay) return;
  
  const resultContainer = document.createElement('div');
  resultContainer.className = 'fact-result-item';
  
  // Create timestamp indicator
  const timeStamp = document.createElement('div');
  timeStamp.className = 'fact-timestamp';
  timeStamp.textContent = results.videoTime;
  resultContainer.appendChild(timeStamp);
  
  // Process each claim
  results.claims.forEach(claim => {
    const claimEl = document.createElement('div');
    claimEl.className = `fact-claim ${getVerificationClass(claim.verification)}`;
    
    const claimText = document.createElement('div');
    claimText.className = 'claim-text';
    claimText.textContent = claim.claim;
    claimEl.appendChild(claimText);
    
    const verificationEl = document.createElement('div');
    verificationEl.className = 'verification-result';
    verificationEl.textContent = `${claim.verification.toUpperCase()} (${claim.confidence} confidence)`;
    claimEl.appendChild(verificationEl);
    
    const explanationEl = document.createElement('div');
    explanationEl.className = 'claim-explanation';
    explanationEl.textContent = claim.explanation;
    claimEl.appendChild(explanationEl);
    
    // Add sources if available
    if (claim.sources && claim.sources.length > 0) {
      const sourcesEl = document.createElement('div');
      sourcesEl.className = 'claim-sources';
      sourcesEl.innerHTML = '<strong>Sources:</strong> ';
      sourcesEl.innerHTML += claim.sources.join(', ');
      claimEl.appendChild(sourcesEl);
    }
    
    resultContainer.appendChild(claimEl);
  });
  
  // Add the new result to the overlay
  const resultsContainer = overlay.querySelector('.fact-results-container');
  resultsContainer.appendChild(resultContainer);
  
  // Ensure we don't overflow with too many results
  while (resultsContainer.children.length > 5) {
    resultsContainer.removeChild(resultsContainer.firstChild);
  }
  
  // Make overlay visible
  overlay.style.display = 'block';
}

// Helper function to get CSS class based on verification result
function getVerificationClass(verification) {
  verification = verification.toLowerCase();
  if (verification === 'true') return 'verification-true';
  if (verification === 'false') return 'verification-false';
  if (verification.includes('partially')) return 'verification-partial';
  return 'verification-unknown';
}

// Helper function to format time in MM:SS format
function formatTime(timeInSeconds) {
  const minutes = Math.floor(timeInSeconds / 60);
  const seconds = Math.floor(timeInSeconds % 60);
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

// Inject UI elements
function injectUI() {
  // Create overlay container
  const overlay = document.createElement('div');
  overlay.id = 'fact-checker-overlay';
  overlay.className = 'fact-checker-overlay';
  
  // Add header with controls
  const header = document.createElement('div');
  header.className = 'fact-checker-header';
  
  const title = document.createElement('div');
  title.className = 'fact-checker-title';
  title.textContent = 'Gemini Fact-Checker';
  header.appendChild(title);
  
  const controls = document.createElement('div');
  controls.className = 'fact-checker-controls';
q
  
  header.appendChild(controls);
  overlay.appendChild(header);
  
  // Add results container
  const resultsContainer = document.createElement('div');
  resultsContainer.className = 'fact-results-container';
  overlay.appendChild(resultsContainer);
  
  // Append to document
  document.body.appendChild(overlay);
  
  // Add styles
  addStyles();
}

// Add required CSS
function addStyles() {
  const style = document.createElement('style');
  style.textContent = `
    .fact-checker-overlay {
      position: fixed;
      top: 70px;
      right: 20px;
      width: 350px;
      max-height: 80vh;
      background-color: rgba(0, 0, 0, 0.8);
      color: white;
      border-radius: 8px;
      z-index: 9999;
      font-family: Roboto, Arial, sans-serif;
      display: none;
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
      overflow: hidden;
      transition: all 0.3s ease;
    }
    
    .fact-checker-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 15px;
      background-color: #0078D4;
      border-bottom: 1px solid rgba(255, 255, 255, 0.2);
    }
    
    .fact-checker-title {
      font-weight: bold;
      font-size: 16px;
    }
    
    .fact-checker-controls button {
      background-color: rgba(255, 255, 255, 0.2);
      border: none;
      color: white;
      padding: 5px 10px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 12px;
    }
    
    .fact-results-container {
      padding: 10px;
      max-height: calc(80vh - 50px);
      overflow-y: auto;
    }
    
    .fact-result-item {
      margin-bottom: 15px;
      padding-bottom: 15px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }
    
    .fact-timestamp {
      font-size: 12px;
      color: #BBB;
      margin-bottom: 5px;
    }
    
    .fact-claim {
      background-color: rgba(255, 255, 255, 0.1);
      padding: 10px;
      border-radius: 4px;
      margin-bottom: 10px;
    }
    
    .claim-text {
      font-weight: bold;
      margin-bottom: 5px;
    }
    
    .verification-result {
      font-size: 12px;
      font-weight: bold;
      padding: 3px 6px;
      border-radius: 3px;
      display: inline-block;
      margin-bottom: 5px;
    }
    
    .verification-true {
      border-left: 4px solid #4CAF50;
    }
    
    .verification-true .verification-result {
      background-color: #4CAF50;
    }
    
    .verification-false {
      border-left: 4px solid #F44336;
    }
    
    .verification-false .verification-result {
      background-color: #F44336;
    }
    
    .verification-partial {
      border-left: 4px solid #FF9800;
    }
    
    .verification-partial .verification-result {
      background-color: #FF9800;
    }
    
    .verification-unknown {
      border-left: 4px solid #9E9E9E;
    }
    
    .verification-unknown .verification-result {
      background-color: #9E9E9E;
    }
    
    .claim-explanation {
      font-size: 14px;
      margin-bottom: 5px;
    }
    
    .claim-sources {
      font-size: 12px;
      color: #BBB;
    }
  `;
  document.head.appendChild(style);
}

// Set up event listeners for UI controls
function setupEventListeners() {
  // Add event listener for toggle button
  document.addEventListener('click', (event) => {
    if (event.target.id === 'toggle-fact-checker') {
      state.isEnabled = !state.isEnabled;
      event.target.textContent = state.isEnabled ? 'Disable' : 'Enable';
      
      if (state.isEnabled) {
        startMonitoring();
      } else {
        stopMonitoring();
      }
    }
  });
}