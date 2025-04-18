const axios = require('axios');

// Wit.ai endpoint for processing natural language queries
const WIT_API_URL = 'https://api.wit.ai/message';

// Wit.ai API access token for authentication (Bearer Token)
const WIT_ACCESS_TOKEN = 'JZ2ZMVQZDRTJ27BN7VKPXN5EW32IZGZT';

/**
 * Sends a message to Wit.ai for natural language processing
 * and returns the parsed response containing intents and entities.
 * 
 * @param {string} message - User input to analyze
 * @returns {Promise<object>} - Parsed response from Wit.ai
 * @throws {Error} - Throws error if the API call fails
 */
const getWitResponse = async (message) => {
  try {
    const response = await axios.get(WIT_API_URL, {
      params: { q: message },
      headers: { Authorization: `Bearer ${WIT_ACCESS_TOKEN}` }
    });
    return response.data;
  } catch (error) {
    console.error('Error calling Wit.ai API:', error);
    throw new Error('Error processing message');
  }
};

// Export the NLP function to be used in other modules
module.exports = { getWitResponse };
