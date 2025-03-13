# YouTube Checker Extension

This is a **Chrome extension** that performs **fact-checking** on YouTube videos using **Gemini Flash 2.0**.

## Features
Extracts live captions from YouTube videos.  
Sends extracted text to Gemini Flash 2.0 for fact-checking.  
Displays fact-checking results as an overlay on the video.  

## Installation Guide

1. **Download and extract the ZIP file.**
2. Open **Google Chrome** and go to `chrome://extensions/`.
3. Enable **Developer Mode** (toggle in the top right).
4. Click **Load Unpacked** and select the extracted folder.
5. The extension will now be installed and ready to use.

## How It Works

- The extension **extracts captions** from YouTube videos in real-time.
- It **sends the extracted text** to the Gemini Flash 2.0 API for fact-checking.
- The **fact-check results are displayed** as an overlay on the video.

## Configuration

1. Open `background.js` and **replace** `YOUR_GEMINI_FLASH_API_KEY` with your actual API key.
2. Reload the extension after making changes.

## Files Overview


## Usage

1. Open any **YouTube video**.
2. Click on the extension icon and **enable fact-checking**.
3. The extension will automatically **fact-check subtitles** in real time.

## Notes
- This extension works best with videos that have **auto-generated or manual captions** enabled.
- The Gemini Flash 2.0 API key is required for fact-checking.
- Ensure your API key has the necessary permissions to perform fact-checking.

## License
This project is open-source and free to use.
