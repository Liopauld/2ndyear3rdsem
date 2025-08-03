$(document).ready(function () {
    const url = 'http://localhost:4000/';
    var jwtToken = sessionStorage.getItem('jwtToken');
    // Admin check
    let isAdmin = false;
    if (jwtToken) {
        try {
            const payload = JSON.parse(atob(jwtToken.split('.')[1]));
            if (payload.role && payload.role === 'admin') {
                isAdmin = true;
            }
        } catch (e) {
            isAdmin = false;
        }
    }
    if (!isAdmin) {
        Swal.fire({
            icon: 'warning',
            title: 'Access Denied',
            text: 'Only authorized admin can access this page.',
            confirmButtonText: 'Go to Home',
            allowOutsideClick: false
        }).then(() => {
            window.location.href = 'home.html';
        });
        return;
    }
    $('#header').load('header.html');
    var table = $('#ordersTable').DataTable({
        ajax: {
            url: `${url}api/v1/orders`,
            dataSrc: function(json) {
                if (json.success && Array.isArray(json.orders)) return json.orders;
                if (json.rows) return json.rows;
                if (Array.isArray(json)) return json;
                if (json.data) return json.data;
                return [];
            },
            error: function(xhr, error, thrown) {
                let msg = xhr.status === 401 ? '401 Unauthorized: You are not authorized. Please log in again.' : (xhr.responseText || error);
                Swal.fire({
                  icon: 'error',
                  title: 'Failed to load orders',
                  text: msg
                }).then(() => {
                  if (xhr.status === 401) {
                    sessionStorage.clear();
                    window.location.href = 'login.html';
                  }
                });
            },
            headers: jwtToken ? { 'Authorization': 'Bearer ' + jwtToken } : {}
        },
        dom: 'frtip', // Remove 'B' to disable built-in buttons
        // Temporarily remove buttons to avoid node errors
        /*
        buttons: [
            {
                extend: 'pdfHtml5',
                text: '<i class="fas fa-file-pdf me-2"></i>PDF',
                className: 'btn btn-danger btn-sm d-none', // Hide default button
                title: 'GadgetEssence - Orders Report',
                customize: function(doc) {
                    doc.content[1].table.widths = ['15%', '20%', '20%', '15%', '20%', '10%'];
                    doc.styles.tableHeader.fillColor = '#667eea';
                    doc.styles.tableHeader.color = 'white';
                }
            },
            {
                extend: 'excelHtml5',
                text: '<i class="fas fa-file-excel me-2"></i>Excel',
                className: 'btn btn-success btn-sm d-none', // Hide default button
                title: 'GadgetEssence - Orders Report'
            }
        ],
        */
        columns: [
            { data: 'order_id' },
            { data: 'date_ordered', render: function(data) { return data ? new Date(data).toLocaleDateString() : ''; } },
            { data: 'date_delivery', render: function(data) { return data ? new Date(data).toLocaleDateString() : ''; } },
            { data: 'status', render: function(data) {
                let badgeClass = 'status-badge';
                let iconClass = 'fas fa-clock';
                
                if (data === 'processing') {
                    badgeClass += ' status-processing';
                    iconClass = 'fas fa-clock';
                } else if (data === 'delivered') {
                    badgeClass += ' status-delivered';
                    iconClass = 'fas fa-check-circle';
                } else if (data === 'canceled') {
                    badgeClass += ' status-canceled';
                    iconClass = 'fas fa-times-circle';
                }
                
                return `<span class='${badgeClass}'>
                    <i class='${iconClass} me-1'></i>
                    ${data.charAt(0).toUpperCase() + data.slice(1)}
                </span>`;
            }},
            { data: null, render: function(row) {
                // Show customer name (if available)
                let name = row.last_name || '';
                if (row.first_name) name += ', ' + row.first_name;
                return name || row.customer_id || '';
            }},
            { data: null, render: function(data, type, row) {
                return `<div class="action-buttons">
                    <a href='#' class='editStatusBtn btn btn-sm btn-outline-primary me-2' 
                       data-id='${row.order_id}' data-status='${row.status}' 
                       title="Edit Status">
                        <i class='fas fa-edit'></i>
                    </a>
                    <a href='#' class='deleteOrderBtn btn btn-sm btn-outline-danger' 
                       data-id='${row.order_id}' 
                       title="Delete Order">
                        <i class='fas fa-trash-alt'></i>
                    </a>
                </div>`;
            }}
        ]
    });
    // Edit status button
    $('#ordersTable tbody').on('click', 'a.editStatusBtn', function (e) {
        e.preventDefault();
        var orderId = $(this).data('id');
        var currentStatus = $(this).data('status');
        
        console.log('Editing order:', orderId, 'current status:', currentStatus);
        
        // Populate modal fields
        $('#modalOrderId').val(orderId);
        $('#modalCurrentStatus').val(currentStatus.charAt(0).toUpperCase() + currentStatus.slice(1));
        $('#modalStatus').val(''); // Clear new status selection
        $('#statusModal').modal('show');
    });
    
    // Reset modal when it's closed
    $('#statusModal').on('hidden.bs.modal', function () {
        const $saveBtn = $('#saveStatusBtn');
        $saveBtn.prop('disabled', false).html('Save changes');
        $('#statusForm')[0].reset();
    });
    // Save status
    $('#saveStatusBtn').on('click', function () {
        var orderId = $('#modalOrderId').val();
        var newStatus = $('#modalStatus').val();
        var currentStatus = $('#modalCurrentStatus').val().toLowerCase();

        if (!newStatus) {
            Swal.fire({
                icon: 'warning',
                title: 'Status Required',
                text: 'Please select a status before saving.',
                confirmButtonText: 'OK'
            });
            return;
        }

        if (newStatus === currentStatus) {
            Swal.fire({
                icon: 'info',
                title: 'No Change Required',
                text: 'The selected status is the same as the current status.',
                confirmButtonText: 'OK'
            });
            return;
        }

        console.log('Attempting to update order:', orderId, 'from:', currentStatus, 'to:', newStatus);

        // Validate status transition
        const validationResult = validateStatusTransition(currentStatus, newStatus);
        if (validationResult === false) {
            return; // Validation failed
        }

        // If validation returned 'confirm', the confirmation dialog is shown and will call proceedWithStatusUpdate
        if (validationResult === 'confirm') {
            return;
        }

        // Show SweetAlert loading spinner for up to 10 seconds
        Swal.fire({
            title: 'Updating Order...',
            html: 'Please wait while we update the order and send the email receipt.<br><br><b>This may take up to 10 seconds.</b>',
            allowOutsideClick: false,
            allowEscapeKey: false,
            didOpen: () => {
                Swal.showLoading();
            },
            timer: 10000,
            timerProgressBar: true
        });

        // Proceed with the update
        proceedWithStatusUpdate(orderId, newStatus, $(this));
    });
    
    // Extracted function for the actual status update process
    function proceedWithStatusUpdate(orderId, newStatus, $saveBtn) {
        
        // Show loading state on button
        $saveBtn.prop('disabled', true).html('<span class="order-status-loading"></span>Updating...');
        console.log('Proceeding with status update for order:', orderId, 'to status:', newStatus);
        $.ajax({
            method: 'PUT',
            url: `${url}api/v1/orders/${orderId}`,
            contentType: 'application/json; charset=utf-8',
            data: JSON.stringify({ status: newStatus }),
            headers: jwtToken ? { 'Authorization': 'Bearer ' + jwtToken } : {},
            timeout: 11000, // 11 seconds to allow for backend timeout
            success: function (data) {
                Swal.close(); // Close the loading spinner
                $('#statusModal').modal('hide');
                if (data && data.success) {
                    Swal.fire({
                        icon: 'success',
                        title: 'Order Status Updated!',
                        html: `
                            <div class="text-center">
                                <i class="fas fa-check-circle text-success mb-2" style="font-size: 2rem;"></i>
                                <p class="mb-2"><strong>Status updated successfully!</strong></p>
                                <p class="text-muted mb-0">Customer has been notified via email.</p>
                            </div>
                        `,
                        showConfirmButton: true,
                        confirmButtonText: 'Great!',
                        timer: 4000,
                        timerProgressBar: true,
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        color: '#ffffff',
                        customClass: {
                            popup: 'gadget-simple-update-popup',
                            confirmButton: 'btn btn-light'
                        }
                    });
                } else {
                    Swal.fire({
                        icon: 'warning',
                        title: 'Order Updated, but...',
                        html: `
                            <div class="text-center">
                                <i class="fas fa-exclamation-triangle text-warning mb-2" style="font-size: 2rem;"></i>
                                <p class="mb-0">${data && data.error ? data.error : 'Unknown issue occurred.'}</p>
                            </div>
                        `,
                        confirmButtonText: 'OK',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        color: '#ffffff',
                        customClass: {
                            popup: 'gadget-simple-update-popup',
                            confirmButton: 'btn btn-light'
                        }
                    });
                }
                table.ajax.reload();
            },
            error: function (xhr, textStatus, errorThrown) {
                Swal.close(); // Close the loading spinner
                $('#statusModal').modal('hide');
                let errorMessage = 'Update failed';
                if (textStatus === 'timeout') {
                    errorMessage = 'The operation took too long (over 10 seconds).<br>It may have failed to update the order or send the email receipt.';
                } else if (xhr.responseJSON && xhr.responseJSON.error) {
                    errorMessage = xhr.responseJSON.error;
                } else if (xhr.responseText) {
                    try {
                        const response = JSON.parse(xhr.responseText);
                        errorMessage = response.error || response.message || errorMessage;
                    } catch (e) {
                        errorMessage = xhr.responseText.length > 100 ?
                            'Server returned an unexpected response' : xhr.responseText;
                    }
                } else if (errorThrown) {
                    errorMessage = errorThrown;
                }
                Swal.fire({
                    icon: 'error',
                    title: 'Update Failed',
                    html: `
                        <div class="text-center">
                            <i class="fas fa-times-circle text-danger mb-2" style="font-size: 2rem;"></i>
                            <p class="mb-0">${errorMessage}</p>
                        </div>
                    `,
                    confirmButtonText: 'OK',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: '#ffffff',
                    customClass: {
                        popup: 'gadget-simple-update-popup',
                        confirmButton: 'btn btn-light'
                    }
                });
            },
            complete: function () {
                $saveBtn.prop('disabled', false).html('Save changes');
            }
        });
    } // End of proceedWithStatusUpdate function
    
    // Order status validation function (for database enum: 'processing', 'delivered', 'canceled')
    function validateStatusTransition(currentStatus, newStatus) {
        const current = currentStatus?.toLowerCase();
        const next = newStatus?.toLowerCase();
        
        // Valid statuses from your database enum
        const validStatuses = ['processing', 'delivered', 'canceled'];
        
        if (!validStatuses.includes(next)) {
            Swal.fire({
                icon: 'error',
                title: 'Invalid Status',
                text: 'Please select a valid status.',
                confirmButtonText: 'OK'
            });
            return false;
        }
        
        // For testing purposes - allow all status transitions
        return true;
    }
    
    // Delete order
    $('#ordersTable tbody').on('click', 'a.deleteOrderBtn', function (e) {
        e.preventDefault();
        var orderId = $(this).data('id');
        Swal.fire({
            title: 'Are you sure?',
            text: 'This will delete the order and all its orderlines!',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Yes, delete it!',
            cancelButtonText: 'Cancel'
        }).then((result) => {
            if (result.isConfirmed) {
                $.ajax({
                    method: 'DELETE',
                    url: `${url}api/v1/orders/${orderId}`,
                    headers: jwtToken ? { 'Authorization': 'Bearer ' + jwtToken } : {},
                    success: function (data) {
                        Swal.fire({ icon: 'success', title: 'Order deleted!' });
                        table.ajax.reload();
                    },
                    error: function (xhr) {
                        let msg = xhr.status === 401 ? '401 Unauthorized: You are not authorized. Please log in again.' : (xhr.responseText || 'Delete failed');
                        Swal.fire({ icon: 'error', title: 'Failed to delete order', text: msg });
                        if (xhr.status === 401) {
                            sessionStorage.clear();
                            window.location.href = 'login.html';
                        }
                    }
                });
            }
        });
    });
    // Download PDF receipt handler (robust against false error popups)
    $(document).on('click', '.download-receipt', function() {
        const orderId = $(this).data('orderid');
        const jwtToken = sessionStorage.getItem('jwtToken') || '';
        if (!jwtToken) {
            Swal.fire({
                icon: 'warning',
                text: 'You must be logged in to download the receipt.'
            });
            return;
        }
        $.ajax({
            url: `http://localhost:4000/api/v1/orders/${orderId}/receipt-pdf`,
            method: 'GET',
            xhrFields: { responseType: 'blob' },
            headers: { 'Authorization': 'Bearer ' + jwtToken },
            success: function (data, status, xhr) {
                const blob = new Blob([data], { type: 'application/pdf' });
                const link = document.createElement('a');
                link.href = window.URL.createObjectURL(blob);
                link.download = `OrderReceipt_${orderId}.pdf`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            },
            error: function (xhr) {
                // If the response is a PDF, treat as success
                const contentType = xhr.getResponseHeader && xhr.getResponseHeader('Content-Type');
                if (xhr.response && contentType && contentType.indexOf('application/pdf') !== -1) {
                    const blob = new Blob([xhr.response], { type: 'application/pdf' });
                    const link = document.createElement('a');
                    link.href = window.URL.createObjectURL(blob);
                    link.download = `OrderReceipt_${orderId}.pdf`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    return;
                }
                let msg = 'Failed to download receipt.';
                if (xhr.status === 401) {
                    msg = '401 Unauthorized: Please log in again.';
                } else if (xhr.responseJSON && xhr.responseJSON.message) {
                    msg = xhr.responseJSON.message;
                }
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
    
    // Custom Export Functions
    function exportOrdersToPDF() {
        // Get all data from the DataTable
        var data = table.rows().data().toArray();
        
        if (data.length === 0) {
            Swal.fire({
                icon: 'warning',
                title: 'No Data',
                text: 'No orders to export.'
            });
            return;
        }
        
        // Create PDF content
        var docDefinition = {
            content: [
                { 
                    text: 'GadgetEssence - Orders Report', 
                    fontSize: 16, 
                    alignment: 'center', 
                    margin: [0, 0, 0, 20] 
                },
                {
                    table: {
                        headerRows: 1,
                        widths: ['15%', '20%', '20%', '15%', '25%', '5%'],
                        body: [
                            ['Order ID', 'Date Ordered', 'Date Delivery', 'Status', 'Customer', 'Actions'],
                            ...data.map(order => [
                                order.order_id || '',
                                order.date_ordered ? new Date(order.date_ordered).toLocaleDateString() : '',
                                order.date_delivery ? new Date(order.date_delivery).toLocaleDateString() : '',
                                order.status || '',
                                (order.last_name || '') + (order.first_name ? ', ' + order.first_name : '') || order.customer_id || '',
                                'View/Edit'
                            ])
                        ]
                    }
                }
            ],
            styles: {
                tableHeader: {
                    fillColor: '#667eea',
                    color: 'white',
                    fontSize: 10
                }
            },
            defaultStyle: {
                fontSize: 9
            }
        };
        
        pdfMake.createPdf(docDefinition).download('GadgetEssence-Orders-Report.pdf');
    }
    
    function exportOrdersToExcel() {
        // Get all data from the DataTable
        var data = table.rows().data().toArray();
        
        if (data.length === 0) {
            Swal.fire({
                icon: 'warning',
                title: 'No Data',
                text: 'No orders to export.'
            });
            return;
        }
        
        // Create CSV content
        var csvContent = "data:text/csv;charset=utf-8,";
        csvContent += "Order ID,Date Ordered,Date Delivery,Status,Customer\n";
        
        data.forEach(order => {
            var customerName = (order.last_name || '') + (order.first_name ? ', ' + order.first_name : '') || order.customer_id || '';
            var row = [
                order.order_id || '',
                order.date_ordered ? new Date(order.date_ordered).toLocaleDateString() : '',
                order.date_delivery ? new Date(order.date_delivery).toLocaleDateString() : '',
                order.status || '',
                customerName.replace(/"/g, '""') // Escape quotes
            ].map(field => `"${field}"`).join(",");
            csvContent += row + "\n";
        });
        
        // Create download link
        var encodedUri = encodeURI(csvContent);
        var link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "GadgetEssence-Orders-Report.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
    
    // Custom Export Button Handlers
    $('#exportOrdersPDF').on('click', function() {
        $(this).addClass('loading');
        try {
            exportOrdersToPDF();
        } catch (error) {
            console.error('PDF Export Error:', error);
            Swal.fire({
                icon: 'error',
                title: 'Export Failed',
                text: 'Failed to generate PDF report.'
            });
        }
        setTimeout(() => {
            $(this).removeClass('loading');
        }, 1000);
    });
    
    $('#exportOrdersExcel').on('click', function() {
        $(this).addClass('loading');
        try {
            exportOrdersToExcel();
        } catch (error) {
            console.error('Excel Export Error:', error);
            Swal.fire({
                icon: 'error',
                title: 'Export Failed',
                text: 'Failed to generate Excel report.'
            });
        }
        setTimeout(() => {
            $(this).removeClass('loading');
        }, 1000);
    });
});
