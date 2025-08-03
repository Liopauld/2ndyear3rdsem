/**
 * Refresh Utility for Manual Role/Status Checks
 * Provides buttons and functions for immediate auth checks
 */

class RefreshUtility {
    constructor() {
        this.init();
    }

    init() {
        // Add refresh buttons to admin pages if they don't exist
        this.addRefreshButtons();
        
        // Set up event listeners
        this.setupEventListeners();
    }

    addRefreshButtons() {
        // Only add to admin pages
        const adminPages = ['user.html', 'dashboard.html', 'orders.html'];
        const currentPage = window.location.pathname.split('/').pop();
        
        if (adminPages.includes(currentPage)) {
            this.createRefreshButtons();
        }
    }

    createRefreshButtons() {
        // Check if buttons already exist
        if ($('#refreshButtons').length > 0) {
            return;
        }

        const refreshButtons = $(`
            <div id="refreshButtons" class="refresh-utility-container" style="
                position: fixed; top: 80px; right: 20px; z-index: 1000;
                background: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                padding: 10px; border: 1px solid #e0e0e0;
            ">
                <div style="font-size: 12px; color: #666; margin-bottom: 8px; font-weight: bold;">
                    <i class="fas fa-sync-alt"></i> Auth Refresh
                </div>
                <div style="display: flex; gap: 5px;">
                    <button id="refreshRoleBtn" class="btn btn-sm btn-outline-primary" 
                            style="font-size: 11px; padding: 4px 8px;" title="Refresh Role">
                        <i class="fas fa-user-shield"></i> Role
                    </button>
                    <button id="refreshStatusBtn" class="btn btn-sm btn-outline-success" 
                            style="font-size: 11px; padding: 4px 8px;" title="Refresh Status">
                        <i class="fas fa-toggle-on"></i> Status
                    </button>
                </div>
                <div id="refreshStatus" style="
                    font-size: 10px; color: #666; margin-top: 5px; text-align: center;
                "></div>
            </div>
        `);

        $('body').append(refreshButtons);
    }

    setupEventListeners() {
        // Role refresh button
        $(document).on('click', '#refreshRoleBtn', (e) => {
            e.preventDefault();
            this.refreshRole();
        });

        // Status refresh button
        $(document).on('click', '#refreshStatusBtn', (e) => {
            e.preventDefault();
            this.refreshStatus();
        });

        // Hide buttons when not on admin pages
        $(document).on('click', '#refreshButtons', (e) => {
            if (e.target.id === 'refreshButtons') {
                $(this).fadeOut();
            }
        });
    }

    refreshRole() {
        if (window.authChecker) {
            window.authChecker.refreshRole();
            this.showRefreshStatus('Role refresh initiated', 'primary');
        } else {
            this.showRefreshStatus('Auth checker not available', 'danger');
        }
    }

    refreshStatus() {
        if (window.authChecker) {
            window.authChecker.refreshStatus();
            this.showRefreshStatus('Status refresh initiated', 'success');
        } else {
            this.showRefreshStatus('Auth checker not available', 'danger');
        }
    }

    showRefreshStatus(message, type = 'info') {
        const statusEl = $('#refreshStatus');
        const colors = {
            'primary': '#007bff',
            'success': '#28a745',
            'danger': '#dc3545',
            'info': '#17a2b8'
        };

        statusEl.html(`<span style="color: ${colors[type] || colors.info};">${message}</span>`);
        
        setTimeout(() => {
            statusEl.html('');
        }, 2000);
    }

    // Public method to get current auth info
    getCurrentAuthInfo() {
        if (window.authChecker) {
            return window.authChecker.getCurrentUser();
        }
        return null;
    }

    // Public method to check permissions
    hasPermission(permission) {
        if (window.authChecker) {
            return window.authChecker.hasPermission(permission);
        }
        return false;
    }
}

// Initialize refresh utility when document is ready
$(document).ready(() => {
    window.refreshUtility = new RefreshUtility();
});

// Export for use in other modules
window.RefreshUtility = RefreshUtility; 