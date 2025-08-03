const connection = require('../config/database');
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const crypto = require('crypto')
const sendEmail = require('../utils/sendEmail')

const registerUser = async (req, res) => {
  // Expecting: { "last_name": "...", "first_name": "...", "email": "...", "password": "..." }
  const { last_name, first_name, email, password } = req.body;
  if (!last_name || !first_name || !email || !password) {
    return res.status(400).json({ error: 'All fields are required.' });
  }
  
  try {
    // Check if email already exists
    const checkEmailSql = 'SELECT id FROM users WHERE email = ?';
    connection.execute(checkEmailSql, [email], async (err, existingUsers) => {
      if (err) {
        console.log(err);
        return res.status(500).json({ error: 'Error checking email', details: err });
      }
      
      if (existingUsers.length > 0) {
        return res.status(400).json({ error: 'Email already registered' });
      }
      
      const hashedPassword = await bcrypt.hash(password, 10);
      
      // Generate email verification token
      const emailVerificationToken = crypto.randomBytes(32).toString('hex');
      
      // Insert into users table with email verification token
      const userSql = `INSERT INTO users (email, password, remember_token) VALUES (?, ?, ?)`;
      connection.execute(userSql, [email, hashedPassword, emailVerificationToken], (err, userResult) => {
        if (err) {
          console.log(err);
          return res.status(500).json({ error: 'Error creating user', details: err });
        }
        
        const userId = userResult.insertId;
        
        // Insert into customer table (other fields left as NULL)
        const customerSql = `INSERT INTO customer (last_name, first_name, user_id) VALUES (?, ?, ?)`;
        connection.execute(customerSql, [last_name, first_name, userId], async (err2, customerResult) => {
          if (err2) {
            console.log(err2);
            return res.status(500).json({ error: 'Error creating customer', details: err2 });
          }
          
          // Send verification email
          try {
            // Dynamic verification URL based on request origin
            const protocol = req.headers['x-forwarded-proto'] || req.protocol;
            const host = req.headers.host;
            const baseUrl = `${protocol}://${host}`;
            const verificationUrl = `${baseUrl}/verify-email.html?token=${emailVerificationToken}`;
            
            const emailHtml = `
              <!DOCTYPE html>
              <html>
              <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Verify Your Email - GadgetEssence</title>
                <style>
                  body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                  .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                  .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                  .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
                  .verify-btn { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; margin: 20px 0; }
                  .verify-btn:hover { opacity: 0.9; }
                  .footer { text-align: center; margin-top: 20px; color: #666; font-size: 14px; }
                </style>
              </head>
              <body>
                <div class="container">
                  <div class="header">
                    <h1>🎉 Welcome to GadgetEssence!</h1>
                    <p>Your account has been created successfully</p>
                  </div>
                  <div class="content">
                    <h2>Hello ${first_name} ${last_name}!</h2>
                    <p>Thank you for registering with GadgetEssence. To complete your account setup and start shopping for amazing gadgets, please verify your email address.</p>
                    <p><strong>Why verify your email?</strong></p>
                    <ul>
                      <li>✅ Secure your account</li>
                      <li>✅ Receive important order updates</li>
                      <li>✅ Access all website features</li>
                      <li>✅ Get exclusive offers and promotions</li>
                    </ul>
                    <div style="text-align: center;">
                      <a href="${verificationUrl}" class="verify-btn">Verify Email Address</a>
                    </div>
                    <p style="margin-top: 20px;"><strong>Note:</strong> This verification link will expire in 24 hours for security reasons.</p>
                    <p>If you didn't create an account with us, please ignore this email.</p>
                  </div>
                  <div class="footer">
                    <p>© 2025 GadgetEssence. All rights reserved.</p>
                    <p>If you're having trouble clicking the button, copy and paste this URL into your browser:</p>
                    <p style="word-break: break-all; color: #667eea;">${verificationUrl}</p>
                  </div>
                </div>
              </body>
              </html>
            `;
            
            await sendEmail({
              email: email,
              subject: 'Verify Your Email Address - GadgetEssence',
              message: emailHtml
            });
            
            return res.status(201).json({ 
              success: true, 
              message: 'Registration successful! Please check your email and click the verification link to activate your account.',
              user_id: userId, 
              customer_id: customerResult.insertId,
              email_sent: true
            });
            
          } catch (emailError) {
            console.log('Email sending failed:', emailError);
            // Still return success but note that email failed
            return res.status(201).json({ 
              success: true, 
              message: 'Registration successful! However, there was an issue sending the verification email. Please contact support.',
              user_id: userId, 
              customer_id: customerResult.insertId,
              email_sent: false,
              email_error: emailError.message
            });
          }
        });
      });
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: 'Server error', details: error });
  }
};

