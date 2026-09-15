-- Mark ALL users as verified (fix legacy accounts)
UPDATE users SET is_verified = true, otp_code = NULL, otp_expires_at = NULL;

-- Show all users and their status
SELECT id, name, email, is_verified FROM users ORDER BY id;
