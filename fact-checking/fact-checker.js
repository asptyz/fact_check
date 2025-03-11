// fact-checker.js - Core fact-checking logic

class FactChecker {
  constructor(apiService) {
    this.apiService = apiService;
    this.resultHistory = [];
    this.maxHistorySize = 100;
    this.onResultsAvailable = null;
  }

  // Set callback for when results are available
  setResultsCallback(callback) {
    if (typeof callback === 'function') {
      this.onResultsAvailable = callback;
    }
  }

  // Check factual claims in text and/or image
  async checkFactualClaims(textContent, imageData = null, timestamp = null) {
    if (!textContent && !imageData) {
      console.warn('No content provided for fact-checking');
      return null;
    }

    try {
      // Ensure API service is available
      if (!this.apiService || !this.apiService.isConfigured()) {
        throw new Error('API service not configured');
      }

      // Call the API service to check facts
      const results = await this.apiService.checkFact(textContent, imageData);

      // Add metadata to results
      const enrichedResults = {
        ...results,
        timestamp: timestamp || Date.now(),
        textContent,
        hasImage: !!imageData
      };

      // Add to history
      this.addToHistory(enrichedResults);

      // Call the callback if set
      if (this.onResultsAvailable && typeof this.onResultsAvailable === 'function') {
        this.onResultsAvailable(enrichedResults);
      }

      return enrichedResults;
    } catch (error) {
      console.error('Error checking factual claims:', error);
      throw error;
    }
  }

  // Add results to history
  addToHistory(results) {
    this.resultHistory.unshift(results);

    // Trim history if it exceeds max size
    if (this.resultHistory.length > this.maxHistorySize) {
      this.resultHistory = this.resultHistory.slice(0, this.maxHistorySize);
    }
  }

  // Get fact-checking history
  getHistory() {
    return this.resultHistory;
  }

  // Clear history
  clearHistory() {
    this.resultHistory = [];
  }

  // Get results for a specific time range
  getResultsForTimeRange(startTime, endTime) {
    return this.resultHistory.filter(result => {
      return result.timestamp >= startTime && result.timestamp <= endTime;
    });
  }

  // Extract most commonly disputed claims
  getTopDisputedClaims(count = 5) {
    // Flatten all claims
    const allClaims = this.resultHistory.flatMap(result => {
      return result.claims ? result.claims : [];
    });

    // Filter to false or partially true claims
    const falseOrPartialClaims = allClaims.filter(claim => {
      const verification = (claim.verification || '').toLowerCase();
      return verification === 'false' || verification.includes('partial');
    });

    // Group similar claims (simplified approach)
    const claimGroups = {};
    falseOrPartialClaims.forEach(claim => {
      const claimText = claim.claim;
      if (!claimGroups[claimText]) {
        claimGroups[claimText] = { claim, count: 1 };
      } else {
        claimGroups[claimText].count++;
      }
    });

    // Convert to array and sort by count
    return Object.values(claimGroups)
      .sort((a, b) => b.count - a.count)
      .slice(0, count);
  }
}

export default FactChecker;
