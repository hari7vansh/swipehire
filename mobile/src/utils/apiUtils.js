import api, { API_URL } from '../services/api';

export const checkApiConnection = async () => {
  try {
    // Try to reach the server with a simple request
    await api.get('/users/login/', { timeout: 5000 });
    return {
      success: true,
      message: 'Connected to API'
    };
  } catch (error) {
    if (error.code === 'ECONNABORTED') {
      return {
        success: false,
        message: `Connection timed out. Check that your server is running and accessible at ${API_URL}`
      };
    } else if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      return {
        success: true, // Server is reachable even if it returns an error
        message: 'API server is reachable'
      };
    } else if (error.request) {
      // The request was made but no response was received
      return {
        success: false,
        message: `Cannot connect to API at ${API_URL}. Make sure your backend is running and accessible.`
      };
    } else {
      // Something happened in setting up the request that triggered an Error
      return {
        success: false,
        message: `Error connecting to API: ${error.message}`
      };
    }
  }
};