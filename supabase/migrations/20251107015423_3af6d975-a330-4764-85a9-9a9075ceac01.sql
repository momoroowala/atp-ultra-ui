-- Make all phase quiz requirements optional
UPDATE phase_quiz_requirements 
SET is_required = false 
WHERE is_required = true;