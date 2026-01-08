# Uploads Directory

This directory stores uploaded files for the Barangay Management System.

## Directory Structure

```
uploads/
├── residents/    # Resident photos
├── documents/    # Document attachments
├── officials/    # Official photos
├── businesses/   # Business documents
├── announcements/ # Announcement images
├── events/       # Event images
├── temp/         # Temporary files
└── avatars/      # User avatars
```

## Notes

- Files are automatically organized by type
- Temporary files are cleaned up periodically
- All uploads should be backed up regularly
- Maximum file size: 5MB (configurable in .env)
- Allowed types: JPEG, PNG, GIF, PDF

## Security

- Files are served through Express static middleware
- Filenames are sanitized to prevent directory traversal
- File types are validated on upload
