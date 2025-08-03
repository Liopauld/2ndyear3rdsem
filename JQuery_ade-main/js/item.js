$(document).ready(function () {
    const url = 'http://localhost:4000/';
    const jwtToken = sessionStorage.getItem('jwtToken');

    // Initialize pagination utility
    const paginationUtility = new PaginationUtility({
        containerId: 'dataContainer',
        paginationBarId: 'paginationBar',
        paginationBarBottomId: 'paginationBarBottom',
        itemsPerPage: 10,
        infiniteScrollStep: 10,
        searchInputId: 'searchInput',
        filterInputs: ['categoryFilter', 'minPrice', 'maxPrice'],
        onItemRender: renderItemsTable,
        onDataLoad: function(data) {
            console.log('Items loaded:', data.length);
        }
    });

    // Custom render function for items table
    function renderItemsTable(items) {
        if (items.length === 0) {
            $('#dataContainer').html('<div class="alert alert-info">No items found.</div>');
        return;
    }

        let html = '<div class="table-responsive"><table class="table table-hover gadget-admin-table">';
        html += '<thead><tr>';
        html += '<th><i class="fas fa-hashtag"></i> ID</th>';
        html += '<th><i class="fas fa-tag"></i> Name</th>';
        html += '<th><i class="fas fa-list"></i> Category</th>';
        html += '<th><i class="fas fa-images"></i> Images</th>';
        html += '<th><i class="fas fa-info-circle"></i> Description</th>';
        html += '<th><i class="fas fa-peso-sign"></i> Sell Price</th>';
        html += '<th><i class="fas fa-money-bill"></i> Cost Price</th>';
        html += '<th><i class="fas fa-eye"></i> Show Item</th>';
        html += '<th><i class="fas fa-boxes"></i> Quantity</th>';
        html += '<th><i class="fas fa-cogs"></i> Actions</th>';
        html += '</tr></thead><tbody>';

        items.forEach(function(item) {
            const categoryBadge = getCategoryBadge(item.category);
            const showItemBadge = item.show_item === 'yes' ? 
                '<span class="status-badge status-active">Yes</span>' :
                '<span class="status-badge status-inactive">No</span>';
            
            const mainImage = item.images && item.images.length > 0 ? 
                `<img src="${url}${item.images[0]}" class="item-image" alt="${item.name}">` :
                `<div class="bg-secondary rounded d-flex align-items-center justify-content-center item-image">
                    <i class="fas fa-image text-white"></i>
                </div>`;

            const description = item.description ? 
                `<div class="item-description" title="${item.description}">${item.description}</div>` : 
                'N/A';

            html += '<tr>';
            html += `<td><strong>#${item.item_id}</strong></td>`;
            html += `<td>${item.name || ''}</td>`;
            html += `<td>${categoryBadge}</td>`;
            html += `<td>${mainImage}</td>`;
            html += `<td>${description}</td>`;
            html += `<td><strong>₱${parseFloat(item.sell_price || 0).toLocaleString()}</strong></td>`;
            html += `<td>₱${parseFloat(item.cost_price || 0).toLocaleString()}</td>`;
            html += `<td>${showItemBadge}</td>`;
            html += `<td><span class="badge badge-info">${item.quantity || 0}</span></td>`;
            html += `<td>
                <div class="btn-group btn-group-sm">
                    <button class="btn btn-primary btn-edit" data-id="${item.item_id}" title="Edit Item">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-danger btn-delete" data-id="${item.item_id}" title="Delete Item">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>`;
            html += '</tr>';
        });

        html += '</tbody></table></div>';
        $('#dataContainer').html(html);
    }

    function getCategoryBadge(category) {
        const categoryClasses = {
            'Smart Home Devices': 'category-smart-home',
            'Mobile & Wearable Tech': 'category-mobile-wearable',
            'Computers & Peripherals': 'category-computers-peripherals',
            'Gaming & VR Gear': 'category-gaming-vr',
            'Audio & Entertainment Devices': 'category-audio-entertainment'
        };
        
        const categoryClass = categoryClasses[category] || 'category-smart-home';
        return `<span class="category-badge ${categoryClass}">${category || 'Uncategorized'}</span>`;
    }

    // Override the applyFilters method for custom filtering
    paginationUtility.applyFilters = function() {
        const categoryFilter = $('#categoryFilter').val();
        const minPrice = parseFloat($('#minPrice').val()) || 0;
        const maxPrice = parseFloat($('#maxPrice').val()) || Infinity;
        
        this.filteredData = this.allData.filter(item => {
            const categoryMatch = !categoryFilter || item.category === categoryFilter;
            const price = parseFloat(item.sell_price) || 0;
            const priceMatch = price >= minPrice && price <= maxPrice;
            
            return categoryMatch && priceMatch;
        });
        
        this.currentPage = 1;
        this.infiniteScrollCount = this.options.infiniteScrollStep;
        this.displayData();
    };

    // Load items data
    function loadItems() {
        $.ajax({
            url: `${url}api/v1/items`,
            method: 'GET',
            dataType: 'json',
            headers: jwtToken ? { 'Authorization': 'Bearer ' + jwtToken } : {},
            success: function (response) {
                if (response.success) {
                    paginationUtility.loadData(response.items || response.rows || response.data || []);
                } else {
                Swal.fire({
                        icon: 'error',
                        title: 'Error',
                        text: response.message || 'Failed to load items'
                    });
                }
            },
            error: function (xhr) {
                let msg = xhr.status === 401 ? 'Unauthorized: Please log in again.' : 
                         xhr.status === 404 ? 'Items not found.' :
                         (xhr.responseJSON && xhr.responseJSON.error ? xhr.responseJSON.error : 'Failed to load items');
                
                Swal.fire({
                  icon: 'error',
                    title: 'Error',
                  text: msg
                }).then(() => {
                  if (xhr.status === 401) {
                    sessionStorage.clear();
                    window.location.href = 'login.html';
                  }
                });
            }
        });
    }

    // Edit item handler
    $(document).on('click', '.btn-edit', function() {
        const itemId = $(this).data('id');
        const item = paginationUtility.allData.find(i => i.item_id == itemId);
        
        if (item) {
            // Populate modal with item data
            $('#itemModalTitle').html('<i class="fas fa-edit"></i> Edit Item');
            $('#item_id').val(item.item_id);
                    $('#name').val(item.name);
                    $('#category').val(item.category);
                    $('#desc').val(item.description);
                    $('#sell').val(item.sell_price);
                    $('#cost').val(item.cost_price);
                    $('#qty').val(item.quantity);
                    $('#show_item').val(item.show_item);
            
            // Show current images if any
            if (item.images && item.images.length > 0) {
                let imagesHtml = '<div class="current-images mb-3">';
                imagesHtml += '<h6>Current Images:</h6>';
                imagesHtml += '<div class="row">';
                item.images.forEach((image, index) => {
                    imagesHtml += `
                        <div class="col-md-3 mb-2">
                            <img src="${url}${image}" class="img-thumbnail" style="width: 100px; height: 100px; object-fit: cover;">
                            <button type="button" class="btn btn-sm btn-danger mt-1" onclick="removeImage(${index})">
                                <i class="fas fa-trash"></i> Remove
                            </button>
                        </div>
                    `;
                });
                imagesHtml += '</div></div>';
                $('#currentImages').html(imagesHtml);
            } else {
                $('#currentImages').html('');
            }
            
            // Show update button, hide save button
            $('#itemUpdate').show();
            $('#itemSubmit').hide();
            
            $('#itemModal').modal('show');
        }
    });

    // Delete item handler
    $(document).on('click', '.btn-delete', function() {
        const itemId = $(this).data('id');
        
        Swal.fire({
            title: 'Are you sure?',
            text: 'This will permanently delete this item and all its images!',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, delete it!',
            cancelButtonText: 'Cancel'
        }).then((result) => {
            if (result.isConfirmed) {
                $.ajax({
                    url: `${url}api/v1/items/${itemId}`,
                    method: 'DELETE',
                    dataType: 'json',
                    headers: jwtToken ? { 'Authorization': 'Bearer ' + jwtToken } : {},
                    success: function (response) {
                        if (response.success) {
                            Swal.fire({
                                icon: 'success',
                                title: 'Deleted!',
                                text: response.message || 'Item has been deleted.',
                                timer: 2000,
                                showConfirmButton: false
                            }).then(() => {
                                loadItems(); // Reload data
                            });
                        } else {
                            Swal.fire({
                                icon: 'error',
                                title: 'Error',
                                text: response.message || 'Failed to delete item'
                            });
                }
            },
            error: function (xhr) {
                        let msg = xhr.status === 401 ? 'Unauthorized: Please log in again.' : 
                                 xhr.status === 404 ? 'Item not found.' :
                                 (xhr.responseJSON && xhr.responseJSON.error ? xhr.responseJSON.error : 'Failed to delete item');
                        
                Swal.fire({
                  icon: 'error',
                            title: 'Error',
                  text: msg
                }).then(() => {
                  if (xhr.status === 401) {
                    sessionStorage.clear();
                    window.location.href = 'login.html';
                  }
                });
            }
        });
            }
        });
    });

    // Save new item button handler
    $('#itemSubmit').on('click', function() {
        const formData = new FormData($('#iform')[0]);
        
        $.ajax({
            url: `${url}api/v1/items`,
            method: 'POST',
            data: formData,
            processData: false,
            contentType: false,
            headers: jwtToken ? { 'Authorization': 'Bearer ' + jwtToken } : {},
            success: function (response) {
                if (response.success) {
                    $('#itemModal').modal('hide');
                Swal.fire({
                  icon: 'success',
                        title: 'Created!',
                        text: response.message || 'Item created successfully',
                        timer: 2000,
                        showConfirmButton: false
                    }).then(() => {
                        loadItems(); // Reload data
                        $('#iform')[0].reset();
                        $('#currentImages').html('');
                    });
                } else {
                    Swal.fire({
                        icon: 'error',
                        title: 'Error',
                        text: response.message || 'Failed to create item'
                    });
                }
            },
            error: function (xhr) {
                let msg = xhr.status === 401 ? 'Unauthorized: Please log in again.' : 
                         (xhr.responseJSON && xhr.responseJSON.error ? xhr.responseJSON.error : 'Failed to create item');
                
                Swal.fire({
                  icon: 'error',
                    title: 'Error',
                  text: msg
                }).then(() => {
                  if (xhr.status === 401) {
                    sessionStorage.clear();
                    window.location.href = 'login.html';
                  }
                });
            }
        });
    });

    // Update item button handler
    $('#itemUpdate').on('click', function() {
        const formData = new FormData($('#iform')[0]);
        const itemId = $('#item_id').val();
                
                $.ajax({
            url: `${url}api/v1/items/${itemId}`,
            method: 'PUT',
            data: formData,
            processData: false,
            contentType: false,
                    headers: jwtToken ? { 'Authorization': 'Bearer ' + jwtToken } : {},
            success: function (response) {
                if (response.success) {
                    $('#itemModal').modal('hide');
                        Swal.fire({
                            icon: 'success',
                        title: 'Updated!',
                        text: response.message || 'Item updated successfully',
                        timer: 2000,
                        showConfirmButton: false
                    }).then(() => {
                        loadItems(); // Reload data
                        $('#iform')[0].reset();
                        $('#currentImages').html('');
                    });
                } else {
                    Swal.fire({
                        icon: 'error',
                        title: 'Error',
                        text: response.message || 'Failed to update item'
                    });
                }
                    },
                    error: function (xhr) {
                let msg = xhr.status === 401 ? 'Unauthorized: Please log in again.' : 
                         (xhr.responseJSON && xhr.responseJSON.error ? xhr.responseJSON.error : 'Failed to update item');
                
                        Swal.fire({
                            icon: 'error',
                    title: 'Error',
                    text: msg
                        }).then(() => {
                            if (xhr.status === 401) {
                                sessionStorage.clear();
                                window.location.href = 'login.html';
                    }
                });
            }
        });
    });

    // Add new item button handler
    $('#addItemBtn').on('click', function() {
        $('#itemModalTitle').html('<i class="fas fa-plus"></i> Add New Item');
        $('#iform')[0].reset();
        $('#item_id').val('');
        $('#currentImages').html('');
        
        // Show save button, hide update button
        $('#itemSubmit').show();
        $('#itemUpdate').hide();
    });

    // Initialize
    loadItems();
});