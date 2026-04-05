UPDATE roles
SET page_visibility = jsonb_set(page_visibility, '{support_tickets}', 'false')
WHERE role_key = 'csm';