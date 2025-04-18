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
    const response = await api.post('/start-interview', { resumeData });
    return response.data;
  },
  
  continueInterview: async (interviewId: string, userResponse: string, resumeData: any, conversationHistory: any[]) => {
    const response = await api.post('/continue-interview', {
      interviewId,
      userResponse,
      resumeData,
      conversationHistory,
    });
    return response.data;
  },
};

export default api;