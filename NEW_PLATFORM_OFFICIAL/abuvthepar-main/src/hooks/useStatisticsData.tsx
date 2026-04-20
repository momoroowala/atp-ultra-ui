import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

// Dynamically exclude admin/staff roles from statistics

export interface NonAdminUser {
  id: string;
  user_email: string | null;
  first_name: string | null;
  last_name: string | null;
  created_at: string;
  role_id: string | null;
  last_login_date: string | null;
  total_logins: number | null;
  current_streak: number | null;
}

export interface TaskInfo {
  id: string;
  phase_id: string;
  is_active: boolean;
}

export interface PhaseInfo {
  id: string;
  title: string;
  course_id: string;
  phase_order: number;
  is_active: boolean;
  tasks: TaskInfo[];
}

export interface CourseWithPhases {
  id: string;
  title: string;
  is_active: boolean;
  phases: PhaseInfo[];
}

export interface TaskResponse {
  user_id: string;
  task_id: string;
  status: string;
  completed_at: string | null;
  phase_id: string;
}

export interface StatisticsData {
  users: NonAdminUser[];
  courseStructure: CourseWithPhases[];
  taskResponses: TaskResponse[];
  quizPassedCount: number;
  totalQuizSubmissions: number;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export const useStatisticsData = (): StatisticsData => {
  const [users, setUsers] = useState<NonAdminUser[]>([]);
  const [courseStructure, setCourseStructure] = useState<CourseWithPhases[]>([]);
  const [taskResponses, setTaskResponses] = useState<TaskResponse[]>([]);
  const [quizPassedCount, setQuizPassedCount] = useState(0);
  const [totalQuizSubmissions, setTotalQuizSubmissions] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // First, get non-client role IDs to exclude (admin, csm, executive, mega_admin)
      const { data: staffRoles, error: rolesError } = await supabase
        .from('roles')
        .select('id, role_key')
        .in('role_key', ['admin', 'mega_admin', 'csm', 'csa', 'executive']);
      
      if (rolesError) throw rolesError;
      const staffRoleIds = (staffRoles || []).map(r => r.id);

      // Execute all queries in parallel
      const [
        usersResult,
        coursesResult,
        phasesResult,
        tasksResult,
        taskResponsesResult,
        quizSubmissionsResult,
      ] = await Promise.all([
        // 1. Users with login streaks (excluding staff roles)
        supabase
          .from('user_profiles')
          .select(`
            id,
            user_email,
            first_name,
            last_name,
            created_at,
            role_id
          `)
          .not('role_id', 'in', `(${staffRoleIds.join(',')})`)
          .eq('is_active', true),

        // 2. Courses
        supabase
          .from('courses')
          .select('id, title, is_active')
          .eq('is_active', true)
          .order('course_order'),

        // 4. Phases
        supabase
          .from('phases')
          .select('id, title, course_id, phase_order, is_active')
          .eq('is_active', true)
          .order('phase_order'),

        // 4. Tasks
        supabase
          .from('tasks')
          .select('id, phase_id, is_active')
          .eq('is_active', true),

        // 5. Task responses
        supabase
          .from('task_responses')
          .select('user_id, task_id, status, completed_at'),

        // 6. Quiz submissions
        supabase
          .from('quiz_submissions')
          .select('user_id, passed'),
      ]);

      // Check for errors
      if (usersResult.error) throw usersResult.error;
      if (coursesResult.error) throw coursesResult.error;
      if (phasesResult.error) throw phasesResult.error;
      if (tasksResult.error) throw tasksResult.error;
      if (taskResponsesResult.error) throw taskResponsesResult.error;
      if (quizSubmissionsResult.error) throw quizSubmissionsResult.error;

      // Fetch login streaks separately and join
      const userIds = (usersResult.data || []).map(u => u.id);
      const loginStreaksResult = await supabase
        .from('user_login_streaks')
        .select('user_id, last_login_date, total_logins, current_streak')
        .in('user_id', userIds);

      if (loginStreaksResult.error) throw loginStreaksResult.error;

      // Create a map for login streaks
      const loginStreaksMap = new Map(
        (loginStreaksResult.data || []).map(ls => [ls.user_id, ls])
      );

      // Merge users with login streaks
      const usersWithStreaks: NonAdminUser[] = (usersResult.data || []).map(user => ({
        ...user,
        last_login_date: loginStreaksMap.get(user.id)?.last_login_date || null,
        total_logins: loginStreaksMap.get(user.id)?.total_logins || null,
        current_streak: loginStreaksMap.get(user.id)?.current_streak || null,
      }));

      // Build course structure
      const tasksMap = new Map<string, TaskInfo[]>();
      (tasksResult.data || []).forEach(task => {
        const existing = tasksMap.get(task.phase_id) || [];
        existing.push(task);
        tasksMap.set(task.phase_id, existing);
      });

      const phasesMap = new Map<string, PhaseInfo[]>();
      (phasesResult.data || []).forEach(phase => {
        const existing = phasesMap.get(phase.course_id) || [];
        existing.push({
          ...phase,
          tasks: tasksMap.get(phase.id) || [],
        });
        phasesMap.set(phase.course_id, existing);
      });

      const structuredCourses: CourseWithPhases[] = (coursesResult.data || []).map(course => ({
        ...course,
        phases: (phasesMap.get(course.id) || []).sort((a, b) => a.phase_order - b.phase_order),
      }));

      // Build task to phase mapping for task responses
      const taskToPhaseMap = new Map<string, string>();
      (tasksResult.data || []).forEach(task => {
        taskToPhaseMap.set(task.id, task.phase_id);
      });

      // Filter task responses to exclude admin users
      const nonAdminUserIds = new Set(userIds);
      const filteredTaskResponses: TaskResponse[] = (taskResponsesResult.data || [])
        .filter(tr => nonAdminUserIds.has(tr.user_id))
        .map(tr => ({
          ...tr,
          phase_id: taskToPhaseMap.get(tr.task_id) || '',
        }));

      // Count quiz stats (exclude admin users)
      const quizSubmissions = (quizSubmissionsResult.data || [])
        .filter(qs => nonAdminUserIds.has(qs.user_id));
      
      const uniqueUsersPassed = new Set(
        quizSubmissions.filter(qs => qs.passed).map(qs => qs.user_id)
      );

      setUsers(usersWithStreaks);
      setCourseStructure(structuredCourses);
      setTaskResponses(filteredTaskResponses);
      setQuizPassedCount(uniqueUsersPassed.size);
      setTotalQuizSubmissions(quizSubmissions.length);
    } catch (err) {
      console.error('Error fetching statistics data:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch statistics'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return {
    users,
    courseStructure,
    taskResponses,
    quizPassedCount,
    totalQuizSubmissions,
    isLoading,
    error,
    refetch: fetchData,
  };
};
