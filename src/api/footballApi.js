import axios from 'axios';

/**
 * Fetches match data from the backend Express server.
 * 
 * This function sends a GET request to the root endpoint of the backend API.
 * It is typically used to test the connection or retrieve default data.
 * 
 * @returns {Promise<Object>} The response data containing match information.
 * @throws Will throw an error if the request fails.
 */
export const getMatchData = async () => {
  try {
      // Replace this URL with your production endpoint when deploying
      const response = await axios.get('http://localhost:5000/'); 
      return response.data;
  } catch (error) {
      // Log the error for debugging purposes
      console.error('Error retrieving match data:', error);
      throw error; // Re-throw the error to be handled by the caller
  }
};
