# Barangay Management System - Complete Implementation Documentation

## System Overview

A comprehensive multi-tenant barangay management system designed for Philippine local government units (barangays). The system features role-based access control, multi-tenancy data isolation, document management, resident tracking, business permits, incident reporting, and community announcements.

### Technology Stack

**Backend:**
- Node.js with Express.js
- MySQL Database with Sequelize ORM
- JWT Authentication
- Bcrypt for password hashing
- Helmet for security headers
- Express Rate Limiting
- Multer for file uploads
- Nodemailer for email notifications
- PDFKit for PDF generation
- ExcelJS for Excel exports

**Frontend:**
- React 18 with TypeScript
- Vite build tool
- TailwindCSS for styling
- Axios for API communication
- Zustand for state management
- React Router DOM for routing

---

## Architecture & Core Concepts

### Multi-Tenancy System

The system implements **strict data isolation** between barangays through:

1. **Barangay Filter Middleware** (`backend/middleware/barangayFilter.js`)
   - Automatically applies `WHERE barangay_id = {user's barangay}` to all database queries
   - Super admins (with `barangay_id = null`) bypass the filter and see all data
   - Prevents cross-barangay data access
   - Applied to all protected routes via middleware chain

2. **Role Hierarchy** (from lowest to highest permissions):
   - `resident` - Basic access
   - `staff` - Can manage residents, documents, businesses
   - `treasurer` - Financial management + staff permissions
   - `secretary` - Document management + staff permissions
   - `captain` - Barangay captain with high-level access
   - `admin` - Full barangay management (cannot manage other barangays)
   - `super_admin` - System-wide access to all barangays

### Authentication Flow

**JWT Token-Based Authentication:**
1. User logs in with email/password
2. Server validates credentials and approval status
3. Access token (7 days expiry) and refresh token (30 days) generated
4. Token payload includes: `{ id, role, barangay_id }`
5. Frontend stores tokens in Zustand store (localStorage)
6. Every request includes `Authorization: Bearer {token}` header
7. Auth middleware validates token and loads user data
8. Expired tokens trigger automatic refresh via interceptor

**Security Features:**
- Passwords hashed with bcrypt (10 salt rounds)
- Rate limiting on auth endpoints (50 requests per 15 minutes)
- General API rate limiting (1000 requests per 15 minutes)
- CORS configured for specific frontend origin
- Helmet.js for security headers
- Email verification tokens
- Password reset tokens with expiry

---

## Database Schema

### Core Tables & Relationships

**1. Barangays** (`barangays`)
- Primary entity for multi-tenancy
- Fields: name, address, municipality, province, contact info, logo
- Has many: Users, Residents, Households, Businesses, Documents, etc.

**2. Users** (`users`)
- System users with role-based access
- Fields: email, password, role, barangay_id, approval_status, is_approved
- Belongs to: Barangay
- Special: Super admins have `barangay_id = NULL`

**3. Residents** (`residents`)
- Barangay residents/citizens
- Fields: personal info, date_of_birth, gender, civil_status, address, zone_purok
- Special flags: voter_status, is_pwd, is_senior_citizen, is_4ps_member, is_solo_parent
- Belongs to: Barangay, Household
- Has many: Documents

**4. Households** (`households`)
- Family/household units
- Fields: household_number, address, zone_purok, economic_status, housing_type
- Belongs to: Barangay
- Has one: Head (Resident)
- Has many: Members (Residents)

**5. Documents** (`documents`)
- Barangay-issued certificates and clearances
- Types: barangay_clearance, certificate_of_residency, certificate_of_indigency, business_permit, good_moral_character, barangay_id, etc.
- Fields: control_number, or_number, purpose, amount_paid, status (pending, processing, ready, released)
- Belongs to: Barangay, Resident, Issuer (User)
- Auto-generates control numbers: `{PREFIX}-{YEAR}-{SEQUENCE}`

**6. Businesses** (`businesses`)
- Registered businesses in barangay
- Fields: business_name, trade_name, owner_name, business_type, business_nature, DTI registration
- Belongs to: Barangay, Owner (Resident)
- Has many: BusinessPermits

**7. BusinessPermits** (`business_permits`)
- Business operating permits
- Fields: permit_number, issue_date, expiry_date, fee_amount, status
- Belongs to: Barangay, Business

