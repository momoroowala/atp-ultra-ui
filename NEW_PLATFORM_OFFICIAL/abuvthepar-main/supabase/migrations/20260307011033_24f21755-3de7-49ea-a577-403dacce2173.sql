
UPDATE public.sprint_tasks SET
  success_metrics = CASE day_number
    WHEN 1 THEN E'✓ Module 1 intro watched\n✓ Goals written down\n✓ Sprint downloaded\n✓ Ready to start'
    WHEN 2 THEN E'✓ State selected\n✓ Bizee.com account created\n✓ LLC application started\n✓ Package selected'
    WHEN 3 THEN E'✓ EIN application submitted\n✓ EIN received (same day)\n✓ EIN saved securely'
    WHEN 4 THEN E'✓ Professional email created\n✓ Business bank account opened\n✓ Business credit card applied for'
    WHEN 5 THEN E'✓ Seller Central account started\n✓ Business info entered\n✓ Documents uploaded\n✓ Identity verification started'
    WHEN 6 THEN E'✓ Video call completed (if required)\n✓ All documents submitted\n✓ Application status: Pending or Approved'
    WHEN 7 THEN E'✓ Smartscout account active\n✓ Keepa extension installed\n✓ Gmass account created\n✓ All tools tested'
    WHEN 8 THEN E'✓ Module 2 completed\n✓ Understand FBA vs FBM\n✓ Know Amazon fee structure\n✓ Understand Buy Box'
    WHEN 9 THEN E'✓ Smartscout account set up\n✓ Understand how to search for profitable brands\n✓ Know how to filter by revenue and growth\n✓ Can identify 10+ potential brands'
    WHEN 10 THEN E'✓ Smartscout training completed\n✓ Keepa training completed\n✓ Know how to analyze products\n✓ Understand profitability metrics'
    WHEN 11 THEN E'✓ Lead list template downloaded\n✓ Columns understood\n✓ First 5 test leads added\n✓ Ready to scale'
    WHEN 12 THEN E'✓ Know where to find brands\n✓ Understand how to verify contact info\n✓ Know what makes a good lead\n✓ Ready to build list'
    WHEN 13 THEN E'✓ 20 new leads added today\n✓ Running total: 20 leads\n✓ Contact info verified\n✓ Website URLs saved'
    WHEN 14 THEN E'✓ 20 new leads added today\n✓ Running total: 40 leads\n✓ Contact info verified\n✓ Momentum building'
    WHEN 15 THEN E'✓ 20 new leads added today\n✓ Running total: 60 leads\n✓ Contact info verified\n✓ Over halfway to 100!'
    WHEN 16 THEN E'✓ 20 new leads added today\n✓ Running total: 80 leads\n✓ Contact info verified\n✓ Almost there!'
    WHEN 17 THEN E'✓ 20 new leads added today\n✓ MILESTONE: 100+ leads total!\n✓ All contact info verified\n✓ Ready for outreach'
    WHEN 18 THEN E'✓ Gmass connected to Gmail\n✓ Email template customized\n✓ Test email sent\n✓ Ready to send 50 emails'
    WHEN 19 THEN E'✓ 50 emails sent\n✓ Gmass campaign active\n✓ Tracking responses\n✓ Running total: 50 emails'
    WHEN 20 THEN E'✓ 50 more emails sent\n✓ MILESTONE: 100 emails total!\n✓ Tracking all responses\n✓ Follow-up plan ready'
    WHEN 21 THEN E'✓ All responses reviewed\n✓ Replied to interested brands\n✓ Requested application links\n✓ Prioritized hot leads'
    WHEN 22 THEN E'✓ 5+ applications submitted\n✓ All required info provided\n✓ References given\n✓ Awaiting approval'
    WHEN 23 THEN E'✓ Follow-up emails sent\n✓ Checked application status\n✓ Replied to questions\n✓ Staying top of mind'
    WHEN 24 THEN E'✓ More applications submitted\n✓ Follow-ups sent\n✓ Some approvals received\n✓ Building momentum'
    WHEN 25 THEN E'✓ Pricelists requested\n✓ Account numbers received\n✓ Payment terms confirmed\n✓ Ready to analyze products'
    WHEN 26 THEN E'✓ Pricelists analyzed\n✓ 10-20 products selected\n✓ Profitability confirmed\n✓ Competition checked'
    WHEN 27 THEN E'✓ Account details confirmed\n✓ Shipping address provided\n✓ Tax exemption certificate sent\n✓ Ready to order'
    WHEN 28 THEN E'✓ Payment terms understood\n✓ MOQ requirements clear\n✓ Net terms requested (if available)\n✓ Ready for first order'
    WHEN 29 THEN E'✓ 5+ accounts confirmed open\n✓ Account numbers saved\n✓ Contact info documented\n✓ Product lists ready'
    WHEN 30 THEN E'✓ 5+ accounts opened\n✓ Products selected\n✓ Ready for first PO\n✓ Sprint completed!'
  END,
  common_mistakes = CASE day_number
    WHEN 1 THEN 'Don''t skip goal-setting - it keeps you accountable'
    WHEN 3 THEN 'Don''t skip EIN - you need it for Seller Central'
    WHEN 4 THEN 'Don''t use personal email - looks unprofessional to suppliers'
    WHEN 5 THEN 'Don''t rush - ensure all info matches LLC documents exactly'
    WHEN 6 THEN 'Don''t panic if video call is required - it''s normal'
    WHEN 7 THEN 'Don''t skip tool setup - you''ll need these for research'
    WHEN 8 THEN 'Don''t rush through Module 2 - fees impact profitability'
    WHEN 9 THEN 'Don''t skip understanding margins and how to use Smart Scout'
    WHEN 10 THEN 'Don''t skip product research training - critical skill'
    WHEN 11 THEN 'Don''t use random format - use the template provided'
    WHEN 12 THEN 'Don''t add leads without contact info - you can''t reach them'
    WHEN 13 THEN 'Don''t add leads without verifying they have contact information'
    WHEN 14 THEN 'Don''t rush - quality over quantity'
    WHEN 15 THEN 'Don''t stop now - keep the momentum going'
    WHEN 16 THEN 'Don''t add duplicates - check your list first'
    WHEN 17 THEN '🚫 DO NOT START OUTREACH WITH LESS THAN 100 LEADS! Volume is critical.'
    WHEN 18 THEN 'Use the template. You can also personalize your own outreach email if you don''t want to use the template.'
    WHEN 19 THEN 'Don''t send to all 100 at once - split into 2 days'
    WHEN 20 THEN 'Don''t forget to track who responds - Update the status on your lead list.'
    WHEN 21 THEN 'Don''t delay responses - reply within 24 hours'
    WHEN 22 THEN 'Don''t lie on applications - be honest'
    WHEN 23 THEN 'Don''t be pushy - be professional and patient'
    WHEN 24 THEN 'Don''t stop at 5 applications - keep going'
    WHEN 25 THEN 'Don''t forget to ask about MOQs and payment terms'
    WHEN 26 THEN 'Don''t select products without checking competition'
    WHEN 27 THEN 'Don''t forget tax exemption certificate - saves money'
    WHEN 28 THEN 'Don''t assume payment terms - always confirm'
    WHEN 29 THEN 'Don''t lose account details - organize everything'
    WHEN 30 THEN 'Don''t stop here - watch the outro video for next steps'
    ELSE NULL
  END,
  templates = CASE day_number
    WHEN 2 THEN '[{"label":"📄 LLC Formation Checklist (Bizee.com)","url":"https://drive.google.com/file/d/1MoHcc_w8cdWKlLWzC9elTt787ucLbMvA/view?usp=drive_link"}]'::jsonb
    WHEN 5 THEN '[{"label":"Amazon Seller Central Setup Checklist","url":"https://drive.google.com/file/d/1RVYkw1-9vaMf0Df5l8uK9nkdzgoU3MMB/view?usp=drive_link"}]'::jsonb
    WHEN 6 THEN '[{"label":"📄 Letter of Authorization (LOA) Template & Example","url":"https://drive.google.com/file/d/1UDo4E6gWXDBv3Y2WBB2oFPgy28_q64FW/view?usp=drive_link"}]'::jsonb
    WHEN 10 THEN '[{"label":"Product Research Template","url":"https://docs.google.com/spreadsheets/d/19SOdTFrAiAf85hLnevfCbU3sWlaxpFoJacIMbR2GqJk/edit?gid=380864053#gid=380864053"}]'::jsonb
    WHEN 11 THEN '[{"label":"Supplier/Brand Lead List Template","url":"https://docs.google.com/spreadsheets/d/1OjQud-pLtqRFHH7MPWa3yUb9T7FOE9ROiYzlbc_nZmQ/edit?gid=380864053#gid=380864053"}]'::jsonb
    WHEN 13 THEN '[{"label":"Supplier/Brand Lead List Template","url":"https://docs.google.com/spreadsheets/d/1OjQud-pLtqRFHH7MPWa3yUb9T7FOE9ROiYzlbc_nZmQ/edit?gid=380864053#gid=380864053"}]'::jsonb
    WHEN 18 THEN '[{"label":"Supplier Outreach Email Templates","url":"https://drive.google.com/file/d/1NAY_ymjVo-K2re2C1G2IYObz5SJSlmB8/view?usp=drive_link"}]'::jsonb
    WHEN 19 THEN '[{"label":"Brand Outreach Email Templates","url":"https://drive.google.com/file/d/1xLEo6DqTATlGV20SldXKpaa3irQXBZmb/view?usp=drive_link"}]'::jsonb
    WHEN 23 THEN '[{"label":"Follow Up Template","url":"https://drive.google.com/file/d/1xLEo6DqTATlGV20SldXKpaa3irQXBZmb/view?usp=drive_link"}]'::jsonb
    ELSE NULL
  END
WHERE day_number BETWEEN 1 AND 30;
