import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ExamBD — Practice & Mock Tests for Bangladeshi Competitive Exams',
  description: 'BCS, Bank Job, NTRCA, Primary Teacher, and university admission mock tests.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="bn" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