**8. Incidents** (`incidents`)
- Blotter records / incident reports
- Fields: blotter_number, incident_type, incident_date, location, description, status (pending, investigating, resolved, dismissed)
- Belongs to: Barangay, Complainant (Resident), Respondent (Resident), Creator (User)
- Tracks: witnesses, actions_taken, resolution

**9. Officials** (`officials`)
- Barangay officials (elected/appointed)
- Fields: position (Captain, Kagawad, SK Chairman, Secretary, Treasurer), term_start, term_end
- Belongs to: Barangay, Resident

**10. Announcements** (`announcements`)
- Public announcements
- Fields: title, content, priority, publish_date, status
- Belongs to: Barangay, Author (User)
- Has public endpoint for residents

**11. Events** (`events`)
- Community events/activities
- Fields: title, description, event_date, location, max_participants
- Belongs to: Barangay, Organizer (User)

---

## API Endpoints Reference

### Authentication (`/api/auth`)

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/register` | Public | Resident self-registration (requires barangay selection) |
| POST | `/login` | Public | User login (blocks unapproved accounts) |
| POST | `/logout` | Auth Required | Logout user |
| POST | `/refresh-token` | Public | Refresh access token |
| POST | `/forgot-password` | Public | Request password reset |
| POST | `/reset-password/:token` | Public | Reset password with token |
| GET | `/verify-email/:token` | Public | Verify email address |
| GET | `/me` | Auth Required | Get current user profile |
| PUT | `/change-password` | Auth Required | Change password |
| PUT | `/update-profile` | Auth Required | Update user profile |

### Barangays (`/api/barangays`)

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/` | Public | List all active barangays |
| GET | `/:id` | Public | Get barangay details |
| GET | `/:id/statistics` | Auth Required | Get barangay statistics |
| POST | `/` | Super Admin | Create barangay + auto-create admin user |
| PUT | `/:id` | Admin | Update barangay details |
| POST | `/:id/upload-logo` | Admin | Upload barangay logo |
| PUT | `/:id/toggle-status` | Super Admin | Activate/deactivate barangay |
| DELETE | `/:id` | Super Admin | Delete barangay |

**Auto-Admin Creation:**
When creating a barangay, the system automatically creates an admin user:
- Email: `admin@{barangayname}.local` (customizable via `admin_email`)
- Password: `{BarangayName}Admin123` (customizable via `admin_password`)
- Role: `admin`
- Status: `active` and `approved`
- Response includes admin credentials for first-time login

### Users (`/api/users`)

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/` | Admin | List all users (paginated, filterable by role, status, barangay) |
| GET | `/:id` | Admin | Get user details |
| POST | `/` | Admin | Create new user |
| PUT | `/:id` | Admin | Update user |
| PUT | `/:id/reset-password` | Admin | Admin password reset |
| PUT | `/:id/toggle-status` | Admin | Activate/deactivate user |
| DELETE | `/:id` | Super Admin | Delete user |
| GET | `/pending-approval/list` | Admin | Get pending user registrations |
| PUT | `/:id/approve` | Admin | Approve user registration |
| PUT | `/:id/reject` | Admin | Reject user registration |

**User Approval System:**
- Residents who self-register have `approval_status = 'pending'` and `is_approved = false`
- They cannot login until admin approves their registration
- Admin/staff users are auto-approved on creation

### Residents (`/api/residents`)

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/` | Staff+ | List all residents (paginated, searchable, filterable) |
| GET | `/search` | Staff+ | Quick search residents by name |
| GET | `/statistics` | Staff+ | Get resident statistics (gender, age, special categories) |
| GET | `/:id` | Staff+ | Get resident details |
| POST | `/` | Staff+ | Create new resident |
| PUT | `/:id` | Staff+ | Update resident |
| DELETE | `/:id` | Admin | Delete resident |
| POST | `/:id/upload-photo` | Staff+ | Upload resident photo |
| GET | `/:id/documents` | Staff+ | Get resident's documents |

**Statistics Include:**
- Total residents
- Gender distribution
- Voter statistics
- PWD count
- Senior citizens
- 4Ps members
- Solo parents