const loginUser = (req, res) => {
  const { email, password } = req.body;
  // Select role from users table and check email verification
  const sql = `SELECT u.id, u.email, u.password, u.role, u.status, u.email_verified_at, c.customer_id, c.last_name, c.first_name, c.address, c.city, c.phone
               FROM users u
               LEFT JOIN customer c ON u.id = c.user_id
               WHERE u.email = ?`;
  connection.execute(sql, [email], async (err, results) => {
    if (err) {
      console.log(err);
      return res.status(500).json({ error: 'Error logging in', details: err });
    }
    if (results.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const user = results[0];

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    // Check if email is verified
    if (!user.email_verified_at) {
      return res.status(403).json({ 
        success: false, 
        message: 'Please verify your email address before logging in. Check your email for the verification link.',
        email_not_verified: true 
      });
    }

    // Check if the account is active
    if (user.status !== 'active') {
      return res.status(403).json({ success: false, message: 'Account is not active. Please contact an Administrator' });
    }

    // Remove password from response
    delete user.password;
    // Include role in JWT
    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET);

    // Save token to users table (api_token column)
    const updateTokenSql = 'UPDATE users SET api_token = ? WHERE id = ?';
    connection.execute(updateTokenSql, [token, user.id], (err2) => {
      if (err2) {
        console.log(err2);
        return res.status(500).json({ error: 'Error saving token', details: err2 });
      }
      return res.status(200).json({
        success: "welcome back",
        user,
        token
      });
    });
  });
};

// Email verification function
const verifyEmail = async (req, res) => {
  const { token } = req.query;
  
  if (!token) {
    return res.status(400).json({ 
      success: false, 
      message: 'Verification token is required' 
    });
  }
  
  try {
    // Find user with the verification token
    const findUserSql = `
      SELECT u.id, u.email, u.email_verified_at, c.first_name, c.last_name 
      FROM users u 
      LEFT JOIN customer c ON u.id = c.user_id 
      WHERE u.remember_token = ? AND u.email_verified_at IS NULL
    `;
    
    connection.execute(findUserSql, [token], (err, results) => {
      if (err) {
        console.log(err);
        return res.status(500).json({ 
          success: false, 
          message: 'Error verifying email', 
          details: err 
        });
      }
      
      if (results.length === 0) {
        return res.status(400).json({ 
          success: false, 
          message: 'Invalid or expired verification token. The link may have already been used or expired.' 
        });
      }
      
      const user = results[0];
      
      // Update user as verified
      const updateUserSql = `
        UPDATE users 
        SET email_verified_at = NOW(), remember_token = NULL 
        WHERE id = ?
      `;
      
      connection.execute(updateUserSql, [user.id], (err2, updateResult) => {
        if (err2) {
          console.log(err2);
          return res.status(500).json({ 
            success: false, 
            message: 'Error updating verification status', 
            details: err2 
          });
        }
        
        return res.status(200).json({ 
          success: true, 
          message: `Email verified successfully! Welcome ${user.first_name || ''} ${user.last_name || ''}. You can now log in to your account.`,
          user: {
            id: user.id,
            email: user.email,
            first_name: user.first_name,
            last_name: user.last_name
          }
        });
      });
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ 
      success: false, 
      message: 'Server error during email verification', 
      details: error 
    });
  }
};

