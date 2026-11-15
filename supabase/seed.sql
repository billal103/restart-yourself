-- Local/dev seed data. Mirrors the Milestone 1 mock data in
-- src/lib/mockData/categories.ts, tags.ts, and professionals.ts so the UI
-- looks the same once it's reading from Supabase instead of mock arrays.

insert into public.categories (slug, name, description, icon) values
  ('relationships', 'Relationships & Marriage', 'Navigating marriage difficulties, trust, and partnership struggles.', 'Heart'),
  ('divorce-separation', 'Divorce & Separation', 'Stories about separating, co-parenting, and starting over.', 'Scale'),
  ('breakups', 'Breakups', 'Processing heartbreak and moving forward after a breakup.', 'HeartCrack'),
  ('family-conflict', 'Family Conflict', 'Difficult family dynamics and finding peace within them.', 'Users'),
  ('loneliness', 'Loneliness', 'Feeling isolated and finding connection again.', 'CloudRain'),
  ('career', 'Career Difficulties', 'Workplace struggles, burnout, and professional setbacks.', 'Briefcase'),
  ('job-loss', 'Job Loss', 'Coping with layoffs and rebuilding a career path.', 'BriefcaseConveyorBelt'),
  ('financial', 'Financial Problems', 'Managing debt, financial stress, and uncertainty.', 'Wallet'),
  ('academic', 'Academic Pressure', 'Exam stress, academic failure, and educational setbacks.', 'GraduationCap'),
  ('confidence', 'Low Confidence', 'Rebuilding self-esteem after setbacks or criticism.', 'ShieldAlert'),
  ('life-transitions', 'Life Transitions', 'Big changes — moving, aging, new chapters of life.', 'Compass')
on conflict (slug) do nothing;

insert into public.tags (slug, name) values
  ('healing', 'Healing'),
  ('starting-over', 'Starting Over'),
  ('self-worth', 'Self-Worth'),
  ('co-parenting', 'Co-Parenting'),
  ('burnout', 'Burnout'),
  ('anxiety', 'Anxiety'),
  ('hope', 'Hope'),
  ('grief', 'Grief'),
  ('gratitude', 'Gratitude'),
  ('boundaries', 'Boundaries')
on conflict (slug) do nothing;

insert into public.resources (title, description, category, url, region) values
  ('International Association for Suicide Prevention — Crisis Centers', 'Directory of crisis centers and hotlines by country.', 'Crisis Support', 'https://www.iasp.info/resources/Crisis_Centres/', 'Global'),
  ('Kaan Pete Roi — Emotional Support Helpline', 'Bangladesh-based emotional support and suicide prevention helpline.', 'Crisis Support', 'https://www.facebook.com/kaanpeteroi/', 'Bangladesh'),
  ('National Domestic Violence Hotline', 'Support for people experiencing domestic violence, available 24/7 in the US.', 'Safety', 'https://www.thehotline.org/', 'United States'),
  ('Open University Financial Hardship Guidance', 'Educational resources for managing academic-related financial stress.', 'Financial', 'https://www.open.edu/', 'Global')
on conflict do nothing;

insert into public.communities (slug, name, description, guidelines) values
  ('starting-over', 'Starting Over', 'For anyone rebuilding their life after a major life change.', 'Be respectful. No solicitation. No sharing of personal contact information.'),
  ('career-recovery', 'Career Recovery', 'Support for job loss, career pivots, and professional setbacks.', 'Keep discussions constructive. No recruiting or self-promotion.'),
  ('personal-growth', 'Personal Growth', 'A space focused on habits, mindset, and gradual self-improvement.', 'Share experiences, not advice presented as medical fact.'),
  ('building-confidence', 'Building Confidence', 'For people working through low self-esteem and self-doubt.', 'Encourage, do not criticize. Report anything that feels unsafe.'),
  ('academic-challenges', 'Academic Challenges', 'Students and former students navigating academic pressure or failure.', 'No sharing of academic dishonesty requests. Respect all education paths.'),
  ('life-after-separation', 'Life After Separation', 'Divorce, separation, and co-parenting support.', 'No discussion of ongoing legal case specifics that identify others.'),
  ('emotional-support', 'Emotional Support', 'General emotional support for anyone going through a hard time.', 'This is peer support, not professional therapy.')
on conflict (slug) do nothing;