### Households (`/api/households`)

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/` | Staff+ | List all households (paginated, filterable) |
| GET | `/statistics` | Staff+ | Get household statistics |
| GET | `/:id` | Staff+ | Get household details |
| GET | `/:id/members` | Staff+ | Get household members |
| POST | `/` | Staff+ | Create new household |
| PUT | `/:id` | Staff+ | Update household |
| DELETE | `/:id` | Admin | Delete household |
| POST | `/:id/add-member` | Staff+ | Add member to household |
| POST | `/:id/remove-member` | Staff+ | Remove member from household |

### Documents (`/api/documents`)

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/` | Staff+ | List all documents (paginated, filterable by type, status, date) |
| GET | `/statistics` | Staff+ | Get document statistics (counts by type, status, revenue) |
| GET | `/:id` | Staff+ | Get document details |
| POST | `/` | Staff+ | Create new document request |
| PUT | `/:id` | Staff+ | Update document |
| PUT | `/:id/status` | Staff+ | Update document status (pending → processing → ready → released) |
| GET | `/:id/download` | Staff+ | Download/print document PDF |
| DELETE | `/:id` | Admin | Delete document |

**Document Types:**
- Barangay Clearance
- Certificate of Residency
- Certificate of Indigency
- Business Permit Clearance
- Good Moral Character
- Certificate of No Income
- Certificate of Late Registration
- Barangay ID
- Other

**Control Number Format:** `{TYPE_PREFIX}-{YEAR}-{SEQUENCE}`
Example: `BAR-2026-00001`

### Businesses (`/api/businesses`)

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/` | Staff+ | List all businesses (paginated, filterable) |
| GET | `/statistics` | Staff+ | Get business statistics |
| GET | `/:id` | Staff+ | Get business details |
| POST | `/` | Staff+ | Create new business |
| PUT | `/:id` | Staff+ | Update business |
| DELETE | `/:id` | Admin | Delete business |
| GET | `/:id/permits` | Staff+ | Get business permits |

### Business Permits (`/api/business-permits`)

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/` | Staff+ | List all permits (paginated, filterable) |
| GET | `/statistics` | Staff+ | Get permit statistics |
| GET | `/expiring` | Staff+ | Get expiring permits (within 30 days) |
| GET | `/:id` | Staff+ | Get permit details |
| POST | `/` | Staff+ | Issue new permit |
| PUT | `/:id` | Staff+ | Update permit |
| PUT | `/:id/renew` | Staff+ | Renew permit |
| DELETE | `/:id` | Admin | Delete permit |

### Incidents (`/api/incidents`)

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/` | Staff+ | List all incidents (paginated, filterable by type, status, date) |
| GET | `/statistics` | Staff+ | Get incident statistics |
| GET | `/:id` | Staff+ | Get incident details |
| POST | `/` | Staff+ | Create new incident report |
| PUT | `/:id` | Staff+ | Update incident |
| PUT | `/:id/resolve` | Staff+ | Resolve incident (add resolution, change status) |
| DELETE | `/:id` | Admin | Delete incident |

**Incident Types:**
- Assault
- Theft
- Domestic Violence
- Noise Complaint
- Property Dispute
- Other

**Blotter Number Format:** `BLT-{YEAR}-{SEQUENCE}`
Example: `BLT-2026-00001`

### Officials (`/api/officials`)

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/` | Staff+ | List all officials |
| GET | `/current` | Public | Get current officials (active term) |
| GET | `/:id` | Staff+ | Get official details |
| POST | `/` | Admin | Add new official |
| PUT | `/:id` | Admin | Update official |
| DELETE | `/:id` | Admin | Remove official |

**Positions:**
- Barangay Captain
- Barangay Kagawad (Councilor)
- SK (Sangguniang Kabataan) Chairman
- Barangay Secretary
- Barangay Treasurer

### Announcements (`/api/announcements`)

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/public` | Public | Get published announcements (public access) |
| GET | `/` | Staff+ | List all announcements (paginated) |
| GET | `/:id` | Staff+ | Get announcement details |
| POST | `/` | Admin | Create new announcement |
| PUT | `/:id` | Admin | Update announcement |
| PUT | `/:id/publish` | Admin | Publish announcement |
| DELETE | `/:id` | Admin | Delete announcement |

### Events (`/api/events`)

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/public` | Public | Get published events (public access) |
| GET | `/` | Staff+ | List all events (paginated) |
| GET | `/upcoming` | Staff+ | Get upcoming events |
| GET | `/:id` | Staff+ | Get event details |
| POST | `/` | Admin | Create new event |
| PUT | `/:id` | Admin | Update event |
| PUT | `/:id/status` | Admin | Update event status |
| DELETE | `/:id` | Admin | Delete event |

