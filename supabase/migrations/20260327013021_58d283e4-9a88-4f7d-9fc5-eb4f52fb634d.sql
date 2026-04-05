
-- Delete related data first
DELETE FROM ticket_metadata WHERE ticket_id IN (SELECT id FROM support_tickets WHERE ticket_number IN (1,2,3,8,9,10,11,12,13,14,18));
DELETE FROM support_notifications WHERE ticket_id IN (SELECT id FROM support_tickets WHERE ticket_number IN (1,2,3,8,9,10,11,12,13,14,18));
DELETE FROM ticket_responses WHERE ticket_id IN (SELECT id FROM support_tickets WHERE ticket_number IN (1,2,3,8,9,10,11,12,13,14,18));
-- Delete the test tickets
DELETE FROM support_tickets WHERE ticket_number IN (1,2,3,8,9,10,11,12,13,14,18);
