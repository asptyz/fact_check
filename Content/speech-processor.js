// speech-processor.js - Handles speech-to-text processing

class SpeechProcessor {
  constructor() {
    this.recognition = null;
    this.isSupported = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
    this.isProcessing = false;
    this.transcript = '';
    this.onTranscriptUpdate = null;
  }

  // Initialize speech recognition
  initialize() {
    if (!this.isSupported) {
      console.warn('Speech recognition is not supported in this browser');
      return false;
    }

    // Create speech recognition instance
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    this.recognition = new SpeechRecognition();
    
    // Configure speech recognition
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = 'en-US'; // Default to English
    
    // Set up event handlers
    this.recognition.onresult = this.handleRecognitionResult.bind(this);
    this.recognition.onerror = this.handleRecognitionError.bind(this);
    this.recognition.onend = this.handleRecognitionEnd.bind(this);
    
    return true;
  }

  // Start speech recognition
  start() {
    if (!this.isSupported || !this.recognition) {
      if (!this.initialize()) {
        return false;
      }
    }

    try {
      this.recognition.start();
      this.isProcessing = true;
      this.transcript = '';
      console.log('Speech recognition started');
      return true;
    } catch (error) {
      console.error('Error starting speech recognition:', error);
      return false;
    }
  }

  // Stop speech recognition
  stop() {
    if (this.recognition && this.isProcessing) {
      try {
        this.recognition.stop();
        this.isProcessing = false;
        console.log('Speech recognition stopped');
        return true;
      } catch (error) {
        console.error('Error stopping speech recognition:', error);
        return false;
      }
    }
    return false;
  }

  // Set callback for transcript updates
  setTranscriptCallback(callback) {
    if (typeof callback === 'function') {
      this.onTranscriptUpdate = callback;
    }
  }

  // Handle speech recognition results
  handleRecognitionResult(event) {
    let interimTranscript = '';
    let finalTranscript = '';

    for (let i = event.resultIndex; i < event.results.length; ++i) {
      if (event.results[i].isFinal) {
        finalTranscript += event.results[i][0].transcript;
      } else {
        interimTranscript += event.results[i][0].transcript;
      }
    }

    // Update transcript
    if (finalTranscript) {
      this.transcript += finalTranscript + ' ';
      
      // Call callback if set
      if (this.onTranscriptUpdate) {
        this.onTranscriptUpdate(this.transcript, finalTranscript);
      }
    }
  }

  // Handle speech recognition errors
  handleRecognitionError(event) {
    console.error('Speech recognition error:', event.error);
    this.isProcessing = false;
    
    // Attempt to restart if not a fatal error
    if (event.error !== 'aborted' && event.error !== 'not-allowed') {
      setTimeout(() => {
        if (this.recognition) {
          this.start();
        }
      }, 1000);
    }
  }

  // Handle speech recognition end
  handleRecognitionEnd() {
    console.log('Speech recognition ended');
    this.isProcessing = false;
    
    // Restart recognition if it stopped unexpectedly
    if (this.isProcessing) {
      this.start();
    }
  }

  // Get current transcript
  getTranscript() {
    return this.transcript;
  }

  // Clear transcript
  clearTranscript() {
    this.transcript = '';
  }
}

export default SpeechProcessor;