### Reports (`/api/reports`)

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/dashboard` | Staff+ | Get dashboard statistics (all counts, recent activity) |
| GET | `/population` | Staff+ | Population report (gender, age groups, special categories) |
| GET | `/documents` | Staff+ | Document issuance report |
| GET | `/financial` | Treasurer+ | Financial report (revenue from documents, permits) |
| GET | `/incidents` | Staff+ | Incident report (by type, status, timeline) |
| GET | `/export/residents` | Admin | Export residents to Excel |
| GET | `/export/businesses` | Admin | Export businesses to Excel |

### Contact (`/api/contact`)

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/` | Public | Send contact message to barangay |

---

## Middleware System

### 1. Authentication Middleware (`backend/middleware/auth.js`)

**`auth` middleware:**
- Validates JWT token from Authorization header
- Loads user data from database
- Checks if user is active
- Checks if barangay is active (for non-super admins)
- Attaches `req.user` and `req.token` to request
- Returns 401 for invalid/expired tokens

**`optionalAuth` middleware:**
- Same as auth but doesn't fail if no token provided
- Used for public endpoints that optionally show user-specific data

### 2. Barangay Filter Middleware (`backend/middleware/barangayFilter.js`)

**`barangayFilter` middleware:**
- **Core multi-tenancy enforcement**
- Super admins bypass filter (can see all data)
- Other users get scoped to their barangay
- Adds `req.barangayScope` with `where: { barangay_id: user.barangay_id }`
- Sets `req.barangayId` and `req.isSuperAdmin` flags

**`getQueryScope(user)` function:**
- Returns appropriate WHERE clause based on user role
- Used throughout route handlers

**`enforceBarangayId` middleware:**
- Forces `barangay_id` in request body to match user's barangay
- Prevents users from creating data in other barangays
- Super admins must specify barangay_id explicitly

### 3. Role Check Middleware (`backend/middleware/roleCheck.js`)

**Role-checking functions:**
- `checkRole(...roles)` - User must have one of specified roles
- `minRole(role)` - User must have minimum role level
- `isSuperAdmin` - Must be super admin
- `isAdmin` - Must be admin or super admin
- `isStaff` - Must be staff or higher (not resident)

**Role Hierarchy:**
```
resident (0) < staff (1) < treasurer (2) < secretary (3) < captain (4) < admin (5) < super_admin (6)
```

### 4. Upload Middleware (`backend/middleware/upload.js`)

**File upload handling with Multer:**
- Destination folders: photos/, documents/, logos/, officials/, attachments/
- File size limits
- File type validation
- Automatic filename generation

### 5. Validator Middleware (`backend/middleware/validator.js`)

**Express-validator integration:**
- Request validation rules
- Sanitization
- Error formatting

---

## Frontend Structure

### Pages

**Authentication:**
- `/login` - User login
- `/register` - Resident self-registration
- `/forgot-password` - Password reset request
- `/reset-password/:token` - Password reset form

**Dashboard Pages (Auth Required):**
- `/dashboard` - Main dashboard with statistics
- `/residents` - Resident management (list, add, edit, view)
- `/residents/:id` - Resident details
- `/households` - Household management
- `/documents` - Document requests management
- `/businesses` - Business registry
- `/business-permits` - Business permit management
- `/incidents` - Incident/blotter reports
- `/officials` - Barangay officials
- `/announcements` - Announcements management
- `/events` - Events management
- `/reports` - Reports and analytics
- `/users` - User management (Admin only)
- `/user-approvals` - Pending user approvals (Admin only)
- `/barangays` - Barangay management (Super Admin only)
- `/profile` - User profile
- `/settings` - System settings

### Services (`frontend/src/services/`)

**API Service Layer:**
- `api.ts` - Axios instance with interceptors (auth, token refresh, error handling)
- `authService.ts` - Authentication operations
- `residentService.ts` - Resident CRUD operations
- `householdService.ts` - Household operations
- `documentService.ts` - Document operations
- `businessService.ts` - Business operations
- `incidentService.ts` - Incident operations
- `dashboardService.ts` - Dashboard data
- `otherServices.ts` - Announcements, events, officials, user approvals

### State Management

**Zustand Store (`frontend/src/store/authStore.ts`):**
- User authentication state
- Token storage (localStorage)
- User profile data
- Login/logout actions
- Auto-persist across page reloads

---

## Key Features Implementation

### 1. Multi-Tenant Data Isolation

