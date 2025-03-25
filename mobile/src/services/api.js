import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Enable mock data by default to make development easier
const MOCK_AUTH_ENABLED = true;

// Set the API URL - change to your server address
// For iOS simulator, use localhost
// For Android emulator, use 10.0.2.2
// For a physical device, use your computer's local IP address or public API endpoint
export const API_URL = Platform.OS === 'ios' 
  ? 'http://localhost:8000/api' 
  : 'http://10.0.2.2:8000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  // Add a timeout to prevent long waits on failed connections
  timeout: 8000
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

// Add a response interceptor to handle common errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    // Handle 401 Unauthorized - usually means token expired
    if (error.response && error.response.status === 401) {
      // Clear token and redirect to login
      await AsyncStorage.removeItem('token');
      // Navigation will happen through App.js token check
    }
    return Promise.reject(error);
  }
);

// Mock auth implementations for development
const mockAuth = {
  login: async (username, password) => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
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
  },
  
  register: async (userData) => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1200));
    
    // Simulate validation
    if (!userData.username || !userData.email || !userData.password) {
      throw {
        response: {
          data: {
            error: 'Missing required fields'
          }
        }
      };
    }
    
    // Mock successful registration
    return {
      data: {
        token: 'mock-token-for-registration-' + Math.random().toString(36).substring(2, 10),
        user_id: Math.floor(Math.random() * 1000) + 1,
        user_type: userData.user_type,
        username: userData.username
      }
    };
  }
};

// Mock matching implementations
const mockMatching = {
  getMatches: async () => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Return sample matches
    return {
      data: [
        {
          id: 101,
          job: {
            id: 1,
            title: "Frontend Developer",
            recruiter: {
              company_name: "Tech Innovations Inc.",
            },
          },
          job_seeker: {
            profile: {
              user: {
                first_name: "Alex",
                last_name: "Johnson",
              },
              profile_picture: null
            }
          },
          created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          last_message: "Hi Alex, I'd like to schedule an interview. Are you available next week?",
          unread_count: 1
        },
        {
          id: 102,
          job: {
            id: 3,
            title: "Mobile Developer",
            recruiter: {
              company_name: "AppWorks Studios",
            },
          },
          job_seeker: {
            profile: {
              user: {
                first_name: "Sarah",
                last_name: "Williams",
              },
              profile_picture: null
            }
          },
          created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          last_message: "Thanks for your application. Your skills are impressive!",
          unread_count: 0
        },
        {
          id: 103,
          job: {
            id: 4,
            title: "UX/UI Designer",
            recruiter: {
              company_name: "Creative Solutions",
            },
          },
          job_seeker: {
            profile: {
              user: {
                first_name: "Michael",
                last_name: "Chen",
              },
              profile_picture: null
            }
          },
          created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          last_message: null,
          unread_count: 0
        }
      ]
    };
  },
  
  getMessages: async (matchId) => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 600));
    
    return {
      data: [
        {
          id: 1,
          sender_id: 999,
          content: "Hello! I'm interested in the position you applied for.",
          created_at: new Date(Date.now() - 60 * 60 * 1000).toISOString()
        },
        {
          id: 2,
          sender_id: 998,
          content: "Hi! Thanks for reaching out. I'm very excited about the opportunity.",
          created_at: new Date(Date.now() - 50 * 60 * 1000).toISOString()
        },
        {
          id: 3,
          sender_id: 999,
          content: "Your experience looks great. When would you be available for an interview?",
          created_at: new Date(Date.now() - 45 * 60 * 1000).toISOString()
        },
        {
          id: 4,
          sender_id: 998,
          content: "I'm available next week on Tuesday and Thursday afternoon. Would either of those work for you?",
          created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString()
        },
        {
          id: 5,
          sender_id: 999,
          content: "Tuesday at 2 PM works perfectly. I'll send a calendar invite with the details.",
          created_at: new Date(Date.now() - 15 * 60 * 1000).toISOString()
        }
      ]
    };
  },
  
  sendMessage: async (messageData) => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return {
      data: {
        id: Date.now(),
        sender_id: 998, // Default to current user in mock
        content: messageData.content,
        created_at: new Date().toISOString(),
        match_id: messageData.match_id
      }
    };
  },
  
  swipe: async (swipeData) => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    return {
      data: {
        id: Date.now(),
        ...swipeData,
        created_at: new Date().toISOString()
      }
    };
  }
};

