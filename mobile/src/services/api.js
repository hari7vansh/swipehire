import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Change this to your machine's IP when testing on physical device
export const API_URL = 'http://172.20.10.2:8000/api';

const MOCK_AUTH_ENABLED = true;

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
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
  login: (username, password) => api.post('/users/login/', { username, password }),
  register: (userData) => api.post('/users/register/', userData),
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