// Global variables
let allItems = []; // Store all items for filtering

$(document).ready(function () {
    // Removed header load, now header is directly in home.html
    const url = 'http://localhost:4000/'
    const jwtToken = sessionStorage.getItem('jwtToken');
    
    let viewMode = 'pagination'; // 'pagination' or 'infinite'
    let currentPage = 1;
    const itemsPerPage = 9;
    let infiniteScrollCount = 0;
    const infiniteScrollStep = 9;

    // Pagination bar click handler (works for both top and bottom pagination)
    $(document).on('click', '#paginationBar .page-link, #paginationBarBottom .page-link', function(e) {
        e.preventDefault();
        const page = $(this).data('page');
        const totalPages = Math.ceil(allItems.length / itemsPerPage);
        if (page === 'prev' && currentPage > 1) {
            currentPage--;
        } else if (page === 'next' && currentPage < totalPages) {
            currentPage++;
        } else if (typeof page === 'number' && page >= 1 && page <= totalPages) {
            currentPage = page;
        }
        displayItems(allItems);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    
    // Fetch all items and display as cards
    function loadItems() {
        $.ajax({
            url: `${url}api/v1/items`,
            method: 'GET',
            dataType: 'json',
            headers: jwtToken ? { 'Authorization': 'Bearer ' + jwtToken } : {},
            success: function (res) {
                allItems = res.items || res.rows || res.data || [];
                if (!Array.isArray(allItems)) allItems = [];
                displayItems(allItems);
                // Initialize autocomplete after items are loaded
                initializeAutocomplete();
            },
            error: function (err) {
                let msg = err.status === 401 ? '401 Unauthorized: You are not authorized. Please log in again.' : 'Failed to load items.';
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: msg
                }).then(() => {
                    if (err.status === 401) {
                        sessionStorage.clear();
                        window.location.href = 'login.html';
                    }
                });
                $('#items').html('<div class="alert alert-danger">' + msg + '</div>');
            }
        });
    }
    
    // Display items function (supports both modes)
    function displayItems(items) {
        let html = '';
        let pagedItems = items;
        if (viewMode === 'pagination') {
            // Pagination mode: show only current page
            const startIdx = (currentPage - 1) * itemsPerPage;
            const endIdx = startIdx + itemsPerPage;
            pagedItems = items.slice(startIdx, endIdx);
        } else if (viewMode === 'infinite') {
            // Infinite scroll mode: show up to infiniteScrollCount
            pagedItems = items.slice(0, infiniteScrollCount);
        }
        if (pagedItems.length === 0) {
            html = '<div class="alert alert-info">No items found.</div>';
        } else {
            html = '<div class="row">';
            pagedItems.forEach(function (item) {
                // ...existing card rendering code...
                let imagesHtml = '';
                if (Array.isArray(item.images) && item.images.length > 0) {
                    let carouselId = 'carousel-' + item.item_id;
                    imagesHtml = `<div id='${carouselId}' class='carousel slide mb-2' data-ride='carousel'>`;
                    imagesHtml += `<div class='carousel-inner'>`;
                    item.images.forEach(function(img, idx) {
                        imagesHtml += `<div class='carousel-item${idx===0?' active':''}'>` +
                            `<img src='${url}${img}' class='d-block w-100' style='height:200px;object-fit:cover;cursor:pointer;' alt='${item.name} image ${idx+1}' onclick="showItemDetails(${item.item_id})" data-item-id="${item.item_id}">` +
                            `</div>`;
                    });
                    imagesHtml += `</div>`;
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
                    }
                    imagesHtml += `</div>`;
                } else if (item.image_path) {
                    imagesHtml = `<img src="${url}${item.image_path}" class="card-img-top" alt="${item.name}" onclick="showItemDetails(${item.item_id})" data-item-id="${item.item_id}" style="cursor:pointer;">`;
                }
                let cartControls = '';
                if (item.quantity > 0) {
                    cartControls = `
                    <div class="mb-2" style="max-width: 140px;">
                      <label class="mb-1 small text-muted">Quantity:</label>
                      <input type="number" class="form-control qty-input text-center" min="1" max="${item.quantity}" value="1" style="width: 80px;" />
                    </div>
                    <button class="btn btn-success btn-block btn-add-to-cart" data-id="${item.item_id}" data-name="${item.name}" data-price="${item.sell_price}" data-image="${(item.images && item.images[0]) ? url+item.images[0] : (item.image_path ? url+item.image_path : '')}" data-description="${item.description || ''}" data-category="${item.category || ''}" data-stock="${item.quantity}">
                      <i class="fas fa-cart-plus"></i> Add to Cart
                    </button>
                    `;
                } else {
                    cartControls = `<button class="btn btn-secondary btn-block" disabled>Out of Stock</button>`;
                }
                html += `
                <div class="col-md-4 mb-4">
                    <div class="card h-100 gadget-card">
                        ${imagesHtml}
                        <div class="card-body">
                            <h5 class="card-title" onclick="showItemDetails(${item.item_id})" data-item-id="${item.item_id}" style="cursor: pointer;">${item.name}</h5>
                            <p class="card-text">${item.description}</p>
                            <p class="card-text"><small class="text-muted"><i class="fas fa-tag"></i> ${item.category}</small></p>
                            <p class="price-tag"><i class="fas fa-peso-sign"></i>${item.sell_price ?? ''}</p>
                            <p class="card-text"><small class="text-muted"><i class="fas fa-box"></i> Stock: ${item.quantity ?? ''}</small></p>
                            <div class="cart-controls">${cartControls}</div>
                        </div>
                    </div>
                </div>
                `;
            });
            html += '</div>';
        }
        $('#itemCards').html(html);
        console.log('Displayed', items.length, 'items with modal onclick handlers');
        // Render pagination bar if in pagination mode
        if (viewMode === 'pagination') {
            renderPaginationBar(items.length);
        } else {
            $('#paginationBar').html('');
            $('#paginationBarBottom').html('');
        }
    }

    // Render pagination bar
    function renderPaginationBar(totalItems) {
        const totalPages = Math.ceil(totalItems / itemsPerPage);
        if (totalPages <= 1) {
            $('#paginationBar').html('');
            $('#paginationBarBottom').html('');
            return;
        }
        let html = '<nav><ul class="pagination justify-content-center">';
        html += `<li class="page-item${currentPage === 1 ? ' disabled' : ''}"><a class="page-link" href="#" data-page="prev">&laquo;</a></li>`;
        for (let i = 1; i <= totalPages; i++) {
            html += `<li class="page-item${i === currentPage ? ' active' : ''}"><a class="page-link" href="#" data-page="${i}">${i}</a></li>`;
        }
        html += `<li class="page-item${currentPage === totalPages ? ' disabled' : ''}"><a class="page-link" href="#" data-page="next">&raquo;</a></li>`;
        html += '</ul></nav>';
        $('#paginationBar').html(html);
        $('#paginationBarBottom').html(html);
    }
    
    // Search functionality
    function searchItems() {
        const searchTerm = $('#searchInput').val().toLowerCase().trim();
        if (searchTerm === '') {
            displayItems(allItems);
            return;
        }
        
        const filteredItems = allItems.filter(item => {
            const name = (item.name || '').toLowerCase();
            const description = (item.description || '').toLowerCase();
            const price = (item.sell_price || '').toString();
            const category = (item.category || '').toLowerCase();
            
            // Check for price range searches
            if (searchTerm.includes('₱') || searchTerm.includes('under') || searchTerm.includes('above')) {
                const itemPrice = parseFloat(item.sell_price) || 0;
                const priceRange = getPriceRange(itemPrice).toLowerCase();
                if (priceRange.includes(searchTerm)) return true;
            }
            
            return name.includes(searchTerm) || 
                   description.includes(searchTerm) || 
                   price.includes(searchTerm) ||
                   category.includes(searchTerm);
        });
        
        displayItems(filteredItems);
    }
    
    // Filter functionality
    function filterItems() {
        const minPrice = parseFloat($('#minPrice').val()) || 0;
        const maxPrice = parseFloat($('#maxPrice').val()) || Infinity;
        const category = $('#categoryFilter').val();
        
        let filteredItems = allItems.filter(item => {
            const price = parseFloat(item.sell_price) || 0;
            const itemCategory = item.category || '';
            
            const priceMatch = price >= minPrice && price <= maxPrice;
            const categoryMatch = !category || itemCategory === category;
            
            return priceMatch && categoryMatch;
        });
        
        // Also apply search if there's a search term
        const searchTerm = $('#searchInput').val().toLowerCase().trim();
        if (searchTerm !== '') {
            filteredItems = filteredItems.filter(item => {
                const name = (item.name || '').toLowerCase();
                const description = (item.description || '').toLowerCase();
                const price = (item.sell_price || '').toString();
                
                return name.includes(searchTerm) || 
                       description.includes(searchTerm) || 
                       price.includes(searchTerm);
            });
        }
        
        displayItems(filteredItems);
    }
    
    // Event handlers
    $('#searchBtn').on('click', searchItems);
    $('#searchInput').on('keypress', function(e) {
        if (e.which === 13) { // Enter key
            searchItems();
        }
    });
    
    $('#clearSearchBtn').on('click', function() {
        $('#searchInput').val('');
        filterItems(); // Apply current filters without search
    });
    
    $('#applyFiltersBtn').on('click', filterItems);
    
    $('#clearFiltersBtn').on('click', function() {
        $('#minPrice').val('');
        $('#maxPrice').val('');
        $('#categoryFilter').val('');
        $('#searchInput').val('');
        displayItems(allItems);
    });
    
    // Mode switch handlers
    $(document).on('click', '#paginationModeBtn', function() {
        viewMode = 'pagination';
        currentPage = 1;
        displayItems(allItems);
        $(this).addClass('btn-primary').removeClass('btn-outline-primary');
        $('#infiniteScrollModeBtn').removeClass('btn-success').addClass('btn-outline-success');
        $(window).off('scroll.infinite');
    });
    $(document).on('click', '#infiniteScrollModeBtn', function() {
        viewMode = 'infinite';
        infiniteScrollCount = infiniteScrollStep;
        displayItems(allItems);
        $(this).addClass('btn-success').removeClass('btn-outline-success');
        $('#paginationModeBtn').removeClass('btn-primary').addClass('btn-outline-primary');
        // Attach infinite scroll
        $(window).off('scroll.infinite').on('scroll.infinite', function() {
            if (viewMode !== 'infinite') return;
            if ($(window).scrollTop() + $(window).height() + 100 >= $(document).height()) {
                if (infiniteScrollCount < allItems.length) {
                    infiniteScrollCount += infiniteScrollStep;
                    displayItems(allItems);
                }
            }
        });
    });

    // Pagination bar click handler
    $(document).on('click', '#paginationBar .page-link', function(e) {
        e.preventDefault();
        const page = $(this).data('page');
        const totalPages = Math.ceil(allItems.length / itemsPerPage);
        if (page === 'prev' && currentPage > 1) {
            currentPage--;
        } else if (page === 'next' && currentPage < totalPages) {
            currentPage++;
        } else if (typeof page === 'number' || !isNaN(parseInt(page))) {
            currentPage = parseInt(page);
        }
        displayItems(allItems);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    // Initialize
    loadItems();
    
    // Initialize autocomplete after items are loaded
    function initializeAutocomplete() {
        // Create suggestions array from all items
        let suggestions = [];
        
        allItems.forEach(function(item) {
            // Add item names
            if (item.name) {
                suggestions.push({
                    label: item.name,
                    value: item.name,
                    type: 'name',
                    item: item
                });
            }
            
            // Add categories
            if (item.category && !suggestions.find(s => s.value === item.category && s.type === 'category')) {
                suggestions.push({
                    label: `Category: ${item.category}`,
                    value: item.category,
                    type: 'category',
                    item: item
                });
            }
            
            // Add price ranges
            if (item.sell_price) {
                const price = parseFloat(item.sell_price);
                const priceRange = getPriceRange(price);
                if (!suggestions.find(s => s.value === priceRange && s.type === 'price')) {
                    suggestions.push({
                        label: `Price: ${priceRange}`,
                        value: priceRange,
                        type: 'price',
                        item: item
                    });
                }
            }
            
            // Add description keywords (first 3 words)
            if (item.description) {
                const words = item.description.split(' ').slice(0, 3);
                words.forEach(word => {
                    if (word.length > 3 && !suggestions.find(s => s.value === word && s.type === 'description')) {
                        suggestions.push({
                            label: `Description: ${word}`,
                            value: word,
                            type: 'description',
                            item: item
                        });
                    }
                });
            }
        });
        
        // Remove duplicates and sort
        suggestions = suggestions.filter((item, index, self) => 
            index === self.findIndex(t => t.value === item.value && t.type === item.type)
        ).sort((a, b) => a.label.localeCompare(b.label));
        
        // Initialize autocomplete
        $('#searchInput').autocomplete({
            source: function(request, response) {
                const term = request.term.toLowerCase();
                const matches = suggestions.filter(item => 
                    item.label.toLowerCase().includes(term) ||
                    item.value.toLowerCase().includes(term)
                ).slice(0, 10); // Limit to 10 suggestions
                response(matches);
            },
            minLength: 2,
            select: function(event, ui) {
                // When a suggestion is selected, perform search
                $('#searchInput').val(ui.item.value);
                searchItems();
                return false;
            },
            focus: function(event, ui) {
                // Prevent value from being inserted on focus
                return false;
            }
        }).autocomplete("instance")._renderItem = function(ul, item) {
            // Custom rendering for different types
            let icon = '';
            switch(item.type) {
                case 'name':
                    icon = '<i class="fas fa-tag text-primary"></i>';
                    break;
                case 'category':
                    icon = '<i class="fas fa-folder text-success"></i>';
                    break;
                case 'price':
                    icon = '<i class="fas fa-peso-sign text-warning"></i>';
                    break;
                case 'description':
                    icon = '<i class="fas fa-info-circle text-info"></i>';
                    break;
            }
            
            return $("<li>")
                .append(`<div class="autocomplete-item">${icon} ${item.label}</div>`)
                .appendTo(ul);
        };
    }
    
    // Helper function to get price range
    function getPriceRange(price) {
        if (price < 100) return 'Under ₱100';
        if (price < 500) return '₱100 - ₱499';
        if (price < 1000) return '₱500 - ₱999';
        if (price < 2000) return '₱1,000 - ₱1,999';
        if (price < 5000) return '₱2,000 - ₱4,999';
        return '₱5,000 and above';
    }
    
    // Add event delegation for quantity input validation and add to cart
    $('#itemCards').off('input', '.qty-input').on('input', '.qty-input', function() {
        var $input = $(this);
        var min = parseInt($input.attr('min')) || 1;
        var max = parseInt($input.attr('max')) || 99;
        var val = parseInt($input.val()) || min;
        if (val < min) $input.val(min);
        if (val > max) $input.val(max);
    });

    // Add event delegation for modal quantity input validation
    $(document).off('input', '#modalCartControls .qty-input').on('input', '#modalCartControls .qty-input', function() {
        var $input = $(this);
        var min = parseInt($input.attr('min')) || 1;
        var max = parseInt($input.attr('max')) || 99;
        var val = parseInt($input.val()) || min;
        if (val < min) $input.val(min);
        if (val > max) $input.val(max);
    });

    // Add event delegation for modal "Add to Cart" button
    $(document).off('click', '#modalCartControls .btn-add-to-cart').on('click', '#modalCartControls .btn-add-to-cart', function() {
        var $btn = $(this);
        var $modal = $('#modalCartControls');
        var qty = parseInt($modal.find('.qty-input').val()) || 1;
        var stock = parseInt($btn.data('stock'));
        if (qty > stock) qty = stock;
        if (qty < 1) qty = 1;
        
        var item = {
            item_id: $btn.data('id'),
            name: $btn.data('name'),
            price: parseFloat($btn.data('price')),
            sell_price: parseFloat($btn.data('price')),
            image: $btn.data('image'),
            description: $btn.data('description') || '',
            category: $btn.data('category') || '',
            quantity: qty
        };
        console.log('Adding item to cart (modal):', item); // Debug log
        
        // Add to cart logic (same as main cards)
        var cart = JSON.parse(localStorage.getItem('cart') || '[]');
        var existingItem = cart.find(function(cartItem) {
            return cartItem.item_id === item.item_id;
        });
        
        if (existingItem) {
            existingItem.quantity += qty;
            if (existingItem.quantity > stock) {
                existingItem.quantity = stock;
            }
        } else {
            cart.push(item);
        }
        localStorage.setItem('cart', JSON.stringify(cart));
        
        // Update cart badge
        if (typeof window.updateCartBadge === 'function') {
            window.updateCartBadge();
        }
        
        Swal.fire({
            icon: 'success',
            text: 'Item added to cart!'
        });
        
        // Close modal after adding to cart
        $('#itemDetailsModal').modal('hide');
    });
    
    $('#itemCards').off('click', '.btn-add-to-cart').on('click', '.btn-add-to-cart', function() {
        var $btn = $(this);
        var $card = $btn.closest('.card-body');
        var qty = parseInt($card.find('.qty-input').val()) || 1;
        var stock = parseInt($btn.data('stock'));
        if (qty > stock) qty = stock;
        if (qty < 1) qty = 1;
        var item = {
            item_id: $btn.data('id'),
            name: $btn.data('name'),
            price: parseFloat($btn.data('price')),
            sell_price: parseFloat($btn.data('price')),
            image: $btn.data('image'),
            description: $btn.data('description') || '',
            category: $btn.data('category') || '',
            quantity: qty
        };
        console.log('Adding item to cart (main cards):', item); // Debug log
        if (typeof window.addToCart === 'function') {
            window.addToCart(item);
        } else {
            // fallback: store in localStorage
            let cart = localStorage.getItem('cart');
            cart = cart ? JSON.parse(cart) : [];
            let idx = cart.findIndex(i => i.item_id == item.item_id);
            if (idx > -1) {
                cart[idx].quantity += item.quantity;
            } else {
                cart.push(item);
            }
            localStorage.setItem('cart', JSON.stringify(cart));
            
            // Update cart badge
            if (typeof window.updateCartBadge === 'function') {
                window.updateCartBadge();
            }
            
            Swal.fire({
                icon: 'success',
                text: 'Item added to cart!'
            });
        }
    });
    
    // Add click handlers for modal functionality as backup to onclick attributes
    $(document).on('click', '.card-img-top, .card-title', function(e) {
        e.preventDefault();
        console.log('Click handler triggered');
        
        // Get the item ID from the onclick attribute or data attribute
        let itemId = null;
        if ($(this).attr('onclick')) {
            const onclickAttr = $(this).attr('onclick');
            const match = onclickAttr.match(/showItemDetails\((\d+)\)/);
            if (match) {
                itemId = parseInt(match[1]);
            }
        }
        
        if (itemId) {
            console.log('Calling showItemDetails with itemId:', itemId);
            window.showItemDetails(itemId);
        } else {
            console.error('Could not extract item ID from element');
        }
    });
});

// Global function to show item details modal
// Make showItemDetails function globally accessible
window.showItemDetails = function(itemId) {
    console.log('showItemDetails called with itemId:', itemId);
    console.log('Current allItems:', allItems);
    console.log('allItems length:', allItems ? allItems.length : 'allItems is null/undefined');
    
    if (!allItems || allItems.length === 0) {
        console.error('Items not loaded yet');
        Swal.fire({
            icon: 'warning',
            title: 'Loading...',
            text: 'Please wait for items to load!',
            timer: 2000
        });
        return;
    }
    
    const item = allItems.find(i => i.item_id == itemId);
    if (!item) {
        console.error('Item not found for itemId:', itemId);
        console.log('Available item IDs:', allItems.map(i => i.item_id));
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Item not found!'
        });
        return;
    }

    console.log('Found item:', item);
    // Populate modal with item details
    populateItemModal(item);
    
    // Load and display reviews
    loadItemReviews(itemId);
    
    // Show the modal
    console.log('Showing modal...');
    $('#itemDetailsModal').modal('show');
}

