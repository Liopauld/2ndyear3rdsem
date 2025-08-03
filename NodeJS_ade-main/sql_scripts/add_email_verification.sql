-- SQL script to add email verification columns to users table
-- Run this in your database to add email verification functionality

ALTER TABLE users 
ADD COLUMN email_verification_token VARCHAR(255) NULL AFTER api_token,
ADD COLUMN email_verified_at TIMESTAMP NULL AFTER email_verification_token;

-- Optional: Add index for faster token lookups
CREATE INDEX idx_email_verification_token ON users(email_verification_token);

-- Optional: Update existing users to be verified (if you want existing users to be already verified)
-- Uncomment the line below if you want existing users to be automatically verified
-- UPDATE users SET email_verified_at = NOW() WHERE email_verified_at IS NULL;
