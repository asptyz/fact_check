// api-service.js - Service for communicating with the Gemini API

class GeminiApiService {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.apiEndpoint = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-2.0:generateContent';
  }

  // Set or update API key
  setApiKey(apiKey) {
    this.apiKey = apiKey;
  }

  // Check if API key is configured
  isConfigured() {
    return !!this.apiKey;
  }

  // Send fact-checking request to Gemini
  async checkFact(textContent, imageData = null) {
    if (!this.apiKey) {
      throw new Error('API key not configured');
    }

    // Prepare the request payload
    const requestBody = {
      contents: [
        {
          parts: [
            {
              text: `Fact check the following statement from a YouTube video: "${textContent}". 
                    Determine if it contains verifiable claims, and if so, verify their accuracy. 
                    Provide sources when possible and a confidence score (low, medium, high) for each verification.
                    Format the response as JSON with these fields: 
                    { "claims": [{"claim": "...", "verification": "true/false/partially true/unverifiable", 
                    "explanation": "...", "sources": ["..."], "confidence": "low/medium/high"}] }`
            }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.2,
        topP: 0.8,
        topK: 40
      }
    };

    // Add image data if provided
    if (imageData) {
      requestBody.contents[0].parts.push({
        inlineData: {
          mimeType: 'image/jpeg',
          data: imageData // Base64 encoded image
        }
      });
    }

    try {
      const response = await fetch(`${this.apiEndpoint}?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API error: ${response.status} - ${errorText}`);
      }

      const responseData = await response.json();
      
      // Extract and process the response
      if (responseData.candidates && responseData.candidates.length > 0) {
        const textResponse = responseData.candidates[0].content.parts[0].text;
        
        // Parse JSON from the response
        try {
          return JSON.parse(textResponse);
        } catch (e) {
          // If JSON parsing fails, return the raw text
          return { rawResponse: textResponse };
        }
      } else {
        throw new Error('No response from Gemini API');
      }
    } catch (error) {
      console.error('Error communicating with Gemini API:', error);
      throw error;
    }
  }
}

// Export the service
export default GeminiApiService;