// Resend verification email function
const resendVerificationEmail = async (req, res) => {
  const { email } = req.body;
  
  if (!email) {
    return res.status(400).json({ 
      success: false, 
      message: 'Email is required' 
    });
  }
  
  try {
    // Find user by email
    const findUserSql = `
      SELECT u.id, u.email, u.email_verified_at, c.first_name, c.last_name 
      FROM users u 
      LEFT JOIN customer c ON u.id = c.user_id 
      WHERE u.email = ?
    `;
    
    connection.execute(findUserSql, [email], async (err, results) => {
      if (err) {
        console.log(err);
        return res.status(500).json({ 
          success: false, 
          message: 'Error finding user', 
          details: err 
        });
      }
      
      if (results.length === 0) {
        return res.status(404).json({ 
          success: false, 
          message: 'No account found with this email address' 
        });
      }
      
      const user = results[0];
      
      // Check if already verified
      if (user.email_verified_at) {
        return res.status(400).json({ 
          success: false, 
          message: 'Email is already verified. You can log in to your account.' 
        });
      }
      
      // Generate new verification token
      const newVerificationToken = crypto.randomBytes(32).toString('hex');
      
      // Update user with new token
      const updateTokenSql = 'UPDATE users SET remember_token = ? WHERE id = ?';
      connection.execute(updateTokenSql, [newVerificationToken, user.id], async (err2, updateResult) => {
        if (err2) {
          console.log(err2);
          return res.status(500).json({ 
            success: false, 
            message: 'Error updating verification token', 
            details: err2 
          });
        }
        
        // Send verification email
        try {
          // Dynamic verification URL based on request origin
          const protocol = req.headers['x-forwarded-proto'] || req.protocol;
          const host = req.headers.host;
          const baseUrl = `${protocol}://${host}`;
          const verificationUrl = `${baseUrl}/verify-email.html?token=${newVerificationToken}`;
          
          const emailHtml = `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Verify Your Email - GadgetEssence</title>
              <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
                .verify-btn { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; margin: 20px 0; }
                .verify-btn:hover { opacity: 0.9; }
                .footer { text-align: center; margin-top: 20px; color: #666; font-size: 14px; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>📧 Email Verification</h1>
                  <p>Complete your account setup</p>
                </div>
                <div class="content">
                  <h2>Hello ${user.first_name || ''} ${user.last_name || ''}!</h2>
                  <p>You requested a new verification email for your GadgetEssence account.</p>
                  <p>Please click the button below to verify your email address:</p>
                  <div style="text-align: center;">
                    <a href="${verificationUrl}" class="verify-btn">Verify Email Address</a>
                  </div>
                  <p style="margin-top: 20px;"><strong>Note:</strong> This verification link will expire in 24 hours for security reasons.</p>
                  <p>If you didn't request this email, please ignore it.</p>
                </div>
                <div class="footer">
                  <p>© 2025 GadgetEssence. All rights reserved.</p>
                  <p>If you're having trouble clicking the button, copy and paste this URL into your browser:</p>
                  <p style="word-break: break-all; color: #667eea;">${verificationUrl}</p>
                </div>
              </div>
            </body>
            </html>
          `;
          
          await sendEmail({
            email: email,
            subject: 'Verify Your Email Address - GadgetEssence',
            message: emailHtml
          });
          
          return res.status(200).json({ 
            success: true, 
            message: 'Verification email sent successfully! Please check your email and click the verification link.',
            email_sent: true
          });
          
        } catch (emailError) {
          console.log('Email sending failed:', emailError);
          return res.status(500).json({ 
            success: false, 
            message: 'Error sending verification email. Please try again later.',
            email_sent: false,
            email_error: emailError.message
          });
        }
      });
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      details: error 
    });
  }
};