**Implementation:**
- Every data table has `barangay_id` foreign key
- `barangayFilter` middleware applied to all protected routes
- Query scope automatically added: `WHERE barangay_id = {user's barangay}`
- Super admins have `barangay_id = NULL` and bypass filter
- Frontend shows only user's barangay data

**Code Example:**
```javascript
// In route handler
const queryScope = getQueryScope(req.user);
const residents = await Resident.findAll({
  where: { ...queryScope.where, status: 'active' }
});
// Result: Only residents from user's barangay
```

### 2. User Registration & Approval System

**Flow:**
1. Resident visits `/register`
2. Selects barangay from dropdown
3. Fills registration form
4. System creates user with:
   - `approval_status = 'pending'`
   - `is_approved = false`
   - `role = 'resident'`
5. Email verification sent (optional)
6. User redirected to login with pending message
7. Login blocked until approved
8. Barangay admin sees user in pending approvals list
9. Admin approves → `is_approved = true`, user can login
10. Admin rejects → user stays inactive

**Benefits:**
- Prevents unauthorized access
- Spam prevention
- Manual verification by barangay
- Audit trail of registrations

### 3. Automatic Barangay Admin Creation

**When creating a barangay:**
```javascript
POST /api/barangays
{
  "name": "Barangay San Jose",
  "address": "123 Main St",
  "municipality": "Quezon City",
  "province": "Metro Manila",
  // Optional admin customization
  "admin_email": "admin@sanjose.local",
  "admin_password": "CustomPassword123",
  "admin_first_name": "Juan",
  "admin_last_name": "Dela Cruz"
}
```

**System Response:**
```json
{
  "message": "Barangay created successfully",
  "barangay": { ... },
  "adminUser": {
    "id": 5,
    "email": "admin@sanjose.local",
    "role": "admin",
    "barangay_id": 3
  },
  "defaultCredentials": {
    "email": "admin@sanjose.local",
    "password": "CustomPassword123",
    "warning": "Please change password after first login"
  }
}
```

**Default Credentials (if not provided):**
- Email: `admin@{barangayname}.local`
- Password: `{BarangayName}Admin123`

### 4. Document Management System

**Document Lifecycle:**
1. **Request Created** → Status: `pending`
   - Staff creates document request for resident
   - System generates control number
   - Purpose and amount recorded

2. **Processing** → Status: `processing`
   - Staff reviews and prepares document
   - Can update details, amount, notes

3. **Ready for Release** → Status: `ready`
   - Document approved and ready
   - PDF generated with barangay letterhead
   - OR number assigned

4. **Released** → Status: `released`
   - Document handed to resident
   - Release date recorded
   - Payment confirmed

**PDF Generation:**
- Professional template with barangay logo
- Digital signatures (if configured)
- QR code for verification (optional)
- Watermark and security features

**Control Number System:**
- Format: `{PREFIX}-{YEAR}-{SEQUENCE}`
- Auto-increments per barangay per year
- Examples:
  - `BAR-2026-00001` (Barangay Clearance)
  - `COR-2026-00123` (Certificate of Residency)
  - `BUS-2026-00045` (Business Clearance)

### 5. Incident Reporting (Blotter System)

**Features:**
- Blotter number generation: `BLT-{YEAR}-{SEQUENCE}`
- Complainant and respondent tracking
- Witness information
- Incident timeline
- Actions taken log
- Resolution tracking
- Status workflow: pending → investigating → resolved/dismissed
- Attachment support
- Email notifications

**Use Cases:**
- Noise complaints
- Property disputes
- Domestic issues (for record-keeping)
- Community conflicts
- Minor incidents requiring barangay intervention

### 6. Business Registry & Permits

**Business Registration:**
- Business name, trade name, owner
- Business type (sole proprietorship, partnership, corporation)
- Business nature (retail, service, manufacturing, etc.)
- DTI registration linkage
- Employee count tracking

**Permit Management:**
- Annual permit issuance
- Expiry tracking
- Renewal workflow
- Fee calculation
- Expiring permits alert (30 days before)
- Permit history
- Status: active, expired, revoked, suspended

### 7. Reports & Analytics

**Dashboard Statistics:**
- Total residents, households, businesses
- Pending documents count
- Pending incidents count
- Active permits count
- Expiring permits alert
- Recent activity feed

