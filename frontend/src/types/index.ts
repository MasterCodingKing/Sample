// User types
export interface User {
  id: number
  barangay_id: number | null
  email: string
  first_name: string
  last_name: string
  middle_name?: string
  role: UserRole
  phone?: string
  contact_number?: string
  avatar?: string
  status: 'active' | 'inactive' | 'suspended'
  email_verified: boolean
  last_login?: string
  resident_id?: number
  created_at: string
  updated_at: string
  barangay?: Barangay
}

export type UserRole = 'super_admin' | 'admin' | 'captain' | 'secretary' | 'treasurer' | 'staff' | 'resident'

// Barangay types
export interface Barangay {
  id: number
  name: string
  address?: string
  municipality?: string
  province?: string
  contact_number?: string
  email?: string
  logo_url?: string
  captain_name?: string
  is_active: boolean
  created_at?: string
  updated_at?: string
}

// Resident types
export interface Resident {
  id: number
  barangay_id: number
  household_id?: number
  user_id?: number
  first_name: string
  last_name: string
  middle_name?: string
  suffix?: string
  date_of_birth: string
  birthdate: string  // alias for date_of_birth
  place_of_birth?: string
  birthplace?: string  // alias for place_of_birth
  gender: 'male' | 'female' | 'other'
  civil_status: 'single' | 'married' | 'widowed' | 'separated' | 'divorced'
  nationality: string
  religion?: string
  blood_type?: string
  contact_number?: string
  email?: string
  address: string
  purok?: string
  zone_purok?: string
  occupation?: string
  monthly_income?: number
  education?: string
  education_level?: string
  voter_status: boolean
  is_voter?: boolean
  is_pwd: boolean
  pwd_type?: string
  is_senior_citizen: boolean
  is_senior?: boolean
  is_solo_parent: boolean
  is_4ps_member: boolean
  photo_url?: string
  status: 'active' | 'inactive' | 'deceased' | 'transferred'
  created_at: string
  updated_at: string
  household?: Household
  barangay?: Barangay
}

// Household types
export interface Household {
  id: number
  barangay_id: number
  household_number: string
  address: string
  purok?: string
  zone?: string
  housing_type: 'owned' | 'rented' | 'shared' | 'informal_settler'
  house_condition: 'good' | 'fair' | 'poor' | 'dilapidated'
  house_ownership?: string
  toilet_type: 'water_sealed' | 'pit' | 'none'
  water_source: 'piped' | 'well' | 'spring' | 'other'
  electricity: boolean
  monthly_income?: number
  income_source?: string
  is_4ps_beneficiary: boolean
  notes?: string
  status: 'active' | 'inactive'
  created_at: string
  updated_at: string
  residents?: Resident[]
  barangay?: Barangay
  // Computed/joined fields from API
  household_head_name?: string
  member_count?: number
  head?: Resident
}

// Document types
export interface Document {
  id: number
  barangay_id: number
  resident_id: number
  processed_by?: number
  document_type: DocumentType
  control_number: string
  purpose?: string
  or_number?: string
  amount: number
  status: DocumentStatus
  rejection_reason?: string
  valid_until?: string
  released_at?: string
  notes?: string
  created_at: string
  updated_at: string
  resident?: Resident
  processor?: User
}

export type DocumentType = 
  | 'barangay_clearance'
  | 'certificate_of_residency'
  | 'certificate_of_indigency'
  | 'business_clearance'
  | 'barangay_id'
  | 'cedula'
  | 'first_time_job_seeker'
  | 'good_moral_certificate'
  | 'lot_ownership'
  | 'travel_permit'
  | 'other'

export type DocumentStatus = 'pending' | 'processing' | 'ready' | 'released' | 'rejected' | 'cancelled'

// Business types
export interface Business {
  id: number
  barangay_id: number
  owner_id?: number
  business_name: string
  trade_name?: string
  business_type: 'sole_proprietorship' | 'partnership' | 'corporation' | 'cooperative'
  business_nature?: string
  business_category: 'micro' | 'small' | 'medium' | 'large'
  dti_registration?: string
  sec_registration?: string
  bir_tin?: string
  address: string
  purok?: string
  contact_number?: string
  email?: string
  floor_area?: number
  capital?: number
  gross_sales?: number
  employees_count: number
  date_established?: string
  status: 'active' | 'closed' | 'suspended'
  notes?: string
  created_at: string
  updated_at: string
  owner?: Resident
}

// Business Permit types
export interface BusinessPermit {
  id: number
  barangay_id: number
  business_id: number
  processed_by?: number
  permit_number: string
  permit_type: 'new' | 'renewal'
  year: number
  or_number?: string
  permit_fee: number
  mayors_fee: number
  sanitary_fee: number
  other_fees: number
  total_amount: number
  issue_date?: string
  expiry_date?: string
  status: 'pending' | 'approved' | 'released' | 'expired' | 'rejected' | 'cancelled'
  rejection_reason?: string
  notes?: string
  created_at: string
  updated_at: string
  business?: Business
  processor?: User
}

