# Samadhan - API Documentation

Complete reference for all APIs, database tables, and real-time subscriptions.

---

## REST API Endpoints

### File Upload

```
POST /api/upload
```

Upload images for issue reporting or resolution.

**Request:**
- Content-Type: `multipart/form-data`
- Body: `file` (File) - Image file to upload

**Response:**
```json
{
  "url": "https://blob.vercel-storage.com/...",
  "filename": "original-name.jpg",
  "size": 123456,
  "type": "image/jpeg"
}
```

**Error Response:**
```json
{
  "error": "No file provided"
}
```

---

## Database Schema

### Tables Overview

| Table | Description |
|-------|-------------|
| `profiles` | User accounts and roles |
| `issues` | Reported infrastructure issues |
| `issue_responses` | Government responses to issues |
| `admin_actions` | Audit log for admin activities |

---

### profiles

User accounts linked to Supabase Auth.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid (PK) | Links to `auth.users.id` |
| `email` | text | User's email |
| `full_name` | text | Display name |
| `user_type` | text | `citizen`, `government`, `admin`, `super_admin` |
| `organization` | text | Organization (for government users) |
| `approval_status` | text | `pending`, `approved`, `rejected` |
| `approved_by` | uuid | Admin who approved |
| `approved_at` | timestamptz | Approval timestamp |
| `rejection_reason` | text | Reason if rejected |
| `created_at` | timestamptz | Account creation |
| `updated_at` | timestamptz | Last update |

**Row Level Security:**
- Users can view/edit their own profile
- Approved users can view other approved users
- Admins can view/edit all profiles

---

### issues

Infrastructure issues reported by citizens.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid (PK) | Unique issue ID |
| `title` | text | Issue title |
| `description` | text | Detailed description |
| `category` | text | `pothole`, `streetlight`, `sidewalk`, `traffic_sign`, `drainage`, `other` |
| `status` | text | `reported`, `in_progress`, `resolved`, `rejected` |
| `priority` | text | `low`, `medium`, `high`, `urgent` |
| `latitude` | decimal | GPS latitude |
| `longitude` | decimal | GPS longitude |
| `address` | text | Human-readable address |
| `photo_url` | text | URL to issue photo |
| `photo_filename` | text | Original filename |
| `reporter_id` | uuid (FK) | Citizen who reported |
| `assigned_to` | uuid (FK) | Assigned government user |
| `created_at` | timestamptz | Report time |
| `updated_at` | timestamptz | Last update |
| `resolved_at` | timestamptz | Resolution time |

**Row Level Security:**
- Anyone can view all issues
- Citizens can create/update their own issues
- Government/Admin can manage all issues

---

### issue_responses

Government responses to issues.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid (PK) | Response ID |
| `issue_id` | uuid (FK) | Related issue |
| `responder_id` | uuid (FK) | Government user |
| `response_type` | text | `status_update`, `resolution`, `rejection`, `request_info` |
| `message` | text | Response message |
| `photo_url` | text | Resolution photo (optional) |
| `photo_filename` | text | Original filename |
| `latitude` | decimal | Responder's location |
| `longitude` | decimal | For location verification |
| `created_at` | timestamptz | Response time |

---

### admin_actions

Audit log for admin activities.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid (PK) | Action ID |
| `admin_id` | uuid (FK) | Admin who performed action |
| `action_type` | text | `approve_user`, `reject_user`, `delete_user`, etc. |
| `target_id` | uuid | Target user/issue ID |
| `details` | jsonb | Additional action details |
| `created_at` | timestamptz | Action timestamp |

---

## Database Functions (RPC)

### approve_government_user

Approve a pending government user.

```typescript
const { data, error } = await supabase.rpc('approve_government_user', {
  user_id: 'uuid-of-user',
  admin_id: 'uuid-of-admin'
})
```

---

### reject_government_user

Reject a pending government user with reason.

```typescript
const { data, error } = await supabase.rpc('reject_government_user', {
  user_id: 'uuid-of-user',
  admin_id: 'uuid-of-admin',
  reason: 'Invalid credentials'
})
```

---

### get_pending_government_users

Get all government users awaiting approval.

```typescript
const { data, error } = await supabase.rpc('get_pending_government_users')
// Returns: Array<{ id, email, full_name, organization, created_at }>
```

---

### add_issue_response

Add a response to an issue and optionally update status.

```typescript
const { data, error } = await supabase.rpc('add_issue_response', {
  p_issue_id: 'uuid-of-issue',
  p_responder_id: 'uuid-of-responder',
  p_response_type: 'resolution',
  p_message: 'Issue has been fixed',
  p_photo_url: 'https://...',        // optional
  p_photo_filename: 'fix.jpg',       // optional
  p_latitude: 12.9716,               // optional
  p_longitude: 77.5946,              // optional
  p_new_status: 'resolved'           // optional
})
```

---

## Real-time Subscriptions

### Subscribe to Issues

```typescript
const supabase = createClient()

const channel = supabase
  .channel('issues-changes')
  .on('postgres_changes', 
    { event: '*', schema: 'public', table: 'issues' },
    (payload) => {
      console.log('Issue changed:', payload)
    }
  )
  .subscribe()

// Cleanup
channel.unsubscribe()
```

### Subscribe to Responses

```typescript
const channel = supabase
  .channel('responses-changes')
  .on('postgres_changes',
    { event: 'INSERT', schema: 'public', table: 'issue_responses' },
    (payload) => {
      console.log('New response:', payload.new)
    }
  )
  .subscribe()
```

---

## Authentication

Uses Supabase Auth with JWT tokens.

### Sign Up

```typescript
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'password123',
  options: {
    data: {
      full_name: 'John Doe',
      user_type: 'citizen' // or 'government'
    }
  }
})
```

### Sign In

```typescript
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password123'
})
```

### Get Current User

```typescript
const { data: { user } } = await supabase.auth.getUser()
```

### Sign Out

```typescript
await supabase.auth.signOut()
```

---

## Role-Based Access

| Role | Permissions |
|------|-------------|
| `citizen` | Report issues, view all issues, update own issues |
| `government` | View/update issues, add responses (requires approval) |
| `admin` | All above + approve users, manage all data |
| `super_admin` | All above + create new admins |