// Function to populate the modal with item details
function populateItemModal(item) {
    const url = 'http://localhost:4000/';
    
    // Set item basic info
    $('#modalItemName').text(item.name);
    $('#modalItemCategory').text(item.category || 'N/A');
    $('#modalItemPrice').text('₱' + (item.sell_price || '0'));
    $('#modalItemStock').text(item.quantity || '0');
    $('#modalItemDescription').text(item.description || 'No description available');
    
    // Handle images
    let carouselInner = '';
    let indicators = '';
    let hasMultipleImages = false;
    
    if (Array.isArray(item.images) && item.images.length > 0) {
        hasMultipleImages = item.images.length > 1;
        item.images.forEach(function(img, idx) {
            const isActive = idx === 0 ? 'active' : '';
            carouselInner += `
                <div class="carousel-item ${isActive}">
                    <img src="${url}${img}" class="d-block w-100" alt="${item.name} image ${idx + 1}">
                </div>
            `;
            indicators += `<li data-target="#modalImageCarousel" data-slide-to="${idx}" class="${isActive}"></li>`;
        });
    } else if (item.image_path) {
        carouselInner = `
            <div class="carousel-item active">
                <img src="${url}${item.image_path}" class="d-block w-100" alt="${item.name}">
            </div>
        `;
    } else {
        carouselInner = `
            <div class="carousel-item active">
                <img src="https://via.placeholder.com/600x400/667eea/ffffff?text=No+Image" class="d-block w-100" alt="No Image">
            </div>
        `;
    }
    
    $('#modalCarouselInner').html(carouselInner);
    $('#modalCarouselIndicators').html(indicators);
    
    // Show/hide carousel controls
    if (hasMultipleImages) {
        $('#modalCarouselPrev, #modalCarouselNext, #modalCarouselIndicators').show();
    } else {
        $('#modalCarouselPrev, #modalCarouselNext, #modalCarouselIndicators').hide();
    }
    
    // Generate cart controls
    let cartControlsHtml = '';
    if (item.quantity > 0) {
        cartControlsHtml = `
            <div class="d-flex align-items-center justify-content-between">
                <div style="max-width: 140px;">
                    <label class="mb-1 small text-muted">Quantity:</label>
                    <input type="number" class="form-control qty-input text-center" value="1" min="1" max="${item.quantity}" style="width: 80px;">
                </div>
                <button class="btn btn-primary btn-add-to-cart ml-3" 
                        data-id="${item.item_id}" 
                        data-name="${item.name}" 
                        data-price="${item.sell_price}" 
                        data-image="${item.image_path ? url + item.image_path : (Array.isArray(item.images) && item.images.length > 0 ? url + item.images[0] : '')}" 
                        data-description="${item.description || ''}"
                        data-category="${item.category || ''}"
                        data-stock="${item.quantity}">
                    <i class="fas fa-cart-plus"></i> Add to Cart
                </button>
            </div>
        `;
    } else {
        cartControlsHtml = `
            <button class="btn btn-secondary btn-block" disabled>
                <i class="fas fa-times"></i> Out of Stock
            </button>
        `;
    }
    
    $('#modalCartControls').html(cartControlsHtml);
}

