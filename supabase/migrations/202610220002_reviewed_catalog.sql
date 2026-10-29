-- Reviewed against public Google HTML on 2026-10-22. Discovery evidence only:
-- availability, access codes, season eligibility and point value are NOT asserted.
insert into public.activities(title,kind,source_url,published,verified_at,metadata) values
('Arcade Base Camp','game','https://www.skills.google/games/7499',true,'2026-10-22T00:00:00Z','{"evidence":"https://go.cloudskillsboost.google/arcade","availability":"unchecked"}'),
('Arcade Adventure','game','https://www.skills.google/games/7496',true,'2026-10-22T00:00:00Z','{"evidence":"https://go.cloudskillsboost.google/arcade","availability":"unchecked"}'),
('Arcade Voyage','game','https://www.skills.google/games/7497',true,'2026-10-22T00:00:00Z','{"evidence":"https://go.cloudskillsboost.google/arcade","availability":"unchecked"}'),
('Arcade Trail','game','https://www.skills.google/games/7498',true,'2026-10-22T00:00:00Z','{"evidence":"https://go.cloudskillsboost.google/arcade","availability":"unchecked"}'),
('Prepare Data for ML APIs on Google Cloud','skill_badge','https://www.skills.google/course_templates/631',true,'2026-10-22T00:00:00Z','{"evidence":"Google public profile award dialog: skill badge description and canonical course URL","availability":"unchecked"}'),
('Build a Secure Google Cloud Network','skill_badge','https://www.skills.google/course_templates/654',true,'2026-10-22T00:00:00Z','{"evidence":"Google public profile award dialog: skill badge description and canonical course URL","availability":"unchecked"}')
on conflict(source_url) do nothing;
