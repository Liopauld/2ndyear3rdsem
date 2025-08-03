$(document).ready(function () {
    const url = 'http://localhost:4000/'

    // const getToken = () => {
    //     const userId = sessionStorage.getItem('userId');

    //     if (!userId) {
    //         Swal.fire({
    //             icon: 'warning',
    //             text: 'You must be logged in to access this page.',
    //             showConfirmButton: true
    //         }).then(() => {
    //             window.location.href = 'login.html';
    //         });
    //         return;
    //     }
    //     return true
    // }
 
    // Inline error helpers for user forms
    function clearUserInlineErrors() {
        $('.invalid-feedback').remove();
        $('.is-invalid').removeClass('is-invalid');
    }
    function showUserInlineError(selector, message) {
        const $input = $(selector);
        $input.addClass('is-invalid');
        if ($input.next('.invalid-feedback').length === 0) {
            $input.after(`<div class="invalid-feedback" style="display:block;">${message}</div>`);
        }
    }
    function validateRegisterForm() {
        let valid = true;
        clearUserInlineErrors();
        let last_name = $('#last_name').val().trim();
        let first_name = $('#first_name').val().trim();
        let email = $('#email').val().trim();
        let password = $('#password').val();
        // Last Name (required, min 2 chars, alpha only)
        if (!last_name) {
            valid = false;
            showUserInlineError('#last_name', 'Last name is required.');
        } else if (last_name.length < 2) {
            valid = false;
            showUserInlineError('#last_name', 'Last name must be at least 2 characters.');
        } else if (!/^[A-Za-z ]+$/.test(last_name)) {
            valid = false;
            showUserInlineError('#last_name', 'Last name must contain only letters and spaces.');
        }
        // First Name (required, min 2 chars, alpha only)
        if (!first_name) {
            valid = false;
            showUserInlineError('#first_name', 'First name is required.');
        } else if (first_name.length < 2) {
            valid = false;
            showUserInlineError('#first_name', 'First name must be at least 2 characters.');
        } else if (!/^[A-Za-z ]+$/.test(first_name)) {
            valid = false;
            showUserInlineError('#first_name', 'First name must contain only letters and spaces.');
        }
        // Email (only allow a-z, A-Z, 0-9, @, . and must be in format user@mail.com)
        if (!email) {
            valid = false;
            showUserInlineError('#email', 'Email is required.');
        } else if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email)) {
            valid = false;
            showUserInlineError('#email', 'Invalid email format. Only letters, numbers, @ and . are allowed.');
        } else if (/[^a-zA-Z0-9@.]/.test(email.replace(/@|\./g, ''))) {
            valid = false;
            showUserInlineError('#email', 'Email must not contain special characters except @ and .');
        }
        // Password
        if (!password) {
            valid = false;
            showUserInlineError('#password', 'Password is required.');
        } else if (password.length < 6) {
            valid = false;
            showUserInlineError('#password', 'Password must be at least 6 characters.');
        }
        return valid;
    }
    // Inline error helpers for profile form (like item.js)
    function clearProfileInlineErrors() {
        $('#profileForm .invalid-feedback').remove();
        $('#profileForm .is-invalid').removeClass('is-invalid');
    }
    function showProfileInlineError(selector, message) {
        const $input = $(selector);
        $input.addClass('is-invalid');
        if ($input.next('.invalid-feedback').length === 0) {
            $input.after(`<div class="invalid-feedback" style="display:block;">${message}</div>`);
        }
    }
    function validateProfileForm() {
        let valid = true;
        clearProfileInlineErrors();
        // Last Name (required, min 2 chars, alpha only)
        let last_name = $('#last_name').val().trim();
        if (!last_name) {
            valid = false;
            showProfileInlineError('#last_name', 'Last name is required.');
        } else if (last_name.length < 2) {
            valid = false;
            showProfileInlineError('#last_name', 'Last name must be at least 2 characters.');
        } else if (!/^[A-Za-z ]+$/.test(last_name)) {
            valid = false;
            showProfileInlineError('#last_name', 'Last name must contain only letters and spaces.');
        }
        // First Name (required, min 2 chars, alpha only)
        let first_name = $('#first_name').val().trim();
        if (!first_name) {
            valid = false;
            showProfileInlineError('#first_name', 'First name is required.');
        } else if (first_name.length < 2) {
            valid = false;
            showProfileInlineError('#first_name', 'First name must be at least 2 characters.');
        } else if (!/^[A-Za-z ]+$/.test(first_name)) {
            valid = false;
            showProfileInlineError('#first_name', 'First name must contain only letters and spaces.');
        }
        // Address (required)
        let address = $('#address').val().trim();
        if (!address) {
            valid = false;
            showProfileInlineError('#address', 'Address is required.');
        }
        // City (required, alpha only)
        let city = $('#city').val().trim();
        if (!city) {
            valid = false;
            showProfileInlineError('#city', 'City is required.');
        } else if (!/^[A-Za-z ]+$/.test(city)) {
            valid = false;
            showProfileInlineError('#city', 'City must contain only letters.');
        }
        // Zip code (required, 4-8 alphanumeric)
        let zipcode = $('#zipcode').val().trim();
        if (!zipcode) {
            valid = false;
            showProfileInlineError('#zipcode', 'Zip code is required.');
        } else if (!/^[a-zA-Z0-9\- ]{4,8}$/.test(zipcode)) {
            valid = false;
            showProfileInlineError('#zipcode', 'Zip code must be 4-8 letters/numbers.');
        }
        // Phone (required, 7-15 digits, numbers only)
        let phone = $('#phone').val().trim();
        if (!phone) {
            valid = false;
            showProfileInlineError('#phone', 'Phone is required.');
        } else if (!/^\d{7,15}$/.test(phone)) {
            valid = false;
            showProfileInlineError('#phone', 'Phone must be 7-15 digits and numbers only.');
        }
        // Optionally: validate avatar file type/size if present
        let avatar = $('#avatar')[0];
        if (avatar && avatar.files && avatar.files.length > 0) {
            let file = avatar.files[0];
            let ext = file.name.split('.').pop().toLowerCase();
            let allowed = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'];
            if (!allowed.includes(ext)) {
                valid = false;
                showProfileInlineError('#avatar', 'Only image files are allowed (jpg, jpeg, png, gif, bmp, webp).');
            }
            if (file.size > 10 * 1024 * 1024) {
                valid = false;
                showProfileInlineError('#avatar', 'Avatar image must be less than 10MB.');
            }
        }
        return valid;
    }
    function validateLoginForm() {
        let valid = true;
        clearUserInlineErrors();
        let email = $('#email').val().trim();
        let password = $('#password').val();
        // Email
        if (!email) {
            valid = false;
            showUserInlineError('#email', 'Email is required.');
        } else if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email)) {
            valid = false;
            showUserInlineError('#email', 'Invalid email format. Only letters, numbers, @ and . are allowed.');
        } else if (/[^a-zA-Z0-9@.]/.test(email.replace(/@|\./g, ''))) {
            valid = false;
            showUserInlineError('#email', 'Email must not contain special characters except @ and .');
        }
        // Password
        if (!password) {
            valid = false;
            showUserInlineError('#password', 'Password is required.');
        }
        return valid;
    }

    // Fix: Use both form submit and #register button click to trigger AJAX registration, but only submit via AJAX once
    function handleRegisterSubmit(e) {
        e.preventDefault();
        if (!validateRegisterForm()) return;
        const last_name  = $('#last_name').val();
        const first_name = $('#first_name').val();
        const email      = $('#email').val();
        const password   = $('#password').val();
        const user = { last_name, first_name, email, password };
        $.ajax({
            method: "POST",
            url: `${url}api/v1/users/register`,
            data: JSON.stringify(user),
            processData: false,
            contentType: 'application/json; charset=utf-8',
            dataType: "json",
            success: function (data) {
                console.log(data);
                if (data.success && data.email_sent) {
                    // Email verification flow
                    Swal.fire({
                        icon: 'success',
                        title: 'Registration Successful!',
                        html: `
                            <div style="text-align: left;">
                                <p><strong>Your account has been created successfully!</strong></p>
                                <p>📧 <strong>Please check your email</strong> and click the verification link to activate your account.</p>
                                <ul style="margin: 15px 0; padding-left: 20px;">
                                    <li>Check your inbox for an email from GadgetEssence</li>
                                    <li>Click the "Verify Email Address" button in the email</li>
                                    <li>After verification, you can log in to your account</li>
                                </ul>
                                <p><small><em>💡 Don't see the email? Check your spam/junk folder or click "Resend Email" on the login page.</em></small></p>
                            </div>
                        `,
                        confirmButtonText: 'Go to Login',
                        confirmButtonColor: '#667eea',
                        allowOutsideClick: false,
                        allowEscapeKey: false
                    }).then((result) => {
                        if (result.isConfirmed) {
                            window.location.href = 'login.html';
                        }
                    });
                } else if (data.success && !data.email_sent) {
                    // Registration successful but email failed
                    Swal.fire({
                        icon: 'warning',
                        title: 'Registration Successful',
                        html: `
                            <div style="text-align: left;">
                                <p><strong>Your account has been created!</strong></p>
                                <p>⚠️ However, there was an issue sending the verification email.</p>
                                <p>Please contact support or try to resend the verification email from the login page.</p>
                            </div>
                        `,
                        confirmButtonText: 'Go to Login',
                        confirmButtonColor: '#667eea'
                    }).then((result) => {
                        if (result.isConfirmed) {
                            window.location.href = 'login.html';
                        }
                    });
                } else {
                    // Fallback for unexpected response
                    Swal.fire({
                        icon: 'success',
                        title: 'Registration successful!',
                        text: data.message || 'You can now log in.',
                        confirmButtonText: 'OK'
                    }).then((result) => {
                        if (result.isConfirmed) {
                            window.location.href = 'login.html';
                        }
                    });
                }
            },
            error: function (error) {
                let msg = 'An error occurred.';
                if (error.responseJSON && error.responseJSON.message) {
                    msg = error.responseJSON.message;
                }
                Swal.fire({
                    icon: 'error',
                    title: 'Registration Failed',
                    text: msg
                });
            }
        });
    }
    $('#registerForm').off('submit').on('submit', handleRegisterSubmit);
    $('#register').off('click').on('click', function(e) {
        e.preventDefault();
        $('#registerForm').submit();
    });

    // Function to check if user profile is complete and redirect accordingly
    function checkUserProfileAndRedirect(userId, jwtToken) {
        $.ajax({
            url: `${url}api/v1/users/customer-by-userid/${userId}`,
            method: 'GET',
            dataType: 'json',
            headers: {
                'Authorization': 'Bearer ' + jwtToken
            },
            success: function(res) {
                console.log('Profile check response:', res);
                if (res.success && res.customer) {
                    const customer = res.customer;
                    // Check if all required profile fields are filled
                    const isProfileComplete = customer.title && 
                                            customer.last_name && 
                                            customer.first_name && 
                                            customer.address && 
                                            customer.city && 
                                            customer.zipcode && 
                                            customer.phone;
                    
                    if (isProfileComplete) {
                        // Profile is complete, redirect to home
                        window.location.href = 'home.html';
                    } else {
                        // Profile is incomplete, redirect to profile to complete it
                        window.location.href = 'profile.html';
                    }
                } else {
                    // Error getting profile, default to profile page
                    window.location.href = 'profile.html';
                }
            },
            error: function(err) {
                console.log('Error checking profile:', err);
                // Error getting profile, default to profile page
                window.location.href = 'profile.html';
            }
        });
    }

    // Enhanced function to show personalized welcome message and redirect
    function showWelcomeMessageAndRedirect(userId, jwtToken) {
        $.ajax({
            url: `${url}api/v1/users/customer-by-userid/${userId}`,
            method: 'GET',
            dataType: 'json',
            headers: {
                'Authorization': 'Bearer ' + jwtToken
            },
            success: function(res) {
                console.log('Welcome profile response:', res);
                let userName = 'User';
                let redirectMessage = '';
                let redirectUrl = 'profile.html';
                
                if (res.success && res.customer) {
                    const customer = res.customer;
                    
                    // Build user's display name
                    if (customer.first_name && customer.last_name) {
                        userName = `${customer.first_name} ${customer.last_name}`;
                    } else if (customer.first_name) {
                        userName = customer.first_name;
                    } else if (customer.last_name) {
                        userName = customer.last_name;
                    }
                    
                    // Check if profile is complete
                    const isProfileComplete = customer.title && 
                                            customer.last_name && 
                                            customer.first_name && 
                                            customer.address && 
                                            customer.city && 
                                            customer.zipcode && 
                                            customer.phone;
                    
                    if (isProfileComplete) {
                        redirectMessage = 'Taking you to the store...';
                        redirectUrl = 'home.html';
                    } else {
                        redirectMessage = 'Please complete your profile to continue...';
                        redirectUrl = 'profile.html';
                    }
                }
                
                // Show enhanced welcome message with user's name
                Swal.fire({
                    icon: 'success',
                    title: `Welcome Back, ${userName}!`,
                    text: redirectMessage,
                    showConfirmButton: false,
                    timer: 2000,
                    timerProgressBar: true,
                    position: "center",
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: '#ffffff',
                    customClass: {
                        popup: 'gadget-welcome-popup'
                    }
                }).then(() => {
                    window.location.href = redirectUrl;
                });
            },
            error: function(err) {
                console.log('Error getting welcome profile:', err);
                // Show generic welcome and redirect to profile
                Swal.fire({
                    icon: 'success',
                    title: 'Welcome Back!',
                    text: 'Please complete your profile to continue...',
                    showConfirmButton: false,
                    timer: 2000,
                    timerProgressBar: true,
                    position: "center",
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: '#ffffff',
                    customClass: {
                        popup: 'gadget-welcome-popup'
                    }
                }).then(() => {
                    window.location.href = 'profile.html';
                });
            }
        });
    }

    $("#login").off('click').on('click', function (e) {
        e.preventDefault();
        if (!validateLoginForm()) return;
        let email = $("#email").val()
        let password = $("#password").val()
        let user = {
            email,
            password
        }
        $.ajax({
            method: "POST",
            url: `${url}api/v1/users/login`,
            data: JSON.stringify(user),
            processData: false,
            contentType: 'application/json; charset=utf-8',
            dataType: "json",
            success: function (data) {
                console.log(data);
                console.log('LOGIN RESPONSE:', data.user);
                // Show the JWT token in an alert (for debugging)
                if (data.token) {
                    Swal.fire({
                        icon: 'info',
                        title: 'JWT Token',
                        html: `<textarea style='width:100%;height:80px'>${data.token}</textarea>`
                    });
                }
                
                sessionStorage.setItem('userId', JSON.stringify(data.user.id))
                sessionStorage.setItem('userEmail', data.user.email)
                sessionStorage.setItem('userRole', data.user.role || 'user')
                sessionStorage.setItem('userStatus', data.user.status || 'active')
                // Optionally store the token for later use
                if (data.token) sessionStorage.setItem('jwtToken', data.token)
                
                // Trigger login event for auth checker
                $(document).trigger('userLoggedIn');
                
                // Show enhanced welcome message and check profile
                showWelcomeMessageAndRedirect(data.user.id, data.token);
            },
            error: function (error) {
                console.log(error);
                let msg = 'An error occurred.';
                let icon = 'error';
                let showResendOption = false;
                
                if (error.status === 401) {
                    msg = error.responseJSON && error.responseJSON.message ? error.responseJSON.message : 'Invalid email or password.';
                } else if (error.status === 403) {
                    const responseData = error.responseJSON;
                    if (responseData && responseData.email_not_verified) {
                        // Email not verified case
                        msg = responseData.message || 'Please verify your email address before logging in.';
                        icon = 'warning';
                        showResendOption = true;
                    } else {
                        msg = responseData && responseData.message ? responseData.message : 'Your account is not active. Please contact an Administrator.';
                        icon = 'warning';
                    }
                } else if (error.responseJSON && error.responseJSON.message) {
                    msg = error.responseJSON.message;
                }
                
                if (showResendOption) {
                    // Show email verification error with resend option
                    Swal.fire({
                        icon: icon,
                        title: 'Email Verification Required',
                        html: `
                            <div style="text-align: left;">
                                <p><strong>${msg}</strong></p>
                                <p>📧 Please check your email for the verification link.</p>
                                <p><strong>Didn't receive the email?</strong></p>
                                <ul style="margin: 10px 0; padding-left: 20px;">
                                    <li>Check your spam/junk folder</li>
                                    <li>Click "Resend Verification Email" below</li>
                                </ul>
                            </div>
                        `,
                        showCancelButton: true,
                        confirmButtonText: '<i class="fas fa-envelope"></i> Resend Verification Email',
                        cancelButtonText: '<i class="fas fa-times"></i> Cancel',
                        confirmButtonColor: '#667eea',
                        cancelButtonColor: '#6c757d'
                    }).then((result) => {
                        if (result.isConfirmed) {
                            // Get email from form and show resend modal
                            const userEmail = $('#email').val();
                            showResendVerificationModal(userEmail);
                        }
                    });
                } else {
                    // Regular error message
                    Swal.fire({
                        icon: icon,
                        title: 'Login Failed',
                        text: msg,
                        showConfirmButton: true,
                        position: "center"
                    });
                }
            }
        });
    });

    $('#avatar').on('change', function () {
        const file = this.files[0];
        console.log(file)
        if (file) {
            const reader = new FileReader();
            reader.onload = function (e) {
                console.log(e.target.result)
                $('#avatarPreview').attr('src', e.target.result);
            };
            reader.readAsDataURL(file);
        }
    });

    $("#updateBtn").off('click').on('click', function (event) {
        event.preventDefault();
        if (!validateProfileForm()) return;
        let userId = sessionStorage.getItem('userId') ?? sessionStorage.getItem('userId')
        let jwtToken = sessionStorage.getItem('jwtToken');
        var data = $('#profileForm')[0];
        let formData = new FormData(data);
        let updateUserId = sessionStorage.getItem('userId') ?? sessionStorage.getItem('userId');
        formData.append('userId', updateUserId)
        $.ajax({
            method: "POST",
            url: `${url}api/v1/users/update-profile`,
            data: formData,
            contentType: false,
            processData: false,
            dataType: "json",
            headers: jwtToken ? { 'Authorization': 'Bearer ' + jwtToken } : {},
            success: function (data) {
                // Get user's name for personalization
                let firstName = $('#first_name').val() || 'User';
                let lastName = $('#last_name').val() || '';
                let fullName = lastName ? `${firstName} ${lastName}` : firstName;
                
                // Simple but elegant profile update message
                Swal.fire({
                    icon: 'success',
                    title: 'Profile Updated Successfully!',
                    html: `
                        <div class="profile-update-simple">
                            <div class="update-user-info">
                                <i class="fas fa-user-check text-success mb-2" style="font-size: 2rem;"></i>
                                <p class="mb-2"><strong>Welcome, ${fullName}!</strong></p>
                                <p class="text-muted mb-0">Your profile information has been saved successfully.</p>
                            </div>
                        </div>
                    `,
                    showConfirmButton: true,
                    confirmButtonText: 'Great!',
                    timer: 4000,
                    timerProgressBar: true,
                    position: "center",
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: '#ffffff',
                    customClass: {
                        popup: 'gadget-simple-update-popup',
                        confirmButton: 'btn btn-light'
                    }
                });
            },
            error: function (error) {
                let msg = 'An error occurred.';
                if (error.status === 401) {
                    msg = '401 Unauthorized: You are not authorized. Please log in again.';
                } else if (error.responseJSON && error.responseJSON.error) {
                    msg = error.responseJSON.error;
                }
                Swal.fire({
                    icon: 'error',
                    title: 'Update Failed',
                    text: msg,
                    confirmButtonText: 'OK'
                }).then(() => {
                    if (error.status === 401) {
                        sessionStorage.clear();
                        window.location.href = 'login.html';
                    }
                });
            }
        });
    });

    // $('#loginBody').load("header.html");


    $("#profile").load("header.html", function () {
        // After header is loaded, check sessionStorage for userId
        if (sessionStorage.getItem('userId')) {
            // Change Login link to Logout
            const $loginLink = $('a.nav-link[href="login.html"]');
            $loginLink.text('Logout').attr({ 'href': '#', 'id': 'logout-link' }).off('click').on('click', function (e) {
                e.preventDefault();
                var jwtToken = sessionStorage.getItem('jwtToken');
                var userId = sessionStorage.getItem('userId') ? JSON.parse(sessionStorage.getItem('userId')) : null;
                if (jwtToken && userId) {
                    $.ajax({
                        method: 'POST',
                        url: url + 'api/v1/logout',
                        contentType: 'application/json; charset=utf-8',
                        data: JSON.stringify({ userId: userId }),
                        headers: { 'Authorization': 'Bearer ' + jwtToken },
                        complete: function () {
                            // Trigger logout event for auth checker
                            $(document).trigger('userLoggedOut');
                            sessionStorage.clear();
                            window.location.href = 'login.html';
                        }
                    });
                } else {
                    // Trigger logout event for auth checker
                    $(document).trigger('userLoggedOut');
                    sessionStorage.clear();
                    window.location.href = 'login.html';
                }
            });
            // Hide Register menu (fix: use .parent() for <li> or .closest('.nav-item'))
            $('a.nav-link[href="register.html"]').parent().hide();
        }
    });

    $("#deactivateBtn").on('click', function (e) {
        e.preventDefault();
        let email = $("#email").val()
        let user = {
            email,
        }
        $.ajax({
            method: "DELETE",
            url: `${url}api/v1/deactivate`,
            data: JSON.stringify(user),
            processData: false,
            contentType: 'application/json; charset=utf-8',
            dataType: "json",
            success: function (data) {
                console.log(data);
                Swal.fire({
                    text: data.message,
                    showConfirmButton: false,
                    timer: 2000,
                    timerProgressBar: true,
                    position: "center"
                });
                sessionStorage.removeItem('userId')
                // window.location.href = 'home.html'
            },
            error: function (error) {
                console.log(error);
            }
        });
    });

    // Autofill profile form if user is logged in
    const userId = JSON.parse(sessionStorage.getItem('userId'));
    const jwtToken = sessionStorage.getItem('jwtToken');
    if (userId && jwtToken) {
        $.ajax({
            url: `${url}api/v1/users/customer-by-userid/${userId}`,
            method: 'GET',
            dataType: 'json',
            headers: {
                'Authorization': 'Bearer ' + jwtToken
            },
            success: function(res) {
                if (res.success && res.customer) {
                    $('#title').val(res.customer.title || '');
                    $('#last_name').val(res.customer.last_name || '');
                    $('#first_name').val(res.customer.first_name || '');
                    $('#address').val(res.customer.address || '');
                    $('#city').val(res.customer.city || '');
                    $('#zipcode').val(res.customer.zipcode || '');
                    $('#phone').val(res.customer.phone || '');
                    if (res.customer.image_path) {
                        $('#avatarPreview').attr('src', url + res.customer.image_path);
                    } else {
                        $('#avatarPreview').attr('src', url + 'storage/images/logo1.png');
                    }
                }
            },
            error: function(err) {
                console.log('Auth error or failed to fetch profile:', err);
                Swal.fire({
                    icon: 'error',
                    title: 'Authorization Error',
                    text: 'You are not authorized. Please log in again.'
                }).then(() => {
                    sessionStorage.clear();
                    window.location.href = 'login.html';
                });
            }
        });
    }

    // Admin DataTable for users/customers (only on users.html)
    if ($('#utable').length) {
        // Use the already-declared jwtToken variable at the top
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
        var table = $('#utable').DataTable({
            ajax: {
                url: `${url}api/v1/users/customers?all=true`,
                dataSrc: 'users',
                error: function(xhr, error, thrown) {
                    let msg = xhr.status === 401 ? '401 Unauthorized: You are not authorized. Please log in again.' : (xhr.responseText || error);
                    Swal.fire({
                      icon: 'error',
                      title: 'Failed to load users',
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
                    title: 'GadgetEssence - Users Report',
                    customize: function(doc) {
                        doc.content[1].table.widths = ['15%', '25%', '20%', '20%', '10%', '10%'];
                        doc.styles.tableHeader.fillColor = '#667eea';
                        doc.styles.tableHeader.color = 'white';
                    }
                },
                {
                    extend: 'excelHtml5',
                    text: '<i class="fas fa-file-excel me-2"></i>Excel',
                    className: 'btn btn-success btn-sm d-none', // Hide default button
                    title: 'GadgetEssence - Users Report'
                }
            ],
            */
            columns: [
                {
                    data: 'image_path',
                    width: "80px",
                    className: "text-center",
                    orderable: false,
                    render: function (data, type, row) {
                        if (data) {
                            return `<img src='${url}${data}' style='width:50px;height:50px;object-fit:cover;border-radius:50%;' alt='User Avatar' />`;
                        } else {
                            // Create avatar placeholder with first letter of first name
                            const initial = row.first_name ? row.first_name.charAt(0).toUpperCase() : '?';
                            return `<div style='width:50px;height:50px;border-radius:50%;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);color:white;font-weight:bold;display:flex;align-items:center;justify-content:center;margin:0 auto;'>${initial}</div>`;
                        }
                    }
                },
                { 
                    data: 'email',
                    render: function (data) {
                        return `<span class='user-email'>${data}</span>`;
                    }
                },
                { 
                    data: 'last_name',
                    render: function (data) {
                        return `<span class='user-name'>${data}</span>`;
                    }
                },
                { 
                    data: 'first_name',
                    render: function (data) {
                        return `<span class='user-name'>${data}</span>`;
                    }
                },
                { 
                    data: 'status',
                    render: function (data) {
                        let badgeClass = 'status-badge';
                        let iconClass = 'fas fa-circle';
                        
                        if (data === 'active') {
                            badgeClass += ' status-active';
                            iconClass = 'fas fa-check-circle';
                        } else {
                            badgeClass += ' status-inactive';
                            iconClass = 'fas fa-times-circle';
                        }
                        
                        return `<span class='${badgeClass}'>
                            <i class='${iconClass} me-1'></i>
                            ${data.charAt(0).toUpperCase() + data.slice(1)}
                        </span>`;
                    }
                },
                { 
                    data: 'role',
                    render: function (data) {
                        let badgeClass = 'status-badge';
                        let iconClass = 'fas fa-user';
                        
                        if (data === 'admin') {
                            badgeClass += ' role-admin';
                            iconClass = 'fas fa-user-shield';
                        } else {
                            badgeClass += ' role-user';
                            iconClass = 'fas fa-user';
                        }
                        
                        return `<span class='${badgeClass}'>
                            <i class='${iconClass} me-1'></i>
                            ${data.charAt(0).toUpperCase() + data.slice(1)}
                        </span>`;
                    }
                },
                {
                    data: null,
                    render: function (data, type, row) {
                        return `<div class="action-buttons">
                            <a href='#' class='editBtn btn btn-sm btn-outline-primary' 
                               data-id='${row.user_id}' 
                               title="Edit User">
                                <i class='fas fa-edit'></i>
                            </a>
                        </div>`;
                    }
                }
            ]
        });

        // Edit button handler
        $('#utable tbody').on('click', 'a.editBtn', function (e) {
            e.preventDefault();
            var data = table.row($(this).parents('tr')).data();
            $('#user_id').val(data.user_id);
            $('#status').val(data.status);
            $('#role').val(data.role);
            // Commented out: populate other fields for future use
            // $('#customer_id').val(data.customer_id);
            // $('#email').val(data.email);
            // $('#last_name').val(data.last_name);
            // $('#first_name').val(data.first_name);
            // $('#address').val(data.address);
            // if (data.image_path) {
            //     $('#imagePreview').attr('src', url + data.image_path).show();
            // } else {
            //     $('#imagePreview').hide();
            // }
            $('#userModal').modal('show');
        });

        // Update user/customer (status and role only)
        $('#userUpdate').on('click', function (e) {
            e.preventDefault();
            let userId = $('#user_id').val();
            let status = $('#status').val();
            let role = $('#role').val();
            $.ajax({
                method: 'POST',
                url: `${url}api/v1/users/customers/${userId}/status-role`,
                data: JSON.stringify({ status, role }),
                contentType: 'application/json; charset=utf-8',
                dataType: 'json',
                headers: jwtToken ? { 'Authorization': 'Bearer ' + jwtToken } : {},
                success: function (data) {
                    $('#userModal').modal('hide');
                    Swal.fire({
                      icon: 'success',
                      title: 'Success',
                      text: 'User updated successfully!'
                    });
                    table.ajax.reload();
                },
                error: function (xhr) {
                    let msg = xhr.status === 401 ? '401 Unauthorized: You are not authorized. Please log in again.' : (xhr.responseText || 'Update failed');
                    Swal.fire({
                      icon: 'error',
                      title: 'Failed to update user',
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
        function exportUsersToPDF() {
            // Get all data from the DataTable
            var data = table.rows().data().toArray();
            
            if (data.length === 0) {
                Swal.fire({
                    icon: 'warning',
                    title: 'No Data',
                    text: 'No users to export.'
                });
                return;
            }
            
            // Create PDF content
            var docDefinition = {
                content: [
                    { 
                        text: 'GadgetEssence - Users Report', 
                        fontSize: 16, 
                        alignment: 'center', 
                        margin: [0, 0, 0, 20] 
                    },
                    {
                        table: {
                            headerRows: 1,
                            widths: ['25%', '20%', '20%', '15%', '10%', '10%'],
                            body: [
                                ['Email', 'Last Name', 'First Name', 'Status', 'Role', 'Avatar'],
                                ...data.map(user => [
                                    user.email || '',
                                    user.last_name || '',
                                    user.first_name || '',
                                    user.status || '',
                                    user.role || '',
                                    user.image_path ? 'Yes' : 'No'
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
            
            pdfMake.createPdf(docDefinition).download('GadgetEssence-Users-Report.pdf');
        }
        
        function exportUsersToExcel() {
            // Get all data from the DataTable
            var data = table.rows().data().toArray();
            
            if (data.length === 0) {
                Swal.fire({
                    icon: 'warning',
                    title: 'No Data',
                    text: 'No users to export.'
                });
                return;
            }
            
            // Create CSV content
            var csvContent = "data:text/csv;charset=utf-8,";
            csvContent += "Email,Last Name,First Name,Status,Role,Avatar\n";
            
            data.forEach(user => {
                var row = [
                    user.email || '',
                    (user.last_name || '').replace(/"/g, '""'), // Escape quotes
                    (user.first_name || '').replace(/"/g, '""'),
                    user.status || '',
                    user.role || '',
                    user.image_path ? 'Yes' : 'No'
                ].map(field => `"${field}"`).join(",");
                csvContent += row + "\n";
            });
            
            // Create download link
            var encodedUri = encodeURI(csvContent);
            var link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", "GadgetEssence-Users-Report.csv");
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
        
        // Custom Export Button Handlers
        $('#exportUsersPDF').on('click', function() {
            $(this).addClass('loading');
            try {
                exportUsersToPDF();
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
        
        $('#exportUsersExcel').on('click', function() {
            $(this).addClass('loading');
            try {
                exportUsersToExcel();
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
    }
    
    // Function to show resend verification email modal
    function showResendVerificationModal(prefillEmail = '') {
        Swal.fire({
            title: '<i class="fas fa-envelope"></i> Resend Verification Email',
            html: `
                <div style="text-align: left;">
                    <p>Enter your email address to receive a new verification link:</p>
                    <div class="form-group mt-3">
                        <label for="resendEmailInput" class="form-label">Email Address:</label>
                        <input type="email" id="resendEmailInput" class="form-control" placeholder="Enter your email" value="${prefillEmail}" required>
                    </div>
                    <small class="text-muted">
                        <i class="fas fa-info-circle"></i> 
                        Make sure to check your spam/junk folder for the verification email.
                    </small>
                </div>
            `,
            showCancelButton: true,
            confirmButtonText: '<i class="fas fa-paper-plane"></i> Send Email',
            cancelButtonText: '<i class="fas fa-times"></i> Cancel',
            confirmButtonColor: '#667eea',
            cancelButtonColor: '#6c757d',
            preConfirm: () => {
                const email = document.getElementById('resendEmailInput').value;
                if (!email) {
                    Swal.showValidationMessage('Please enter your email address');
                    return false;
                }
                if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                    Swal.showValidationMessage('Please enter a valid email address');
                    return false;
                }
                return email;
            }
        }).then((result) => {
            if (result.isConfirmed) {
                const email = result.value;
                resendVerificationEmail(email);
            }
        });
    }
    
    // Function to resend verification email
    function resendVerificationEmail(email) {
        // Show loading
        Swal.fire({
            title: 'Sending Email...',
            html: '<i class="fas fa-spinner fa-spin"></i> Please wait while we send your verification email.',
            allowOutsideClick: false,
            allowEscapeKey: false,
            showConfirmButton: false
        });
        
        $.ajax({
            url: `${url}api/v1/users/resend-verification`,
            method: 'POST',
            dataType: 'json',
            contentType: 'application/json',
            data: JSON.stringify({ email: email }),
            success: function(response) {
                if (response.success) {
                    Swal.fire({
                        icon: 'success',
                        title: 'Email Sent!',
                        html: `
                            <div style="text-align: left;">
                                <p><strong>Verification email sent successfully!</strong></p>
                                <p>📧 Please check your email inbox and click the verification link.</p>
                                <p><small><em>💡 Don't see the email? Check your spam/junk folder.</em></small></p>
                            </div>
                        `,
                        confirmButtonText: 'OK',
                        confirmButtonColor: '#667eea'
                    });
                } else {
                    Swal.fire({
                        icon: 'error',
                        title: 'Failed to Send',
                        text: response.message || 'Failed to send verification email.',
                        confirmButtonColor: '#667eea'
                    });
                }
            },
            error: function(error) {
                let message = 'Failed to send verification email.';
                if (error.responseJSON && error.responseJSON.message) {
                    message = error.responseJSON.message;
                }
                
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: message,
                    confirmButtonColor: '#667eea'
                });
            }
        });
    }
    
    // Make functions globally accessible
    window.showResendVerificationModal = showResendVerificationModal;
    window.resendVerificationEmail = resendVerificationEmail;
})