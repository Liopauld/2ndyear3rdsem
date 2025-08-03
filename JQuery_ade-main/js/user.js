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
        filterInputs: ['statusFilter', 'roleFilter'],
        onItemRender: renderUsersTable,
        onDataLoad: function(data) {
            console.log('Users loaded:', data.length);
        }
    });

    // Custom render function for users table
    function renderUsersTable(users) {
        if (users.length === 0) {
            $('#dataContainer').html('<div class="alert alert-info">No users found.</div>');
            return;
        }

        let html = '<div class="table-responsive"><table class="table table-hover gadget-admin-table">';
        html += '<thead><tr>';
        html += '<th><i class="fas fa-image"></i> Avatar</th>';
        html += '<th><i class="fas fa-envelope"></i> Email</th>';
        html += '<th><i class="fas fa-user"></i> Last Name</th>';
        html += '<th><i class="fas fa-user"></i> First Name</th>';
        html += '<th><i class="fas fa-toggle-on"></i> Status</th>';
        html += '<th><i class="fas fa-user-shield"></i> Role</th>';
        html += '<th><i class="fas fa-cogs"></i> Actions</th>';
        html += '</tr></thead><tbody>';

        users.forEach(function(user) {
            const avatar = user.image_path ? 
                `<img src="${url}${user.image_path}" class="rounded-circle" width="40" height="40" alt="Avatar">` :
                `<div class="bg-secondary rounded-circle d-flex align-items-center justify-content-center" style="width: 40px; height: 40px;">
                    <i class="fas fa-user text-white"></i>
                </div>`;

            const statusBadge = user.status === 'active' ? 
                '<span class="status-badge status-active">Active</span>' :
                '<span class="status-badge status-inactive">Inactive</span>';

            const roleBadge = user.role === 'admin' ? 
                '<span class="status-badge role-admin">Admin</span>' :
                '<span class="status-badge role-user">User</span>';

            html += '<tr>';
            html += `<td>${avatar}</td>`;
            html += `<td>${user.email || ''}</td>`;
            html += `<td>${user.last_name || ''}</td>`;
            html += `<td>${user.first_name || ''}</td>`;
            html += `<td>${statusBadge}</td>`;
            html += `<td>${roleBadge}</td>`;
            html += `<td>
                <div class="btn-group btn-group-sm">
                    <button class="btn btn-primary btn-edit" data-id="${user.user_id}" title="Edit User">
                        <i class="fas fa-edit"></i>
                    </button>
                            </div>
            </td>`;
            html += '</tr>';
        });

        html += '</tbody></table></div>';
        $('#dataContainer').html(html);
    }

    // Override the applyFilters method for custom filtering
    paginationUtility.applyFilters = function() {
        const statusFilter = $('#statusFilter').val();
        const roleFilter = $('#roleFilter').val();
        
        this.filteredData = this.allData.filter(user => {
            const statusMatch = !statusFilter || user.status === statusFilter;
            const roleMatch = !roleFilter || user.role === roleFilter;
            return statusMatch && roleMatch;
        });
        
        this.currentPage = 1;
        this.infiniteScrollCount = this.options.infiniteScrollStep;
        this.displayData();
    };

    // Load users data
    function loadUsers() {
        $.ajax({
            url: `${url}api/v1/users/customers?all=true`,
            method: 'GET',
            dataType: 'json',
            headers: jwtToken ? { 'Authorization': 'Bearer ' + jwtToken } : {},
            success: function (response) {
                if (response.success) {
                    paginationUtility.loadData(response.users);
                } else {
                    Swal.fire({
                        icon: 'error',
                        title: 'Error',
                        text: response.message || 'Failed to load users'
                    });
                }
            },
            error: function (xhr) {
                let msg = xhr.status === 401 ? 'Unauthorized: Please log in again.' : 
                         xhr.status === 404 ? 'Users not found.' :
                         (xhr.responseJSON && xhr.responseJSON.error ? xhr.responseJSON.error : 'Failed to load users');
                
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

    // Edit user handler
    $(document).on('click', '.btn-edit', function() {
        const userId = $(this).data('id');
        const user = paginationUtility.allData.find(u => u.user_id == userId);
        
        console.log('Edit user clicked:', userId, user); // Debug log
        
        if (user) {
            $('#user_id').val(user.user_id);
            $('#status').val(user.status);
            $('#role').val(user.role);
            $('#userModal').modal('show');
        } else {
            console.error('User not found:', userId);
                    Swal.fire({
                      icon: 'error',
                title: 'Error',
                text: 'User not found'
            });
        }
    });

    // Update user button handler
    $('#userUpdate').on('click', function() {
        const userId = $('#user_id').val();
        const status = $('#status').val();
        const role = $('#role').val();
        
        console.log('Update user:', { userId, status, role }); // Debug log
        
        $.ajax({
            url: `${url}api/v1/users/customers/${userId}/status-role`,
            method: 'PUT',
            dataType: 'json',
            contentType: 'application/json',
            data: JSON.stringify({
                status: status,
                role: role
            }),
            headers: jwtToken ? { 'Authorization': 'Bearer ' + jwtToken } : {},
            success: function (response) {
                if (response.success) {
                    $('#userModal').modal('hide');
                    Swal.fire({
                        icon: 'success',
                        title: 'Success',
                        text: response.message || 'User updated successfully',
                        timer: 2000,
                        showConfirmButton: false
                    }).then(() => {
                        loadUsers(); // Reload data
                    });
                } else {
                    Swal.fire({
                        icon: 'error',
                        title: 'Error',
                        text: response.message || 'Failed to update user'
                    });
                }
            },
            error: function (xhr) {
                let msg = xhr.status === 401 ? 'Unauthorized: Please log in again.' : 
                         xhr.status === 404 ? 'User not found.' :
                         (xhr.responseJSON && xhr.responseJSON.error ? xhr.responseJSON.error : 'Failed to update user');
                
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
    loadUsers();
});