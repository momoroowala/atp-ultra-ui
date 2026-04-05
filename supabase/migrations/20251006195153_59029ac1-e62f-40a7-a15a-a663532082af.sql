-- Clear stale trading metrics cache entry
DELETE FROM trading_metrics_cache 
WHERE user_id = '9d451597-7ac1-4ee4-9381-780dc35e46fa' 
AND period_start_date = '2025-09-30';