// Mock jobs implementations
const mockJobs = {
  getJobs: async () => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    return {
      data: [
        {
          id: 1,
          title: "Frontend Developer",
          company: "Tech Innovations Inc.",
          location: "San Francisco, CA",
          description: "We're looking for a talented frontend developer to join our team. You'll work on building responsive user interfaces and implementing new features.",
          requirements: "Strong knowledge of React and JavaScript. Experience with modern frontend frameworks. Understanding of UI/UX principles.",
          salary_min: 80000,
          salary_max: 120000,
          job_type: "full_time",
          experience_level: "mid",
          recruiter: {
            id: 1,
            company_name: "Tech Innovations Inc."
          }
        },
        {
          id: 2,
          title: "Backend Engineer",
          company: "DataFlow Systems",
          location: "Remote",
          description: "Join our team to build scalable backend systems that power our applications. You'll work with databases, APIs, and server infrastructure.",
          requirements: "Experience with Python, Django, and RESTful APIs. Knowledge of database design and optimization.",
          salary_min: 100000,
          salary_max: 150000,
          job_type: "full_time",
          experience_level: "senior",
          is_remote: true,
          recruiter: {
            id: 2,
            company_name: "DataFlow Systems"
          }
        },
        {
          id: 3,
          title: "Mobile Developer",
          company: "AppWorks Studios",
          location: "Seattle, WA",
          description: "Work on our mobile applications for iOS and Android using React Native. You'll be responsible for building new features and maintaining existing code.",
          requirements: "Experience with React Native and mobile app development. Understanding of mobile UX patterns.",
          salary_min: 90000,
          salary_max: 130000,
          job_type: "full_time",
          experience_level: "mid",
          recruiter: {
            id: 3,
            company_name: "AppWorks Studios"
          }
        },
        {
          id: 4,
          title: "UX/UI Designer",
          company: "Creative Solutions",
          location: "New York, NY",
          description: "Design beautiful and intuitive user experiences for our products. Work closely with developers to implement your designs.",
          requirements: "Proficiency in design tools like Figma or Sketch. Portfolio showing UI/UX projects. Understanding of user-centered design principles.",
          salary_min: 85000,
          salary_max: 125000,
          job_type: "full_time",
          experience_level: "mid",
          recruiter: {
            id: 4,
            company_name: "Creative Solutions"
          }
        },
        {
          id: 5,
          title: "DevOps Engineer",
          company: "CloudTech Services",
          location: "Austin, TX",
          description: "Manage our cloud infrastructure and CI/CD pipelines. Ensure reliability, performance, and security of our systems.",
          requirements: "Experience with AWS, Docker, and Kubernetes. Knowledge of CI/CD practices and tools.",
          salary_min: 110000,
          salary_max: 160000,
          job_type: "full_time",
          experience_level: "senior",
          recruiter: {
            id: 5,
            company_name: "CloudTech Services"
          }
        }
      ]
    };
  },
  
  getJob: async (id) => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // In a real app, this would fetch the specific job
    const mockJobs = await mockJobs.getJobs();
    const job = mockJobs.data.find(job => job.id === id);
    
    if (job) {
      return { data: job };
    } else {
      throw {
        response: {
          status: 404,
          data: { error: 'Job not found' }
        }
      };
    }
  },
  
  createJob: async (jobData) => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return {
      data: {
        id: Date.now(),
        ...jobData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_active: true
      }
    };
  },
  
  updateJob: async (id, jobData) => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    return {
      data: {
        id,
        ...jobData,
        updated_at: new Date().toISOString()
      }
    };
  }
};

// API interfaces
export const authAPI = {
  login: (username, password) => {
    if (MOCK_AUTH_ENABLED) {
      return mockAuth.login(username, password);
    }
    return api.post('/users/login/', { username, password });
  },
  register: (userData) => {
    if (MOCK_AUTH_ENABLED) {
      return mockAuth.register(userData);
    }
    return api.post('/users/register/', userData);
  },
  getProfile: () => api.get('/users/profiles/'),
};

export const jobsAPI = {
  getJobs: () => {
    if (MOCK_AUTH_ENABLED) {
      return mockJobs.getJobs();
    }
    return api.get('/jobs/jobs/');
  },
  getJob: (id) => {
    if (MOCK_AUTH_ENABLED) {
      return mockJobs.getJob(id);
    }
    return api.get(`/jobs/jobs/${id}/`);
  },
  createJob: (jobData) => {
    if (MOCK_AUTH_ENABLED) {
      return mockJobs.createJob(jobData);
    }
    return api.post('/jobs/jobs/', jobData);
  },
  updateJob: (id, jobData) => {
    if (MOCK_AUTH_ENABLED) {
      return mockJobs.updateJob(id, jobData);
    }
    return api.put(`/jobs/jobs/${id}/`, jobData);
  },
};

export const matchingAPI = {
  swipe: (swipeData) => {
    if (MOCK_AUTH_ENABLED) {
      return mockMatching.swipe(swipeData);
    }
    return api.post('/matching/swipe/', swipeData);
  },
  getMatches: () => {
    if (MOCK_AUTH_ENABLED) {
      return mockMatching.getMatches();
    }
    return api.get('/matching/matches/');
  },
  getMessages: (matchId) => {
    if (MOCK_AUTH_ENABLED) {
      return mockMatching.getMessages(matchId);
    }
    return api.get(`/matching/messages/?match_id=${matchId}`);
  },
  sendMessage: (messageData) => {
    if (MOCK_AUTH_ENABLED) {
      return mockMatching.sendMessage(messageData);
    }
    return api.post('/matching/messages/', messageData);
  },
};

export default api;