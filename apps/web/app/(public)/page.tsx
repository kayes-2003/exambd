export default function HomePage() {
  return (
    <main className="max-w-5xl mx-auto px-6 py-24 text-center">
      <h1 className="text-4xl font-bold tracking-tight">
        Practice for BCS, Bank Job, NTRCA &amp; Admission Tests
      </h1>
      <p className="mt-4 text-lg text-slate-600 dark:text-slate-400">
        Thousands of MCQs, full-length mock exams, and performance analytics — built for
        Bangladeshi students.
      </p>
      <a
        href="/register"
        className="inline-block mt-8 rounded-md bg-accent px-6 py-3 text-white font-medium"
      >
        Start practicing free
      </a>
    </main>
  );
}
