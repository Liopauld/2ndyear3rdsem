# Role & Status Refresh Authentication System

## Overview

This system provides **continuous monitoring** of user authentication status, roles, and permissions to prevent unauthorized access and ensure real-time security.

## Key Features

### 🔄 **Continuous Monitoring**
- **Automatic Checks**: Every 30 seconds
- **Status Monitoring**: Tracks user account status (active/inactive)
- **Role Monitoring**: Tracks user role changes (user/admin)
- **Real-time Updates**: Immediate response to permission changes

### 🛡️ **Security Features**
- **Session Validation**: Continuous JWT token validation
- **Permission Enforcement**: Automatic redirects for unauthorized access
- **Account Deactivation**: Immediate logout when account is deactivated
- **Role-based Access**: Page access control based on current role

### 🔧 **Manual Refresh**
- **Role Refresh**: Immediate role permission check
- **Status Refresh**: Immediate account status check
- **Admin Controls**: Manual refresh buttons on admin pages

## How It Works

### 1. **Automatic Monitoring**
```javascript
// Checks every 30 seconds
setInterval(() => {
    performAuthCheck();
}, 30000);
```

### 2. **Status Changes**
- **Account Deactivated**: Immediate logout with notification
- **Role Changed**: Redirect if no longer has page access
- **Session Expired**: Automatic logout and redirect to login

### 3. **Permission Enforcement**
- **Admin Pages**: Only accessible to admin users
- **User Pages**: Accessible to all active users
- **Real-time Updates**: Immediate response to permission changes

## File Structure

```
JQuery_ade-main/
├── js/
│   ├── auth-checker.js          # Main authentication checker
│   └── refresh-utility.js       # Manual refresh utilities
├── pages/
│   ├── user.html                # Admin user management
│   ├── dashboard.html           # Admin dashboard
│   ├── orders.html              # Admin orders
│   ├── home.html                # User home page
│   └── profile.html             # User profile
└── AUTH_SYSTEM.md              # This documentation
```

## API Endpoints

### Authentication Status
- `GET /api/v1/users/auth-status` - Check current user status and role
- **Headers**: `Authorization: Bearer <jwt_token>`
- **Response**: User status, role, and permissions

## Usage Examples

### **Automatic Monitoring**
```javascript
// Automatically starts when user logs in
window.authChecker = new AuthChecker();
```

### **Manual Refresh**
```javascript
// Manual role refresh
window.authChecker.refreshRole();

// Manual status refresh
window.authChecker.refreshStatus();
```

### **Permission Checking**
```javascript
// Check if user has admin permission
if (window.authChecker.hasPermission('admin')) {
    // Show admin features
}

// Check if user is active
if (window.authChecker.hasPermission('active')) {
    // Allow access
}
```

### **Get Current User Info**
```javascript
const userInfo = window.authChecker.getCurrentUser();
console.log(userInfo);
// {
//   id: "123",
//   email: "user@example.com",
//   role: "admin",
//   status: "active",
//   lastCheck: "1640995200000"
// }
```

## Admin Interface

### **Refresh Buttons**
- **Location**: Top-right corner of admin pages
- **Role Button**: Blue button with user-shield icon
- **Status Button**: Green button with toggle icon
- **Auto-hide**: Click outside to hide

### **Admin Pages with Refresh**
- `/user.html` - User management
- `/dashboard.html` - Admin dashboard
- `/orders.html` - Order management

## Event System

### **Login Events**
```javascript
// Triggered when user logs in
$(document).on('userLoggedIn', () => {
    // Start monitoring
});
```

### **Logout Events**
```javascript
// Triggered when user logs out
$(document).on('userLoggedOut', () => {
    // Stop monitoring
});
```

## Security Scenarios

### **Account Deactivated**
1. Admin deactivates user account
2. System detects status change within 30 seconds
3. User is immediately logged out
4. Notification: "Account Deactivated"

### **Role Changed**
1. Admin changes user role from admin to user
2. System detects role change
3. If user is on admin page, redirected to home
4. Notification: "Access Restricted"

### **Session Expired**
1. JWT token expires
2. Next auth check fails
3. User logged out automatically
4. Redirected to login page

## Configuration

### **Check Intervals**
```javascript
// In auth-checker.js
this.checkInterval = 30000; // 30 seconds
this.minCheckInterval = 5000; // 5 seconds minimum
```

### **Page Access Rules**
```javascript
const adminPages = ['user.html', 'dashboard.html', 'orders.html'];
const userPages = ['home.html', 'profile.html', 'cart.html', 'myorders.html'];
```

## Error Handling

### **Network Errors**
- **Temporary**: Logs warning, continues monitoring
- **Persistent**: Eventually logs out user

### **Authentication Errors**
- **401 Unauthorized**: Immediate logout
- **403 Forbidden**: Immediate logout with reason

### **Server Errors**
- **500 Errors**: Logs error, continues monitoring
- **Timeout**: Retries with exponential backoff

## Benefits

### 🔒 **Enhanced Security**
- Real-time permission enforcement
- Immediate response to account changes
- Prevents unauthorized access

### 👥 **User Experience**
- Seamless role transitions
- Clear notifications for changes
- Automatic redirects when needed

### 🛠️ **Admin Control**
- Manual refresh capabilities
- Real-time status monitoring
- Immediate permission updates

### 📊 **Monitoring**
- Continuous status tracking
- Role change detection
- Session validation

## Troubleshooting

### **Common Issues**

**Q: Refresh buttons not appearing?**
A: Ensure you're on an admin page (user.html, dashboard.html, orders.html)

**Q: Auth checks not working?**
A: Check browser console for network errors or JWT token issues

**Q: Manual refresh not responding?**
A: Verify auth-checker.js is loaded and window.authChecker exists

### **Debug Mode**
```javascript
// Enable debug logging
console.log('Auth checker status:', window.authChecker);
console.log('Current user:', window.authChecker.getCurrentUser());
console.log('Has admin permission:', window.authChecker.hasPermission('admin'));
```

## Future Enhancements

- [ ] Add more granular permissions
- [ ] Implement role-based UI elements
- [ ] Add audit logging for permission changes
- [ ] Create admin notification system
- [ ] Add session timeout warnings

---

**Note**: This system ensures that users cannot access unauthorized pages even while logged in, providing real-time security and permission enforcement. 