$(document).ready(function () {
    // Load header with enhanced navigation
    $('#header').load('header.html', function() {
        if (!sessionStorage.getItem('userId')) {
            // Hide Profile menu if not logged in
            $('a.nav-link[href="profile.html"]').closest('.nav-item').hide();
            // Show Register and Login
            $('a.nav-link[href="register.html"]').closest('.nav-item').show();
            $('a.nav-link[href="login.html"]').closest('.nav-item').show();
        } else {
            // If logged in, show Profile, hide Register, change Login to Logout
            $('a.nav-link[href="profile.html"]').closest('.nav-item').show();
            $('a.nav-link[href="register.html"]').closest('.nav-item').hide();
            const $loginLink = $('a.nav-link[href="login.html"]');
            $loginLink.text('Logout').attr({ 'href': '#', 'id': 'logout-link' }).on('click', function (e) {
                e.preventDefault();
                
                // Enhanced logout confirmation with GadgetEssence styling
                Swal.fire({
                    title: 'Logout Confirmation',
                    text: 'Are you sure you want to logout?',
                    icon: 'question',
                    showCancelButton: true,
                    confirmButtonColor: '#667eea',
                    cancelButtonColor: '#6c757d',
                    confirmButtonText: '<i class="fas fa-sign-out-alt"></i> Yes, Logout',
                    cancelButtonText: '<i class="fas fa-times"></i> Cancel',
                    customClass: {
                        popup: 'gadget-logout-popup'
                    }
                }).then((result) => {
                    if (result.isConfirmed) {
                        sessionStorage.clear();
                        window.location.href = 'login.html';
                    }
                });
            });
        }
    });
    
    // Initialize variables
    const url = 'http://localhost:4000/';
    const userId = sessionStorage.getItem('userId') ? JSON.parse(sessionStorage.getItem('userId')) : '';
    const jwtToken = sessionStorage.getItem('jwtToken') || '';
    let allOrders = []; // Store all orders for filtering
    
    // Enhanced authentication check
    if (!userId || !jwtToken) {
        Swal.fire({
            title: 'Authentication Required',
            text: 'You must be logged in to view your orders.',
            icon: 'warning',
            confirmButtonColor: '#667eea',
            confirmButtonText: '<i class="fas fa-sign-in-alt"></i> Go to Login',
            customClass: {
                popup: 'gadget-auth-popup'
            }
        }).then(() => {
            window.location.href = 'login.html';
        });
        return;
    }
    
    // Enhanced loading indicator
    function showLoading() {
        $('#ordersTable').html(`
            <div class="gadget-loading-container">
                <div class="gadget-loading-spinner">
                    <i class="fas fa-circle-notch fa-spin"></i>
                </div>
                <h5 class="gadget-loading-text">Loading your orders...</h5>
                <p class="gadget-loading-subtext">Please wait while we fetch your order history</p>
            </div>
        `);
    }
    
    // Show loading initially
    showLoading();
    // Load orders with enhanced error handling
    $.ajax({
        url: `${url}api/v1/orders/user/${userId}`,
        method: 'GET',
        dataType: 'json',
        headers: { 'Authorization': 'Bearer ' + jwtToken },
        success: function (res) {
            if (!res.orders || res.orders.length === 0) {
                $('#ordersTable').html(`
                    <div class="gadget-empty-orders">
                        <div class="gadget-empty-icon">
                            <i class="fas fa-shopping-bag"></i>
                        </div>
                        <h3 class="gadget-empty-title">No Orders Found</h3>
                        <p class="gadget-empty-text">You haven't placed any orders yet. Start shopping for amazing gadgets!</p>
                        <div class="gadget-empty-actions">
                            <a href="home.html" class="btn gadget-btn-primary gadget-btn-large">
                                <i class="fas fa-shopping-cart"></i> Start Shopping
                            </a>
                            <a href="profile.html" class="btn gadget-btn-secondary gadget-btn-large">
                                <i class="fas fa-user"></i> View Profile
                            </a>
                        </div>
                    </div>
                `);
                return;
            }
            
            // Store orders for filtering
            allOrders = res.orders;
            displayOrders(allOrders);
        },
        error: function (err) {
            let msg = 'Failed to load orders. Please try again.';
            let icon = 'error';
            
            if (err.status === 401) {
                msg = 'Your session has expired. Please log in again.';
                icon = 'warning';
            } else if (err.status === 404) {
                msg = 'Orders not found. You may not have any orders yet.';
                icon = 'info';
            } else if (err.status >= 500) {
                msg = 'Server error. Please try again later.';
            }
            
            Swal.fire({
                title: 'Error Loading Orders',
                text: msg,
                icon: icon,
                confirmButtonColor: '#667eea',
                confirmButtonText: '<i class="fas fa-refresh"></i> Retry',
                showCancelButton: true,
                cancelButtonText: '<i class="fas fa-home"></i> Go Home',
                customClass: {
                    popup: 'gadget-error-popup'
                }
            }).then((result) => {
                if (result.isConfirmed) {
                    location.reload();
                } else if (result.isDismissed) {
                    if (err.status === 401) {
                        sessionStorage.clear();
                        window.location.href = 'login.html';
                    } else {
                        window.location.href = 'home.html';
                    }
                }
            });
        }
    });
    
    // Enhanced order display function
    function displayOrders(orders) {
        let html = '<div class="gadget-orders-grid">';
        
        orders.forEach(function(order, orderIdx) {
            // Enhanced order data processing
            const lastName = order.last_name || '';
            const firstName = order.first_name || '';
            const address = order.address || '';
            const city = order.city || '';
            const phone = order.phone || '';
            const shipping = order.shipping !== undefined ? Number(order.shipping) : 50.00;
            const orderDate = order.date_ordered ? new Date(order.date_ordered) : new Date();
            
            // Enhanced status handling
            const status = order.status || 'processing';
            const statusInfo = getStatusInfo(status);
            
            html += `
            <div class="gadget-user-order-card" data-status="${status}" data-order-id="${order.order_id}">
                <div class="gadget-order-card-header">
                    <div class="gadget-order-meta">
                        <div class="gadget-order-number">
                            <i class="fas fa-hashtag"></i>
                            <span class="order-id">Order #${order.order_id}</span>
                        </div>
                        <div class="gadget-order-date">
                            <i class="fas fa-calendar-alt"></i>
                            <span>${orderDate.toLocaleDateString('en-US', { 
                                year: 'numeric', 
                                month: 'long', 
                                day: 'numeric' 
                            })}</span>
                        </div>
                    </div>
                    <div class="gadget-order-status">
                        <span class="gadget-status-badge ${statusInfo.class}">
                            <i class="${statusInfo.icon}"></i>
                            ${statusInfo.label}
                        </span>
                    </div>
                </div>
                
                <div class="gadget-order-card-body">
                    <div class="gadget-customer-info">
                        <h6 class="gadget-section-title">
                            <i class="fas fa-user"></i> Delivery Information
                        </h6>
                        <div class="gadget-info-grid">
                            <div class="gadget-info-item">
                                <span class="gadget-info-label">Name:</span>
                                <span class="gadget-info-value">${lastName}, ${firstName}</span>
                            </div>
                            <div class="gadget-info-item">
                                <span class="gadget-info-label">Address:</span>
                                <span class="gadget-info-value">${address}${city ? ', ' + city : ''}</span>
                            </div>
                            <div class="gadget-info-item">
                                <span class="gadget-info-label">Phone:</span>
                                <span class="gadget-info-value">${phone}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="gadget-order-items">
                        <h6 class="gadget-section-title">
                            <i class="fas fa-box"></i> Order Items
                        </h6>
                        <div class="gadget-items-list">`;
            
            let total = 0;
            (order.items || []).forEach(function(item, itemIdx) {
                let price = Number(item.sell_price !== undefined ? item.sell_price : item.price) || 0;
                let subtotal = price * (item.quantity || 1);
                total += subtotal;
                
                // Enhanced image handling
                let imageHtml = '';
                if (Array.isArray(item.images) && item.images.length > 0) {
                    imageHtml = `<img src='${url}${item.images[0]}' alt='${item.name || 'Product'}' class='gadget-item-image' />`;
                } else {
                    imageHtml = `<div class="gadget-item-placeholder"><i class="fas fa-image"></i></div>`;
                }
                
                html += `
                <div class="gadget-order-item">
                    <div class="gadget-item-image-container">
                        ${imageHtml}
                    </div>
                    <div class="gadget-item-details">
                        <h6 class="gadget-item-name">${item.name || 'Unknown Product'}</h6>
                        <div class="gadget-item-meta">
                            <span class="gadget-item-price">₱${price.toFixed(2)}</span>
                            <span class="gadget-item-qty">Qty: ${item.quantity || 1}</span>
                            <span class="gadget-item-subtotal">₱${subtotal.toFixed(2)}</span>
                        </div>
                    </div>
                </div>`;
            });
            
            html += `
                        </div>
                    </div>
                    
                    <div class="gadget-order-total">
                        <div class="gadget-total-breakdown">
                            <div class="gadget-total-row">
                                <span class="gadget-total-label">
                                    <i class="fas fa-shopping-bag"></i> Items Total:
                                </span>
                                <span class="gadget-total-value">₱${total.toFixed(2)}</span>
                            </div>
                            <div class="gadget-total-row">
                                <span class="gadget-total-label">
                                    <i class="fas fa-shipping-fast"></i> Shipping Fee:
                                </span>
                                <span class="gadget-total-value">₱${shipping.toFixed(2)}</span>
                            </div>
                            <div class="gadget-total-row gadget-grand-total">
                                <span class="gadget-total-label">
                                    <i class="fas fa-receipt"></i> Grand Total:
                                </span>
                                <span class="gadget-total-value">₱${(total + shipping).toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="gadget-order-actions">
                        <button class="btn gadget-btn-primary gadget-btn-receipt view-receipt" data-orderid="${order.order_id}">
                            <i class="fas fa-eye"></i> View Receipt
                        </button>
                        <button class="btn gadget-btn-secondary gadget-btn-receipt download-receipt" data-orderid="${order.order_id}">
                            <i class="fas fa-download"></i> Download PDF
                        </button>
                    </div>
                </div>
            </div>`;
        });
        
        html += '</div>';
        $('#ordersTable').html(html);
    }
    
    // Enhanced status information
    function getStatusInfo(status) {
        const statusMap = {
            'processing': {
                label: 'Processing',
                class: 'gadget-status-processing',
                icon: 'fas fa-clock'
            },
            'delivered': {
                label: 'Delivered',
                class: 'gadget-status-delivered',
                icon: 'fas fa-check-circle'
            },
            'canceled': {
                label: 'Canceled',
                class: 'gadget-status-canceled',
                icon: 'fas fa-times-circle'
            }
        };
        
        return statusMap[status] || {
            label: 'Unknown',
            class: 'gadget-status-unknown',
            icon: 'fas fa-question-circle'
        };
    }
    // Enhanced filtering and search functionality
    $('#statusFilter').on('change', function() {
        filterOrders();
    });
    
    $('#orderSearch').on('input', function() {
        filterOrders();
    });
    
    function filterOrders() {
        const statusFilter = $('#statusFilter').val();
        const searchTerm = $('#orderSearch').val().toLowerCase();
        
        let filteredOrders = allOrders.filter(order => {
            // Status filter
            if (statusFilter && order.status !== statusFilter) {
                return false;
            }
            
            // Search filter
            if (searchTerm) {
                const orderIdMatch = order.order_id.toString().includes(searchTerm);
                const itemsMatch = (order.items || []).some(item => 
                    (item.name || '').toLowerCase().includes(searchTerm)
                );
                
                if (!orderIdMatch && !itemsMatch) {
                    return false;
                }
            }
            
            return true;
        });
        
        if (filteredOrders.length === 0) {
            $('#ordersTable').html(`
                <div class="gadget-no-results">
                    <div class="gadget-no-results-icon">
                        <i class="fas fa-search"></i>
                    </div>
                    <h4 class="gadget-no-results-title">No Orders Found</h4>
                    <p class="gadget-no-results-text">
                        No orders match your current filter criteria. Try adjusting your search or filter settings.
                    </p>
                    <button class="btn gadget-btn-secondary" onclick="clearFilters()">
                        <i class="fas fa-refresh"></i> Clear Filters
                    </button>
                </div>
            `);
        } else {
            displayOrders(filteredOrders);
        }
    }
    
    // Clear filters function
    window.clearFilters = function() {
        $('#statusFilter').val('');
        $('#orderSearch').val('');
        displayOrders(allOrders);
    };
    
    // Enhanced receipt viewing functionality
    $(document).on('click', '.view-receipt', function() {
        const orderId = $(this).data('orderid');
        const $button = $(this);
        
        if (!jwtToken) {
            Swal.fire({
                title: 'Authentication Required',
                text: 'You must be logged in to view the receipt.',
                icon: 'warning',
                confirmButtonColor: '#667eea',
                customClass: {
                    popup: 'gadget-auth-popup'
                }
            });
            return;
        }
        
        // Show loading state
        $button.prop('disabled', true).html('<i class="fas fa-spinner fa-spin"></i> Loading...');
        
        $.ajax({
            url: `${url}api/v1/orders/${orderId}/receipt-html`,
            method: 'GET',
            headers: { 'Authorization': 'Bearer ' + jwtToken },
            success: function (data) {
                // Reset button
                $button.prop('disabled', false).html('<i class="fas fa-eye"></i> View Receipt');
                
                // Open receipt in new window
                const receiptWindow = window.open('', '_blank', 'width=800,height=600,scrollbars=yes,resizable=yes');
                if (receiptWindow) {
                    receiptWindow.document.open();
                    receiptWindow.document.write(data);
                    receiptWindow.document.close();
                    receiptWindow.focus();
                } else {
                    Swal.fire({
                        title: 'Popup Blocked',
                        text: 'Please allow popups for this site to view the receipt.',
                        icon: 'warning',
                        confirmButtonColor: '#667eea',
                        customClass: {
                            popup: 'gadget-warning-popup'
                        }
                    });
                }
            },
            error: function (err) {
                // Reset button
                $button.prop('disabled', false).html('<i class="fas fa-eye"></i> View Receipt');
                
                let msg = 'Failed to load receipt. Please try again.';
                if (err.status === 401) {
                    msg = 'Your session has expired. Please log in again.';
                } else if (err.status === 404) {
                    msg = 'Receipt not found for this order.';
                } else if (err.responseJSON && err.responseJSON.message) {
                    msg = err.responseJSON.message;
                }
                
                Swal.fire({
                    title: 'Error Loading Receipt',
                    text: msg,
                    icon: 'error',
                    confirmButtonColor: '#667eea',
                    customClass: {
                        popup: 'gadget-error-popup'
                    }
                }).then(() => {
                    if (err.status === 401) {
                        sessionStorage.clear();
                        window.location.href = 'login.html';
                    }
                });
            }
        });
    });
    
    // Enhanced PDF download functionality
    $(document).on('click', '.download-receipt', function() {
        const orderId = $(this).data('orderid');
        const $button = $(this);
        
        if (!jwtToken) {
            Swal.fire({
                title: 'Authentication Required',
                text: 'You must be logged in to download the receipt.',
                icon: 'warning',
                confirmButtonColor: '#667eea',
                customClass: {
                    popup: 'gadget-auth-popup'
                }
            });
            return;
        }
        
        // Show loading state
        $button.prop('disabled', true).html('<i class="fas fa-spinner fa-spin"></i> Downloading...');
        
        $.ajax({
            url: `${url}api/v1/orders/${orderId}/receipt-pdf`,
            method: 'GET',
            xhrFields: { responseType: 'blob' },
            headers: { 'Authorization': 'Bearer ' + jwtToken },
            success: function (data, status, xhr) {
                // Reset button
                $button.prop('disabled', false).html('<i class="fas fa-download"></i> Download PDF');
                
                // Create download link
                const blob = new Blob([data], { type: 'application/pdf' });
                const link = document.createElement('a');
                link.href = window.URL.createObjectURL(blob);
                link.download = `GadgetEssence_Order_${orderId}_Receipt.pdf`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                
                // Success notification
                Swal.fire({
                    title: 'Download Complete',
                    text: `Receipt for Order #${orderId} has been downloaded successfully.`,
                    icon: 'success',
                    timer: 3000,
                    timerProgressBar: true,
                    confirmButtonColor: '#667eea',
                    customClass: {
                        popup: 'gadget-success-popup'
                    }
                });
            },
            error: function (err) {
                // Reset button
                $button.prop('disabled', false).html('<i class="fas fa-download"></i> Download PDF');
                
                let msg = 'Failed to download receipt. Please try again.';
                if (err.status === 401) {
                    msg = 'Your session has expired. Please log in again.';
                } else if (err.status === 404) {
                    msg = 'Receipt not found for this order.';
                } else if (err.responseJSON && err.responseJSON.message) {
                    msg = err.responseJSON.message;
                }
                
                // Commented out SweetAlert modal to prevent false error messages during successful downloads
                /*
                Swal.fire({
                    title: 'Download Failed',
                    text: msg,
                    icon: 'error',
                    confirmButtonColor: '#667eea',
                    customClass: {
                        popup: 'gadget-error-popup'
                    }
                }).then(() => {
                    if (err.status === 401) {
                        sessionStorage.clear();
                        window.location.href = 'login.html';
                    }
                });
                */
                
                // Only handle authentication errors
                if (err.status === 401) {
                    sessionStorage.clear();
                    window.location.href = 'login.html';
                }
            }
        });
    });
});