**Population Reports:**
- Gender distribution
- Age group breakdown
- Civil status distribution
- Special categories (voters, PWD, seniors, 4Ps, solo parents)
- Educational attainment
- Employment status

**Financial Reports:**
- Document revenue (by type, date range)
- Permit fees collected
- Monthly/annual trends
- Top revenue sources

**Excel Exports:**
- Complete resident list
- Business registry
- Document issuance records
- Customizable date ranges and filters

### 8. Security Features

**Implemented Security:**
- ✅ JWT token authentication
- ✅ Bcrypt password hashing
- ✅ Rate limiting (auth & general API)
- ✅ Helmet.js security headers
- ✅ CORS configuration
- ✅ Input validation and sanitization
- ✅ SQL injection prevention (Sequelize ORM)
- ✅ XSS protection
- ✅ Role-based access control
- ✅ Multi-tenant data isolation
- ✅ Email verification tokens
- ✅ Password reset with expiry
- ✅ User approval system
- ✅ Active barangay check
- ✅ Account status validation

**Rate Limiting:**
- Auth endpoints: 50 requests per 15 minutes
- General API: 1000 requests per 15 minutes
- Prevents brute force attacks

**Token Management:**
- Access token: 7 days expiry
- Refresh token: 30 days expiry
- Automatic token refresh on 401
- Logout clears all tokens

---

## Database Migrations

**Migration Files (`backend/migrations/`):**

1. `20240101000001-create-barangays.js` - Barangays table
2. `20240101000002-create-users.js` - Users table
3. `20240101000003-create-households.js` - Households table
4. `20240101000004-create-residents.js` - Residents table
5. `20240101000005-create-documents.js` - Documents table
6. `20240101000006-create-businesses.js` - Businesses table
7. `20240101000007-create-business-permits.js` - Business permits table
8. `20240101000008-create-officials.js` - Officials table
9. `20240101000009-create-incidents.js` - Incidents table
10. `20240101000010-create-announcements.js` - Announcements table
11. `20240101000011-create-events.js` - Events table
12. `20240101000012-add-user-approval-fields.js` - User approval system

**Seeders (`backend/seeders/`):**
- `20240101000001-barangays.js` - Sample barangays
- `20240101000002-users.js` - Default super admin

**Running Migrations:**
```bash
cd backend
npm run db:migrate        # Run all pending migrations
npm run db:migrate:undo   # Rollback last migration
npm run db:seed:all       # Run all seeders
```

---

## Environment Configuration

### Backend (.env)

```env
# Server
NODE_ENV=development
PORT=3000

# Database
DB_HOST=localhost
DB_PORT=3306
DB_NAME=barangay_system
DB_USER=root
DB_PASSWORD=your_password

# JWT
JWT_SECRET=your_super_secret_key_here
JWT_EXPIRE=7d
JWT_REFRESH_SECRET=your_refresh_secret_key
JWT_REFRESH_EXPIRE=30d

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:5173

# Email (Nodemailer)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=Barangay System <noreply@barangay.local>

# File Upload
MAX_FILE_SIZE=10485760  # 10MB

# Uploads URL (for serving files)
UPLOADS_URL=http://localhost:3000/uploads
```

### Frontend (.env)

```env
VITE_API_URL=http://localhost:3000/api
```

---

## Deployment Considerations

### Production Checklist

**Security:**
- [ ] Change all default passwords
- [ ] Use strong JWT secrets (minimum 32 characters)
- [ ] Enable HTTPS/SSL
- [ ] Configure proper CORS origins
- [ ] Set secure cookie flags
- [ ] Implement CSP headers
- [ ] Enable audit logging
- [ ] Regular security updates

**Database:**
- [ ] Use connection pooling
- [ ] Enable query logging (development only)
- [ ] Regular backups
- [ ] Database replication (optional)
- [ ] Index optimization

**Performance:**
- [ ] Enable Gzip compression
- [ ] Implement caching (Redis recommended)
- [ ] CDN for static assets
- [ ] Database query optimization
- [ ] Image optimization
- [ ] Lazy loading on frontend

**Monitoring:**
- [ ] Error tracking (Sentry, etc.)
- [ ] Uptime monitoring
- [ ] Performance monitoring
- [ ] Log aggregation
- [ ] Alert system

**Backups:**
- [ ] Daily database backups
- [ ] File upload backups
- [ ] Backup retention policy
- [ ] Disaster recovery plan

---

## Common Workflows

### Creating a New Barangay (Super Admin)