const updateUser = (req, res) => {
  const { title, last_name, first_name, address, city, zipcode, phone, userId } = req.body;

  if (req.file) {
    // If a new image is uploaded, update image_path
    const filename = req.file.filename;
    const image = `storage/images/${filename}`;
    const updateSql = `
      UPDATE customer SET
        title = ?,
        last_name = ?,
        first_name = ?,
        address = ?,
        city = ?,
        zipcode = ?,
        phone = ?,
        image_path = ?
      WHERE user_id = ?
    `;
    const params = [title, last_name, first_name, address, city, zipcode, phone, image, userId];
    connection.execute(updateSql, params, (err, result) => {
      if (err) {
        return res.status(500).json({ error: err });
      }
      return res.status(200).json({
        success: true,
        message: 'Profile updated',
        result
      });
    });
  } else {
    // No new image: do NOT update image_path, keep existing value in DB
    const updateSql = `
      UPDATE customer SET
        title = ?,
        last_name = ?,
        first_name = ?,
        address = ?,
        city = ?,
        zipcode = ?,
        phone = ?
      WHERE user_id = ?
    `;
    const params = [title, last_name, first_name, address, city, zipcode, phone, userId];
    connection.execute(updateSql, params, (err, result) => {
      if (err) {
        return res.status(500).json({ error: err });
      }
      return res.status(200).json({
        success: true,
        message: 'Profile updated',
        result
      });
    });
  }
};

