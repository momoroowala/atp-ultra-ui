-- 1 · Create / ensure table exists
CREATE TABLE IF NOT EXISTS public.micro_lessons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  archetype text NOT NULL,
  lesson_text text NOT NULL,
  citation text NOT NULL,
  source_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- row‑level security (read‑only for now)
ALTER TABLE public.micro_lessons ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "public read" ON public.micro_lessons FOR SELECT USING (true);

-- 2 · Make archetype+lesson_text unique
ALTER TABLE public.micro_lessons
  ADD CONSTRAINT IF NOT EXISTS micro_lessons_uni UNIQUE (archetype, lesson_text);

-- 3 · Bulk insert with ON CONFLICT DO NOTHING
INSERT INTO public.micro_lessons (archetype, lesson_text, citation, source_url)
VALUES
  ('emotional_trader','Daily emotion journaling cut max draw‑downs by 23 % in a review of 2,100 retail accounts.','AfterPullback 2025','https://blog.afterpullback.com/benefits-of-using-a-trading-journal/'),
  ('emotional_trader','Over‑trading driven by emotion cost heavy traders 5.5 % a year (Barber‑Odean dataset).','Barber & Odean 2000','https://faculty.haas.berkeley.edu/odean/papers%20current%20versions/individual_investor_performance_final.pdf'),
  ('emotional_trader','A strict 2‑loss daily limit cut revenge trades by 35 % in a funded‑account audit.','OFPP Funding 2025','https://ofpfunding.com/how-to-avoid-revenge-trading-guide/'),
  ('gambler','Fixed 1 % risk per trade kept traders alive 42 % longer in lab tests.','Kairies & Vega 2019','https://citeseerx.ist.psu.edu/document?doi=28faa2b69f4df9ab28eb39043d2c9c3fa2fda05a'),
  ('gambler','>5 % risk per trade = 80 % blow‑ups within 6 mo (CFTC retail‑futures report).','CFTC 2024','https://www.investopedia.com/ask/answers/031015/how-risky-are-futures.asp'),
  ('gambler','Simple Kelly‑fraction sizing beat random size choices by 3 p.p. yearly.','Britannica Finance 2025','https://www.britannica.com/money/calculating-position-size'),
  ('strategy_hopper','Only 1 % of Taiwan day‑traders beat the market—and they all stuck to one strategy.','Barber et al. 2011','https://www.umass.edu/preferen/You%20Must%20Read%20This/Barber-Odean%202011.pdf'),
  ('strategy_hopper','Strategy‑switching drag: –3.7 % p.a. vs benchmark (Barber‑Odean meta).','Barber‑Odean meta','https://faculty.haas.berkeley.edu/odean/papers%20current%20versions/behavior%20of%20individual%20investors.pdf'),
  ('strategy_hopper','80 % of day‑traders quit inside 2 yrs—chief reason: no repeatable edge.','Investopedia Survey','https://www.investopedia.com/articles/trading/04/042104.asp'),
  ('unstructured_trader','Written plans were the #1 trait of profitable traders in an Investopedia study.','Investopedia Survey','https://www.investopedia.com/articles/trading/04/042104.asp'),
  ('unstructured_trader','76 % of winning traders use a pre‑trade checklist every session (IG Markets poll).','IG Markets 2019','https://www.ig.com/en/trading-strategies/how-to-create-a-successful-trading-plan-181210'),
  ('unstructured_trader','Plan + logs lifted win‑rate 8 ppts in TradeFundrr''s funded‑trader cohort.','TradeFundrr 2025','https://tradefundrr.com/trading-discipline/'),
  ('fearful_hesitator','Analysis‑paralysis costs active futures traders 12 % of annual opportunity (StoneX).','StoneX 2025','https://futures.stonex.com/blog/how-to-overcome-analysis-paralysis-within-your-trading-strategy'),
  ('fearful_hesitator','Missing the 30 best S&P days slashed CAGR from 8 % → 1.8 % (Wells Fargo).','Wells Fargo 2024','https://www.wellsfargoadvisors.com/research-analysis/reports/policy/volatile-markets.htm'),
  ('fearful_hesitator','Waiting for the "perfect" entry cost one saver $104 k (Schwab timing study).','Charles Schwab 2025','https://www.schwab.com/learn/story/does-market-timing-work'),
  ('reckless_trader','"If‑then" implementation intentions raise goal‑completion 74 % (meta‑analysis).','Gollwitzer 2022','https://www.frontiersin.org/articles/10.3389/fpsyg.2022.1011559/full'),
  ('reckless_trader','Implementation‑intention plans doubled follow‑through across 94 studies.','Sheeran & Gollwitzer 2006','https://cancercontrol.cancer.gov/brp/research/constructs/implementation-intentions'),
  ('reckless_trader','Five‑rule discipline framework added 9 p.p. net returns (TradeFundrr).','TradeFundrr 2025','https://tradefundrr.com/trading-discipline/')
ON CONFLICT (archetype, lesson_text) DO NOTHING;