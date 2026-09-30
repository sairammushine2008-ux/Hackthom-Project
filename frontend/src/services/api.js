import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Attach JWT token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('launchops_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));

// Global response error handler
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Don't auto-redirect if already on login/register
      if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/register')) {
        localStorage.removeItem('launchops_token');
        localStorage.removeItem('launchops_user');
        window.location.href = '/login';
      }
    }
    const message = error.response?.data?.error || error.response?.data?.message || error.message || 'An error occurred';
    return Promise.reject(new Error(message));
  }
);

export const authApi = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  getMe: () => api.get('/auth/me'),
  getUsers: () => api.get('/auth/users')
};

export const dashboardApi = {
  getMetrics: () => api.get('/dashboard/metrics')
};

export const projectsApi = {
  getAll: () => api.get('/projects'),
  getById: (id) => api.get(`/projects/${id}`),
  create: (data) => api.post('/projects', data),
  update: (id, data) => api.put(`/projects/${id}`, data)
};

export const sourcesApi = {
  getSources: (projectId) => api.get(`/projects/${projectId}/sources`),
  createSource: (projectId, data) => api.post(`/projects/${projectId}/sources`, data)
};

export const aiApi = {
  generatePlan: (projectId) => api.post(`/projects/${projectId}/ai/generate-plan`),
  getLatestProposal: (projectId) => api.get(`/projects/${projectId}/ai/latest-proposal`),
  approvePlan: (projectId, data) => api.post(`/projects/${projectId}/ai/approve-plan`, data),
  explainBlockers: (projectId, question) => api.post(`/projects/${projectId}/ai/explain-blockers`, { question }),
  summarizeProgress: (projectId) => api.post(`/projects/${projectId}/ai/summarize-progress`)
};

export const tasksApi = {
  getProjectTasks: (projectId) => api.get(`/projects/${projectId}/tasks`),
  getMyTasks: () => api.get('/my-tasks'),
  createTask: (projectId, data) => api.post(`/projects/${projectId}/tasks`, data),
  updateTask: (id, data) => api.put(`/tasks/${id}`, data)
};

export const commentsApi = {
  getComments: (projectId) => api.get(`/projects/${projectId}/comments`),
  createComment: (projectId, data) => api.post(`/projects/${projectId}/comments`, data)
};

export const notificationsApi = {
  getNotifications: () => api.get('/notifications'),
  markRead: (id) => api.put(`/notifications/${id}/read`),
  markAllRead: () => api.put('/notifications/read-all')
};

export const auditApi = {
  getAuditEvents: (projectId) => api.get(`/projects/${projectId}/audit`)
};

export default api;
