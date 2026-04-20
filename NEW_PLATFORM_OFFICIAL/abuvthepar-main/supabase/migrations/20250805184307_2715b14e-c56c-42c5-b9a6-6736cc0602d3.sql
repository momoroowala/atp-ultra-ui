-- Assign operations role to operations user
INSERT INTO user_roles (user_id, role) 
SELECT id, 'operations' 
FROM auth.users 
WHERE email = 'operations@smarttradingblueprint.com'
ON CONFLICT (user_id, role) DO NOTHING;