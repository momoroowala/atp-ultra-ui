-- trader_profiles ---------------------------------------------------
CREATE POLICY "users insert own profile"
ON public.trader_profiles FOR INSERT
WITH CHECK (auth.uid() = id);

CREATE POLICY "users select own profile"
ON public.trader_profiles FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "users update own profile"
ON public.trader_profiles FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- No DELETE policy → non‑service‑role users cannot delete rows.

-- micro_lessons -----------------------------------------------------
CREATE POLICY "public read lessons"
ON public.micro_lessons FOR SELECT USING (true);

CREATE POLICY "admin manage lessons"
ON public.micro_lessons FOR ALL
TO service_role
USING (true) WITH CHECK (true);