# API Quick Reference - Barangay System

## Fixed Issues

### 400 Bad Request Errors - RESOLVED ✅
The 400 errors were caused by:
1. Missing barangay_id validation
2. Inconsistent error messages
3. Middleware not properly handling super_admin vs regular admin cases

**Fix Applied**: Enhanced validation and error handling across all routes.

---

## New Features

### 1. Auto-Create Barangay Admin

**Endpoint**: `POST /api/barangays`

**Request**:
```json
{
  "name": "San Jose",
  "address": "123 Main St",
  "municipality": "Quezon City",
  "province": "Metro Manila",
  "contact_number": "09123456789",
  "email": "sanjose@barangay.gov.ph",
  
  // Optional admin customization
  "admin_email": "admin@sanjose.com",
  "admin_password": "CustomPassword123",
  "admin_first_name": "Juan",
  "admin_last_name": "Dela Cruz"
}
```

**Response**:
```json
{
  "message": "Barangay created successfully with default admin user",
  "barangay": {
    "id": 1,
    "name": "San Jose",
    ...
  },
  "admin": {
    "id": 2,
    "email": "admin@sanjose.local",
    "default_password": "SanJoseAdmin123",
    "message": "Please change the default password after first login"
  }
}
```

**Default Credentials** (if not customized):
- Email: `admin@{barangay_name_lowercase}.local`
- Password: `{BarangayName}Admin123`

---

### 2. Resident Registration with Approval

#### A. Register Resident

**Endpoint**: `POST /api/auth/register`

**Request**:
```json
{
  "first_name": "Juan",
  "last_name": "Dela Cruz",
  "email": "juan@example.com",
  "password": "SecurePass123",
  "phone": "09123456789",
  "barangay_id": 1  // REQUIRED - Barangay selection
}
```

**Response** (Success):
```json
{
  "message": "Registration successful. Your account is pending approval from the barangay administrator.",
  "user": {
    "id": 10,
    "email": "juan@example.com",
    "first_name": "Juan",
    "last_name": "Dela Cruz",
    "barangay_id": 1,
    "barangay_name": "San Jose",
    "approval_status": "pending"
  }
}
```

**Note**: User CANNOT login until approved by barangay admin.

---

#### B. Login (with approval check)

**Endpoint**: `POST /api/auth/login`

**Request**:
```json
{
  "email": "juan@example.com",
  "password": "SecurePass123"
}
```

**Response** (If Not Approved):
```json
{
  "message": "Your account is pending approval from the barangay administrator.",
  "approval_status": "pending"
}
```

**Response** (If Approved):
```json
{
  "message": "Login successful",
  "user": {
    "id": 10,
    "email": "juan@example.com",
    "first_name": "Juan",
    "last_name": "Dela Cruz",
    "role": "resident",
    "barangay_id": 1,
    "barangay": {
      "id": 1,
      "name": "San Jose",
      "logo_url": "/uploads/logo.png"
    },
    "is_approved": true
  },
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc..."
}
```

---

### 3. User Approval Endpoints (Admin Only)

#### A. Get Pending Users

**Endpoint**: `GET /api/users/pending-approval/list`

**Headers**: `Authorization: Bearer {token}`

**Response**:
```json
{
  "users": [
    {
      "id": 10,
      "email": "juan@example.com",
      "first_name": "Juan",
      "last_name": "Dela Cruz",
      "phone": "09123456789",
      "barangay": {
        "id": 1,
        "name": "San Jose"
      },
      "approval_status": "pending",
      "created_at": "2026-01-08T10:30:00Z"
    }
  ],
  "count": 1
}
```

---

#### B. Approve User

**Endpoint**: `PUT /api/users/:id/approve`

**Headers**: `Authorization: Bearer {token}`

**Response**:
```json
{
  "message": "User approved successfully",
  "user": {
    "id": 10,
    "email": "juan@example.com",
    "first_name": "Juan",
    "last_name": "Dela Cruz",
    "approval_status": "approved",
    "is_approved": true
  }
}
```

---

#### C. Reject User

**Endpoint**: `PUT /api/users/:id/reject`

**Headers**: `Authorization: Bearer {token}`

**Request** (Optional):
```json
{
  "reason": "Invalid information provided"
}
```

**Response**:
```json
{
  "message": "User registration rejected",
  "user": {
    "id": 10,
    "email": "juan@example.com",
    "approval_status": "rejected"
  }
}
```

---

## Barangay Data Isolation

### How It Works

All data is automatically filtered by `barangay_id`:

1. **Super Admin** (`role = 'super_admin'`, `barangay_id = null`)
   - Can see and manage ALL data across ALL barangays
   - No filtering applied

