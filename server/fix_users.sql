UPDATE users SET is_verified = true, otp_code = NULL, otp_expires_at = NULL WHERE is_verified = false;
