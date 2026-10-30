// ============================================
// CampusIQ Domain Types
// ============================================

// --- Enums ---

export type UserRole = 
  | 'student' 
  | 'faculty' 
  | 'class_representative' 
  | 'club_moderator' 
  | 'support_staff' 
  | 'department_admin' 
  | 'college_admin' 
  | 'super_admin';

export type AccountStatus = 'pending_verification' | 'active' | 'suspended' | 'deactivated';

export type RoomType = 
  | 'college_wide' 
  | 'department' 
  | 'program' 
  | 'academic_year' 
  | 'section' 
  | 'subject' 
  | 'interest_community' 
  | 'study_group' 
  | 'event' 
  | 'private';

export type TicketStatus = 
  | 'submitted' 
  | 'under_review' 
  | 'assigned' 
  | 'in_progress' 
  | 'waiting_for_info' 
  | 'resolved' 
  | 'closed' 
  | 'rejected';

export type TicketPriority = 'low' | 'medium' | 'high' | 'critical';

export type ItemReportType = 'lost' | 'found';

export type ItemReportStatus = 'open' | 'claimed' | 'verified' | 'handed_over' | 'closed' | 'expired';

export type ListingStatus = 'active' | 'sold' | 'exchanged' | 'expired' | 'removed';

export type AnnouncementScope = 'college' | 'department' | 'program' | 'section' | 'subject';

// --- Institutional Structure ---

export interface College {
  id: string;
  name: string;
  code: string;
  email_domain: string;
  timezone: string;
  created_at: string;
}

export interface Department {
  id: string;
  college_id: string;
  name: string;
  code: string;
  created_at: string;
}

export interface Program {
  id: string;
  department_id: string;
  name: string;
  code: string;
  duration_years: number;
  created_at: string;
}

export interface AcademicYear {
  id: string;
  college_id: string;
  name: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
}

export interface Semester {
  id: string;
  academic_year_id: string;
  number: number;
  name: string;
  start_date: string;
  end_date: string;
}

export interface Section {
  id: string;
  program_id: string;
  academic_year_id: string;
  name: string;
  semester_id: string;
}

export interface Subject {
  id: string;
  department_id: string;
  program_id: string;
  semester_id: string;
  name: string;
  code: string;
  credits: number;
}

// --- Identity & Profiles ---

export interface Profile {
  id: string; // auth.uid()
  college_id: string;
  campus_id: string;
  display_name: string;
  email: string;
  avatar_url: string | null;
  department_id: string | null;
  program_id: string | null;
  academic_year_id: string | null;
  section_id: string | null;
  semester_id: string | null;
  account_status: AccountStatus;
  interests: string[];
  skills: string[];
  bio: string | null;
  privacy_settings: PrivacySettings;
  created_at: string;
  updated_at: string;
}

export interface PrivacySettings {
  show_email: boolean;
  show_interests: boolean;
  show_skills: boolean;
  allow_direct_messages: boolean;
  searchable: boolean;
}

export interface RoleAssignment {
  id: string;
  user_id: string;
  role: UserRole;
  scope_type: 'college' | 'department' | 'program' | 'section';
  scope_id: string;
  granted_by: string;
  granted_at: string;
}

// --- Messaging ---

export interface Room {
  id: string;
  college_id: string;
  name: string;
  description: string | null;
  type: RoomType;
  visibility: 'public' | 'private' | 'restricted';
  created_by: string;
  created_at: string;
  archived: boolean;
  scope_type: string | null;
  scope_id: string | null;
}

export interface RoomMember {
  id: string;
  room_id: string;
  user_id: string;
  role: 'member' | 'moderator' | 'admin';
  joined_at: string;
}

export interface Message {
  id: string;
  room_id: string | null;
  conversation_id: string | null;
  sender_id: string;
  content: string;
  reply_to_id: string | null;
  edited: boolean;
  edited_at: string | null;
  created_at: string;
  deleted: boolean;
  sender?: Profile;
  reactions?: MessageReaction[];
  attachments?: MessageAttachment[];
}

export interface MessageReaction {
  id: string;
  message_id: string;
  user_id: string;
  emoji: string;
  created_at: string;
}

export interface MessageAttachment {
  id: string;
  message_id: string;
  file_name: string;
  file_url: string;
  file_type: string;
  file_size: number;
  uploaded_at: string;
}

// --- Private Conversations ---

export interface Conversation {
  id: string;
  type: 'direct' | 'group';
  title: string | null;
  created_by: string;
  created_at: string;
  last_message_at: string | null;
  members?: ConversationMember[];
}

export interface ConversationMember {
  id: string;
  conversation_id: string;
  user_id: string;
  role: 'member' | 'admin';
  joined_at: string;
  last_read_at: string | null;
  muted: boolean;
  user?: Profile;
}

export interface MessageRequest {
  id: string;
  from_user_id: string;
  to_user_id: string;
  message_preview: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
}

export interface UserBlock {
  id: string;
  blocker_id: string;
  blocked_id: string;
  created_at: string;
}

// --- Academic Resources ---

