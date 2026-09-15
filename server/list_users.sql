SELECT id, name, email, is_verified, LEFT(password_hash, 10) as pass_prefix, phone FROM users ORDER BY id DESC;
