-- Seed Achievement Badges Data

-- 🎯 ONBOARDING & FIRST STEPS (Bronze Tier)
INSERT INTO public.achievement_badges (badge_key, badge_name, description, category, tier, icon_emoji, points_value, requirement_type, requirement_value, auto_award) VALUES
('market_rookie', 'Market Rookie', 'Welcome to the trading journey! First login completed.', 'onboarding', 'bronze', '🎯', 50, 'first_login', '{}', true),
('blueprint_enrolled', 'Blueprint Enrolled', 'Complete your onboarding profile and get started.', 'onboarding', 'bronze', '📋', 75, 'onboarding_complete', '{}', true),
('foundation_built', 'Foundation Built', 'Complete all onboarding tasks - you''re ready to trade!', 'onboarding', 'bronze', '🏗️', 100, 'onboarding_complete', '{}', true),
('strategy_mapped', 'Strategy Mapped', 'Complete your trading psychology assessment.', 'onboarding', 'bronze', '🧠', 75, 'onboarding_complete', '{}', true);

-- 📚 LEARNING & PROGRESS (Bronze → Platinum Tiers)
INSERT INTO public.achievement_badges (badge_key, badge_name, description, category, tier, icon_emoji, points_value, requirement_type, requirement_value, auto_award) VALUES
('chart_reader', 'Chart Reader', 'Complete your first learning phase.', 'learning', 'bronze', '📈', 100, 'task_completion_percent', '{"percent": 10}', true),
('strategy_student', 'Strategy Student', 'Complete 25% of all learning tasks - building momentum!', 'learning', 'silver', '📚', 150, 'task_completion_percent', '{"percent": 25}', true),
('technical_analyst', 'Technical Analyst', 'Complete 50% of all learning tasks - halfway there!', 'learning', 'silver', '📊', 200, 'task_completion_percent', '{"percent": 50}', true),
('market_scholar', 'Market Scholar', 'Complete 75% of all learning tasks - almost there!', 'learning', 'gold', '🎓', 300, 'task_completion_percent', '{"percent": 75}', true),
('blueprint_graduate', 'Blueprint Graduate', 'Complete 100% of all learning phases - mastery achieved!', 'learning', 'platinum', '🏆', 500, 'task_completion_percent', '{"percent": 100}', true),
('knowledge_seeker', 'Knowledge Seeker', 'Submit your first homework assignment.', 'learning', 'bronze', '✍️', 75, 'task_completion_percent', '{"percent": 5}', true),
('quiz_master', 'Quiz Master', 'Pass your first quiz - knowledge verified!', 'learning', 'bronze', '✅', 100, 'quiz_passed', '{"count": 1}', true),
('perfect_score', 'Perfect Score', 'Achieve 100% on any quiz - perfection!', 'learning', 'gold', '💯', 250, 'quiz_passed', '{"count": 1, "score": 100}', false);

-- 🏆 TRADING PERFORMANCE (Silver → Platinum Tiers)
INSERT INTO public.achievement_badges (badge_key, badge_name, description, category, tier, icon_emoji, points_value, requirement_type, requirement_value, auto_award) VALUES
('first_trade_logged', 'First Trade Logged', 'Log your first trade in the journal - tracking begins!', 'trading_performance', 'bronze', '📝', 100, 'first_trade', '{}', true),
('journal_keeper', 'Journal Keeper', 'Log 10 trades with full details - discipline in action.', 'trading_performance', 'silver', '📖', 200, 'trade_count', '{"count": 10}', true),
('green_day_trader', 'Green Day Trader', 'Record your first profitable trading day!', 'trading_performance', 'silver', '💚', 150, 'green_day', '{"days": 1}', true),
('consistency_king', 'Consistency King', 'Achieve 5 consecutive green days - consistency is key!', 'trading_performance', 'gold', '👑', 300, 'green_day', '{"days": 5, "consecutive": true}', false),
('funded_trader', 'Funded Trader', 'Get your first funded trading account!', 'trading_performance', 'gold', '💰', 400, 'milestone', '{"milestone": "funded_account"}', false),
('profit_taker', 'Profit Taker', 'Take your first payout from a funded account!', 'trading_performance', 'gold', '💸', 400, 'milestone', '{"milestone": "first_payout"}', false),
('monthly_winner', 'Monthly Winner', 'Achieve $1k profit month - breaking through!', 'trading_performance', 'gold', '🌟', 500, 'milestone', '{"milestone": "1k_month"}', false),
('elite_trader', 'Elite Trader', 'Achieve $5k profit month - elite status achieved!', 'trading_performance', 'platinum', '⭐', 1000, 'milestone', '{"milestone": "5k_month"}', false),
('risk_manager', 'Risk Manager', 'Complete your Enigma Calculator setup.', 'trading_performance', 'silver', '🎲', 150, 'enigma_complete', '{}', false);

