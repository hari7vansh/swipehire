import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Enable mock data by default to make development easier
const MOCK_AUTH_ENABLED = true;

// Use a consistent localhost URL - this won't connect on physical devices but mock data will work
export const API_URL = 'http://10.36.63.63:8000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  // Add a timeout to prevent long waits on failed connections
  timeout: 5000
});

// Add a request interceptor to include the token in all requests
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Token ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

const mockAuth = {
  login: async (username, password) => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    if (username === 'recruiter' && password === 'password123') {
      return {
        data: {
          token: 'ca9db1703a90cb560cddd1fe518d236b3c6010aa',
          user_id: 1,
          user_type: 'recruiter',
          username: 'recruiter'
        }
      };
    } else if (username === 'jobseeker' && password === 'password123') {
      return {
        data: {
          token: 'ff70777824a6bbb0b33d4f79c0b3a7b484525090',
          user_id: 2,
          user_type: 'job_seeker',
          username: 'jobseeker'
        }
      };
    } else {
      throw {
        response: {
          data: {
            error: 'Invalid credentials'
          }
        }
      };
    }
  }
};

export const authAPI = {
  login: (username, password) => {
    if (MOCK_AUTH_ENABLED) {
      return mockAuth.login(username, password);
    }
    return api.post('/users/login/', { username, password });
  },
  register: (userData) => {
    if (MOCK_AUTH_ENABLED) {
      // Mock successful registration
      return Promise.resolve({
        data: {
          token: 'mock-token-for-registration',
          user_id: 999,
          user_type: userData.user_type,
          username: userData.username
        }
      });
    }
    return api.post('/users/register/', userData);
  },
  getProfile: () => api.get('/users/profiles/'),
};

export const jobsAPI = {
  getJobs: () => api.get('/jobs/jobs/'),
  getJob: (id) => api.get(`/jobs/jobs/${id}/`),
  createJob: (jobData) => api.post('/jobs/jobs/', jobData),
  updateJob: (id, jobData) => api.put(`/jobs/jobs/${id}/`, jobData),
};

export const matchingAPI = {
  swipe: (swipeData) => api.post('/matching/swipe/', swipeData),
  getMatches: () => api.get('/matching/matches/'),
  getMessages: (matchId) => api.get(`/matching/messages/?match_id=${matchId}`),
  sendMessage: (messageData) => api.post('/matching/messages/', messageData),
};

export default api;