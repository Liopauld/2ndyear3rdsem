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
        filterInputs: ['statusFilter', 'dateFrom', 'dateTo'],
        onItemRender: renderOrdersTable,
        onDataLoad: function(data) {
            console.log('Orders loaded:', data.length);
        }
    });

    // Custom render function for orders table
    function renderOrdersTable(orders) {
        if (orders.length === 0) {
            $('#dataContainer').html('<div class="alert alert-info">No orders found.</div>');
            return;
        }

        let html = '<div class="table-responsive"><table class="table table-hover gadget-admin-table">';
        html += '<thead><tr>';
        html += '<th><i class="fas fa-hashtag me-2"></i>Order ID</th>';
        html += '<th><i class="fas fa-calendar-alt me-2"></i>Date Ordered</th>';
        html += '<th><i class="fas fa-truck me-2"></i>Date Delivery</th>';
        html += '<th><i class="fas fa-info-circle me-2"></i>Status</th>';
        html += '<th><i class="fas fa-user me-2"></i>Customer</th>';
        html += '<th><i class="fas fa-cogs me-2"></i>Actions</th>';
        html += '</tr></thead><tbody>';

        orders.forEach(function(order) {
            const statusBadge = getStatusBadge(order.status);
            const customerName = `${order.first_name || ''} ${order.last_name || ''}`.trim() || 'N/A';
            const dateOrdered = order.date_ordered ? new Date(order.date_ordered).toLocaleDateString() : 'N/A';
            const dateDelivery = order.date_delivery ? new Date(order.date_delivery).toLocaleDateString() : 'N/A';

            html += '<tr>';
            html += `<td><strong>#${order.order_id}</strong></td>`;
            html += `<td>${dateOrdered}</td>`;
            html += `<td>${dateDelivery}</td>`;
            html += `<td>${statusBadge}</td>`;
            html += `<td>${customerName}</td>`;
            html += `<td>
                <div class="btn-group btn-group-sm">
                    <button class="btn btn-primary btn-edit-status" data-id="${order.order_id}" data-status="${order.status}" title="Update Status">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-info btn-view-details" data-id="${order.order_id}" title="View Details">
                        <i class="fas fa-eye"></i>
                    </button>
                </div>
            </td>`;
            html += '</tr>';
        });

        html += '</tbody></table></div>';
        $('#dataContainer').html(html);
    }

    function getStatusBadge(status) {
        const statusClasses = {
            'pending': 'status-pending',
            'processing': 'status-processing',
            'delivered': 'status-delivered',
            'canceled': 'status-canceled'
        };
        
        const statusText = status.charAt(0).toUpperCase() + status.slice(1);
        const statusClass = statusClasses[status] || 'status-pending';
        
        return `<span class="status-badge ${statusClass}">${statusText}</span>`;
    }

    // Override the applyFilters method for custom filtering
    paginationUtility.applyFilters = function() {
        const statusFilter = $('#statusFilter').val();
        const dateFrom = $('#dateFrom').val();
        const dateTo = $('#dateTo').val();
        
        this.filteredData = this.allData.filter(order => {
            const statusMatch = !statusFilter || order.status === statusFilter;
            
            let dateMatch = true;
            if (dateFrom || dateTo) {
                const orderDate = new Date(order.date_ordered);
                if (dateFrom) {
                    const fromDate = new Date(dateFrom);
                    dateMatch = dateMatch && orderDate >= fromDate;
                }
                if (dateTo) {
                    const toDate = new Date(dateTo);
                    toDate.setHours(23, 59, 59); // Include the entire day
                    dateMatch = dateMatch && orderDate <= toDate;
                }
            }
            
            return statusMatch && dateMatch;
        });
        
        this.currentPage = 1;
        this.infiniteScrollCount = this.options.infiniteScrollStep;
        this.displayData();
    };

    // Load orders data
    function loadOrders() {
        $.ajax({
            url: `${url}api/v1/orders`,
            method: 'GET',
            dataType: 'json',
            headers: jwtToken ? { 'Authorization': 'Bearer ' + jwtToken } : {},
            success: function (response) {
                if (response.success) {
                    paginationUtility.loadData(response.orders);
                } else {
                    Swal.fire({
                        icon: 'error',
                        title: 'Error',
                        text: response.message || 'Failed to load orders'
                    });
                }
            },
            error: function (xhr) {
                let msg = xhr.status === 401 ? 'Unauthorized: Please log in again.' : 
                         xhr.status === 404 ? 'Orders not found.' :
                         (xhr.responseJSON && xhr.responseJSON.error ? xhr.responseJSON.error : 'Failed to load orders');
                
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

    // Edit status handler
    $(document).on('click', '.btn-edit-status', function() {
        const orderId = $(this).data('id');
        const currentStatus = $(this).data('status');
        
        $('#modalOrderId').val(orderId);
        $('#modalCurrentStatus').val(currentStatus);
        $('#statusModal').modal('show');
    });
    
    // View details handler
    $(document).on('click', '.btn-view-details', function() {
        const orderId = $(this).data('id');
        
        // Load order details
        $.ajax({
            url: `${url}api/v1/orders/${orderId}`,
            method: 'GET',
            dataType: 'json',
            headers: jwtToken ? { 'Authorization': 'Bearer ' + jwtToken } : {},
            success: function (response) {
                if (response.success) {
                    showOrderDetails(response.order);
                } else {
                    Swal.fire({
                        icon: 'error',
                        title: 'Error',
                        text: response.message || 'Failed to load order details'
                    });
                }
            },
            error: function (xhr) {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Failed to load order details'
                });
            }
        });
    });

    function showOrderDetails(order) {
        // Create a modal to show order details
        const modalHtml = `
            <div class="modal fade" id="orderDetailsModal" tabindex="-1" role="dialog">
                <div class="modal-dialog modal-lg" role="document">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">
                                <i class="fas fa-shopping-cart"></i> Order Details #${order.order_id}
                            </h5>
                            <button type="button" class="close" data-dismiss="modal">
                                <span>&times;</span>
                            </button>
                        </div>
                        <div class="modal-body">
                            <div class="row">
                                <div class="col-md-6">
                                    <h6>Order Information</h6>
                                    <p><strong>Order ID:</strong> #${order.order_id}</p>
                                    <p><strong>Date Ordered:</strong> ${new Date(order.date_ordered).toLocaleDateString()}</p>
                                    <p><strong>Status:</strong> ${getStatusBadge(order.status)}</p>
                                </div>
                                <div class="col-md-6">
                                    <h6>Customer Information</h6>
                                    <p><strong>Name:</strong> ${order.first_name} ${order.last_name}</p>
                                    <p><strong>Email:</strong> ${order.email}</p>
                                    <p><strong>Phone:</strong> ${order.phone || 'N/A'}</p>
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-dismiss="modal">Close</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Remove existing modal if any
        $('#orderDetailsModal').remove();
        
        // Add new modal to body
        $('body').append(modalHtml);
        
        // Show modal
        $('#orderDetailsModal').modal('show');
    }

    // Update status form submission
    $('#statusForm').on('submit', function(e) {
        e.preventDefault();
        
        const orderId = $('#modalOrderId').val();
        const newStatus = $('#modalNewStatus').val();
        
                $.ajax({
            url: `${url}api/v1/orders/${orderId}/status`,
            method: 'PUT',
            dataType: 'json',
            contentType: 'application/json',
            data: JSON.stringify({
                status: newStatus
            }),
                    headers: jwtToken ? { 'Authorization': 'Bearer ' + jwtToken } : {},
            success: function (response) {
                if (response.success) {
                    $('#statusModal').modal('hide');
                    Swal.fire({
                        icon: 'success',
                        title: 'Success',
                        text: response.message || 'Order status updated successfully',
                        timer: 2000,
                        showConfirmButton: false
                    }).then(() => {
                        loadOrders(); // Reload data
                    });
                } else {
            Swal.fire({
                        icon: 'error',
                        title: 'Error',
                        text: response.message || 'Failed to update order status'
                    });
                }
            },
            error: function (xhr) {
                let msg = xhr.status === 401 ? 'Unauthorized: Please log in again.' : 
                         xhr.status === 404 ? 'Order not found.' :
                         (xhr.responseJSON && xhr.responseJSON.error ? xhr.responseJSON.error : 'Failed to update order status');
                
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
    
    // Initialize
    loadOrders();
});
