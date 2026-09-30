import express from 'express';
import {
  register,
  login,
  getCurrentUser,
  getOrganizationUsers
} from '../controllers/authController.js';
import {
  getProjects,
  getProjectById,
  createProject,
  updateProject
} from '../controllers/projectController.js';
import {
  getSourceDocs,
  createSourceDoc
} from '../controllers/sourceDocController.js';
import {
  generatePlan,
  getLatestProposal,
  approvePlan,
  askBlockerExplanation,
  askProgressSummary
} from '../controllers/aiController.js';
import {
  getTasks,
  getMyTasks,
  createTask,
  updateTask
} from '../controllers/taskController.js';
import {
  getComments,
  createComment
} from '../controllers/commentController.js';
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead
} from '../controllers/notificationController.js';
import {
  getDashboardMetrics,
  getAuditEvents
} from '../controllers/dashboardController.js';
import {
  authenticateToken,
  requireRoles,
  requireWorkspaceProject,
  validateBody
} from '../middleware/auth.js';
import {
  registerSchema,
  loginSchema,
  createProjectSchema,
  updateProjectSchema,
  createSourceDocSchema,
  approvePlanSchema,
  updateTaskSchema,
  createCommentSchema
} from '../schemas/index.js';

const router = express.Router();

// --- Authentication ---
router.post('/auth/register', validateBody(registerSchema), register);
router.post('/auth/login', validateBody(loginSchema), login);
router.get('/auth/me', authenticateToken, getCurrentUser);
router.get('/auth/users', authenticateToken, getOrganizationUsers);

// --- Operational Dashboard ---
router.get('/dashboard/metrics', authenticateToken, getDashboardMetrics);

// --- Projects ---
router.get('/projects', authenticateToken, getProjects);
router.post('/projects', authenticateToken, validateBody(createProjectSchema), createProject);
router.get('/projects/:id', authenticateToken, getProjectById);
router.put('/projects/:id', authenticateToken, requireRoles('Administrator', 'Manager'), validateBody(updateProjectSchema), updateProject);

// --- Source Documents ---
router.get('/projects/:projectId/sources', authenticateToken, requireWorkspaceProject, getSourceDocs);
router.post('/projects/:projectId/sources', authenticateToken, requireWorkspaceProject, validateBody(createSourceDocSchema), createSourceDoc);

// --- AI Onboarding Intelligence (called only from Express backend) ---
router.post('/projects/:projectId/ai/generate-plan', authenticateToken, requireWorkspaceProject, generatePlan);
router.get('/projects/:projectId/ai/latest-proposal', authenticateToken, requireWorkspaceProject, getLatestProposal);
router.post('/projects/:projectId/ai/approve-plan', authenticateToken, requireWorkspaceProject, requireRoles('Administrator', 'Manager'), validateBody(approvePlanSchema), approvePlan);
router.post('/projects/:projectId/ai/explain-blockers', authenticateToken, requireWorkspaceProject, askBlockerExplanation);
router.post('/projects/:projectId/ai/summarize-progress', authenticateToken, requireWorkspaceProject, askProgressSummary);

// --- Departmental Tasks & Workflow ---
router.get('/projects/:projectId/tasks', authenticateToken, requireWorkspaceProject, getTasks);
router.post('/projects/:projectId/tasks', authenticateToken, requireWorkspaceProject, createTask);
router.put('/tasks/:id', authenticateToken, validateBody(updateTaskSchema), updateTask);
router.get('/my-tasks', authenticateToken, getMyTasks);

// --- Comments & Cross-Team Discussion ---
router.get('/projects/:projectId/comments', authenticateToken, requireWorkspaceProject, getComments);
router.post('/projects/:projectId/comments', authenticateToken, requireWorkspaceProject, validateBody(createCommentSchema), createComment);

// --- Notifications ---
router.get('/notifications', authenticateToken, getNotifications);
router.put('/notifications/:id/read', authenticateToken, markNotificationAsRead);
router.put('/notifications/read-all', authenticateToken, markAllNotificationsAsRead);

// --- Audit Events ---
router.get('/projects/:projectId/audit', authenticateToken, requireWorkspaceProject, getAuditEvents);

export default router;
