-- Minimal local dev seed data
insert into subjects (name, slug, exam_category) values
  ('বাংলা ভাষা ও সাহিত্য', 'bangla', 'BCS'),
  ('English Language', 'english', 'BCS'),
  ('গাণিতিক যুক্তি', 'math', 'Bank Job'),
  ('বাংলাদেশ বিষয়াবলী', 'bangladesh-affairs', 'BCS')
on conflict (slug) do nothing;
