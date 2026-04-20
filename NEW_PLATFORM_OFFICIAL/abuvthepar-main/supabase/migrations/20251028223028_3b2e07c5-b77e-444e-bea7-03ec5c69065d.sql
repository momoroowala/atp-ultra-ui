-- Add the new STB Tester role to the app_role enum
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'client_stb_tester';