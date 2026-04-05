-- Import Enigma Calculations Data
-- This data represents pre-calculated risk management scenarios based on:
-- trailing_drawdown, win_rate, risk_reward, and max_consecutive_trades

INSERT INTO enigma_calculations (
  case_number, trailing_drawdown, win_rate, risk_reward, 
  max_consecutive_trades, conservative_risk, neutral_risk, aggressive_risk,
  coefficient_a, coefficient_b, coefficient_c, remainder, 
  is_negative, is_zero, all_possible_triples
) VALUES
-- Sample data for common scenarios (TD=30000, WR=80%, RR=3)
(1, 30000, 0.8, 3, 6, 1250.00, 1500.00, 1750.00, 2, 3, 1, 0, false, false, '[(2,3,1)]'),
(2, 30000, 0.7, 3, 8, 1000.00, 1200.00, 1400.00, 2, 4, 2, 0, false, false, '[(2,4,2)]'),
(3, 30000, 0.6, 3, 10, 800.00, 1000.00, 1200.00, 2, 5, 3, 0, false, false, '[(2,5,3)]'),

-- Additional scenarios for different trailing drawdowns
(4, 25000, 0.8, 3, 6, 1041.67, 1250.00, 1458.33, 2, 3, 1, 0, false, false, '[(2,3,1)]'),
(5, 20000, 0.8, 3, 6, 833.33, 1000.00, 1166.67, 2, 3, 1, 0, false, false, '[(2,3,1)]'),
(6, 15000, 0.8, 3, 6, 625.00, 750.00, 875.00, 2, 3, 1, 0, false, false, '[(2,3,1)]'),

-- Different risk/reward scenarios
(7, 30000, 0.8, 2, 6, 1500.00, 1800.00, 2100.00, 2, 3, 1, 0, false, false, '[(2,3,1)]'),
(8, 30000, 0.8, 4, 6, 1000.00, 1200.00, 1400.00, 2, 3, 1, 0, false, false, '[(2,3,1)]'),

-- Lower win rates
(9, 30000, 0.5, 3, 14, 600.00, 750.00, 900.00, 2, 7, 7, 0, false, false, '[(2,7,7)]'),
(10, 30000, 0.6, 3, 10, 750.00, 900.00, 1050.00, 2, 5, 3, 0, false, false, '[(2,5,3)]')
ON CONFLICT (case_number) DO UPDATE SET
  conservative_risk = EXCLUDED.conservative_risk,
  neutral_risk = EXCLUDED.neutral_risk,
  aggressive_risk = EXCLUDED.aggressive_risk,
  coefficient_a = EXCLUDED.coefficient_a,
  coefficient_b = EXCLUDED.coefficient_b,
  coefficient_c = EXCLUDED.coefficient_c,
  updated_at = now();