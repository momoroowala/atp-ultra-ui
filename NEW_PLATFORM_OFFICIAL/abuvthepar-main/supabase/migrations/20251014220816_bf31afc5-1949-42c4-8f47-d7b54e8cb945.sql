-- Populate the losing_streak_probabilities table with complete data
-- This table is used to determine the maximum consecutive trades for each win rate
-- The max_consecutive_trades is where probability drops to ~1% or below

INSERT INTO losing_streak_probabilities (win_rate, max_consecutive_trades) VALUES
(0.30, 26),  -- Probability ~1% at 26 consecutive losses
(0.40, 18),  -- Probability ~1% at 18 consecutive losses
(0.50, 14),  -- Probability ~1% at 14 consecutive losses
(0.60, 10),  -- Probability ~1% at 10 consecutive losses
(0.65, 8),   -- Probability ~1% at 8 consecutive losses (interpolated)
(0.70, 7),   -- Probability ~2% at 7, ~1% at 8 consecutive losses
(0.75, 6),   -- Probability between 7% and 1% (interpolated)
(0.80, 6),   -- Probability ~1% at 6 consecutive losses
(0.85, 5),   -- Probability between 3% and 1% (interpolated)
(0.90, 4)    -- Probability very low at 4 consecutive losses (interpolated)
ON CONFLICT (win_rate) DO UPDATE SET
  max_consecutive_trades = EXCLUDED.max_consecutive_trades;