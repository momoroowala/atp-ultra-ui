-- Add DELETE policy for habit_completions
CREATE POLICY "Users can delete their own completions"
ON habit_completions
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Add DELETE policy for habit_streaks  
CREATE POLICY "Users can delete their own streaks"
ON habit_streaks
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Add DELETE policy for user_habits
CREATE POLICY "Users can delete their own habits"
ON user_habits
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);