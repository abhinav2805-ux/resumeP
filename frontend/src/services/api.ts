import axios from 'axios';

// Base URL for API
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Resume services
export const resumeService = {
  uploadResume: async (file: File) => {
    const formData = new FormData();
    formData.append('resume', file);
    
    const response = await api.post('/parse-resume', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.data;
  },
};

// Interview services
export const interviewService = {
  startInterview: async (resumeData: any) => {
    try {
      const response = await api.post('/start-interview', { resumeData });
      
      // Transform backend response to frontend expected format
      return {
        interviewId: response.data.interviewId,
        question: response.data.message,  // Map 'message' to 'question'
        interviewStatus: response.data.interviewStatus
      };
    } catch (error) {
      console.error('Error starting interview:', error);
      throw error;
    }
  },
  
  continueInterview: async (interviewId: string, userResponse: string, resumeData: any, conversationHistory: any[]) => {
    try {
      const response = await api.post('/continue-interview', {
        interviewId,
        userResponse,
        resumeData,
        conversationHistory,
      });
      
      return {
        question: response.data.message,
        interviewStatus: response.data.interviewStatus,
        feedback: response.data.feedback,
        score: response.data.score
      };
    } catch (error) {
      console.error('Error continuing interview:', error);
      throw error;
    }
  },
};


// Add response interceptor to handle errors
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response) {
      // Server responded with a status code outside 2xx
      console.error('API Error:', error.response.data);
      return Promise.reject(error.response.data.error || 'API request failed');
    } else if (error.request) {
      // No response received
      console.error('No response received:', error.request);
      return Promise.reject('No response from server');
    } else {
      // Something happened in setting up the request
      console.error('Request setup error:', error.message);
      return Promise.reject('Request setup failed');
    }
  }
);

export default api;