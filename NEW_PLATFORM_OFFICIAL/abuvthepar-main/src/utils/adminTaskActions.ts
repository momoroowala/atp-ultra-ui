import { supabase } from "@/integrations/supabase/client";

export const markTaskComplete = async (userId: string, taskId: string) => {
  // Check if response already exists
  const { data: existing } = await supabase
    .from('task_responses')
    .select('id')
    .eq('user_id', userId)
    .eq('task_id', taskId)
    .maybeSingle();

  if (existing) {
    // Update existing response
    const { error } = await supabase
      .from('task_responses')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id);

    if (error) throw error;
  } else {
    // Create new response
    const { error } = await supabase
      .from('task_responses')
      .insert({
        user_id: userId,
        task_id: taskId,
        status: 'completed',
        completed_at: new Date().toISOString(),
        response: { admin_marked: true },
      });

    if (error) throw error;
  }
};

export const markTaskIncomplete = async (userId: string, taskId: string) => {
  // Check if response exists
  const { data: existing } = await supabase
    .from('task_responses')
    .select('id')
    .eq('user_id', userId)
    .eq('task_id', taskId)
    .maybeSingle();

  if (existing) {
    // Update existing response to pending
    const { error } = await supabase
      .from('task_responses')
      .update({
        status: 'pending',
        completed_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id);

    if (error) throw error;
  }
  // If no response exists, do nothing (already incomplete)
};

export const deleteQuizSubmission = async (submissionId: string) => {
  const { error } = await supabase
    .from('quiz_submissions')
    .delete()
    .eq('id', submissionId);

  if (error) throw error;
};

export const deleteAllQuizSubmissionsForUser = async (userId: string, quizId: string) => {
  const { error } = await supabase
    .from('quiz_submissions')
    .delete()
    .eq('user_id', userId)
    .eq('quiz_id', quizId);

  if (error) throw error;
};

