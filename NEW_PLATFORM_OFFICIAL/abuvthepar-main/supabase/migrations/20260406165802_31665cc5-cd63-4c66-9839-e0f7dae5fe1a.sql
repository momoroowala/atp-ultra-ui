-- Delete existing completions and milestones, then re-seed with correct data
DELETE FROM public.csm_milestone_completions;
DELETE FROM public.csm_milestones;

INSERT INTO public.csm_milestones (title, sort_order) VALUES
  ('Form LLC + Get EIN', 1),
  ('Open Business Bank Account', 2),
  ('Register Amazon Seller Account', 3),
  ('Purchase Domain', 4),
  ('Created Professional Email Address', 5),
  ('Get Reseller Certificate', 6),
  ('Purchase Keepa & Smartscout', 7),
  ('Research Products with Tools', 8),
  ('Found Prep Center', 9),
  ('Find Brands & Distributors', 10),
  ('Reach Out & Apply for Wholesale Accounts', 11),
  ('Create Purchase Order', 12),
  ('Get Invoice from Supplier/Brand', 13),
  ('Apply for Ungating', 14),
  ('Submit Purchase Order (PO)', 15),
  ('Create FBA Shipping Plan', 16),
  ('Ship to Amazon', 17),
  ('Monitor Listings & Reorder', 18);