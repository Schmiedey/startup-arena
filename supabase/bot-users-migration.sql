-- Label seeded/demo accounts as bots and add bot predictor rows.
-- Safe to run repeatedly.

ALTER TABLE users ADD COLUMN IF NOT EXISTS is_bot BOOLEAN DEFAULT FALSE;
CREATE INDEX IF NOT EXISTS idx_users_is_bot ON users(is_bot);

UPDATE users
SET is_bot = TRUE
WHERE email IN (
  'marcus@example.com',
  'sarah@example.com',
  'dev@example.com',
  'jenny@example.com',
  'alex@example.com',
  'kim@example.com',
  'jordan@example.com',
  'priya@example.com',
  'mika@example.com',
  'taylor@example.com',
  'maya.r@protonmail.com',
  'jake.h@fastmail.com',
  'aisha.m@gmail.com',
  'tomas.g@outlook.com',
  'nina.p@protonmail.com',
  'mchen@hey.com',
  'priya.s@icloud.com',
  'd.okafor@gmail.com',
  'emma.l@yahoo.com',
  'ktran@college.edu',
  'sofia.nav@protonmail.com',
  'rpatterson@gmail.com',
  'lena.h@hey.com',
  'raj.m@outlook.com',
  'c.washington@gmail.com',
  'djkim@fastmail.com',
  'olive.m@protonmail.com',
  'felix.m@gmail.com',
  'anika.d@hey.com',
  'zach.w@outlook.com',
  'jamie.osei@gmail.com',
  'mia.s@fastmail.com',
  'dmitch@college.edu',
  'yuki.t@protonmail.com',
  'g.vasquez@hey.com',
  'b.oneill@gmail.com',
  'fatima.ar@outlook.com',
  'sam.e@protonmail.com'
);

