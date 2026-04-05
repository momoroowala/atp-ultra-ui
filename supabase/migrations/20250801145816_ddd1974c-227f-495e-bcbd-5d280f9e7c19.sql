-- Insert new prompt catalog entries
INSERT INTO public.prompt_catalog (handle, title, archetypes, mission, tooltip)
VALUES 
  (
    'expectation-reset-sim',
    'Expectation Reset Simulator',
    ARRAY['gambler', 'reckless_trader', 'emotional_trader'],
    'See—visually—how a positive-edge system still swings into drawdown.',
    'A 1 000-trade Monte-Carlo shows that even a +0.3 R edge can hit 10-trade losing streaks & 25 % equity dips—so you don''t panic when they arrive.'
  ),
  (
    'long-game-blueprint',
    'Long-Game Win Blueprint', 
    ARRAY['emotional_trader', 'reckless_trader', 'strategy_hopper'],
    'Anchor your mindset to multi-year compounding instead of single-trade wins.',
    'Walks through CAGR math: a 0.4 R edge at 3 trades/day can 4× equity in 24 months—so normal drawdowns are just the price of admission.'
  ),
  (
    'process-goal-lab',
    'Process-Goal Lab',
    ARRAY['unstructured_trader', 'fearful_hesitator', 'emotional_trader'], 
    'Swap outcome targets for process targets that actually drive edge.',
    'Turns "make $10 k/month" into daily reps: journal every trade, review every Friday, hit 95 % rule compliance—then tracks streaks instead of P&L.'
  )
ON CONFLICT (handle) DO NOTHING;