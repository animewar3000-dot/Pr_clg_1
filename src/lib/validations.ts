import { z } from 'zod';

// --- Auth Schemas ---

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const registerSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  displayName: z.string().min(2, 'Name must be at least 2 characters').max(100),
  collegeCode: z.string().min(1, 'College code is required'),
});

export const passwordResetSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

export const updatePasswordSchema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

// --- Profile Schemas ---

export const profileUpdateSchema = z.object({
  displayName: z.string().min(2).max(100).optional(),
  bio: z.string().max(500).optional(),
  interests: z.array(z.string()).max(10).optional(),
  skills: z.array(z.string()).max(15).optional(),
  privacySettings: z.object({
    showEmail: z.boolean().optional(),
    showInterests: z.boolean().optional(),
    showSkills: z.boolean().optional(),
    allowDirectMessages: z.boolean().optional(),
    searchable: z.boolean().optional(),
  }).optional(),
});

// --- Messaging Schemas ---

export const messageSchema = z.object({
  content: z.string().min(1, 'Message cannot be empty').max(5000),
  roomId: z.string().uuid().optional(),
  conversationId: z.string().uuid().optional(),
  replyToId: z.string().uuid().optional(),
}).refine(
  (data) => data.roomId || data.conversationId,
  { message: 'Either roomId or conversationId is required' }
);

// --- Resource Schemas ---

export const resourceUploadSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(200),
  description: z.string().max(2000).optional(),
  subjectId: z.string().uuid().optional(),
  type: z.enum(['lecture_notes', 'handwritten', 'previous_exam', 'assignment', 'lab_manual', 'reference', 'study_guide']),
  visibility: z.enum(['public', 'department', 'subject', 'private']),
});

// --- Lost & Found Schemas ---

export const itemReportSchema = z.object({
  reportType: z.enum(['lost', 'found']),
  title: z.string().min(3, 'Title must be at least 3 characters').max(200),
  description: z.string().min(10, 'Description must be at least 10 characters').max(2000),
  category: z.string().min(1, 'Category is required'),
  location: z.string().min(1, 'Location is required'),
  date: z.string().min(1, 'Date is required'),
  contactPreference: z.enum(['platform_message', 'email', 'phone']),
});

// --- Ticket Schemas ---

export const ticketCreateSchema = z.object({
  categoryId: z.string().uuid('Please select a category'),
  title: z.string().min(5, 'Title must be at least 5 characters').max(200),
  description: z.string().min(20, 'Description must be at least 20 characters').max(5000),
  location: z.string().max(200).optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']),
});

export const ticketCommentSchema = z.object({
  content: z.string().min(1, 'Comment cannot be empty').max(2000),
  isInternal: z.boolean().default(false),
});

// --- Announcement Schemas ---

export const announcementSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(200),
  content: z.string().min(10, 'Content must be at least 10 characters').max(10000),
  scope: z.enum(['college', 'department', 'program', 'section', 'subject']),
  scopeId: z.string().uuid().optional(),
  priority: z.enum(['normal', 'important', 'urgent']),
  expiresAt: z.string().optional(),
});

// --- Event Schemas ---

export const eventSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(200),
  description: z.string().min(10, 'Description must be at least 10 characters').max(5000),
  location: z.string().min(1, 'Location is required'),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  registrationDeadline: z.string().optional(),
  maxCapacity: z.number().positive().optional(),
  clubId: z.string().uuid().optional(),
}).refine((data) => new Date(data.endDate) > new Date(data.startDate), {
  message: 'End date must be after start date',
  path: ['endDate'],
});

// --- Marketplace Schemas ---

export const listingSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(200),
  description: z.string().min(10, 'Description must be at least 10 characters').max(2000),
  category: z.string().min(1, 'Category is required'),
  price: z.number().min(0).optional(),
  isFree: z.boolean().default(false),
});

// --- Feedback Schemas ---

export const feedbackSchema = z.object({
  category: z.string().min(1, 'Category is required'),
  title: z.string().min(5, 'Title must be at least 5 characters').max(200),
  content: z.string().min(20, 'Content must be at least 20 characters').max(5000),
  isAnonymous: z.boolean().default(false),
});

// --- Study Group Schemas ---

export const studyGroupSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters').max(100),
  description: z.string().min(10, 'Description must be at least 10 characters').max(1000),
  subjectId: z.string().uuid().optional(),
  maxMembers: z.number().min(2).max(50).default(10),
});

// --- Room Schemas ---

export const roomCreateSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters').max(100),
  description: z.string().max(500).optional(),
  type: z.enum(['interest_community', 'study_group', 'private']),
  visibility: z.enum(['public', 'private', 'restricted']).default('public'),
});

// --- Club Schemas ---

export const clubSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters').max(100),
  description: z.string().min(10, 'Description must be at least 10 characters').max(2000),
  category: z.string().min(1, 'Category is required'),
});