UPDATE users
SET
  name = CASE email
    WHEN 'mchen@hey.com' THEN 'mchen'
    WHEN 'priya.s@icloud.com' THEN 'priya'
    WHEN 'ktran@college.edu' THEN 'ktran'
    WHEN 'anika.d@hey.com' THEN 'anika builds'
    WHEN 'c.washington@gmail.com' THEN 'krystal.codes'
    WHEN 'jamie.osei@gmail.com' THEN 'jamie_osei'
    WHEN 'felix.m@gmail.com' THEN 'feliix'
    WHEN 'aisha.m@gmail.com' THEN 'aishaM'
    WHEN 'dmitch@college.edu' THEN 'd.mitch'
    WHEN 'emma.l@yahoo.com' THEN 'emmal'
    WHEN 'jake.h@fastmail.com' THEN 'jakeh'
    WHEN 'lena.h@hey.com' THEN 'lena'
    WHEN 'mia.s@fastmail.com' THEN 'mia.s'
    WHEN 'nina.p@protonmail.com' THEN 'np'
    WHEN 'olive.m@protonmail.com' THEN 'Olive'
    WHEN 'raj.m@outlook.com' THEN 'rajm'
    WHEN 'rpatterson@gmail.com' THEN 'rpatterson'
    WHEN 'tomas.g@outlook.com' THEN 'tomas'
    WHEN 'yuki.t@protonmail.com' THEN 'yuki_t'
    WHEN 'zach.w@outlook.com' THEN 'zw'
    WHEN 'maya.r@protonmail.com' THEN 'maya'
    WHEN 'd.okafor@gmail.com' THEN 'dan_ok'
    WHEN 'sofia.nav@protonmail.com' THEN 'sofia.nav'
    WHEN 'djkim@fastmail.com' THEN 'djkim'
    WHEN 'g.vasquez@hey.com' THEN 'gloria_v'
    WHEN 'b.oneill@gmail.com' THEN 'b_oneill'
    WHEN 'fatima.ar@outlook.com' THEN 'fatima'
    WHEN 'sam.e@protonmail.com' THEN 'sam.e'
    ELSE name
  END,
  image = CASE email
    WHEN 'mchen@hey.com' THEN 'https://api.dicebear.com/9.x/notionists/svg?seed=mchen'
    WHEN 'priya.s@icloud.com' THEN 'https://api.dicebear.com/9.x/notionists/svg?seed=priya'
    WHEN 'ktran@college.edu' THEN 'https://api.dicebear.com/9.x/notionists/svg?seed=ktran'
    WHEN 'anika.d@hey.com' THEN 'https://api.dicebear.com/9.x/notionists/svg?seed=anika-builds'
    WHEN 'c.washington@gmail.com' THEN 'https://api.dicebear.com/9.x/notionists/svg?seed=krystal-codes'
    WHEN 'jamie.osei@gmail.com' THEN 'https://api.dicebear.com/9.x/notionists/svg?seed=jamie-osei'
    WHEN 'felix.m@gmail.com' THEN 'https://api.dicebear.com/9.x/notionists/svg?seed=feliix'
    WHEN 'aisha.m@gmail.com' THEN 'https://api.dicebear.com/9.x/notionists/svg?seed=aishaM'
    WHEN 'dmitch@college.edu' THEN 'https://api.dicebear.com/9.x/notionists/svg?seed=d-mitch'
    WHEN 'emma.l@yahoo.com' THEN 'https://api.dicebear.com/9.x/notionists/svg?seed=emmal'
    WHEN 'jake.h@fastmail.com' THEN 'https://api.dicebear.com/9.x/notionists/svg?seed=jakeh'
    WHEN 'lena.h@hey.com' THEN 'https://api.dicebear.com/9.x/notionists/svg?seed=lena'
    WHEN 'mia.s@fastmail.com' THEN 'https://api.dicebear.com/9.x/notionists/svg?seed=mia-s'
    WHEN 'nina.p@protonmail.com' THEN 'https://api.dicebear.com/9.x/notionists/svg?seed=np'
    WHEN 'olive.m@protonmail.com' THEN 'https://api.dicebear.com/9.x/notionists/svg?seed=olive'
    WHEN 'raj.m@outlook.com' THEN 'https://api.dicebear.com/9.x/notionists/svg?seed=rajm'
    WHEN 'rpatterson@gmail.com' THEN 'https://api.dicebear.com/9.x/notionists/svg?seed=rpatterson'
    WHEN 'tomas.g@outlook.com' THEN 'https://api.dicebear.com/9.x/notionists/svg?seed=tomas'
    WHEN 'yuki.t@protonmail.com' THEN 'https://api.dicebear.com/9.x/notionists/svg?seed=yuki-t'
    WHEN 'zach.w@outlook.com' THEN 'https://api.dicebear.com/9.x/notionists/svg?seed=zw'
    WHEN 'maya.r@protonmail.com' THEN 'https://api.dicebear.com/9.x/notionists/svg?seed=maya'
    WHEN 'd.okafor@gmail.com' THEN 'https://api.dicebear.com/9.x/notionists/svg?seed=dan-ok'
    WHEN 'sofia.nav@protonmail.com' THEN 'https://api.dicebear.com/9.x/notionists/svg?seed=sofia-nav'
    WHEN 'djkim@fastmail.com' THEN 'https://api.dicebear.com/9.x/notionists/svg?seed=djkim'
    WHEN 'g.vasquez@hey.com' THEN 'https://api.dicebear.com/9.x/notionists/svg?seed=gloria-v'
    WHEN 'b.oneill@gmail.com' THEN 'https://api.dicebear.com/9.x/notionists/svg?seed=b-oneill'
    WHEN 'fatima.ar@outlook.com' THEN 'https://api.dicebear.com/9.x/notionists/svg?seed=fatima'
    WHEN 'sam.e@protonmail.com' THEN 'https://api.dicebear.com/9.x/notionists/svg?seed=sam-e'
    ELSE image
  END