2. **Barangay Admin/Staff** (`role = 'admin'|'staff'`, `barangay_id = X`)
   - Can ONLY see and manage data from their barangay
   - All queries automatically filtered: `WHERE barangay_id = X`

3. **Resident** (`role = 'resident'`, `barangay_id = X`)
   - Can ONLY see their own barangay's data
   - Limited access based on permissions

### Affected Resources

All these resources are filtered by barangay_id:
- ✅ Residents
- ✅ Households
- ✅ Businesses
- ✅ Business Permits
- ✅ Documents
- ✅ Incidents
- ✅ Announcements
- ✅ Events
- ✅ Officials
- ✅ Users (except super admin view)

### Examples

```javascript
// Admin of Barangay 1 creates a resident
POST /api/residents
{
  "first_name": "Maria",
  "last_name": "Santos",
  ...
}
// System automatically sets: barangay_id = 1

// Admin of Barangay 1 fetches residents
GET /api/residents
// System automatically adds: WHERE barangay_id = 1
// Only sees residents from Barangay 1

// Admin of Barangay 2 fetches residents
GET /api/residents
// System automatically adds: WHERE barangay_id = 2
// Only sees residents from Barangay 2

// Super Admin fetches residents
GET /api/residents
// No filter applied
// Sees residents from ALL barangays
```

---

## Database Changes

### New Columns in `users` Table

```sql
-- Added columns
approval_status ENUM('pending', 'approved', 'rejected') DEFAULT 'approved'
is_approved BOOLEAN DEFAULT true
```

### Migration

Run the migration:
```bash
cd backend
npx sequelize-cli db:migrate
```

**Status**: ✅ Migration completed successfully

---

## User Roles and Permissions

| Role | barangay_id | Can See | Can Create/Edit |
|------|------------|---------|----------------|
| super_admin | NULL | All barangays | All barangays |
| admin | X | Barangay X only | Barangay X only |
| captain | X | Barangay X only | Barangay X only |
| secretary | X | Barangay X only | Barangay X only |
| treasurer | X | Barangay X only | Barangay X only |
| staff | X | Barangay X only | Barangay X only |
| resident | X | Limited | Very limited |

---

## Testing Checklist

### ✅ Test Barangay Creation
- [ ] Create barangay as super admin
- [ ] Verify admin user is created
- [ ] Login with admin credentials
- [ ] Verify admin can only see their barangay data

### ✅ Test Resident Registration
- [ ] Register as resident
- [ ] Select barangay
- [ ] Verify cannot login (pending)
- [ ] Login as admin
- [ ] Approve the resident
- [ ] Login as resident (should work now)

### ✅ Test Data Isolation
- [ ] Create data in Barangay A
- [ ] Create data in Barangay B
- [ ] Login as Admin A - should only see Barangay A data
- [ ] Login as Admin B - should only see Barangay B data
- [ ] Login as Super Admin - should see both

### ✅ Test 400 Errors Fixed
- [ ] Add resident - should work
- [ ] Edit resident - should work
- [ ] Delete resident - should work
- [ ] All CRUD operations should return proper error messages

---

## Common Error Messages

| Error | Meaning | Solution |
|-------|---------|----------|
| `barangay_id is required` | Super admin creating resource without barangay_id | Include barangay_id in request |
| `Please select a barangay` | Resident registering without barangay | Select barangay from dropdown |
| `Your account is pending approval` | Trying to login before admin approval | Wait for admin to approve |
| `Access denied. Cannot access data from another barangay` | Trying to access another barangay's data | Can only access your own barangay |
| `Invalid or inactive barangay` | Selected barangay doesn't exist or is disabled | Choose an active barangay |

---

## Frontend Integration

### User Approval Page

Add to your router:
```typescript
{
  path: '/dashboard/user-approvals',
  element: <UserApprovals />,
  // Only for admins
}
```

### Dashboard Widget (Recommended)

Add a widget showing pending approval count:
```typescript
const { data: pendingUsers } = useQuery(
  'pending-approvals',
  () => userService.getPendingApprovals()
)

// Show badge with count
<Badge>{pendingUsers?.count || 0}</Badge>
```

---

## Security Considerations

1. **Change Default Passwords**: Admins must change password after first login
2. **Email Verification**: Consider adding email verification for residents
3. **Rate Limiting**: Add to registration endpoint
4. **Audit Logging**: Log all approval/rejection actions
5. **Session Timeout**: Implement proper session management

---

## Support

If you encounter issues:
1. Check the [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md) for detailed documentation
2. Verify database migration ran successfully
3. Check backend console for error messages
4. Ensure user has proper role and barangay_id
