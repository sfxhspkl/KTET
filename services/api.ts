/// <reference types="vite/client" />
import axios from 'axios';

// API Base URL - use environment variable or default to local
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Create axios instance
const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add token to requests
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Handle token expiration
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('auth_token');
            window.location.href = '/';
        }
        return Promise.reject(error);
    }
);

// ==================== AUTH API ====================

export const authAPI = {
    login: async (username: string, password: string) => {
        const response = await api.post('/api/auth/login', { username, password });
        if (response.data.token) {
            localStorage.setItem('auth_token', response.data.token);
        }
        return response.data;
    },

    signup: async (userData: any) => {
        const response = await api.post('/api/auth/signup', userData);
        if (response.data.token) {
            localStorage.setItem('auth_token', response.data.token);
        }
        return response.data;
    },

    getCurrentUser: async () => {
        const response = await api.get('/api/auth/me');
        return response.data;
    },

    logout: () => {
        localStorage.removeItem('auth_token');
    },
};

// ==================== USER API ====================

export const userAPI = {
    getUsers: async () => {
        const response = await api.get('/api/users');
        return response.data;
    },

    getUser: async (id: string) => {
        const response = await api.get(`/api/users/${id}`);
        return response.data;
    },

    createUser: async (userData: any) => {
        const response = await api.post('/api/users', userData);
        return response.data;
    },

    updateUser: async (id: string, userData: any) => {
        const response = await api.put(`/api/users/${id}`, userData);
        return response.data;
    },

    deleteUser: async (id: string) => {
        await api.delete(`/api/users/${id}`);
    },

    updateUsageTime: async (id: string, totalUsageTime: number) => {
        const response = await api.put(`/api/users/${id}/usage`, { totalUsageTime });
        return response.data;
    },
};

// ==================== QUESTION API ====================

export const questionAPI = {
    getQuestions: async (filters?: {
        tetCategory?: string;
        subjectId?: string;
        topicId?: string;
        status?: string;
    }) => {
        const response = await api.get('/api/questions', { params: filters });
        return response.data;
    },

    getQuestion: async (id: string) => {
        const response = await api.get(`/api/questions/${id}`);
        return response.data;
    },

    createQuestion: async (questionData: any) => {
        const response = await api.post('/api/questions', questionData);
        return response.data;
    },

    updateQuestion: async (id: string, questionData: any) => {
        const response = await api.put(`/api/questions/${id}`, questionData);
        return response.data;
    },

    deleteQuestion: async (id: string) => {
        const response = await api.delete(`/api/questions/${id}`);
        return response.data;
    },
};

// ==================== SUBJECT API ====================

export const subjectAPI = {
    getSubjects: async (tetCategory?: string) => {
        const response = await api.get('/api/subjects', {
            params: tetCategory ? { tetCategory } : {},
        });
        return response.data;
    },

    createSubject: async (subjectData: any) => {
        const response = await api.post('/api/subjects', subjectData);
        return response.data;
    },

    updateSubject: async (id: string, subjectData: any) => {
        const response = await api.put(`/api/subjects/${id}`, subjectData);
        return response.data;
    },

    deleteSubject: async (id: string) => {
        const response = await api.delete(`/api/subjects/${id}`);
        return response.data;
    },
};

// ==================== TOPIC API ====================

export const topicAPI = {
    getTopics: async (subjectId?: string) => {
        const response = await api.get('/api/topics', {
            params: subjectId ? { subjectId } : {},
        });
        return response.data;
    },

    createTopic: async (topicData: any) => {
        const response = await api.post('/api/topics', topicData);
        return response.data;
    },

    updateTopic: async (id: string, topicData: any) => {
        const response = await api.put(`/api/topics/${id}`, topicData);
        return response.data;
    },

    deleteTopic: async (id: string) => {
        const response = await api.delete(`/api/topics/${id}`);
        return response.data;
    },
};

// ==================== QUIZ API ====================

export const quizAPI = {
    getQuizHistory: async (userId: string) => {
        const response = await api.get(`/api/quiz/history/${userId}`);
        return response.data;
    },

    completeQuiz: async (quizData: any) => {
        const response = await api.post('/api/quiz/complete', quizData);
        return response.data;
    },
};

// ==================== REPORT API ====================

export const reportAPI = {
    getReports: async () => {
        const response = await api.get('/api/reports');
        return response.data;
    },

    createReport: async (reportData: any) => {
        const response = await api.post('/api/reports', reportData);
        return response.data;
    },

    updateReport: async (id: string, status: string) => {
        const response = await api.put(`/api/reports/${id}`, { status });
        return response.data;
    },
};

// ==================== MESSAGE API ====================

export const messageAPI = {
    getUserMessages: async (userId: string) => {
        const response = await api.get(`/api/messages/${userId}`);
        return response.data;
    },

    getAllMessages: async () => {
        const response = await api.get('/api/messages');
        return response.data;
    },

    sendMessage: async (messageData: any) => {
        const response = await api.post('/api/messages', messageData);
        return response.data;
    },

    markAsRead: async (userId: string) => {
        const response = await api.put(`/api/messages/mark-read/${userId}`);
        return response.data;
    },

    markAsReadByUser: async (userId: string) => {
        const response = await api.put(`/api/messages/mark-read-user/${userId}`);
        return response.data;
    },
};

// ==================== NOTIFICATION API ====================

export const notificationAPI = {
    getNotifications: async () => {
        const response = await api.get('/api/notifications');
        return response.data;
    },

    createNotification: async (notificationData: any) => {
        const response = await api.post('/api/notifications', notificationData);
        return response.data;
    },

    updateNotification: async (id: string, notificationData: any) => {
        const response = await api.put(`/api/notifications/${id}`, notificationData);
        return response.data;
    },
};

// ==================== SYLLABUS API ====================

export const syllabusAPI = {
    getSyllabus: async (tetCategory?: string) => {
        const response = await api.get('/api/syllabus', {
            params: tetCategory ? { tetCategory } : {},
        });
        return response.data;
    },

    createSyllabus: async (syllabusData: any) => {
        const response = await api.post('/api/syllabus', syllabusData);
        return response.data;
    },

    updateSyllabus: async (id: string, syllabusData: any) => {
        const response = await api.put(`/api/syllabus/${id}`, syllabusData);
        return response.data;
    },

    deleteSyllabus: async (id: string) => {
        const response = await api.delete(`/api/syllabus/${id}`);
        return response.data;
    },
};

// ==================== UTILITY FUNCTIONS ====================

// Generic shuffle function using Fisher-Yates algorithm
export const shuffleArray = <T,>(array: T[]): T[] => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
};

export const getUserStats = () => {
    return {
        completionRate: 45,
        globalAccuracy: 68,
        pendingQuestions: 120,
        weakZoneCount: 3,
    };
};

export default api;
