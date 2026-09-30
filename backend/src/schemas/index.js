import { z } from 'zod';

export const DEPARTMENTS = ['Sales', 'Customer Success', 'Finance', 'IT', 'Security', 'Operations'];
export const ROLES = ['Administrator', 'Manager', 'Member'];
export const PROJECT_STATUSES = ['Planning', 'In Progress', 'Blocked', 'Ready for Launch', 'Launched'];
export const TASK_STATUSES = ['Not Started', 'In Progress', 'Blocked', 'Completed'];

// Authentication Schemas
export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(ROLES).default('Member'),
  department: z.enum(DEPARTMENTS).default('Operations'),
  organizationName: z.string().min(2, 'Workspace / Organization name required').optional()
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required')
});

// Project Schemas
export const createProjectSchema = z.object({
  customerName: z.string().min(2, 'Customer name is required'),
  targetLaunchDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Target launch date must be YYYY-MM-DD'),
  managerId: z.string().optional()
});

export const updateProjectSchema = z.object({
  customerName: z.string().min(2).optional(),
  targetLaunchDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  status: z.enum(PROJECT_STATUSES).optional(),
  managerId: z.string().nullable().optional()
});

// Source Document Schemas
export const createSourceDocSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  content: z.string().min(10, 'Document content must be at least 10 characters')
});

// AI Source Reference Schema
export const sourceReferenceSchema = z.object({
  documentId: z.string(),
  paragraphId: z.string(),
  quote: z.string()
});

// AI Proposed Task Schema
export const aiProposedTaskSchema = z.object({
  title: z.string().min(3),
  description: z.string().optional().default(''),
  department: z.enum(DEPARTMENTS),
  suggestedOwnerId: z.string().nullable().optional(),
  suggestedOwnerName: z.string().nullable().optional(),
  dueDate: z.string().nullable().optional(),
  dependencies: z.array(z.string()).default([]), // Prerequisite task titles
  missingInformation: z.string().nullable().optional(),
  sourceReferences: z.array(sourceReferenceSchema).default([]),
  requiresApproval: z.boolean().default(true)
});

// AI Plan Structured Output Schema
export const aiPlanSchema = z.object({
  summary: z.string(),
  riskAssessment: z.string(),
  extractedRequirements: z.array(z.string()),
  missingInformationAlerts: z.array(z.object({
    department: z.enum(DEPARTMENTS),
    issue: z.string(),
    impact: z.string(),
    sourceReference: z.string().optional()
  })),
  proposedTasks: z.array(aiProposedTaskSchema)
});

// Plan Approval Schema (Manager reviewing and confirming tasks)
export const approvePlanSchema = z.object({
  tasks: z.array(z.object({
    title: z.string().min(2),
    description: z.string().optional().default(''),
    department: z.enum(DEPARTMENTS),
    ownerId: z.string().nullable().optional(),
    dueDate: z.string().nullable().optional(),
    status: z.enum(TASK_STATUSES).default('Not Started'),
    sourceReferences: z.array(sourceReferenceSchema).default([]),
    prerequisiteTitles: z.array(z.string()).default([])
  })).min(1, 'At least one task must be approved')
});

// Task Update Schema
export const updateTaskSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  department: z.enum(DEPARTMENTS).optional(),
  ownerId: z.string().nullable().optional(),
  status: z.enum(TASK_STATUSES).optional(),
  dueDate: z.string().nullable().optional()
});

// Comment Schema
export const createCommentSchema = z.object({
  taskId: z.string().nullable().optional(),
  content: z.string().min(1, 'Comment text cannot be empty')
});

// AI Question / Query Schema
export const aiQuestionSchema = z.object({
  question: z.string().min(2, 'Question must be at least 2 characters')
});