const deactivateUser = (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  const sql = 'UPDATE users SET deleted_at = ? WHERE email = ?';
  const timestamp = new Date();

  connection.execute(sql, [timestamp, email], (err, result) => {
    if (err) {
      console.log(err);
      return res.status(500).json({ error: 'Error deactivating user', details: err });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    return res.status(200).json({
      success: true,
      message: 'User deactivated successfully',
      email,
      deleted_at: timestamp
    });
  });
};

// // Get customer info by email (for autofill, no password required)
// const getCustomerByEmail = (req, res) => {
//   const { email } = req.query;
//   if (!email) return res.status(400).json({ error: 'Email is required' });

// const sql = `SELECT u.id, u.email, c.customer_id, c.last_name, c.first_name, c.title, c.address, c.city, c.zipcode, c.phone,
//              FROM users u
//              LEFT JOIN customer c ON u.id = c.user_id
//              WHERE u.email = ?`;
//   connection.execute(sql, [email], (err, results) => {
//     if (err) return res.status(500).json({ error: 'Error fetching customer', details: err });
//     if (!results.length) return res.status(404).json({ error: 'No customer found' });
//     res.status(200).json({ success: true, customer: results[0] });
//   });
// };

const getCustomerByUserId = (req, res) => {
  const userId = req.query.user_id || req.params.user_id;
  if (!userId) return res.status(400).json({ error: 'user_id is required' });

  const sql = `
    SELECT u.id, u.email, c.customer_id, c.title, c.last_name, c.first_name, c.address, c.city, c.zipcode, c.phone, c.image_path
    FROM users u
    LEFT JOIN customer c ON u.id = c.user_id
    WHERE u.id = ?
  `;
  connection.execute(sql, [userId], (err, results) => {
    if (err) return res.status(500).json({ error: 'Error fetching customer', details: err });
    if (!results.length) return res.status(404).json({ error: 'No customer found' });
    res.status(200).json({ success: true, customer: results[0] });
  });
};

const deleteUserAndCustomer = (req, res) => {
  const user_id = req.params.user_id;
  if (!user_id) {
    return res.status(400).json({ error: 'user_id is required' });
  }

  // First delete the customer, then the user
  const deleteCustomerSql = 'DELETE FROM customer WHERE user_id = ?';
  const deleteUserSql = 'DELETE FROM users WHERE id = ?';

  connection.execute(deleteCustomerSql, [user_id], (err, customerResult) => {
    if (err) {
      return res.status(500).json({ error: 'Error deleting customer', details: err });
    }
    connection.execute(deleteUserSql, [user_id], (err2, userResult) => {
      if (err2) {
        return res.status(500).json({ error: 'Error deleting user', details: err2 });
      }
      return res.status(200).json({ success: true, message: 'User and customer deleted', user_id });
    });
  });
};

const getAllUsersWithCustomers = (req, res) => {
  // Only allow if ?all=true and admin
  if (!req.query.all || req.query.all !== 'true') {
    return res.status(400).json({ error: 'Missing or invalid all=true query param' });
  }
  const sql = `
    SELECT 
      u.id as user_id, u.email, u.status, u.role, u.deleted_at,
      c.customer_id, c.last_name, c.first_name, c.title, c.address, c.city, c.zipcode, c.phone, c.image_path
    FROM users u
    LEFT JOIN customer c ON u.id = c.user_id
    ORDER BY u.id DESC
  `;
  connection.execute(sql, [], (err, results) => {
    if (err) return res.status(500).json({ error: 'Error fetching users', details: err });
    res.status(200).json({ success: true, users: results });
  });
};

const updateUserStatusRole = (req, res) => {
  const { status, role } = req.body;
  const userId = req.params.userId;
  if (!status || !role) {
    return res.status(400).json({ error: 'Status and role are required.' });
  }
  const sql = `UPDATE users SET status = ?, role = ? WHERE id = ?`;
  connection.execute(sql, [status, role, userId], (err, result) => {
    if (err) return res.status(500).json({ error: 'Error updating user', details: err });
    res.status(200).json({ success: true, message: 'User status and role updated.' });
  });
};

const logoutUser = (req, res) => {
  // Use authenticated user id from JWT (set by isAuthenticatedUser middleware)
  const userId = req.user && req.user.id;
  console.log('Logout attempt for user ID:', userId); // Debug log
  
  if (!userId) {
    console.log('No user ID found in token'); // Debug log
    return res.status(400).json({ error: 'User ID not found in token.' });
  }
  
  const sql = 'UPDATE users SET api_token = NULL WHERE id = ?';
  connection.execute(sql, [userId], (err, result) => {
    if (err) {
      console.log('Database error during logout:', err); // Debug log
      return res.status(500).json({ error: 'Error logging out', details: err });
    }
    
    console.log('Logout database result:', result); // Debug log
    console.log('Affected rows:', result.affectedRows); // Debug log
    
    return res.status(200).json({ 
      success: true, 
      message: 'Logged out successfully.',
      affectedRows: result.affectedRows 
    });
  });
};

const getAuthStatus = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get user with role and status
    const sql = `
      SELECT u.id, u.email, u.status, u.role, u.email_verified_at
      FROM users u 
      WHERE u.id = ?
    `;
    
    connection.execute(sql, [userId], (err, results) => {
      if (err) {
        console.log(err);
        return res.status(500).json({ 
          success: false, 
          message: 'Error fetching user status',
          details: err 
        });
      }
      
      if (results.length === 0) {
        return res.status(404).json({ 
          success: false, 
          message: 'User not found' 
        });
      }
      
      const user = results[0];
      
      // Check if user is active
      if (user.status !== 'active') {
        return res.status(403).json({ 
          success: false, 
          message: 'Account is not active',
          user: {
            id: user.id,
            email: user.email,
            status: user.status,
            role: user.role
          }
        });
      }
      
      // Check if email is verified
      if (!user.email_verified_at) {
        return res.status(403).json({ 
          success: false, 
          message: 'Email not verified',
          user: {
            id: user.id,
            email: user.email,
            status: user.status,
            role: user.role
          }
        });
      }
      
      return res.status(200).json({
        success: true,
        message: 'Authentication status valid',
        user: {
          id: user.id,
          email: user.email,
          status: user.status,
          role: user.role
        }
      });
      
    });
    
  } catch (error) {
    console.log(error);
    return res.status(500).json({ 
      success: false, 
      message: 'Server error',
      details: error 
    });
  }
};

module.exports = { registerUser, loginUser, updateUser, deactivateUser, getCustomerByUserId, getAllUsersWithCustomers, updateUserStatusRole, logoutUser, verifyEmail, resendVerificationEmail, getAuthStatus };