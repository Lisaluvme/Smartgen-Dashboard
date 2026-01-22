# SmartGen Dashboard - Airtable Integration

## Overview
The SmartGen Dashboard uses Airtable API for user authentication and token management.

## Airtable Configuration

### API Configuration
- **API Key**: `pat0RN2dMiFb4ZgwA`
- **Base ID**: `appXg0HFmWSpwzY5g`
- **Table ID**: `tblc0wGUoMGAfaAqI`
- **API URL**: `https://api.airtable.com/v0/appXg0HFmWSpwzY5g/tblc0wGUoMGAfaAqI`

### Airtable Table Structure
The Airtable table should contain the following fields:
- **Email** (Email field): User's Gmail address
- **Password** (Single line text): User's password
- **Token** (Single line text): User's access token for genset data
- **Site** (Single line text): User's site/location name

## Authentication Flow

### 1. Login Process
1. User enters their Gmail address and password
2. System queries Airtable for matching email and password
3. If record found, extract Token and Site fields
4. Store user data in sessionStorage (24-hour expiry)
5. Redirect to dashboard

### 2. Dashboard Access
1. Check sessionStorage for valid login data
2. Extract token and site from stored data
3. Use token to fetch genset data from genset API
4. Filter gensets based on user's token(s)

### 3. Session Management
- Login data stored in sessionStorage
- 24-hour expiry
- Automatic login on page refresh if session valid
- Logout clears all data

## API Integration

### Fetch User from Airtable
```javascript
async function fetchUserFromAirtable(email, password) {
  // Filter records by email and password
  const filterFormula = `AND(FIND("${email}", LOWER({Email})) > 0, {Password} = "${password}")`;
  const url = `${AIRTABLE_API_URL}?filterByFormula=${encodeURIComponent(filterFormula)}`;
  
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${AIRTABLE_API_KEY}`
    }
  });
  
  return await response.json();
}
```

### Expected Response
```json
{
  "records": [
    {
      "id": "recXXXXXXXXXXXXXX",
      "fields": {
        "Email": "user@gmail.com",
        "Password": "password123",
        "Token": "SITE_A",
        "Site": "Factory A"
      }
    }
  ]
}
```

## User Flow

1. **Login Page**
   - User enters Gmail address and password
   - Clicks "Login" button
   - System queries Airtable with email and password
   - If user found, direct to dashboard
   - If not found, show "Invalid email or password" error

2. **Dashboard**
   - Dashboard loads with genset data filtered by user's token
   - Header displays: Email, Token, and Site
   - Auto-refreshes every 30 seconds

3. **Logout**
   - Clears sessionStorage
   - Returns to login page

## Features

✅ **Gmail + Password login** - Secure authentication with password
✅ **Gmail validation** - Ensures valid Gmail address format
✅ **Error handling** - User-friendly error messages
✅ **Session persistence** - Login state maintained across page refreshes (24 hours)
✅ **Auto-refresh** - Dashboard refreshes every 30 seconds
✅ **Responsive design** - Works on all screen sizes

## Error Handling

The system handles various error scenarios:
- Invalid Gmail format (must be @gmail.com)
- Empty email or password input
- Network failures
- Invalid email or password combination
- Missing token in Airtable record
- Session expiry

## Testing Checklist

- [ ] Test with valid Gmail and correct password that exists in Airtable
- [ ] Test with valid Gmail but wrong password
- [ ] Test with invalid Gmail address (non-Gmail)
- [ ] Test with malformed Gmail (should show validation error)
- [ ] Test network error scenarios
- [ ] Test session persistence (refresh page after login)
- [ ] Test logout functionality
- [ ] Test dashboard displays correct gensets for user's token
- [ ] Test auto-refresh works every 30 seconds
- [ ] Test on mobile devices
- [ ] Test on desktop browsers

## Files Modified

1. `index.html` - Login form with email input
2. `script.js` - Airtable API integration for user authentication
3. `styles.css` - Dashboard styling

## Deployment Notes

- No server-side changes required
- Airtable API key is stored in client-side JavaScript
- Ensure CORS is configured correctly for Airtable API calls
- Airtable API key should be kept secure and not committed to public repositories

## Security Considerations

⚠️ **Important Security Notes**:
1. **API Key Exposure**: The Airtable API key is stored in client-side JavaScript (`script.js`). For production, consider:
   - Using a proxy server to hide the API key
   - Using Netlify Functions or similar serverless functions

2. **Password Storage**: Passwords are stored in plain text in Airtable. For production, consider:
   - Using hashed passwords (bcrypt, etc.)
   - Implementing proper password encryption
   - Using a dedicated authentication service (Firebase Auth, Auth0, etc.)

3. **Password Transmission**: Passwords are sent in plain text. For production, ensure:
   - HTTPS is always used
   - Consider implementing OAuth or token-based authentication

## Future Enhancements

To add extra fields in the future:
1. Update Airtable table with new fields
2. Extract new fields from Airtable response in `handleLogin()`
3. Store new fields in sessionStorage
4. Display new fields in dashboard header or UI elements

Example additions: phone number, device status, company name, role/permissions, etc.
