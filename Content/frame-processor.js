// frame-processor.js - Handles video frame extraction and processing

class FrameProcessor {
  constructor() {
    this.canvas = document.createElement('canvas');
    this.context = this.canvas.getContext('2d');
    this.processingInterval = null;
    this.onFrameExtracted = null;
    this.frameRate = 1; // Extract 1 frame per second by default
    this.isProcessing = false;
  }

  // Start processing frames from video element
  startProcessing(videoElement, frameRate = 1) {
    if (!videoElement || !(videoElement instanceof HTMLVideoElement)) {
      console.error('Invalid video element provided');
      return false;
    }

    // Update frame rate
    this.frameRate = frameRate;

    // Stop any existing processing
    this.stopProcessing();

    // Set canvas dimensions to match video
    this.updateCanvasDimensions(videoElement);

    // Start processing frames
    const intervalMs = Math.floor(1000 / this.frameRate);
    this.processingInterval = setInterval(() => {
      this.extractFrame(videoElement);
    }, intervalMs);

    this.isProcessing = true;
    return true;
  }

  // Stop processing frames
  stopProcessing() {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }
    this.isProcessing = false;
  }

  // Extract a single frame from the video element
  extractFrame(videoElement) {
    if (!videoElement || videoElement.paused || videoElement.ended) {
      return null;
    }

    try {
      // Update canvas dimensions if video size has changed
      this.updateCanvasDimensions(videoElement);

      // Draw the current frame to the canvas
      this.context.drawImage(videoElement, 0, 0, this.canvas.width, this.canvas.height);

      // Get base64 data URL
      const imageData = this.canvas.toDataURL('image/jpeg', 0.8);
      const base64Data = imageData.split(',')[1];

      // Call the callback if set
      if (this.onFrameExtracted && typeof this.onFrameExtracted === 'function') {
        this.onFrameExtracted(base64Data, videoElement.currentTime);
      }

      return base64Data;
    } catch (error) {
      console.error('Error extracting video frame:', error);
      return null;
    }
  }

  // Update canvas dimensions to match video
  updateCanvasDimensions(videoElement) {
    if (this.canvas.width !== videoElement.videoWidth || 
        this.canvas.height !== videoElement.videoHeight) {
      this.canvas.width = videoElement.videoWidth;
      this.canvas.height = videoElement.videoHeight;
    }
  }

  // Set callback for frame extraction
  setFrameCallback(callback) {
    if (typeof callback === 'function') {
      this.onFrameExtracted = callback;
    }
  }

  // Check if processing is active
  isActive() {
    return this.isProcessing;
  }

  // Get a downsized frame to reduce data size
  getDownsizedFrame(videoElement, maxWidth = 640, maxHeight = 480) {
    if (!videoElement || videoElement.paused || videoElement.ended) {
      return null;
    }

    try {
      // Create a temporary canvas for downscaling
      const tempCanvas = document.createElement('canvas');
      const tempContext = tempCanvas.getContext('2d');

      // Calculate new dimensions while maintaining aspect ratio
      let newWidth = videoElement.videoWidth;
      let newHeight = videoElement.videoHeight;

      if (newWidth > maxWidth) {
        const ratio = maxWidth / newWidth;
        newWidth = maxWidth;
        newHeight = Math.floor(newHeight * ratio);
      }

      if (newHeight > maxHeight) {
        const ratio = maxHeight / newHeight;
        newHeight = maxHeight;
        newWidth = Math.floor(newWidth * ratio);
      }

      // Set canvas dimensions
      tempCanvas.width = newWidth;
      tempCanvas.height = newHeight;

      // Draw the current frame with downscaling
      tempContext.drawImage(videoElement, 0, 0, newWidth, newHeight);

      // Get base64 data URL
      const imageData = tempCanvas.toDataURL('image/jpeg', 0.7);
      return imageData.split(',')[1];
    } catch (error) {
      console.error('Error extracting downsized video frame:', error);
      return null;
    }
  }
}

export default FrameProcessor;
