-- profiles
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- diary_entries
CREATE POLICY "Users can view own entries"
  ON public.diary_entries FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own entries"
  ON public.diary_entries FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own entries"
  ON public.diary_entries FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own entries"
  ON public.diary_entries FOR DELETE USING (auth.uid() = user_id);

-- body_annotations
CREATE POLICY "Users can view own annotations"
  ON public.body_annotations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own annotations"
  ON public.body_annotations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own annotations"
  ON public.body_annotations FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own annotations"
  ON public.body_annotations FOR DELETE USING (auth.uid() = user_id);

-- knowledge_cards (内置卡片所有人可读)
CREATE POLICY "Anyone can view knowledge cards"
  ON public.knowledge_cards FOR SELECT USING (true);

-- user_materials
CREATE POLICY "Users can view own materials"
  ON public.user_materials FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own materials"
  ON public.user_materials FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own materials"
  ON public.user_materials FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own materials"
  ON public.user_materials FOR DELETE USING (auth.uid() = user_id);
