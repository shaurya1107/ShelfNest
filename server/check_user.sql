UPDATE users SET is_verified = true, otp_code = NULL, otp_expires_at = NULL WHERE email = 'shauryadevesh711@gmail.com';
SELECT id, name, email, is_verified, phone, created_at FROM users WHERE email = 'shauryadevesh711@gmail.com';