-- 👥 COMMUNITY & ENGAGEMENT (Bronze → Gold Tiers)
INSERT INTO public.achievement_badges (badge_key, badge_name, description, category, tier, icon_emoji, points_value, requirement_type, requirement_value, auto_award) VALUES
('community_member', 'Community Member', 'Attend your first live community call.', 'community', 'bronze', '👥', 100, 'milestone', '{"milestone": "first_community_call"}', false),
('active_learner', 'Active Learner', 'Attend 5 community calls - engaged member!', 'community', 'silver', '🎤', 200, 'community_calls', '{"count": 5}', false),
('rising_star', 'Rising Star', 'Reach top 50 on the leaderboard.', 'community', 'silver', '⭐', 200, 'leaderboard_rank', '{"rank": 50}', false),
('top_performer', 'Top Performer', 'Reach top 10 on the leaderboard!', 'community', 'gold', '🏅', 400, 'leaderboard_rank', '{"rank": 10}', false);

-- 🔥 CONSISTENCY & DISCIPLINE (Bronze → Gold Tiers)
INSERT INTO public.achievement_badges (badge_key, badge_name, description, category, tier, icon_emoji, points_value, requirement_type, requirement_value, auto_award) VALUES
('week_warrior', 'Week Warrior', 'Login for 7 consecutive days - building the habit!', 'consistency', 'bronze', '🔥', 100, 'login_streak', '{"days": 7}', true),
('month_master', 'Month Master', 'Login for 30 consecutive days - consistency champion!', 'consistency', 'silver', '📅', 250, 'login_streak', '{"days": 30}', true),
('streak_master', 'Streak Master', 'Login for 60 consecutive days - unstoppable!', 'consistency', 'gold', '⚡', 400, 'login_streak', '{"days": 60}', true),
('early_bird', 'Early Bird', 'Complete pre-market review before 8:30 AM EST (10 times).', 'consistency', 'silver', '🌅', 200, 'premarket_early', '{"count": 10}', false),
('night_owl', 'Night Owl', 'Complete 20 post-market reviews - reflection master.', 'consistency', 'silver', '🌙', 200, 'postmarket_count', '{"count": 20}', false);

-- 🎖️ SPECIAL ACHIEVEMENTS (Gold → Platinum Tiers)
INSERT INTO public.achievement_badges (badge_key, badge_name, description, category, tier, icon_emoji, points_value, requirement_type, requirement_value, auto_award) VALUES
('speed_learner', 'Speed Learner', 'Complete a phase within 7 days of unlock.', 'special', 'gold', '⚡', 300, 'phase_speed', '{"days": 7}', false),
('all_star', 'All-Star', 'Earn at least one badge from every category!', 'special', 'platinum', '🌟', 500, 'category_complete', '{}', false),
('program_graduate', 'Program Graduate', 'Complete the entire Smart Trading Blueprint program!', 'special', 'platinum', '🎓', 1000, 'milestone', '{"milestone": "program_complete"}', false);