// Function to load and display item reviews
function loadItemReviews(itemId) {
    const url = 'http://localhost:4000/';
    const jwtToken = sessionStorage.getItem('jwtToken');
    
    // Show loading state
    $('#modalReviewsContainer').html(`
        <div class="reviews-loading">
            <i class="fas fa-spinner"></i>
            <p>Loading reviews...</p>
        </div>
    `);
    
    // Prepare headers
    let headers = {};
    if (jwtToken) {
        headers['Authorization'] = 'Bearer ' + jwtToken;
    }
    
    // Load reviews from API using the correct endpoint
    $.ajax({
        url: `${url}api/v1/items/${itemId}/reviews`,
        method: 'GET',
        dataType: 'json',
        headers: headers,
        success: function(response) {
            console.log('Reviews API response:', response);
            if (response.success) {
                displayItemReviews(response.reviews || []);
            } else {
                console.error('API returned success: false');
                displayItemReviews([]);
            }
        },
        error: function(err) {
            console.error('Error loading reviews:', err);
            displayItemReviews([]);
        }
    });
}

// Function to display reviews in the modal
function displayItemReviews(reviews) {
    console.log('Displaying reviews:', reviews);
    let reviewsHtml = '';
    
    if (reviews.length === 0) {
        reviewsHtml = `
            <div class="no-reviews">
                <i class="fas fa-comment-slash"></i>
                <h6>No Reviews for this Item yet</h6>
                <p class="mb-0">Be the first to leave a review for this product!</p>
            </div>
        `;
    } else {
        reviews.forEach(function(review) {
            const reviewDate = new Date(review.created_at || review.review_date).toLocaleDateString();
            const rating = parseInt(review.rating) || 0;
            let starsHtml = '';
            
            // Generate star rating
            for (let i = 1; i <= 5; i++) {
                if (i <= rating) {
                    starsHtml += '<i class="fas fa-star"></i>';
                } else {
                    starsHtml += '<i class="far fa-star"></i>';
                }
            }
            
            // Handle customer name - try different possible field combinations
            let customerName = 'Anonymous';
            if (review.first_name && review.last_name) {
                customerName = `${review.first_name} ${review.last_name}`;
            } else if (review.customer_name) {
                customerName = review.customer_name;
            } else if (review.user_name) {
                customerName = review.user_name;
            } else if (review.name) {
                customerName = review.name;
            }
            
            reviewsHtml += `
                <div class="review-item">
                    <div class="review-header">
                        <span class="reviewer-name">${customerName}</span>
                        <span class="review-date">${reviewDate}</span>
                    </div>
                    <div class="review-rating">${starsHtml}</div>
                    <p class="review-text">${review.review_text || review.comment || 'No comment provided'}</p>
                </div>
            `;
        });
    }
    
    $('#modalReviewsContainer').html(reviewsHtml);
}
