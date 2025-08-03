$(document).ready(function () {
    const url = 'http://localhost:4000/'
    // Use localStorage for persistent cart, or switch to sessionStorage for session-only cart
    function getCart() {
        let cart = localStorage.getItem('cart');
        return cart ? JSON.parse(cart) : [];
    }

    function saveCart(cart) {
        localStorage.setItem('cart', JSON.stringify(cart));
    }

    function renderCart() {
        let cart = getCart();
        console.log('Cart contents:', cart); // Debug: Check cart contents
        let html = '';
        let total = 0;
        const shipping = 50.00;
        if (cart.length === 0) {
            html = `<div class="empty-cart-message">
                <i class="fas fa-shopping-cart"></i>
                <h3>Your cart is empty</h3>
                <p>Start shopping for amazing gadgets!</p>
                <a href="home.html" class="btn gadget-btn-primary mt-3">
                    <i class="fas fa-shopping-bag"></i> Start Shopping
                </a>
            </div>`;
        } else {
            html = `<div class="table-responsive">
                <table class="table table-bordered">
                <thead>
                    <tr>
                        <th><i class="fas fa-image"></i> Image</th>
                        <th><i class="fas fa-tag"></i> Name</th>
                        <th><i class="fas fa-info-circle"></i> Description</th>
                        <th><i class="fas fa-list"></i> Category</th>
                        <th><i class="fas fa-peso-sign"></i> Price</th>
                        <th><i class="fas fa-sort-numeric-up"></i> Qty</th>
                        <th><i class="fas fa-calculator"></i> Total</th>
                        <th><i class="fas fa-trash"></i> Remove</th>
                    </tr>
                </thead>
                <tbody>`;
            cart.forEach((item, idx) => {
                console.log(`Cart item ${idx}:`, item); // Debug: Check individual items
                let price = item.sell_price !== undefined ? item.sell_price : item.price;
                let subtotal = price * item.quantity;
                total += subtotal;
                
                // Fix image URL to use correct backend server
                let imageUrl = item.image;
                if (imageUrl && !imageUrl.startsWith('http')) {
                    // If the image path doesn't start with http, prepend the backend URL
                    if (imageUrl.startsWith('/')) {
                        imageUrl = `${url}${imageUrl.substring(1)}`;
                    } else {
                        imageUrl = `${url}${imageUrl}`;
                    }
                }
                
                html += `<tr>
                    <td><img src="${imageUrl || `${url}storage/images/placeholder.png`}" width="60" alt="${item.name}" onerror="this.src='${url}storage/images/placeholder.png'"></td>
                    <td><strong>${item.name || ''}</strong></td>
                    <td>${item.description || ''}</td>
                    <td><span class="badge badge-info">${item.category || ''}</span></td>
                    <td><strong>₱${(price).toFixed(2)}</strong></td>
                    <td>
                        <div class="input-group input-group-sm" style="max-width: 110px; margin: 0 auto;">
                            <div class="input-group-prepend">
                                <button class="btn btn-cart-qty-down" type="button" data-idx="${idx}">
                                    <i class="fas fa-minus"></i>
                                </button>
                            </div>
                            <input type="number" class="form-control cart-qty-input no-spinner" min="1" value="${item.quantity}" data-idx="${idx}" />
                            <div class="input-group-append">
                                <button class="btn btn-cart-qty-up" type="button" data-idx="${idx}">
                                    <i class="fas fa-plus"></i>
                                </button>
                            </div>
                        </div>
                    </td>
                    <td><strong>₱${(subtotal).toFixed(2)}</strong></td>
                    <td><button class="btn btn-danger btn-sm remove-item" data-idx="${idx}" title="Remove item">
                        <i class="fas fa-times"></i>
                    </button></td>
                </tr>`;
            });
            html += `</tbody></table>
                </div>
                <div class="cart-total-section">
                    <div class="row">
                        <div class="col-md-6 offset-md-6">
                            <h5 class="text-right">
                                <i class="fas fa-shopping-bag"></i> Items Total: 
                                <span class="text-primary">₱${total.toFixed(2)}</span>
                            </h5>
                            <h5 class="text-right">
                                <i class="fas fa-shipping-fast"></i> Shipping Fee: 
                                <span class="text-info">₱${shipping.toFixed(2)}</span>
                            </h5>
                            <h4 class="text-right">
                                <i class="fas fa-receipt"></i> Grand Total: 
                                <span>₱${(total + shipping).toFixed(2)}</span>
                            </h4>
                        </div>
                    </div>
                </div>
                <style>
                  input.cart-qty-input.no-spinner::-webkit-outer-spin-button,
                  input.cart-qty-input.no-spinner::-webkit-inner-spin-button {
                    -webkit-appearance: none;
                    margin: 0;
                  }
                  input.cart-qty-input.no-spinner[type=number] {
                    -moz-appearance: textfield;
                  }
                  
                  /* Cart styling improvements */
                  .gadget-cart-container {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    min-height: 100vh;
                    padding: 20px 0;
                  }
                  
                  .gadget-cart-title {
                    color: white;
                    text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
                    margin-bottom: 30px;
                  }
                  
                  .gadget-cart-table {
                    background: white;
                    border-radius: 15px;
                    padding: 20px;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.3);
                  }
                  
                  .table th {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    border: none;
                    font-weight: 600;
                  }
                  
                  .table td {
                    vertical-align: middle;
                    border-color: #e9ecef;
                  }
                  
                  .btn-cart-qty-up, .btn-cart-qty-down {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    border: none;
                    color: white;
                    font-size: 0.8rem;
                    padding: 0.25rem 0.5rem;
                  }
                  
                  .btn-cart-qty-up:hover, .btn-cart-qty-down:hover {
                    background: linear-gradient(135deg, #764ba2 0%, #667eea 100%);
                    color: white;
                  }
                  
                  .cart-total-section {
                    background: #f8f9fa;
                    padding: 20px;
                    border-radius: 10px;
                    margin-top: 20px;
                    border: 2px solid #667eea;
                  }
                  
                  .empty-cart-message {
                    text-align: center;
                    padding: 60px 20px;
                    color: #6c757d;
                  }
                  
                  .empty-cart-message i {
                    font-size: 4rem;
                    color: #dee2e6;
                    margin-bottom: 20px;
                  }
                  
                  .cart-actions {
                    text-align: center;
                  }
                  
                  .gadget-btn-primary {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    border: none;
                    padding: 12px 30px;
                    border-radius: 25px;
                    font-weight: 600;
                    color: white;
                    transition: all 0.3s ease;
                  }
                  
                  .gadget-btn-primary:hover {
                    background: linear-gradient(135deg, #764ba2 0%, #667eea 100%);
                    transform: translateY(-2px);
                    color: white;
                  }
                  
                  .gadget-btn-secondary {
                    background: transparent;
                    border: 2px solid white;
                    color: white;
                    padding: 12px 30px;
                    border-radius: 25px;
                    font-weight: 600;
                    margin-right: 15px;
                    transition: all 0.3s ease;
                  }
                  
                  .gadget-btn-secondary:hover {
                    background: white;
                    color: #667eea;
                    text-decoration: none;
                  }
                </style>`;
        }
        $('#cartTable').html(html);
    }

    // Add to cart logic (should be called from product/item page)
    window.addToCart = function(item) {
        let cart = getCart();
        // Check if item already exists in cart
        let idx = cart.findIndex(i => i.item_id === item.item_id);
        if (idx > -1) {
            cart[idx].quantity += item.quantity;
        } else {
            cart.push(item);
        }
        saveCart(cart);
        renderCart();
        
        // Update cart badge
        if (typeof window.updateCartBadge === 'function') {
            window.updateCartBadge();
        }
        
        Swal.fire({
            icon: 'success',
            text: 'Item added to cart!'
        });
    }

    $('#cartTable').on('click', '.remove-item', function () {
        let idx = $(this).data('idx');
        let cart = getCart();
        cart.splice(idx, 1);
        saveCart(cart);
        renderCart();
        
        // Update cart badge
        if (typeof window.updateCartBadge === 'function') {
            window.updateCartBadge();
        }
    });

    $('#header').load("header.html", function() {
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
                sessionStorage.clear();
                window.location.href = 'login.html';
            });
        }
    });

    function getUserId() {
        let userId = sessionStorage.getItem('userId');
        return userId ? JSON.parse(userId) : '';
    }
    function getJwtToken() {
        return sessionStorage.getItem('jwtToken') || '';
    }

    // Add function to check customer profile completeness
    function checkCustomerProfile() {
        return new Promise((resolve, reject) => {
            const userId = getUserId();
            const jwtToken = getJwtToken();
            
            if (!userId || !jwtToken) {
                reject('User not authenticated');
                return;
            }
            
            $.ajax({
                type: "GET",
                url: `${url}api/v1/customer/profile/${userId}`,
                headers: { 'Authorization': 'Bearer ' + jwtToken },
                success: function (response) {
                    console.log('Customer profile response:', response);
                    
                    // Check if customer profile exists and has required fields
                    if (response.success && response.customer) {
                        const customer = response.customer;
                        const requiredFields = ['address', 'city', 'phone'];
                        const missingFields = [];
                        
                        requiredFields.forEach(field => {
                            if (!customer[field] || customer[field].trim() === '') {
                                missingFields.push(field);
                            }
                        });
                        
                        if (missingFields.length > 0) {
                            reject({
                                type: 'incomplete_profile',
                                missingFields: missingFields,
                                customer: customer
                            });
                        } else {
                            resolve(customer);
                        }
                    } else {
                        reject({
                            type: 'no_profile',
                            message: 'Customer profile not found'
                        });
                    }
                },
                error: function (error) {
                    console.error('Error checking customer profile:', error);
                    if (error.status === 404) {
                        reject({
                            type: 'no_profile',
                            message: 'Customer profile not found'
                        });
                    } else if (error.status === 401) {
                        reject({
                            type: 'auth_error',
                            message: 'Authentication failed'
                        });
                    } else {
                        reject({
                            type: 'server_error',
                            message: 'Failed to check customer profile'
                        });
                    }
                }
            });
        });
    }

    // Function to show profile completion modal
    function showProfileCompletionModal(errorData) {
        let modalContent = '';
        let modalTitle = 'Complete Your Profile';
        
        if (errorData.type === 'no_profile') {
            modalContent = `
                <div class="alert alert-warning">
                    <i class="fas fa-exclamation-triangle"></i>
                    <strong>Profile Not Found</strong>
                </div>
                <p>You need to create a customer profile before you can checkout.</p>
                <p>Please go to your profile page and fill out your information including:</p>
                <ul>
                    <li><i class="fas fa-map-marker-alt"></i> Address</li>
                    <li><i class="fas fa-city"></i> City</li>
                    <li><i class="fas fa-phone"></i> Phone Number</li>
                </ul>
            `;
        } else if (errorData.type === 'incomplete_profile') {
            const fieldNames = {
                'address': 'Address',
                'city': 'City',
                'phone': 'Phone Number'
            };
            
            modalContent = `
                <div class="alert alert-info">
                    <i class="fas fa-info-circle"></i>
                    <strong>Profile Incomplete</strong>
                </div>
                <p>Your customer profile is missing some required information for checkout.</p>
                <p>Please complete the following fields:</p>
                <ul>
                    ${errorData.missingFields.map(field => 
                        `<li><i class="fas fa-exclamation-circle text-danger"></i> ${fieldNames[field] || field}</li>`
                    ).join('')}
                </ul>
                <p class="mt-3">You can update your profile information on the Profile page.</p>
            `;
        } else {
            modalContent = `
                <div class="alert alert-danger">
                    <i class="fas fa-times-circle"></i>
                    <strong>Error</strong>
                </div>
                <p>${errorData.message || 'An error occurred while checking your profile.'}</p>
                <p>Please try again or contact support if the problem persists.</p>
            `;
        }
        
        // Create and show Bootstrap modal
        const modalHtml = `
            <div class="modal fade" id="profileCompletionModal" tabindex="-1" role="dialog" aria-labelledby="profileCompletionModalLabel" aria-hidden="true">
                <div class="modal-dialog modal-dialog-centered" role="document">
                    <div class="modal-content">
                        <div class="modal-header bg-primary text-white">
                            <h5 class="modal-title" id="profileCompletionModalLabel">
                                <i class="fas fa-user-edit"></i> ${modalTitle}
                            </h5>
                            <button type="button" class="close text-white" data-dismiss="modal" aria-label="Close">
                                <span aria-hidden="true">&times;</span>
                            </button>
                        </div>
                        <div class="modal-body">
                            ${modalContent}
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-dismiss="modal">
                                <i class="fas fa-times"></i> Cancel
                            </button>
                            <a href="profile.html" class="btn btn-primary">
                                <i class="fas fa-user-edit"></i> Go to Profile
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Remove existing modal if any
        $('#profileCompletionModal').remove();
        
        // Add modal to body and show it
        $('body').append(modalHtml);
        $('#profileCompletionModal').modal('show');
        
        // Clean up modal when hidden
        $('#profileCompletionModal').on('hidden.bs.modal', function () {
            $(this).remove();
        });
    }

    // Separate function for the actual checkout process
    function proceedWithCheckout(cart) {
        const payload = JSON.stringify({
            user: { id: getUserId() },
            cart
        });
        
        $.ajax({
            type: "POST",
            url: `${url}api/v1/create-order`,
            data: payload,
            dataType: "json",
            processData: false,
            contentType: 'application/json; charset=utf-8',
            headers: getJwtToken() ? { 'Authorization': 'Bearer ' + getJwtToken() } : {},
            success: function (data) {
                Swal.fire({
                    icon: "success",
                    title: "Order Created Successfully!",
                    text: data.message,
                    timer: 3000,
                    timerProgressBar: true
                });
                localStorage.removeItem('cart');
                renderCart();
                
                // Update cart badge after successful checkout
                if (typeof window.updateCartBadge === 'function') {
                    window.updateCartBadge();
                }
            },
            error: function (error) {
                let msg = 'An error occurred during checkout.';
                if (error.status === 401) {
                    msg = '401 Unauthorized: Please log in again.';
                } else if (error.status === 403) {
                    msg = '403 Forbidden: You are not allowed to perform this action.';
                } else if (error.responseJSON && error.responseJSON.message) {
                    msg = error.responseJSON.message;
                }
                Swal.fire({
                    icon: 'error',
                    title: 'Checkout Failed',
                    text: msg
                }).then(() => {
                    if (error.status === 401) {
                        sessionStorage.clear();
                        window.location.href = 'login.html';
                    }
                });
            }
        });
    }

    $('#checkoutBtn').on('click', function () {
        let cart = getCart();
        
        // Check if user is logged in
        if (!getUserId()) {
            Swal.fire({
                icon: 'warning',
                text: 'You must be logged in to checkout.',
                showConfirmButton: true
            }).then(() => {
                window.location.href = 'login.html';
            });
            return;
        }
        
        // Check if cart is empty
        if (cart.length === 0) {
            Swal.fire({
                icon: 'info',
                text: 'Your cart is empty.'
            });
            return;
        }
        
        // Show loading while checking profile
        const $checkoutBtn = $(this);
        const originalText = $checkoutBtn.html();
        $checkoutBtn.prop('disabled', true).html('<i class="fas fa-spinner fa-spin"></i> Checking Profile...');
        
        // Check customer profile before proceeding with checkout
        checkCustomerProfile()
            .then((customerProfile) => {
                console.log('Customer profile is complete:', customerProfile);
                
                // Reset button
                $checkoutBtn.prop('disabled', false).html(originalText);
                
                // Proceed with checkout
                proceedWithCheckout(cart);
            })
            .catch((error) => {
                console.error('Customer profile check failed:', error);
                
                // Reset button
                $checkoutBtn.prop('disabled', false).html(originalText);
                
                if (error.type === 'auth_error') {
                    Swal.fire({
                        icon: 'warning',
                        title: 'Authentication Required',
                        text: 'Your session has expired. Please log in again.',
                        showConfirmButton: true
                    }).then(() => {
                        sessionStorage.clear();
                        window.location.href = 'login.html';
                    });
                } else {
                    // Show profile completion modal
                    showProfileCompletionModal(error);
                }
            });
    });

    // Quantity up/down and input change handlers for cart
    $('#cartTable').off('click', '.btn-cart-qty-up').on('click', '.btn-cart-qty-up', function() {
        let idx = $(this).data('idx');
        let cart = getCart();
        let max = 99; // Optionally set a max stock limit
        if (cart[idx].quantity < max) {
            cart[idx].quantity++;
            saveCart(cart);
            renderCart();
            
            // Update cart badge
            if (typeof window.updateCartBadge === 'function') {
                window.updateCartBadge();
            }
        }
    });
    $('#cartTable').off('click', '.btn-cart-qty-down').on('click', '.btn-cart-qty-down', function() {
        let idx = $(this).data('idx');
        let cart = getCart();
        let min = 1;
        if (cart[idx].quantity > min) {
            cart[idx].quantity--;
            saveCart(cart);
            renderCart();
            
            // Update cart badge
            if (typeof window.updateCartBadge === 'function') {
                window.updateCartBadge();
            }
        }
    });
    $('#cartTable').off('input', '.cart-qty-input').on('input', '.cart-qty-input', function() {
        let idx = $(this).data('idx');
        let cart = getCart();
        let min = 1;
        let val = parseInt($(this).val()) || min;
        if (val < min) val = min;
        cart[idx].quantity = val;
        saveCart(cart);
        renderCart();
        
        // Update cart badge
        if (typeof window.updateCartBadge === 'function') {
            window.updateCartBadge();
        }
    });

    renderCart();
});