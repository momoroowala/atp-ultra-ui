-- Bulk-update beginner-friendly tooltips for every prompt
UPDATE public.prompt_catalog AS pc
SET    tooltip = v.new_tooltip
FROM (VALUES
  ('tilt-recovery-drill',    'Reset after a frustration trade in under 2 min.'),
  ('emotion-reset-blueprint','Train calm reactions so fear & greed don''t hijack setups.'),
  ('stress-test-playbook',   'Start each session relaxed with a 6-min breath-plus-checklist.'),
  ('bounce-back-framework',  'Pause, downsize risk, and rebuild confidence after 3 losses.'),
  ('urge-surfing-challenge', 'Ride out the "double-down" urge for 90 sec, then size correctly.'),
  ('prop-firm-drawdown',     'Stretch your prop account by scaling risk as you near max-loss.'),
  ('risk-psychology-reboot', 'Swap thrill-seeking risk habits for edge-aligned limits.'),
  ('gambling-trigger-detox', 'Spot the emotional cues that spark all-in bets and defuse them fast.'),
  ('capital-shield-ladder',  'Lock in equity first, raise size only after preset profit steps.'),
  ('strategy-rebuild-blueprint','Rebuild one A-grade setup from entry to exit—ditch the clutter.'),
  ('commit-to-one-protocol', 'Sign a 7-day no-switch pact to end strategy-hopping.'),
  ('focus-edge-deep-dive',   'Dissect every filter of your edge—time, regime, stats.'),
  ('boredom-proof-routine',  'Fill slow sessions with micro-tasks to block boredom trades.'),
  ('high-probability-filter','Let only A-grade setups through a simple yes/no checklist.'),
  ('one-page-plan',          'Put your whole strategy on a one-page sheet you can scan in 60 sec.'),
  ('daily-weekly-routine',   'Install a daily prep & Friday review habit that boosts consistency.'),
  ('journal-review',         'Turn each trade into data with a 2-min log and weekly pattern scan.'),
  ('a-plus-playbook',        'Keep a screenshot library of only your best entries.'),
  ('simplify-your-screen',   'Strip charts to essential levels so price action stands out.'),
  ('fearless-execution-plan','Use IF-THEN scripts to pull the trigger without second-guessing.'),
  ('single-trigger-checklist','Reduce your entry rules to one binary signal.'),
  ('decision-drill-2min',    'Beat analysis-paralysis with a timed 2-min choice loop.'),
  ('time-pressure-reset',    'Quick worst/best/likely grid to cut deadline anxiety.'),
  ('if-then-lab',            'Write IF-THEN rules that fire automatically under stress.'),
  ('accountability-loop',    'Send daily screenshots to a partner to keep discipline tight.'),
  ('five-rule-framework',    'Slim your plan to the 5 rules you''ll actually follow.'),
  ('consistency-streak-builder','Gamify a discipline streak—no misses allowed.'),
  ('stress-test-playbook',   'Start each session relaxed with a 6-min breath-plus-checklist.')
) AS v(handle, new_tooltip)
WHERE pc.handle = v.handle;