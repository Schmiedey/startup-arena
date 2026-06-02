-- Seed data for Likelyr
-- Run after schema

INSERT INTO users (id, name, email, image, is_bot) VALUES
('a0000000-0000-0000-0000-000000000001', 'Marcus Chen', 'marcus@example.com', 'https://api.dicebear.com/9.x/avataaars/svg?seed=marcus', TRUE),
('a0000000-0000-0000-0000-000000000002', 'Sarah Park', 'sarah@example.com', 'https://api.dicebear.com/9.x/avataaars/svg?seed=sarah', TRUE),
('a0000000-0000-0000-0000-000000000003', 'Dev Patel', 'dev@example.com', 'https://api.dicebear.com/9.x/avataaars/svg?seed=dev', TRUE),
('a0000000-0000-0000-0000-000000000004', 'Jenny Liu', 'jenny@example.com', 'https://api.dicebear.com/9.x/avataaars/svg?seed=jenny', TRUE),
('a0000000-0000-0000-0000-000000000005', 'Alex Rivera', 'alex@example.com', 'https://api.dicebear.com/9.x/avataaars/svg?seed=alex', TRUE),
('a0000000-0000-0000-0000-000000000006', 'Kim Nguyen', 'kim@example.com', 'https://api.dicebear.com/9.x/avataaars/svg?seed=kim', TRUE),
('a0000000-0000-0000-0000-000000000007', 'Jordan Blake', 'jordan@example.com', 'https://api.dicebear.com/9.x/avataaars/svg?seed=jordan', TRUE),
('a0000000-0000-0000-0000-000000000008', 'Priya Sharma', 'priya@example.com', 'https://api.dicebear.com/9.x/avataaars/svg?seed=priya', TRUE),
('a0000000-0000-0000-0000-000000000009', 'Mika Virtanen', 'mika@example.com', 'https://api.dicebear.com/9.x/avataaars/svg?seed=mika', TRUE),
('a0000000-0000-0000-0000-000000000010', 'Taylor Brooks', 'taylor@example.com', 'https://api.dicebear.com/9.x/avataaars/svg?seed=taylor', TRUE)
ON CONFLICT (email) DO NOTHING;

INSERT INTO ideas (name, pitch, target_customer, problem, revenue_model, category, stage, elo_score, wins, losses, user_id) VALUES
('LeadSniper AI', 'AI tool that finds local businesses with bad websites and sends personalized cold emails.', 'Small business owners', 'Small businesses have terrible websites but lack the time and expertise to fix them or find help.', 'SaaS subscription $49/mo per business', 'AI', 'MVP', 1284, 39, 8, 'a0000000-0000-0000-0000-000000000001'),
('ClipArena', 'Platform where creators battle short-form video edits and viewers vote on the best clips.', 'Content creators and social media managers', 'Creators need feedback on what style of content performs best before investing in production.', 'Freemium with pro analytics at $19/mo', 'Consumer App', 'Idea', 1192, 24, 9, 'a0000000-0000-0000-0000-000000000002'),
('TutorCredits', 'App where students trade homework help using credits earned by helping others.', 'High school and college students', 'Students need quick homework help but can''t always afford tutors.', 'Take 10% commission on credit purchases', 'Education', 'Idea', 1087, 13, 9, 'a0000000-0000-0000-0000-000000000003'),
('InboxZero AI', 'AI email assistant that categorizes, drafts replies, and unsubscribes from newsletters automatically.', 'Busy professionals and executives', 'Email overload wastes 3+ hours per day and important messages get buried.', '$12/mo personal, $29/mo professional', 'SaaS', 'Launched', 1156, 21, 7, 'a0000000-0000-0000-0000-000000000004'),
('NeighborFit', 'Platform that matches renters to neighborhoods based on lifestyle preferences, not just price.', 'Apartment renters in major cities', 'People move to new cities and pick neighborhoods blindly, leading to mismatches.', 'Referral fees from property managers', 'Marketplace', 'MVP', 1043, 11, 11, 'a0000000-0000-0000-0000-000000000005'),
('ScriptShot', 'Chrome extension that summarizes YouTube videos into key bullet points with timestamps.', 'YouTube power learners and researchers', 'Skipping through videos to find key info wastes enormous time.', 'Free tier + $5/mo for unlimited summaries', 'Chrome Extension', 'Revenue', 1211, 19, 5, 'a0000000-0000-0000-0000-000000000006'),
('MerchForge', 'On-demand merch store where fans vote on designs and winning designs get produced.', 'YouTubers, Twitch streamers, podcasters', 'Creators want merch but don''t want to deal with inventory risk and upfront costs.', '15% cut on each sale', 'Creator Tools', 'MVP', 1102, 14, 8, 'a0000000-0000-0000-0000-000000000007'),
('LocalBite', 'App that finds hidden-gem restaurants near you based on food critic data, not tourist reviews.', 'Foodies and adventurous eaters', 'Tourist-trap restaurants dominate review sites while real local gems stay hidden.', 'Restaurant promotion fees', 'Consumer App', 'Idea', 978, 7, 10, 'a0000000-0000-0000-0000-000000000008'),
('FormWiz AI', 'AI that converts any PDF form into a fillable web form with auto-complete suggestions.', 'HR departments and real estate agents', 'People waste hours filling out the same information on different forms.', '$19/mo per user', 'SaaS', 'Launched', 1234, 17, 4, 'a0000000-0000-0000-0000-000000000009'),
('WildCard', 'Surprise subscription box where each month is themed by what the internet was obsessed about.', 'Gen Z and millennials who love surprises', 'Subscription fatigue — most boxes are predictable and boring.', '$34.99/mo box, $5/mo digital tier', 'E-commerce', 'Idea', 945, 5, 8, 'a0000000-0000-0000-0000-000000000010');

INSERT INTO battles (id, idea_a_id, idea_b_id, idea_a_votes, idea_b_votes, winner_id, created_at) VALUES
('b1111111-1111-1111-1111-111111111111', (SELECT id FROM ideas WHERE name = 'LeadSniper AI'), (SELECT id FROM ideas WHERE name = 'TutorCredits'), 31, 16, (SELECT id FROM ideas WHERE name = 'LeadSniper AI'), NOW() - INTERVAL '5 days'),
('b2222222-2222-2222-2222-222222222222', (SELECT id FROM ideas WHERE name = 'ClipArena'), (SELECT id FROM ideas WHERE name = 'LocalBite'), 22, 11, (SELECT id FROM ideas WHERE name = 'ClipArena'), NOW() - INTERVAL '4 days'),
('b3333333-3333-3333-3333-333333333333', (SELECT id FROM ideas WHERE name = 'InboxZero AI'), (SELECT id FROM ideas WHERE name = 'NeighborFit'), 18, 14, (SELECT id FROM ideas WHERE name = 'InboxZero AI'), NOW() - INTERVAL '3 days'),
('b4444444-4444-4444-4444-444444444444', (SELECT id FROM ideas WHERE name = 'ScriptShot'), (SELECT id FROM ideas WHERE name = 'WildCard'), 15, 9, (SELECT id FROM ideas WHERE name = 'ScriptShot'), NOW() - INTERVAL '2 days'),
('b5555555-5555-5555-5555-555555555555', (SELECT id FROM ideas WHERE name = 'MerchForge'), (SELECT id FROM ideas WHERE name = 'LocalBite'), 12, 5, (SELECT id FROM ideas WHERE name = 'MerchForge'), NOW() - INTERVAL '1 day');