// Official types
export interface Official {
  id: number
  barangay_id: number
  resident_id?: number
  first_name: string
  last_name: string
  middle_name?: string
  suffix?: string
  position: OfficialPosition
  committee?: string
  term_start: string
  term_end: string
  contact_number?: string
  email?: string
  photo_url?: string
  status: 'active' | 'inactive' | 'resigned' | 'suspended' | 'terminated'
  created_at: string
  updated_at: string
  resident?: Resident
}

export type OfficialPosition = 'captain' | 'kagawad' | 'secretary' | 'treasurer' | 'sk_chairman' | 'sk_kagawad' | 'tanod' | 'lupon' | 'bhw' | 'other'

// Incident types
export interface Incident {
  id: number
  barangay_id: number
  complainant_id?: number
  respondent_id?: number
  recorded_by?: number
  blotter_number: string
  incident_type: IncidentType
  incident_date: string
  incident_time?: string
  incident_location: string
  complainant_name: string
  complainant_address?: string
  complainant_contact?: string
  respondent_name?: string
  respondent_address?: string
  respondent_contact?: string
  narrative: string
  action_taken?: string
  hearing_date?: string
  resolution?: string
  resolution_date?: string
  status: IncidentStatus
  priority: 'low' | 'medium' | 'high' | 'urgent'
  witnesses?: string
  attachments?: string
  notes?: string
  created_at: string
  updated_at: string
  complainant?: Resident
  respondent?: Resident
  recorder?: User
}

export type IncidentType = 
  | 'physical_assault'
  | 'verbal_abuse'
  | 'property_dispute'
  | 'noise_complaint'
  | 'domestic_violence'
  | 'theft'
  | 'trespassing'
  | 'public_disturbance'
  | 'animal_complaint'
  | 'traffic_incident'
  | 'other'

export type IncidentStatus = 'reported' | 'under_investigation' | 'scheduled_hearing' | 'mediation' | 'resolved' | 'escalated' | 'dismissed'

// Announcement types
export interface Announcement {
  id: number
  barangay_id: number
  created_by?: number
  title: string
  content: string
  excerpt?: string
  category: AnnouncementCategory
  priority: 'low' | 'normal' | 'high' | 'urgent'
  image?: string
  attachments?: string
  is_public: boolean
  is_pinned: boolean
  publish_date?: string
  expiry_date?: string
  views: number
  status: 'draft' | 'published' | 'archived'
  created_at: string
  updated_at: string
  creator?: User
}

export type AnnouncementCategory = 'general' | 'health' | 'education' | 'safety' | 'environment' | 'events' | 'emergency' | 'advisory'

// Event types
export interface Event {
  id: number
  barangay_id: number
  created_by?: number
  title: string
  description?: string
  event_type: EventType
  start_date: string
  end_date?: string
  all_day: boolean
  location?: string
  venue_details?: string
  organizer?: string
  contact_person?: string
  contact_number?: string
  max_participants?: number
  registration_required: boolean
  registration_deadline?: string
  image?: string
  attachments?: string
  is_public: boolean
  color?: string
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled' | 'postponed'
  notes?: string
  created_at: string
  updated_at: string
  creator?: User
}

export type EventType = 'meeting' | 'assembly' | 'fiesta' | 'medical_mission' | 'clean_up_drive' | 'sports' | 'seminar' | 'outreach' | 'other'

// API Response types
export interface ApiResponse<T> {
  success: boolean
  message?: string
  data: T
}

export interface PaginatedResponse<T> {
  data: T[]
  permits?: T[]  // For business permits
  residents?: T[]  // For residents
  households?: T[]  // For households
  documents?: T[]  // For documents
  incidents?: T[]  // For incidents
  announcements?: T[]  // For announcements
  events?: T[]  // For events
  users?: T[]  // For users
  businesses?: T[]  // For businesses
  pagination?: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
  // Alternative flat structure
  total?: number
  page?: number
  limit?: number
  pages?: number
  totalPages?: number
}

// Auth types
export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterData {
  email: string
  password: string
  first_name: string
  last_name: string
  barangay_id?: number
}

export interface AuthResponse {
  user: User
  token?: string
  accessToken?: string
  refreshToken?: string
  message?: string
}

// Statistics types
export interface DashboardStats {
  totalResidents: number
  totalHouseholds: number
  totalBusinesses: number
  totalDocuments: number
  pendingDocuments: number
  pendingIncidents: number
  activeIncidents: number
  upcomingEvents: number
  maleCount: number
  femaleCount: number
  recentResidents: Resident[]
  recentDocuments: Document[]
  populationByGender: { male: number; female: number }
  populationByAgeGroup: Record<string, number>
}
