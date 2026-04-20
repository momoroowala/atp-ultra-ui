-- Update tooltips: original wording + supporting statistic
UPDATE public.prompt_catalog AS pc
SET    tooltip = v.new_tooltip
FROM (VALUES
  ('tilt-recovery-drill',      'Reset after a frustration trade in under 2 min—funded-account reviews showed 35 % fewer revenge trades.'),
  ('emotion-reset-blueprint',  'Train calm reactions so fear & greed don''t hijack setups—journaling cut max draw-downs 23 % across 2,100 accounts.'),
  ('stress-test-playbook',     'Start each session relaxed with a 6-min breath-plus-checklist—lab tests trimmed cortisol spikes about 25 %.'),
  ('bounce-back-framework',    'Pause, downsize risk, and rebuild confidence after 3 losses—users cut streak damage roughly 30 %.'),
  ('urge-surfing-challenge',   'Ride out the "double-down" urge for 90 sec, then size correctly—mindfulness trials cut impulse trades 40 %.'),
  ('prop-firm-drawdown',       'Stretch your prop account by scaling risk as you near max-loss—Kelly scaling kept traders alive 42 % longer.'),
  ('risk-psychology-reboot',   'Swap thrill-seeking risk habits for edge-aligned limits—cortisol-aware rules reduced oversize events 28 %.'),
  ('gambling-trigger-detox',   'Spot the emotional cues that spark all-in bets and defuse them fast—40 % of prospects reported these triggers.'),
  ('capital-shield-ladder',    'Lock in equity first, raise size only after preset profit steps—sub-Kelly ladder kept draw-downs shallow while growth stayed steady.'),
  ('strategy-rebuild-blueprint','Rebuild one A-grade setup from entry to exit—only 1 % of 129 k Taiwan traders beat the market by sticking to one play.'),
  ('commit-to-one-protocol',   'Sign a 7-day no-switch pact to end strategy-hopping—commitment contracts boosted adherence 63 %.'),
  ('focus-edge-deep-dive',     'Dissect every filter of your edge—TradeFundrr audit showed expectancy rose 0.4 R after this exercise.'),
  ('boredom-proof-routine',    'Fill slow sessions with micro-tasks to block boredom trades—cognitive-load studies cut mistakes about 30 %.'),
  ('high-probability-filter',  'Let only A-grade setups through a simple yes/no checklist—A-grade trades averaged +1.4 R vs −1.1 R FOMO trades.'),
  ('one-page-plan',            'Put your whole strategy on a one-page sheet you can scan in 60 sec—76 % of winning traders had one (IG survey).'),
  ('daily-weekly-routine',     'Install a daily prep & Friday review habit that boosts consistency—routine users report 25 % higher consistency.'),
  ('journal-review',           'Turn each trade into data with a 2-min log and weekly pattern scan—journaling improved self-control 23 %.'),
  ('a-plus-playbook',          'Keep a screenshot library of only your best entries—pattern recall lifts correct decisions 30 %.'),
  ('simplify-your-screen',     'Strip charts to essential levels so price action stands out—each extra element adds ~80 ms reaction time.'),
  ('fearless-execution-plan',  'Use IF-THEN scripts to pull the trigger without second-guessing—implementation intentions cut latency 28 %.'),
  ('single-trigger-checklist', 'Reduce entry rules to one binary signal—NASA cockpit checklists dropped errors 35 %.'),
  ('decision-drill-2min',      'Beat analysis-paralysis with a timed 2-min choice loop—confidence rose 22 % in speed-decision tests.'),
  ('time-pressure-reset',      'Quick worst/best/likely grid to cut deadline anxiety—lowered stress markers 18 %.'),
  ('if-then-lab',              'Write IF-THEN rules that fire automatically under stress—meta-analysis shows rule follow-through doubled.'),
  ('accountability-loop',      'Send daily screenshots to a partner to keep discipline tight—social checks raised adherence 55 %.'),
  ('five-rule-framework',      'Slim your plan to the 5 rules you''ll actually follow—audits showed +9 p.p. net returns.'),
  ('consistency-streak-builder','Gamify a discipline streak—no misses allowed; streak boards cut missed tasks 40 %.'),
  ('stress-test-playbook',     'Start each session relaxed with a 6-min breath-plus-checklist—lab tests trimmed cortisol spikes about 25 %.' )
) AS v(handle, new_tooltip)
WHERE pc.handle = v.handle;