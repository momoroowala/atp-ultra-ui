-- Assign General tier to all users with null tier_id
UPDATE user_profiles 
SET tier_id = '3d5a4052-987f-4929-95fa-053cd0888172'
WHERE tier_id IS NULL;