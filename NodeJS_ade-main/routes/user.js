const express = require('express');
const router = express.Router();
const upload = require('../utils/multer')
const sendEmail = require('../utils/sendEmail');

const { isAuthenticatedUser, isAdmin } = require('../middlewares/auth');

const { registerUser, 
    loginUser, 
    updateUser, 
    deactivateUser, 
    // getCustomerByEmail, 
    getCustomerByUserId, 
    getAllUsersWithCustomers,
    updateUserStatusRole,
    logoutUser,
    verifyEmail,
    resendVerificationEmail,
    getAuthStatus } = require('../controllers/user')

router.post('/register', registerUser)
router.post('/login', loginUser)
router.get('/verify-email', verifyEmail)
router.get('/auth-status', isAuthenticatedUser, getAuthStatus)
router.get('/verify-email-redirect', (req, res) => {
  const token = req.query.token;
  if (token) {
    res.redirect(`/verify-email.html?token=${token}`);
  } else {
    res.redirect('/verify-email.html');
  }
});
router.get('/verify-email-page', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Email Verification - GadgetEssence</title>
        
        <!-- Bootstrap CSS -->
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/bootstrap@4.0.0/dist/css/bootstrap.min.css"
          integrity="sha384-Gn5384xqQ1aoWXA+058RXPxPg6fy4IWvTNh0E263XmFcJlSAwiGgFAW/dAiS6JXm"
          crossorigin="anonymous"
        />
        
        <!-- SweetAlert CSS -->
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/sweetalert2/11.16.1/sweetalert2.css"
          integrity="sha512-fjO3Vy3QodX9c6G9AUmr6WuIaEPdGRxBjD7gjatG5gGylzYyrEq3U0q+smkG6CwIY0L8XALRFHh4KPHig0Q1ug=="
          crossorigin="anonymous"
          referrerpolicy="no-referrer"
        />
        
        <!-- Font Awesome -->
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css"
          crossorigin="anonymous"
        />
        
        <!-- jQuery -->
        <script
          src="https://code.jquery.com/jquery-3.6.4.min.js"
          integrity="sha256-oP6HI9z1XaZNBrJURtCoUT5SUnxFr8s3BzRl+cbzUq8="
          crossorigin="anonymous"
        ></script>
        
        <!-- Bootstrap JS -->
        <script
          src="https://cdn.jsdelivr.net/npm/popper.js@1.12.9/dist/umd/popper.min.js"
          integrity="sha384-ApNbgh9B+Y1QKtv3Rn7W3mgPxhU9K/ScQsAP7hUibX39j7fakFPskvXusvfa0b4Q"
          crossorigin="anonymous"
        ></script>
        <script
          src="https://cdn.jsdelivr.net/npm/bootstrap@4.0.0/dist/js/bootstrap.min.js"
          integrity="sha384-JZR6Spejh4U02d8jOt6vLEHfe/JQGiRRSQQxSfFWpi1MquVdAyjUar5+76PVCmYl"
          crossorigin="anonymous"
        ></script>
        
        <!-- SweetAlert JS -->
        <script
          src="https://cdnjs.cloudflare.com/ajax/libs/sweetalert2/11.16.1/sweetalert2.min.js"
          integrity="sha512-LGHBR+kJ5jZSIzhhdfytPoEHzgaYuTRifq9g5l6ja6/k9NAOsAi5dQh4zQF6JIRB8cAYxTRedERUF+97/KuivQ=="
          crossorigin="anonymous"
          referrerpolicy="no-referrer"
        ></script>
    </head>
    <body>
        <div class="gadget-verify-container">
            <div class="container">
                <div class="row justify-content-center">
                    <div class="col-md-8 col-lg-6">
                        <div class="gadget-verify-card">
                            <div class="gadget-verify-header" id="verifyHeader">
                                <div class="gadget-loading-spinner">
                                    <i class="fas fa-circle-notch fa-spin"></i>
                                </div>
                                <h2>Verifying Your Email...</h2>
                                <p>Please wait while we verify your email address.</p>
                            </div>
                            
                            <div class="gadget-verify-content" id="verifyContent">
                                <!-- Content will be populated by JavaScript -->
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Resend Verification Modal -->
        <div class="modal fade" id="resendVerificationModal" tabindex="-1" role="dialog" aria-labelledby="resendVerificationModalLabel" aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered" role="document">
                <div class="modal-content">
                    <div class="modal-header bg-primary text-white">
                        <h5 class="modal-title" id="resendVerificationModalLabel">
                            <i class="fas fa-envelope"></i> Resend Verification Email
                        </h5>
                        <button type="button" class="close text-white" data-dismiss="modal" aria-label="Close">
                            <span aria-hidden="true">&times;</span>
                        </button>
                    </div>
                    <div class="modal-body">
                        <form id="resendVerificationForm">
                            <div class="form-group">
                                <label for="resendEmail">Email Address</label>
                                <input type="email" class="form-control" id="resendEmail" placeholder="Enter your email address" required>
                            </div>
                            <div class="form-group">
                                <small class="text-muted">
                                    Enter the email address associated with your account to receive a new verification link.
                                </small>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-dismiss="modal">
                            <i class="fas fa-times"></i> Cancel
                        </button>
                        <button type="button" class="btn btn-primary" id="resendVerificationBtn">
                            <i class="fas fa-paper-plane"></i> Send Verification Email
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <script>
            $(document).ready(function () {
                const url = window.location.origin;
                
                // Get token from URL parameters
                const urlParams = new URLSearchParams(window.location.search);
                const token = urlParams.get('token');
                
                if (!token) {
                    showError('No verification token provided. Please check your email for the correct verification link.');
                    return;
                }
                
                // Verify email
                verifyEmail(token);
                
                function verifyEmail(token) {
                    $.ajax({
                        url: \`\${url}/api/v1/users/verify-email?token=\${token}\`,
                        method: 'GET',
                        dataType: 'json',
                        success: function(response) {
                            console.log('Verification response:', response);
                            if (response.success) {
                                showSuccess(response.message, response.user);
                            } else {
                                showError(response.message || 'Email verification failed.');
                            }
                        },
                        error: function(error) {
                            console.error('Verification error:', error);
                            let message = 'Email verification failed. ';
                            
                            if (error.responseJSON && error.responseJSON.message) {
                                message += error.responseJSON.message;
                            } else if (error.status === 400) {
                                message += 'Invalid or expired verification token.';
                            } else if (error.status === 500) {
                                message += 'Server error. Please try again later.';
                            } else {
                                message += 'Please try again.';
                            }
                            
                            showError(message);
                        }
                    });
                }
                
                function showSuccess(message, user) {
                    $('#verifyHeader').html(\`
                        <div class="gadget-success-icon">
                            <i class="fas fa-check-circle"></i>
                        </div>
                        <h2>Email Verified Successfully!</h2>
                        <p>Your account has been activated.</p>
                    \`);
                    
                    $('#verifyContent').html(\`
                        <div class="alert alert-success">
                            <i class="fas fa-check-circle"></i>
                            <strong>Success!</strong> \${message}
                        </div>
                        <div class="verification-details">
                            <h5>What's Next?</h5>
                            <ul class="list-unstyled">
                                <li><i class="fas fa-sign-in-alt text-primary"></i> Log in to your account</li>
                                <li><i class="fas fa-shopping-bag text-success"></i> Start shopping for amazing gadgets</li>
                                <li><i class="fas fa-user text-info"></i> Complete your profile</li>
                                <li><i class="fas fa-heart text-danger"></i> Save your favorite items</li>
                            </ul>
                        </div>
                        <div class="verification-actions">
                            <a href="\${url}/login" class="btn gadget-btn-primary btn-lg">
                                <i class="fas fa-sign-in-alt"></i> Login Now
                            </a>
                        </div>
                    \`);
                    
                    // Show success notification
                    Swal.fire({
                        icon: 'success',
                        title: 'Email Verified!',
                        text: 'Your account is now active. You can log in and start shopping!',
                        confirmButtonColor: '#667eea',
                        timer: 5000,
                        timerProgressBar: true
                    });
                }
                
                function showError(message) {
                    $('#verifyHeader').html(\`
                        <div class="gadget-error-icon">
                            <i class="fas fa-times-circle"></i>
                        </div>
                        <h2>Verification Failed</h2>
                        <p>There was an issue verifying your email.</p>
                    \`);
                    
                    $('#verifyContent').html(\`
                        <div class="alert alert-danger">
                            <i class="fas fa-exclamation-circle"></i>
                            <strong>Error!</strong> \${message}
                        </div>
                        <div class="verification-help">
                            <h5>Need Help?</h5>
                            <p>If your verification link has expired or you're having trouble, you can:</p>
                            <ul>
                                <li>Request a new verification email</li>
                                <li>Check your spam/junk folder</li>
                                <li>Contact our support team</li>
                            </ul>
                        </div>
                        <div class="verification-actions">
                            <button class="btn gadget-btn-primary btn-lg" data-toggle="modal" data-target="#resendVerificationModal">
                                <i class="fas fa-envelope"></i> Resend Verification Email
                            </button>
                            <a href="\${url}/register" class="btn gadget-btn-secondary btn-lg ml-2">
                                <i class="fas fa-user-plus"></i> Register Again
                            </a>
                        </div>
                    \`);
                }
                
                // Handle resend verification email
                $('#resendVerificationBtn').on('click', function() {
                    const email = $('#resendEmail').val();
                    const \$btn = $(this);
                    const originalText = \$btn.html();
                    
                    if (!email) {
                        Swal.fire({
                            icon: 'warning',
                            title: 'Email Required',
                            text: 'Please enter your email address.',
                            confirmButtonColor: '#667eea'
                        });
                        return;
                    }
                    
                    // Show loading
                    \$btn.prop('disabled', true).html('<i class="fas fa-spinner fa-spin"></i> Sending...');
                    
                    $.ajax({
                        url: \`\${url}/api/v1/users/resend-verification\`,
                        method: 'POST',
                        dataType: 'json',
                        contentType: 'application/json',
                        data: JSON.stringify({ email: email }),
                        success: function(response) {
                            // Reset button
                            \$btn.prop('disabled', false).html(originalText);
                            
                            if (response.success) {
                                $('#resendVerificationModal').modal('hide');
                                Swal.fire({
                                    icon: 'success',
                                    title: 'Email Sent!',
                                    text: response.message,
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
                            // Reset button
                            \$btn.prop('disabled', false).html(originalText);
                            
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
                });
            });
        </script>

        <style>
            .gadget-verify-container {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                min-height: 100vh;
                padding: 60px 0;
                display: flex;
                align-items: center;
            }
            
            .gadget-verify-card {
                background: white;
                border-radius: 20px;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
                overflow: hidden;
                margin: 20px 0;
            }
            
            .gadget-verify-header {
                background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
                padding: 40px 30px;
                text-align: center;
                border-bottom: 3px solid #667eea;
            }
            
            .gadget-verify-header h2 {
                color: #2c3e50;
                margin: 20px 0 10px 0;
                font-weight: 600;
            }
            
            .gadget-verify-header p {
                color: #6c757d;
                margin-bottom: 0;
            }
            
            .gadget-verify-content {
                padding: 30px;
            }
            
            .gadget-loading-spinner i {
                font-size: 3rem;
                color: #667eea;
                animation: spin 1s linear infinite;
            }
            
            .gadget-success-icon i {
                font-size: 4rem;
                color: #28a745;
            }
            
            .gadget-error-icon i {
                font-size: 4rem;
                color: #dc3545;
            }
            
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
            
            .verification-details ul li {
                padding: 8px 0;
                font-size: 16px;
            }
            
            .verification-details ul li i {
                width: 20px;
                margin-right: 10px;
            }
            
            .verification-actions {
                text-align: center;
                margin-top: 30px;
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
                text-decoration: none;
            }
            
            .gadget-btn-secondary {
                background: transparent;
                border: 2px solid #667eea;
                color: #667eea;
                padding: 12px 30px;
                border-radius: 25px;
                font-weight: 600;
                transition: all 0.3s ease;
            }
            
            .gadget-btn-secondary:hover {
                background: #667eea;
                color: white;
                text-decoration: none;
            }
            
            .verification-help h5 {
                color: #495057;
                margin-bottom: 15px;
            }
            
            .verification-help p {
                color: #6c757d;
            }
            
            .verification-help ul li {
                color: #495057;
                margin-bottom: 5px;
            }
        </style>
    </body>
    </html>
  `);
});
router.post('/resend-verification', resendVerificationEmail)
// Only authenticated users can update their profile
router.post('/update-profile', isAuthenticatedUser, upload.single('image'), updateUser)
// Only admin can deactivate users and delete users
router.delete('/deactivate', isAuthenticatedUser, isAdmin, deactivateUser)

// Admin-only: get all users/customers for DataTable
router.get('/customers', isAuthenticatedUser, isAdmin, getAllUsersWithCustomers);
// Admin-only: update status and role for a user
router.put('/customers/:userId/status-role', isAuthenticatedUser, isAdmin, updateUserStatusRole);
// If you want to support methodOverride via POST:
router.post('/customers/:userId/status-role', isAuthenticatedUser, isAdmin, updateUserStatusRole);
router.get('/customer-by-userid/:user_id', isAuthenticatedUser, getCustomerByUserId);
router.post('/logout', isAuthenticatedUser, logoutUser);

router.post('/test-email', async (req, res) => {
  try {
    await sendEmail({
      email: req.body.email, // or hardcode for testing
      subject: req.body.subject || 'Test Email',
      message: req.body.message || 'This is a test email from your Node.js app.'
    });
    res.status(200).json({ success: true, message: 'Test email sent!' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router

