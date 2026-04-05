import { useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useCourses } from "@/hooks/useCourses";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { MobileLogoHeader } from "@/components/MobileLogoHeader";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ChevronRight, Lock, BookOpen } from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Demo / placeholder courses shown when Supabase returns empty       */
/* ------------------------------------------------------------------ */
const DEMO_COURSES = [
  {
    id: 'demo-course-1',
    title: 'Amazon FBA Wholesale Mastery',
    description: 'Master the fundamentals of wholesale FBA from brand research to your first profitable purchase order.',
    thumbnail_url: null,
    hasAccess: true,
    is_active: true,
    visible_tiers: ['all'],
    catalog_visible_tier_ids: [],
    visible_tier_ids: [],
    created_at: new Date().toISOString(),
  },
  {
    id: 'demo-course-2',
    title: 'Brand Outreach & Negotiation',
    description: 'Learn how to find, contact, and negotiate with brands to get approved as an authorized reseller.',
    thumbnail_url: null,
    hasAccess: true,
    is_active: true,
    visible_tiers: ['all'],
    catalog_visible_tier_ids: [],
    visible_tier_ids: [],
    created_at: new Date().toISOString(),
  },
  {
    id: 'demo-course-3',
    title: 'Advanced Amazon Analytics',
    description: 'Deep dive into Keepa, SmartScout, and Seller Central analytics to maximize your ROI.',
    thumbnail_url: null,
    hasAccess: false,
    is_active: true,
    visible_tiers: ['Ultimate', 'Platinum'],
    catalog_visible_tier_ids: [],
    visible_tier_ids: [],
    created_at: new Date().toISOString(),
  },
];

/* Gradient palettes for course thumbnail placeholders */
const CARD_GRADIENTS = [
  'from-emerald-500 to-teal-600',
  'from-blue-500 to-indigo-600',
  'from-amber-500 to-orange-600',
  'from-violet-500 to-purple-600',
  'from-rose-500 to-pink-600',
];

function CourseInitials({ title, index }: { title: string; index: number }) {
  const initials = title
    .split(/\s+/)
    .filter((w) => w.length > 0 && w[0] === w[0].toUpperCase())
    .slice(0, 2)
    .map((w) => w[0])
    .join('');

  const gradient = CARD_GRADIENTS[index % CARD_GRADIENTS.length];

  return (
    <div
      className={`h-full w-full rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center`}
    >
      <span className="text-white font-bold text-lg md:text-xl select-none drop-shadow-sm">
        {initials || 'C'}
      </span>
    </div>
  );
}

const CourseCatalog = () => {
  const navigate = useNavigate();
  const { data: courses, isLoading: coursesLoading } = useCourses();
  const { user } = useAuth();
  const { data: profile } = useQuery({
    queryKey: ['user-profile-basic', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('user_profiles')
        .select('first_name, last_name')
        .eq('id', user!.id)
        .single();
      return data;
    },
    enabled: !!user?.id,
  });

  // Always include demo courses alongside real courses so users have accessible content
  const displayCourses = useMemo(() => {
    const realCourses = courses || [];
    const realIds = new Set(realCourses.map((c: any) => c.id));
    // Append demo courses that don't collide with real course IDs
    const demosToAdd = (DEMO_COURSES as any[]).filter(d => !realIds.has(d.id));
    return [...realCourses, ...demosToAdd];
  }, [courses]);

  // Disabled auto-redirect so catalog is always visible for demo review
  // useEffect(() => {
  //   if (!coursesLoading && displayCourses) {
  //     const accessibleCourses = displayCourses.filter((c: any) => c.hasAccess);
  //     if (accessibleCourses.length === 1 && !accessibleCourses[0].id.startsWith('demo-')) {
  //       navigate(`/courses/${accessibleCourses[0].id}`, { replace: true });
  //     }
  //   }
  // }, [displayCourses, coursesLoading, navigate]);

  const initials = [profile?.first_name?.[0], profile?.last_name?.[0]]
    .filter(Boolean)
    .join("")
    .toUpperCase() || "U";

  if (coursesLoading) {
    return (
      <main className="flex-1 overflow-auto bg-content">
        <div className="p-4 md:p-6 lg:p-8">
          <div className="rounded-3xl bg-card shadow-sm p-6 md:p-10 space-y-6">
            <Skeleton className="h-8 w-40" />
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <div key={i} className="flex items-center gap-4 rounded-2xl border border-border p-5">
                  <Skeleton className="h-20 w-20 rounded-xl shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-48" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                  <Skeleton className="h-10 w-10 rounded-full shrink-0" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 overflow-auto bg-content" data-tour="course-catalog">
      <div className="p-4 md:p-6 lg:p-8">
        <MobileLogoHeader />

        <div className="rounded-3xl bg-card shadow-sm p-6 md:p-10">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">
              My Courses
            </h1>
            <Avatar className="h-10 w-10 shrink-0">
              <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
          </div>

          {/* Course Cards */}
          <div className="space-y-4">
            {displayCourses?.map((course: any, idx: number) => {
              const hasAccess = course.hasAccess;

              return (
                <div
                  key={course.id}
                  onClick={() => navigate(`/courses/${course.id}`)}
                  className={`
                    flex items-center gap-4 md:gap-5 rounded-2xl border p-4 md:p-5 transition-all duration-200
                    ${hasAccess
                      ? "border-border border-l-4 border-l-primary bg-card cursor-pointer shadow-md hover:shadow-xl hover:border-primary/30"
                      : "border-border bg-card/60 opacity-60 cursor-not-allowed shadow-sm"}
                  `}
                >
                  {/* Thumbnail */}
                  <div className={`
                    h-16 w-16 md:h-20 md:w-20 rounded-xl shrink-0 flex items-center justify-center overflow-hidden
                    ${!course.thumbnail_url && !hasAccess ? "bg-muted" : ""}
                  `}>
                    {course.thumbnail_url ? (
                      <img
                        src={course.thumbnail_url}
                        alt={course.title}
                        className="h-full w-full object-cover rounded-xl"
                      />
                    ) : hasAccess ? (
                      <CourseInitials title={course.title} index={idx} />
                    ) : (
                      <div className="h-full w-full rounded-xl bg-gradient-to-br from-gray-400 to-gray-500 flex items-center justify-center">
                        <Lock className="h-6 w-6 text-white/70" />
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <h3 className={`font-semibold text-base md:text-lg ${hasAccess ? "text-foreground" : "text-muted-foreground"}`}>
                      {course.title}
                    </h3>
                    {course.description && (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {course.description}
                      </p>
                    )}
                  </div>

                  {/* Action Button */}
                  <div className="shrink-0">
                    {hasAccess ? (
                      <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center">
                        <ChevronRight className="h-5 w-5 text-primary-foreground" />
                      </div>
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                        <Lock className="h-4 w-4 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </main>
  );
};

export default CourseCatalog;