1. Login as super admin
2. Navigate to Barangays management
3. Click "Add Barangay"
4. Fill form with barangay details
5. (Optional) Customize admin credentials
6. Submit
7. System creates barangay + admin user
8. Note down admin credentials
9. Share credentials with barangay admin
10. Barangay admin logs in and changes password

### Resident Registration & Approval

1. Resident visits website
2. Clicks "Register"
3. Selects their barangay
4. Fills personal information
5. Submits registration
6. Receives "Pending Approval" message
7. Barangay admin logs in
8. Goes to "User Approvals" page
9. Reviews pending registration
10. Approves or rejects
11. Resident receives notification (if email configured)
12. Approved resident can now login

### Issuing a Document

1. Staff logs in
2. Goes to Documents section
3. Clicks "New Document"
4. Searches and selects resident
5. Chooses document type
6. Enters purpose and amount
7. Submits (status: pending)
8. Updates status to "processing" when working on it
9. Updates status to "ready" when completed
10. Enters OR number
11. Generates PDF
12. Prints document
13. Updates status to "released" after handing to resident

### Recording an Incident

1. Staff logs in
2. Goes to Incidents section
3. Clicks "New Incident"
4. Enters incident details:
   - Type, date, location
   - Complainant (search resident)
   - Respondent (search resident)
   - Description
5. Saves as "pending"
6. Updates to "investigating" when action taken
7. Adds notes on actions taken
8. When resolved, updates to "resolved" with resolution details
9. Generates blotter entry PDF

---

## Troubleshooting

### Common Issues

**Issue: "barangay_id is required"**
- **Cause:** Super admin trying to create data without specifying barangay
- **Solution:** Include `barangay_id` in request body

**Issue: "Your account is pending approval"**
- **Cause:** Resident registered but not yet approved by admin
- **Solution:** Contact barangay admin for approval

**Issue: "Cannot access data from another barangay"**
- **Cause:** User trying to access data from different barangay
- **Solution:** This is by design - multi-tenant isolation

**Issue: "Token expired"**
- **Cause:** JWT token expired (after 7 days)
- **Solution:** Automatic token refresh should handle this; if not, re-login

**Issue: Admin can't login after barangay creation**
- **Cause:** Using wrong credentials
- **Solution:** Use credentials from barangay creation response

**Issue: File upload fails**
- **Cause:** File size exceeds limit or wrong file type
- **Solution:** Check file size (max 10MB) and allowed types

---

## Future Enhancements

**Planned Features:**
1. **Email Notifications:**
   - User approval/rejection
   - Document status updates
   - Permit expiry alerts
   - Announcement notifications

2. **SMS Integration:**
   - OTP verification
   - Document ready alerts
   - Emergency announcements

3. **Payment Gateway:**
   - Online payment for documents
   - Online permit renewal
   - Payment history

4. **Mobile App:**
   - Resident mobile application
   - Push notifications
   - Document tracking
   - Announcement viewing

5. **Advanced Reporting:**
   - Custom report builder
   - Scheduled reports
   - Data visualization dashboards
   - Export to multiple formats

6. **Audit Logging:**
   - Complete activity logs
   - User action tracking
   - Data change history
   - Compliance reports

7. **Document Templates:**
   - Customizable document templates
   - Multi-language support
   - Digital signatures
   - QR code verification

8. **Chatbot Support:**
   - FAQ automation
   - Application status inquiry
   - Appointment scheduling

9. **GIS Integration:**
   - Map view of residents/households
   - Zone/purok mapping
   - Heat maps for incidents
   - Business location mapping

10. **Biometric Integration:**
    - Fingerprint verification
    - Photo capture with face detection
    - Biometric attendance for events

---

## System Files Reference

### Backend Structure

```
backend/
├── config/
│   ├── config.js          # Database configuration
│   ├── database.js        # Sequelize config
│   └── email.js           # Email service config
├── middleware/
│   ├── auth.js            # Authentication middleware
│   ├── barangayFilter.js  # Multi-tenancy middleware
│   ├── roleCheck.js       # Role-based access control
│   ├── upload.js          # File upload handling
│   └── validator.js       # Request validation
├── migrations/            # Database migrations
├── models/               # Sequelize models
├── routes/               # API route handlers
├── seeders/              # Database seeders
├── services/
│   ├── emailService.js   # Email operations
│   ├── pdfService.js     # PDF generation
│   └── uploadService.js  # File upload logic
├── uploads/              # Uploaded files storage
├── utils/
│   ├── helpers.js        # Utility functions
│   ├── jwt.js           # JWT utilities
│   └── logger.js        # Logging utilities
├── server.js            # Express app entry point
└── package.json         # Dependencies
```

