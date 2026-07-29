// Server Component: fetch the student's profile + upcoming exams via the Supabase server client,
// then hand off to client components for anything interactive (charts, autosave, etc.)
import { createClient } from '@/lib/supabase/server';

export default async function StudentDashboardPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <main className="max-w-6xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-semibold">Welcome back{user ? `, ${user.email}` : ''}</h1>
      <p className="text-slate-500 mt-1">Continue where you left off, or start a new mock test.</p>
      {/* <UpcomingExams />, <PerformanceRings />, <WeakTopicsWidget /> — component stubs to build out */}
    </main>
  );
}