WHERE email IN (
  'mchen@hey.com',
  'priya.s@icloud.com',
  'ktran@college.edu',
  'anika.d@hey.com',
  'c.washington@gmail.com',
  'jamie.osei@gmail.com',
  'felix.m@gmail.com',
  'aisha.m@gmail.com',
  'dmitch@college.edu',
  'emma.l@yahoo.com',
  'jake.h@fastmail.com',
  'lena.h@hey.com',
  'mia.s@fastmail.com',
  'nina.p@protonmail.com',
  'olive.m@protonmail.com',
  'raj.m@outlook.com',
  'rpatterson@gmail.com',
  'tomas.g@outlook.com',
  'yuki.t@protonmail.com',
  'zach.w@outlook.com',
  'maya.r@protonmail.com',
  'd.okafor@gmail.com',
  'sofia.nav@protonmail.com',
  'djkim@fastmail.com',
  'g.vasquez@hey.com',
  'b.oneill@gmail.com',
  'fatima.ar@outlook.com',
  'sam.e@protonmail.com'
);

INSERT INTO users (
  name,
  email,
  image,
  is_bot,
  prediction_elo,
  prediction_wins,
  prediction_losses,
  prediction_streak,
  best_prediction_streak,
  created_at
) VALUES
('riley.js', 'bot.signal-scout@likelyr.local', 'https://api.dicebear.com/9.x/notionists/svg?seed=riley-js', TRUE, 1316, 39, 18, 2, 7, NOW() - INTERVAL '23 days'),
('marlowe', 'bot.market-maven@likelyr.local', 'https://api.dicebear.com/9.x/notionists/svg?seed=marlowe', TRUE, 1274, 44, 24, 0, 10, NOW() - INTERVAL '19 days'),
('C.V. Roads', 'bot.launch-oracle@likelyr.local', 'https://api.dicebear.com/9.x/notionists/svg?seed=cv-roads', TRUE, 1249, 31, 12, 4, 6, NOW() - INTERVAL '27 days'),
('jae_h', 'bot.revenue-radar@likelyr.local', 'https://api.dicebear.com/9.x/notionists/svg?seed=jae-h', TRUE, 1211, 28, 17, 1, 8, NOW() - INTERVAL '16 days'),
('Nadia', 'bot.crowd-whisperer@likelyr.local', 'https://api.dicebear.com/9.x/notionists/svg?seed=nadia', TRUE, 1183, 34, 25, 3, 5, NOW() - INTERVAL '31 days'),
('tcalls', 'bot.moat-mapper@likelyr.local', 'https://api.dicebear.com/9.x/notionists/svg?seed=tcalls', TRUE, 1159, 22, 11, 2, 6, NOW() - INTERVAL '14 days'),
('imani b.', 'bot.traction-taster@likelyr.local', 'https://api.dicebear.com/9.x/notionists/svg?seed=imani-b', TRUE, 1134, 26, 21, 0, 4, NOW() - INTERVAL '25 days'),
('vicsal', 'bot.tam-reader@likelyr.local', 'https://api.dicebear.com/9.x/notionists/svg?seed=vicsal', TRUE, 1107, 19, 13, 1, 5, NOW() - INTERVAL '18 days'),
('rowan.pierce', 'bot.painkiller-picker@likelyr.local', 'https://api.dicebear.com/9.x/notionists/svg?seed=rowan-pierce-handle', TRUE, 1088, 23, 25, 0, 3, NOW() - INTERVAL '22 days'),
('K. Tan', 'bot.idea-referee@likelyr.local', 'https://api.dicebear.com/9.x/notionists/svg?seed=k-tan', TRUE, 1061, 16, 12, 2, 4, NOW() - INTERVAL '12 days'),
('drewh', 'bot.growth-gauge@likelyr.local', 'https://api.dicebear.com/9.x/notionists/svg?seed=drewh', TRUE, 1037, 21, 28, 1, 3, NOW() - INTERVAL '29 days'),
('alma.f', 'bot.demand-decoder@likelyr.local', 'https://api.dicebear.com/9.x/notionists/svg?seed=alma-f', TRUE, 1014, 13, 16, 0, 2, NOW() - INTERVAL '15 days')
ON CONFLICT (email) DO UPDATE SET
  name = EXCLUDED.name,
  image = EXCLUDED.image,
  is_bot = TRUE,
  prediction_elo = EXCLUDED.prediction_elo,
  prediction_wins = EXCLUDED.prediction_wins,
  prediction_losses = EXCLUDED.prediction_losses,
  prediction_streak = EXCLUDED.prediction_streak,
  best_prediction_streak = EXCLUDED.best_prediction_streak;