export interface Resource {
  id: string;
  college_id: string;
  subject_id: string | null;
  title: string;
  description: string | null;
  type: 'lecture_notes' | 'handwritten' | 'previous_exam' | 'assignment' | 'lab_manual' | 'reference' | 'study_guide';
  file_url: string;
  file_name: string;
  file_type: string;
  file_size: number;
  uploaded_by: string;
  visibility: 'public' | 'department' | 'subject' | 'private';
  status: 'pending_review' | 'approved' | 'rejected';
  download_count: number;
  created_at: string;
  updated_at: string;
  uploader?: Profile;
}

export interface ResourceBookmark {
  id: string;
  resource_id: string;
  user_id: string;
  created_at: string;
}

// --- Lost & Found ---

export interface ItemReport {
  id: string;
  college_id: string;
  report_type: ItemReportType;
  title: string;
  description: string;
  category: string;
  location: string;
  date: string;
  image_urls: string[];
  reporter_id: string;
  contact_preference: 'platform_message' | 'email' | 'phone';
  status: ItemReportStatus;
  created_at: string;
  updated_at: string;
  reporter?: Profile;
}

export interface ItemClaim {
  id: string;
  report_id: string;
  claimant_id: string;
  description: string;
  evidence_urls: string[];
  status: 'pending' | 'verified' | 'rejected';
  created_at: string;
}

// --- Request Desk ---

export interface Ticket {
  id: string;
  public_id: string;
  college_id: string;
  requester_id: string;
  category_id: string;
  title: string;
  description: string;
  location: string | null;
  priority: TicketPriority;
  status: TicketStatus;
  assigned_department: string | null;
  assigned_staff_id: string | null;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
  requester?: Profile;
  assigned_staff?: Profile;
}

export interface TicketCategory {
  id: string;
  college_id: string;
  name: string;
  description: string | null;
  department_id: string | null;
  is_active: boolean;
}

export interface TicketComment {
  id: string;
  ticket_id: string;
  author_id: string;
  content: string;
  is_internal: boolean;
  created_at: string;
  author?: Profile;
}

// --- Announcements ---

export interface Announcement {
  id: string;
  college_id: string;
  title: string;
  content: string;
  scope: AnnouncementScope;
  scope_id: string | null;
  priority: 'normal' | 'important' | 'urgent';
  published_by: string;
  published_at: string;
  expires_at: string | null;
  attachment_urls: string[];
  publisher?: Profile;
}

// --- Events ---

export interface Event {
  id: string;
  college_id: string;
  title: string;
  description: string;
  location: string;
  start_date: string;
  end_date: string;
  registration_deadline: string | null;
  max_capacity: number | null;
  organizer_id: string;
  club_id: string | null;
  status: 'draft' | 'published' | 'cancelled' | 'completed';
  created_at: string;
}

export interface EventRegistration {
  id: string;
  event_id: string;
  user_id: string;
  status: 'registered' | 'waitlisted' | 'cancelled';
  registered_at: string;
}

// --- Clubs ---

export interface Club {
  id: string;
  college_id: string;
  name: string;
  description: string;
  category: string;
  created_by: string;
  created_at: string;
  member_count: number;
}

export interface ClubMembership {
  id: string;
  club_id: string;
  user_id: string;
  role: 'member' | 'moderator' | 'president';
  joined_at: string;
}

// --- Marketplace ---

export interface MarketplaceListing {
  id: string;
  college_id: string;
  seller_id: string;
  title: string;
  description: string;
  category: string;
  price: number | null;
  is_free: boolean;
  image_urls: string[];
  status: ListingStatus;
  created_at: string;
  expires_at: string | null;
  seller?: Profile;
}

// --- Study Groups ---

export interface StudyGroup {
  id: string;
  college_id: string;
  name: string;
  description: string;
  subject_id: string | null;
  max_members: number;
  created_by: string;
  created_at: string;
  room_id: string | null;
}

export interface StudyGroupMember {
  id: string;
  group_id: string;
  user_id: string;
  role: 'member' | 'admin';
  joined_at: string;
}

// --- Timetable ---

export interface TimetableEntry {
  id: string;
  college_id: string;
  section_id: string;
  subject_id: string;
  faculty_id: string;
  classroom_id: string | null;
  day_of_week: number;
  start_time: string;
  end_time: string;
  semester_id: string;
}

// --- Notifications ---

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string;
  data: Record<string, unknown>;
  read: boolean;
  created_at: string;
}

// --- Feedback ---

export interface FeedbackSubmission {
  id: string;
  college_id: string;
  submitter_id: string | null;
  category: string;
  title: string;
  content: string;
  is_anonymous: boolean;
  status: 'pending' | 'reviewed' | 'responded' | 'closed';
  created_at: string;
}

// --- AI ---

export interface AIUsageRecord {
  id: string;
  user_id: string;
  provider: string;
  model: string;
  input_tokens: number;
  output_tokens: number;
  purpose: string;
  created_at: string;
}

export interface AIChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  sources?: AISource[];
}

export interface AISource {
  title: string;
  type: string;
  url?: string;
  snippet: string;
}
