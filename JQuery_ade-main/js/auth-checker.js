/**
 * Authentication & Authorization Checker
 * Continuously monitors user status and role permissions
 */

class AuthChecker {
    constructor() {
        this.url = 'http://localhost:4000/';
        this.checkInterval = 30000; // Check every 30 seconds
        this.isChecking = false;
        this.lastCheck = 0;
        this.minCheckInterval = 5000; // Minimum 5 seconds between checks
        this.init();
    }

    init() {
        // Start monitoring if user is logged in
        if (this.isLoggedIn()) {
            this.startMonitoring();
        }

        // Listen for login/logout events
        $(document).on('userLoggedIn', () => {
            this.startMonitoring();
        });

        $(document).on('userLoggedOut', () => {
            this.stopMonitoring();
        });
    }

    isLoggedIn() {
        return sessionStorage.getItem('userId') && sessionStorage.getItem('jwtToken');
    }

    startMonitoring() {
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
        }

        // Initial check
        this.performAuthCheck();

        // Set up periodic checks
        this.monitoringInterval = setInterval(() => {
            this.performAuthCheck();
        }, this.checkInterval);

        console.log('🔐 Auth monitoring started');
    }

    stopMonitoring() {
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
            this.monitoringInterval = null;
        }
        console.log('🔐 Auth monitoring stopped');
    }

    performAuthCheck() {
        // Prevent multiple simultaneous checks
        if (this.isChecking) {
            return;
        }

        // Rate limiting
        const now = Date.now();
        if (now - this.lastCheck < this.minCheckInterval) {
            return;
        }

        this.isChecking = true;
        this.lastCheck = now;

        const userId = sessionStorage.getItem('userId');
        const jwtToken = sessionStorage.getItem('jwtToken');

        if (!userId || !jwtToken) {
            this.handleLogout('No valid session found');
            return;
        }

        // Check user status and role
        $.ajax({
            url: `${this.url}api/v1/users/auth-status`,
            method: 'GET',
            dataType: 'json',
            headers: {
                'Authorization': 'Bearer ' + jwtToken
            },
            success: (response) => {
                this.handleAuthResponse(response);
            },
            error: (xhr) => {
                this.handleAuthError(xhr);
            },
            complete: () => {
                this.isChecking = false;
            }
        });
    }

    handleAuthResponse(response) {
        if (!response.success) {
            this.handleLogout(response.message || 'Authentication failed');
            return;
        }

        const userData = response.user;
        const currentRole = sessionStorage.getItem('userRole');
        const currentStatus = sessionStorage.getItem('userStatus');

        // Check if status changed
        if (userData.status !== currentStatus) {
            sessionStorage.setItem('userStatus', userData.status);
            
            if (userData.status === 'inactive') {
                this.handleAccountDeactivated();
                return;
            }
        }

        // Check if role changed
        if (userData.role !== currentRole) {
            sessionStorage.setItem('userRole', userData.role);
            this.handleRoleChange(userData.role);
        }

        // Update last check timestamp
        sessionStorage.setItem('lastAuthCheck', Date.now().toString());
    }

    handleAuthError(xhr) {
        console.error('Auth check error:', xhr);
        
        if (xhr.status === 401) {
            this.handleLogout('Session expired. Please log in again.');
        } else if (xhr.status === 403) {
            this.handleLogout('Access denied. Your account may have been restricted.');
        } else {
            // Network error - don't logout immediately, just log
            console.warn('Network error during auth check, will retry');
        }
    }

    handleLogout(reason) {
        console.log('🔐 Logging out user:', reason);
        
        // Show notification
        Swal.fire({
            icon: 'warning',
            title: 'Session Ended',
            text: reason,
            confirmButtonText: 'OK',
            allowOutsideClick: false
        }).then(() => {
            this.forceLogout();
        });
    }

    handleAccountDeactivated() {
        console.log('🔐 Account deactivated');
        
        Swal.fire({
            icon: 'error',
            title: 'Account Deactivated',
            text: 'Your account has been deactivated by an administrator. Please contact support for assistance.',
            confirmButtonText: 'OK',
            allowOutsideClick: false
        }).then(() => {
            this.forceLogout();
        });
    }

    handleRoleChange(newRole) {
        console.log('🔐 Role changed to:', newRole);
        
        // Check if user is on a page they no longer have access to
        const currentPage = this.getCurrentPage();
        const hasAccess = this.checkPageAccess(currentPage, newRole);
        
        if (!hasAccess) {
            Swal.fire({
                icon: 'warning',
                title: 'Access Restricted',
                text: `Your role has been changed to ${newRole}. You no longer have access to this page.`,
                confirmButtonText: 'Go to Home',
                allowOutsideClick: false
            }).then(() => {
                window.location.href = 'home.html';
            });
        } else {
            // Show subtle notification
            this.showRoleChangeNotification(newRole);
        }
    }

    getCurrentPage() {
        const path = window.location.pathname;
        const page = path.split('/').pop() || 'home.html';
        return page;
    }

    checkPageAccess(page, role) {
        const adminPages = ['user.html', 'dashboard.html', 'orders.html'];
        const userPages = ['home.html', 'profile.html', 'cart.html', 'myorders.html'];
        
        if (adminPages.includes(page)) {
            return role === 'admin';
        }
        
        return true; // User pages are accessible to all logged-in users
    }

    showRoleChangeNotification(newRole) {
        // Show a subtle toast notification
        const toast = $(`
            <div class="auth-toast" style="
                position: fixed; top: 20px; right: 20px; 
                background: #667eea; color: white; padding: 10px 15px; 
                border-radius: 5px; z-index: 9999; font-size: 14px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.2);
            ">
                <i class="fas fa-user-shield"></i> Role updated to: ${newRole}
            </div>
        `);
        
        $('body').append(toast);
        
        setTimeout(() => {
            toast.fadeOut(() => toast.remove());
        }, 3000);
    }

    forceLogout() {
        // Clear session
        sessionStorage.clear();
        
        // Trigger logout event
        $(document).trigger('userLoggedOut');
        
        // Redirect to login
        window.location.href = 'login.html';
    }

    // Manual refresh methods for immediate checks
    refreshRole() {
        console.log('🔄 Manual role refresh requested');
        this.performAuthCheck();
    }

    refreshStatus() {
        console.log('🔄 Manual status refresh requested');
        this.performAuthCheck();
    }

    // Public method to check if user has specific permission
    hasPermission(permission) {
        const role = sessionStorage.getItem('userRole');
        const status = sessionStorage.getItem('userStatus');
        
        if (status !== 'active') {
            return false;
        }
        
        switch (permission) {
            case 'admin':
                return role === 'admin';
            case 'user':
                return role === 'user' || role === 'admin';
            case 'active':
                return status === 'active';
            default:
                return false;
        }
    }

    // Public method to get current user info
    getCurrentUser() {
        return {
            id: sessionStorage.getItem('userId'),
            email: sessionStorage.getItem('userEmail'),
            role: sessionStorage.getItem('userRole'),
            status: sessionStorage.getItem('userStatus'),
            lastCheck: sessionStorage.getItem('lastAuthCheck')
        };
    }
}

// Initialize auth checker when document is ready
$(document).ready(() => {
    window.authChecker = new AuthChecker();
});

// Export for use in other modules
window.AuthChecker = AuthChecker; 