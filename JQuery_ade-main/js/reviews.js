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
                
                // Enhanced logout confirmation
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
    const userId = sessionStorage.getItem('userId') ? JSON.parse(sessionStorage.getItem('userId')) : null;
    const jwtToken = sessionStorage.getItem('jwtToken') || '';
    let currentItemId = null;
    let allReviews = [];
    
    // Check if user is authenticated before proceeding
    if (!userId || !jwtToken) {
        showGadgetNotification('Please login to access the reviews page', 'warning');
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 2000);
        return;
    }
    
    // Initialize page
    loadDeliveredItems();
    setupStarRating();
    setupFormHandlers();
    setupFilters();
    checkAuthentication();
    
    // Check authentication status
    function checkAuthentication() {
        if (userId && jwtToken) {
            $('#reviewFormSection').show();
        } else {
            $('#reviewFormSection').hide();
            showGadgetNotification('Please login to write reviews', 'info');
        }
    }
    
    // Setup star rating functionality
    function setupStarRating() {
        $(document).on('click', '.gadget-star-rating .fa-star', function() {
            const rating = $(this).data('rating');
            const container = $(this).parent();
            const hiddenInput = container.siblings('input[type="hidden"]');
            
            // Update hidden input
            hiddenInput.val(rating);
            
            // Update star display
            container.find('.fa-star').each(function(index) {
                if (index < rating) {
                    $(this).removeClass('far').addClass('fas');
                } else {
                    $(this).removeClass('fas').addClass('far');
                }
            });
        });
    }
    
    // Setup form handlers
    function setupFormHandlers() {
        $('#submitReviewForm').on('submit', function(e) {
            e.preventDefault();
            submitReview();
        });
    }
    
    // Setup filters
    function setupFilters() {
        $('#reviewsFilter').on('change', function() {
            filterReviews();
        });
    }
    
    // Load delivered items from user's orders
    function loadDeliveredItems() {
        showLoading(true);
        
        $.ajax({
            url: `${url}api/v1/orders/user/${userId}`,
            method: 'GET',
            dataType: 'json',
            headers: { 'Authorization': 'Bearer ' + jwtToken },
            success: function(response) {
                if (response.success) {
                    const deliveredItems = extractDeliveredItems(response.orders);
                    if (deliveredItems.length > 0) {
                        // Load item images for delivered items
                        loadItemImages(deliveredItems).then((itemsWithImages) => {
                            loadItemReviews(itemsWithImages);
                            displayDeliveredItems(itemsWithImages);
                            hideItemSelection();
                        });
                    } else {
                        showNoDeliveredItems();
                    }
                } else {
                    showGadgetNotification('Failed to load your orders', 'error');
                }
            },
            error: function(err) {
                console.error('Error loading orders:', err);
                let errorMessage = 'Error loading your orders';
                
                if (err.status === 401) {
                    errorMessage = 'Please login to access your orders';
                    setTimeout(() => {
                        window.location.href = 'login.html';
                    }, 2000);
                } else if (err.status === 403) {
                    errorMessage = 'Access denied';
                } else if (err.status >= 500) {
                    errorMessage = 'Server error. Please try again later.';
                }
                
                showGadgetNotification(errorMessage, 'error');
            },
            complete: function() {
                showLoading(false);
            }
        });
    }

    // Extract delivered items from orders
    function extractDeliveredItems(orders) {
        const deliveredItems = [];
        const itemsMap = new Map();
        
        orders.forEach(order => {
            if (order.status === 'delivered' && order.items) {
                order.items.forEach(item => {
                    if (!itemsMap.has(item.item_id)) {
                        itemsMap.set(item.item_id, {
                            ...item,
                            order_id: order.order_id,
                            order_date: order.date_ordered,
                            delivery_date: order.date_delivery || order.updated_at
                        });
                    }
                });
            }
        });
        
        return Array.from(itemsMap.values());
    }

    // Load item images from items_images table
    function loadItemImages(items) {
        return new Promise((resolve) => {
            if (!items || items.length === 0) {
                resolve(items);
                return;
            }

            console.log('Loading images for items:', items);

            // Load each item's full details including images
            const promises = items.map(item => {
                return new Promise((itemResolve) => {
                    console.log(`Loading details for item ${item.item_id}`);
                    $.ajax({
                        url: `${url}api/v1/items/${item.item_id}`,
                        method: 'GET',
                        headers: { 'Authorization': 'Bearer ' + jwtToken },
                        success: function(response) {
                            console.log(`Response for item ${item.item_id}:`, response);
                            if (response.success && response.item) {
                                // Update item with full details including images
                                Object.assign(item, response.item);
                                console.log(`Updated item ${item.item_id} with images:`, item.images);
                            }
                            itemResolve(item);
                        },
                        error: function(err) {
                            console.error(`Error loading details for item ${item.item_id}:`, err);
                            itemResolve(item);
                        }
                    });
                });
            });

            Promise.all(promises).then((updatedItems) => {
                console.log('All items loaded with images:', updatedItems);
                resolve(updatedItems);
            });
        });
    }
    
    // Display delivered items with review actions
    function displayDeliveredItems(items) {
        const container = $('#deliveredItemsList');
        container.empty();
        
        if (items.length === 0) {
            container.html(`
                <div class="gadget-empty-items">
                    <div class="gadget-empty-icon">
                        <i class="fas fa-box-open"></i>
                    </div>
                    <h5>No Delivered Items</h5>
                    <p>You don't have any delivered items to review yet.</p>
                    <a href="home.html" class="btn gadget-btn-primary">
                        <i class="fas fa-shopping-cart"></i> Continue Shopping
                    </a>
                </div>
            `);
            return;
        }
        
        items.forEach(item => {
            const itemHtml = generateDeliveredItemHtml(item);
            container.append(itemHtml);
        });
        
        // Initialize carousels after items are added to DOM
        setTimeout(() => {
            $('.carousel').each(function() {
                $(this).carousel({
                    interval: false,
                    wrap: true,
                    ride: false
                });
            });
        }, 100);
    }

    // Generate delivered item HTML with review actions
    function generateDeliveredItemHtml(item) {
        console.log('Generating HTML for item:', item);
        
        // Fix date handling - check if delivery_date exists and is valid
        let deliveryDate = 'Unknown';
        console.log('Raw delivery_date:', item.delivery_date);
        console.log('Raw order date:', item.order_date);
        console.log('Full item object for date debugging:', item);
        
        // Try different date fields that might be available
        const dateToCheck = item.delivery_date || item.date_delivery || item.order_date || item.date_ordered || item.updated_at || item.created_at;
        console.log('Date to check:', dateToCheck);
        
        if (dateToCheck) {
            const date = new Date(dateToCheck);
            console.log('Parsed date:', date);
            if (!isNaN(date.getTime())) {
                deliveryDate = date.toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });
            }
        }
        
        console.log('Delivery date for item:', deliveryDate);
        console.log('Item images:', item.images);
        
        // Create a simple placeholder image URL (avoiding SVG encoding issues)
        const placeholderSvg = 'data:image/svg+xml;base64,' + btoa(`
            <svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
                <rect width="200" height="200" fill="#f8f9fa" stroke="#dee2e6" stroke-width="2"/>
                <text x="50%" y="45%" font-family="Arial,sans-serif" font-size="14" fill="#6c757d" text-anchor="middle">No Image</text>
                <text x="50%" y="60%" font-family="Arial,sans-serif" font-size="12" fill="#6c757d" text-anchor="middle">Available</text>
            </svg>
        `.trim());
        
        // Generate images carousel or single image
        let imagesHtml = '';
        if (Array.isArray(item.images) && item.images.length > 0) {
            console.log('Generating carousel for multiple images');
            const carouselId = 'carousel-review-' + item.item_id;
            imagesHtml = `<div id='${carouselId}' class='carousel slide' data-interval='false' data-ride='false' data-wrap='true'>`;
            
            // Add image count badge if multiple images
            if (item.images.length > 1) {
                imagesHtml += `<div class="gadget-image-count-badge">
                    <i class="fas fa-images"></i> ${item.images.length}
                </div>`;
            }
            
            imagesHtml += `<div class='carousel-inner'>`;
            
            item.images.forEach(function(img, idx) {
                console.log(`Image ${idx + 1} object:`, img);
                // Handle different image structures - check if it's a string or object
                let imageSrc;
                if (typeof img === 'string') {
                    // Direct image path like in home.js
                    imageSrc = `${url}${img}`;
                } else if (img && img.image_path) {
                    // Object with image_path property
                    imageSrc = `${url}storage/images/${img.image_path}`;
                } else if (img && img.path) {
                    // Object with path property
                    imageSrc = `${url}${img.path}`;
                } else {
                    // Fallback to placeholder
                    imageSrc = placeholderSvg;
                }
                console.log(`Image ${idx + 1} src:`, imageSrc);
                imagesHtml += `<div class='carousel-item${idx === 0 ? ' active' : ''}'>` +
                    `<img src='${imageSrc}' class='gadget-carousel-image' alt='${item.name} image ${idx + 1}' onerror="this.src='${placeholderSvg}'">` +
                    `</div>`;
            });
            
            imagesHtml += `</div>`;
            
            // Add navigation controls only if there are multiple images
            if (item.images.length > 1) {
                imagesHtml += `
                    <a class='carousel-control-prev' href='#${carouselId}' role='button' data-slide='prev'>
                        <span class='carousel-control-prev-icon' aria-hidden='true'></span>
                        <span class='sr-only'>Previous</span>
                    </a>
                    <a class='carousel-control-next' href='#${carouselId}' role='button' data-slide='next'>
                        <span class='carousel-control-next-icon' aria-hidden='true'></span>
                        <span class='sr-only'>Next</span>
                    </a>
                `;
                
                // Add indicators for multiple images
                imagesHtml += `<ol class='carousel-indicators'>`;
                item.images.forEach(function(img, idx) {
                    imagesHtml += `<li data-target='#${carouselId}' data-slide-to='${idx}'${idx === 0 ? ' class="active"' : ''}></li>`;
                });
                imagesHtml += `</ol>`;
            }
            
            imagesHtml += `</div>`;
        } else if (item.image_path) {
            // Fallback for legacy single image path
            console.log('Using single image fallback');
            const imageSrc = `${url}storage/images/${item.image_path}`;
            console.log('Single image src:', imageSrc);
            imagesHtml = `<img src="${imageSrc}" class="gadget-single-image" alt="${item.name}" onerror="this.src='${placeholderSvg}'">`;
        } else {
            // No images available
            console.log('No images available, using placeholder');
            imagesHtml = `<img src="${placeholderSvg}" class="gadget-single-image" alt="No image available">`;
        }
        
        // Check if user has already reviewed this item
        const userReview = item.userReview || null;
        const hasReview = userReview !== null;
        
        return `
            <div class="gadget-delivered-item-card" data-item-id="${item.item_id}">
                <div class="gadget-item-image">
                    ${imagesHtml}
                </div>
                <div class="gadget-item-details">
                    <h5 class="gadget-item-name">${item.name}</h5>
                    <p class="gadget-item-description">${item.description || 'No description available'}</p>
                    <div class="gadget-item-meta">
                        <span class="gadget-item-price">₱${parseFloat(item.price).toFixed(2)}</span>
                        <span class="gadget-delivery-info">
                            <i class="fas fa-truck"></i> Delivered on ${deliveryDate}
                        </span>
                    </div>
                    ${hasReview ? `
                        <div class="gadget-existing-review">
                            <div class="gadget-review-summary">
                                <div class="gadget-star-display">${generateStarsHtml(userReview.rating)}</div>
                                <span class="gadget-review-rating">${userReview.rating}/5</span>
                            </div>
                            ${userReview.review_text ? `
                                <p class="gadget-review-preview">"${userReview.review_text.substring(0, 100)}${userReview.review_text.length > 100 ? '...' : ''}"</p>
                            ` : ''}
                        </div>
                    ` : ''}
                </div>
                <div class="gadget-item-actions">
                    ${hasReview ? `
                        <button class="btn gadget-btn-secondary gadget-btn-sm" onclick="editItemReview(${item.item_id}, ${userReview.review_id}, ${userReview.rating}, '${(userReview.review_text || '').replace(/'/g, '\\\'').replace(/"/g, '&quot;')}', '${item.name}')">
                            <i class="fas fa-edit"></i> Edit Review
                        </button>
                        <button class="btn gadget-btn-outline gadget-btn-sm" onclick="viewItemReviews(${item.item_id}, '${item.name}')">
                            <i class="fas fa-eye"></i> View All Reviews
                        </button>
                        <button class="btn gadget-btn-danger gadget-btn-sm" onclick="deleteReview(${userReview.review_id})">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    ` : `
                        <button class="btn gadget-btn-primary gadget-btn-sm" onclick="writeItemReview(${item.item_id}, '${item.name}')">
                            <i class="fas fa-star"></i> Write Review
                        </button>
                        <button class="btn gadget-btn-outline gadget-btn-sm" onclick="viewItemReviews(${item.item_id}, '${item.name}')">
                            <i class="fas fa-eye"></i> View Reviews
                        </button>
                    `}
                </div>
            </div>
        `;
    }

    // Hide item selection section and show delivered items
    function hideItemSelection() {
        $('.gadget-item-selection-section').hide();
        $('#deliveredItemsSection').show();
    }

    // Show no delivered items message
    function showNoDeliveredItems() {
        $('.gadget-item-selection-section').hide();
        $('#deliveredItemsSection').show();
        displayDeliveredItems([]);
    }
    
    // Load reviews for delivered items and check user's existing reviews
    function loadItemReviews(deliveredItems) {
        if (!deliveredItems || deliveredItems.length === 0) return;
        
        // Load user's existing reviews to check which items they've already reviewed
        $.ajax({
            url: `${url}api/v1/my-reviews`,
            method: 'GET',
            headers: { 'Authorization': 'Bearer ' + jwtToken },
            success: function(response) {
                if (response.success) {
                    // Map user reviews to items
                    const userReviewsMap = new Map();
                    response.reviews.forEach(review => {
                        userReviewsMap.set(review.item_id, review);
                    });
                    
                    // Add user review info to delivered items
                    deliveredItems.forEach(item => {
                        item.userReview = userReviewsMap.get(item.item_id) || null;
                    });
                    
                    displayDeliveredItems(deliveredItems);
                }
            },
            error: function(err) {
                console.log('Could not load user reviews:', err);
                // Still display items even if we can't load reviews
                displayDeliveredItems(deliveredItems);
            }
        });
    }
    
    // Load reviews data
    function loadReviewsData(itemId) {
        return new Promise((resolve, reject) => {
            // Prepare headers - include auth token if available
            const headers = {};
            if (jwtToken) {
                headers['Authorization'] = 'Bearer ' + jwtToken;
            }
            
            $.ajax({
                url: `${url}api/v1/items/${itemId}/reviews`,
                method: 'GET',
                dataType: 'json',
                headers: headers,
                success: function(response) {
                    if (response.success) {
                        allReviews = response.reviews;
                        displayReviewStats(response.statistics);
                        displayReviews(response.reviews);
                        resolve(response);
                    } else {
                        reject('Failed to load reviews');
                    }
                },
                error: function(err) {
                    console.error('Error loading reviews:', err);
                    let errorMessage = 'Failed to load reviews';
                    
                    if (err.status === 401) {
                        errorMessage = 'Authentication required to view reviews';
                    } else if (err.status === 404) {
                        errorMessage = 'Item not found';
                    }
                    
                    reject(errorMessage);
                }
            });
        });
    }
    
    // Display review statistics
    function displayReviewStats(stats) {
        $('#averageRating').text(stats.average_rating.toFixed(1));
        $('#totalReviews').text(stats.total_reviews);
        
        // Display average stars
        const starsHtml = generateStarsHtml(stats.average_rating);
        $('#averageStars').html(starsHtml);
        
        // Display rating breakdown
        const breakdownHtml = generateRatingBreakdown(stats.rating_breakdown, stats.total_reviews);
        $('#ratingBreakdown').html(breakdownHtml);
    }
    
    // Generate stars HTML
    function generateStarsHtml(rating) {
        let html = '';
        for (let i = 1; i <= 5; i++) {
            if (i <= rating) {
                html += '<i class="fas fa-star"></i>';
            } else if (i - 0.5 <= rating) {
                html += '<i class="fas fa-star-half-alt"></i>';
            } else {
                html += '<i class="far fa-star"></i>';
            }
        }
        return html;
    }
    
    // Generate rating breakdown
    function generateRatingBreakdown(breakdown, total) {
        let html = '';
        for (let i = 5; i >= 1; i--) {
            const count = breakdown[i] || 0;
            const percentage = total > 0 ? (count / total * 100) : 0;
            html += `
                <div class="gadget-breakdown-row">
                    <span class="gadget-star-label">${i}<i class="fas fa-star"></i></span>
                    <div class="gadget-progress-bar">
                        <div class="gadget-progress-fill" style="width: ${percentage}%"></div>
                    </div>
                    <span class="gadget-count">${count}</span>
                </div>
            `;
        }
        return html;
    }
    
    // Display reviews list
    function displayReviews(reviews) {
        const container = $('#reviewsList');
        container.empty();
        
        if (reviews.length === 0) {
            container.html(`
                <div class="gadget-empty-reviews">
                    <div class="gadget-empty-icon">
                        <i class="fas fa-star"></i>
                    </div>
                    <h5>No Reviews Yet</h5>
                    <p>Be the first to review this amazing product!</p>
                    ${userId && jwtToken ? '<button class="btn gadget-btn-primary" onclick="scrollToReviewForm()"><i class="fas fa-edit"></i> Write First Review</button>' : ''}
                </div>
            `);
            return;
        }
        
        reviews.forEach(review => {
            const reviewHtml = generateReviewHtml(review);
            container.append(reviewHtml);
        });
    }
    
    // Generate single review HTML
    function generateReviewHtml(review) {
        const date = new Date(review.created_at).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        const stars = generateStarsHtml(review.rating);
        
        const avatarSrc = review.image_path ? 
            `${url}storage/images/${review.image_path}` : 
            `https://ui-avatars.com/api/?name=${encodeURIComponent(review.first_name + ' ' + review.last_name)}&background=667eea&color=ffffff&size=60&rounded=true`;
        
        return `
            <div class="gadget-review-card" data-rating="${review.rating}">
                <div class="gadget-review-header">
                    <div class="gadget-reviewer-info">
                        <img src="${avatarSrc}" alt="Reviewer" class="gadget-reviewer-avatar" 
                             onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(review.first_name + ' ' + review.last_name)}&background=667eea&color=ffffff&size=60&rounded=true'">
                        <div class="gadget-reviewer-details">
                            <h6 class="gadget-reviewer-name">${review.first_name} ${review.last_name}</h6>
                            <div class="gadget-review-meta">
                                <div class="gadget-star-display">${stars}</div>
                                <span class="gadget-review-date">${date}</span>
                            </div>
                        </div>
                    </div>
                    <div class="gadget-review-rating">
                        <span class="gadget-rating-number">${review.rating}</span>
                    </div>
                </div>
                ${review.review_text ? `
                    <div class="gadget-review-content">
                        <p>${review.review_text}</p>
                    </div>
                ` : ''}
                <div class="gadget-review-actions">
                    <button class="btn gadget-btn-outline gadget-btn-sm" onclick="markHelpful(${review.review_id})">
                        <i class="fas fa-thumbs-up"></i> Helpful
                    </button>
                </div>
            </div>
        `;
    }
    
    // Submit new review
    function submitReview() {
        if (!userId || !jwtToken) {
            showGadgetNotification('Please login to submit a review', 'warning');
            return;
        }
        
        const rating = $('#selectedRating').val();
        if (!rating) {
            showGadgetNotification('Please select a rating', 'warning');
            return;
        }
        
        const data = {
            item_id: currentItemId,
            customer_id: userId,  // Add the customer_id
            rating: parseInt(rating),
            review_text: $('#reviewText').val()
        };
        
        console.log('Submitting review data:', data);
        console.log('Request URL:', `${url}api/v1/reviews`);
        console.log('JWT Token present:', !!jwtToken);
        console.log('Data being sent:', JSON.stringify(data, null, 2));
        
        showLoading(true);
        
        $.ajax({
            url: `${url}api/v1/reviews`,
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + jwtToken,
                'Content-Type': 'application/json'
            },
            data: JSON.stringify(data),
            success: function(response) {
                console.log('Review submission response:', response);
                if (response.success) {
                    showGadgetNotification('Review submitted successfully!', 'success');
                    resetReviewForm();
                    $('#reviewFormSection').hide();
                    loadDeliveredItems(); // Reload delivered items to update review status
                } else {
                    showGadgetNotification(response.error || 'Error submitting review', 'error');
                }
            },
            error: function(err) {
                console.error('Review submission error:', err);
                console.error('Error response:', err.responseJSON);
                console.error('Error status:', err.status);
                const error = err.responseJSON?.error || 'Error submitting review';
                showGadgetNotification(error, 'error');
            },
            complete: function() {
                showLoading(false);
            }
        });
    }
    
    // Reset review form
    window.resetReviewForm = function() {
        $('#submitReviewForm')[0].reset();
        $('#selectedRating').val('');
        $('.gadget-star-rating .fa-star').removeClass('fas').addClass('far');
    };
    
    // Filter reviews
    function filterReviews() {
        const filter = $('#reviewsFilter').val();
        let filteredReviews = allReviews;
        
        if (filter !== 'all') {
            if (filter === 'verified') {
                filteredReviews = allReviews.filter(review => review.is_verified_purchase === 'yes');
            } else {
                filteredReviews = allReviews.filter(review => review.rating.toString() === filter);
            }
        }
        
        displayReviews(filteredReviews);
    }
    
    // Write review for specific item
    window.writeItemReview = function(itemId, itemName) {
        currentItemId = itemId;
        $('#currentItemName').text(itemName);
        
        // Reset form
        resetReviewForm();
        
        // Show review form and scroll to it
        $('#reviewFormSection').show();
        $('html, body').animate({
            scrollTop: $('#reviewFormSection').offset().top
        }, 500);
    };

    // Edit existing review for specific item
    window.editItemReview = function(itemId, reviewId, rating, reviewText, itemName) {
        $('#editReviewId').val(reviewId);
        $('#editSelectedRating').val(rating);
        $('#editReviewText').val(reviewText);
        $('#editItemInfo').html(`<strong>${itemName}</strong>`);
        
        // Set stars
        $('#editRatingStars .fa-star').each(function(index) {
            if (index < rating) {
                $(this).removeClass('far').addClass('fas');
            } else {
                $(this).removeClass('fas').addClass('far');
            }
        });
        
        $('#editReviewModal').modal('show');
    };

    // View all reviews for specific item
    window.viewItemReviews = function(itemId, itemName) {
        currentItemId = itemId;
        showLoading(true);
        
        loadReviewsData(itemId).then(() => {
            showLoading(false);
            $('#selectedItemName').text(itemName);
            $('#reviewStatsSection, #reviewsListSection').show();
            $('html, body').animate({
                scrollTop: $('#reviewStatsSection').offset().top
            }, 500);
        }).catch((error) => {
            console.error('Error loading reviews:', error);
            showLoading(false);
            showGadgetNotification('Error loading reviews data', 'error');
        });
    };
    
    // Update review
    window.updateReview = function() {
        const reviewId = $('#editReviewId').val();
        const rating = $('#editSelectedRating').val();
        const reviewText = $('#editReviewText').val();
        
        if (!rating) {
            showGadgetNotification('Please select a rating', 'warning');
            return;
        }
        
        const data = {
            rating: parseInt(rating),
            review_text: reviewText
        };
        
        showLoading(true);
        
        $.ajax({
            url: `${url}api/v1/reviews/${reviewId}`,
            method: 'PUT',
            headers: {
                'Authorization': 'Bearer ' + jwtToken,
                'Content-Type': 'application/json'
            },
            data: JSON.stringify(data),
            success: function(response) {
                if (response.success) {
                    showGadgetNotification('Review updated successfully!', 'success');
                    $('#editReviewModal').modal('hide');
                    loadDeliveredItems(); // Reload delivered items to update review status
                    if (currentItemId) {
                        loadReviewsData(currentItemId).then(() => {
                            displayReviewStats(allReviews);
                            displayReviews(allReviews);
                        });
                    }
                } else {
                    showGadgetNotification(response.error || 'Error updating review', 'error');
                }
            },
            error: function(err) {
                const error = err.responseJSON?.error || 'Error updating review';
                showGadgetNotification(error, 'error');
            },
            complete: function() {
                showLoading(false);
            }
        });
    };
    
    // Delete review
    window.deleteReview = function(reviewId) {
        Swal.fire({
            title: 'Delete Review?',
            text: 'Are you sure you want to delete this review? This action cannot be undone.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#e74c3c',
            cancelButtonColor: '#6c757d',
            confirmButtonText: '<i class="fas fa-trash"></i> Yes, Delete',
            cancelButtonText: '<i class="fas fa-times"></i> Cancel',
            customClass: {
                popup: 'gadget-delete-popup'
            }
        }).then((result) => {
            if (result.isConfirmed) {
                performDeleteReview(reviewId);
            }
        });
    };
    
    // Perform delete review
    function performDeleteReview(reviewId) {
        showLoading(true);
        
        $.ajax({
            url: `${url}api/v1/reviews/${reviewId}`,
            method: 'DELETE',
            headers: { 'Authorization': 'Bearer ' + jwtToken },
            success: function(response) {
                if (response.success) {
                    showGadgetNotification('Review deleted successfully!', 'success');
                    loadDeliveredItems(); // Reload delivered items to update review status
                    if (currentItemId) {
                        loadReviewsData(currentItemId).then(() => {
                            displayReviewStats(allReviews);
                            displayReviews(allReviews);
                        });
                    }
                } else {
                    showGadgetNotification(response.error || 'Error deleting review', 'error');
                }
            },
            error: function(err) {
                const error = err.responseJSON?.error || 'Error deleting review';
                showGadgetNotification(error, 'error');
            },
            complete: function() {
                showLoading(false);
            }
        });
    }
    
    // Mark review as helpful (placeholder)
    window.markHelpful = function(reviewId) {
        showGadgetNotification('Thank you for your feedback!', 'info');
    };
    
    // Scroll to review form
    window.scrollToReviewForm = function() {
        $('html, body').animate({
            scrollTop: $('#reviewFormSection').offset().top
        }, 500);
    };
    
    // Initialize carousel controls after DOM is ready
    $(document).on('click', '.carousel-control-prev, .carousel-control-next', function(e) {
        e.preventDefault();
        const target = $(this).attr('href');
        const direction = $(this).hasClass('carousel-control-prev') ? 'prev' : 'next';
        $(target).carousel(direction);
        return false;
    });

    // Initialize carousel indicators
    $(document).on('click', '.carousel-indicators li', function(e) {
        e.preventDefault();
        const target = $(this).data('target');
        const slideTo = $(this).data('slide-to');
        $(target).carousel(parseInt(slideTo));
        return false;
    });

    // Ensure carousels don't auto-cycle
    $(document).on('DOMNodeInserted', function(e) {
        if ($(e.target).hasClass('carousel')) {
            $(e.target).carousel({
                interval: false,
                wrap: true
            });
        }
    });
    
    // Utility functions
    function showReviewSections() {
        $('#reviewStatsSection, #reviewsListSection').show();
        if (userId && jwtToken) {
            $('#reviewFormSection').show();
        }
    }
    
    function hideAllSections() {
        $('#reviewStatsSection, #reviewFormSection, #reviewsListSection').hide();
    }
    
    function showLoading(show) {
        if (show) {
            $('#loadingSpinner').show();
        } else {
            $('#loadingSpinner').hide();
        }
    }
    
    function showGadgetNotification(message, type) {
        const iconMap = {
            'success': 'check-circle',
            'error': 'exclamation-circle',
            'warning': 'exclamation-triangle',
            'info': 'info-circle'
        };
        
        Swal.fire({
            title: type.charAt(0).toUpperCase() + type.slice(1),
            text: message,
            icon: type,
            confirmButtonColor: '#667eea',
            customClass: {
                popup: `gadget-${type}-popup`
            }
        });
    }
});