### Frontend Structure

```
frontend/
├── public/              # Static assets
├── src/
│   ├── layouts/
│   │   ├── AuthLayout.tsx     # Login/register layout
│   │   └── DashboardLayout.tsx # Dashboard wrapper
│   ├── pages/
│   │   ├── auth/             # Auth pages
│   │   └── dashboard/        # Dashboard pages
│   ├── services/            # API service layer
│   ├── store/
│   │   └── authStore.ts     # Authentication state
│   ├── types/
│   │   └── index.ts         # TypeScript types
│   ├── App.tsx             # Main app component
│   ├── main.tsx            # Entry point
│   └── index.css           # Global styles
├── index.html
├── package.json
├── tailwind.config.js      # TailwindCSS config
├── tsconfig.json          # TypeScript config
└── vite.config.ts         # Vite config
```

---

## API Response Formats

### Success Response
```json
{
  "message": "Operation successful",
  "data": { ... },
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10
  }
}
```

### Error Response
```json
{
  "message": "Error message",
  "errors": [
    {
      "field": "email",
      "message": "Invalid email address"
    }
  ]
}
```

### Validation Error
```json
{
  "errors": [
    {
      "msg": "First name is required",
      "param": "first_name",
      "location": "body"
    }
  ]
}
```

---

## Testing Guide

### API Testing with Postman/Insomnia

**1. Setup Environment:**
- Base URL: `http://localhost:3000/api`
- Add Authorization header: `Bearer {token}`

**2. Test Authentication:**
```bash
# Register
POST /auth/register
Body: { email, password, first_name, last_name, barangay_id }

# Login
POST /auth/login
Body: { email, password }
Response: { user, accessToken, refreshToken }

# Get Profile
GET /auth/me
Headers: Authorization: Bearer {token}
```

**3. Test Multi-Tenancy:**
```bash
# Login as Admin of Barangay A
# Create resident → should have barangay_id = A
POST /residents
Body: { first_name, last_name, ... }

# Login as Admin of Barangay B
# List residents → should only see Barangay B residents
GET /residents

# Login as Super Admin
# List residents → should see ALL residents
GET /residents
```

**4. Test User Approval:**
```bash
# Register as resident
POST /auth/register

# Try to login → should fail with "pending approval"
POST /auth/login

# Login as admin
POST /auth/login

# Get pending approvals
GET /users/pending-approval/list

# Approve user
PUT /users/{id}/approve

# Login as resident → should succeed
POST /auth/login
```

---

## Support & Maintenance

### Log Files

**Backend Logs:**
- Application logs: `backend/logs/app.log`
- Error logs: `backend/logs/error.log`
- Access logs: `backend/logs/access.log`

**Database Logs:**
- Query logs (development): Printed to console
- Production: Configure MySQL slow query log

### Backup Procedures

**Database Backup:**
```bash
# Full backup
mysqldump -u root -p barangay_system > backup_$(date +%Y%m%d).sql

# Restore
mysql -u root -p barangay_system < backup_20260108.sql
```

**File Uploads Backup:**
```bash
# Backup uploads folder
tar -czf uploads_backup_$(date +%Y%m%d).tar.gz backend/uploads/

# Restore
tar -xzf uploads_backup_20260108.tar.gz -C backend/
```

### Health Monitoring

**Health Check Endpoint:**
```bash
GET /api/health
Response: { status: "OK", message: "Barangay Management System API is running" }
```

**Database Connection Check:**
```javascript
// In server.js startup
db.sequelize.authenticate()
  .then(() => console.log('Database connected'))
  .catch(err => console.error('Database connection error:', err));
```

---

## License & Credits

**System:** Barangay Management System
**Version:** 1.0.0
**Developed:** 2024-2026
**Purpose:** Local government unit management for Philippine barangays

---

## Conclusion

This documentation covers the complete implementation of the Barangay Management System, including architecture, features, API endpoints, security, deployment, and troubleshooting. The system is designed to be scalable, secure, and maintainable while providing comprehensive management capabilities for Philippine barangays.

For questions or support, refer to the troubleshooting section or contact the development team.
