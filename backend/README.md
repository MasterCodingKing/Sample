# Barangay Management System - Backend API

A comprehensive multi-tenant backend API for the Barangay Management System serving 5 barangays in Malvar, Batangas.

## 🚀 Quick Start

### Prerequisites

- Node.js (v18+)
- MySQL (v8.0+)
- npm or yarn

### Installation

1. **Clone and navigate to backend directory**

```bash
cd backend
```

2. **Install dependencies**

```bash
npm install
```

3. **Configure environment variables**

```bash
cp .env.example .env
# Edit .env with your database credentials and configuration
```

4. **Create the database**

```sql
CREATE DATABASE barangay_system;
```

5. **Run migrations**

```bash
npm run migrate
```

6. **Seed initial data**

```bash
npm run seed
```

7. **Start the server**

```bash
# Development mode
npm run dev

# Production mode
npm start
```

## 📁 Project Structure

```
backend/
├── config/
│   ├── config.js       # Sequelize configuration
│   ├── database.js     # Database connection
│   └── email.js        # Email configuration
├── middleware/
│   ├── auth.js         # JWT authentication
│   ├── barangayFilter.js # Multi-tenant filtering
│   ├── roleCheck.js    # Role-based access control
│   ├── upload.js       # File upload handling
│   └── validator.js    # Request validation
├── migrations/         # Database migrations
├── models/             # Sequelize models
├── routes/
│   ├── auth.js         # Authentication routes
│   ├── residents.js    # Resident management
│   ├── households.js   # Household management
│   ├── documents.js    # Document requests
│   ├── officials.js    # Barangay officials
│   ├── incidents.js    # Blotter/Incidents
│   ├── businesses.js   # Business registration
│   ├── businessPermits.js # Business permits
│   ├── announcements.js # Announcements
│   ├── events.js       # Events calendar
│   ├── reports.js      # Reports & analytics
│   ├── barangays.js    # Barangay management
│   ├── users.js        # User management
│   └── contact.js      # Contact form
├── seeders/            # Database seeders
├── services/
│   ├── emailService.js # Email sending
│   ├── pdfService.js   # PDF generation
│   └── uploadService.js # File management
├── utils/
│   ├── jwt.js          # JWT utilities
│   ├── helpers.js      # Helper functions
│   └── logger.js       # Logging utility
├── uploads/            # Uploaded files
├── .env.example        # Environment template
├── .sequelizerc        # Sequelize CLI config
├── package.json
├── server.js           # Application entry point
└── README.md
```

## 🔐 Authentication

The API uses JWT-based authentication with access and refresh tokens.

### Default Credentials

**Super Admin:**

- Email: `superadmin@barangay.gov.ph`
- Password: `SuperAdmin@123`

**Barangay Admins:**

- Email: `admin.luta-sur@barangay.gov.ph`
- Email: `admin.luta-norte@barangay.gov.ph`
- Email: `admin.san-pio@barangay.gov.ph`
- Email: `admin.san-greg@barangay.gov.ph`
- Email: `admin.santiago@barangay.gov.ph`
- Password: `SuperAdmin@123`

### Role Hierarchy

1. `super_admin` - System-wide access
2. `admin` - Full barangay access
3. `captain` - Barangay captain
4. `secretary` - Document processing
5. `treasurer` - Financial records
6. `staff` - General staff
7. `resident` - Limited access

## 📡 API Endpoints

### Authentication

| Method | Endpoint                        | Description            |
| ------ | ------------------------------- | ---------------------- |
| POST   | `/api/auth/register`            | Register new user      |
| POST   | `/api/auth/login`               | User login             |
| POST   | `/api/auth/logout`              | User logout            |
| POST   | `/api/auth/refresh-token`       | Refresh access token   |
| POST   | `/api/auth/forgot-password`     | Request password reset |
| POST   | `/api/auth/reset-password`      | Reset password         |
| GET    | `/api/auth/verify-email/:token` | Verify email           |
| GET    | `/api/auth/me`                  | Get current user       |

### Residents

| Method | Endpoint                    | Description          |
| ------ | --------------------------- | -------------------- |
| GET    | `/api/residents`            | List all residents   |
| GET    | `/api/residents/:id`        | Get resident details |
| POST   | `/api/residents`            | Create new resident  |
| PUT    | `/api/residents/:id`        | Update resident      |
| DELETE | `/api/residents/:id`        | Delete resident      |
| GET    | `/api/residents/statistics` | Get statistics       |

### Documents

| Method | Endpoint                      | Description            |
| ------ | ----------------------------- | ---------------------- |
| GET    | `/api/documents`              | List document requests |
| GET    | `/api/documents/:id`          | Get document details   |
| POST   | `/api/documents`              | Request new document   |
| PUT    | `/api/documents/:id/status`   | Update status          |
| GET    | `/api/documents/:id/download` | Download PDF           |

### Other Endpoints

- `/api/households` - Household management
- `/api/officials` - Barangay officials
- `/api/incidents` - Blotter records
- `/api/businesses` - Business registry
- `/api/business-permits` - Permit management
- `/api/announcements` - Announcements
- `/api/events` - Events calendar
- `/api/reports` - Reports & analytics
- `/api/barangays` - Barangay management
- `/api/users` - User management
- `/api/contact` - Contact form

## 🏗️ Multi-Tenant Architecture

All data is isolated by barangay using the `barangay_id` field. The `barangayFilter` middleware automatically applies filtering to all queries based on the authenticated user's barangay.

**Super Admin Exception:** Users with `super_admin` role can access data from all barangays.

## 📧 Email Configuration

The system uses Nodemailer with Gmail SMTP for sending emails:

1. Enable 2-Factor Authentication on your Gmail account
2. Generate an App Password
3. Add credentials to `.env`:

```
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
```

## 📄 License

MIT License

---

Built for the Municipality of Malvar, Batangas
