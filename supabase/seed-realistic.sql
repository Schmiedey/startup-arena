-- Realistic seed data for Likelyr
-- Uses subqueries for foreign keys to avoid hardcoded UUIDs
-- Safe to re-run (uses ON CONFLICT DO NOTHING on unique email)

BEGIN;

-- ============================================================
-- USERS — 28 realistic founders
-- ============================================================
INSERT INTO users (name, email, image, is_bot) VALUES
('Maya Rodriguez', 'maya.r@protonmail.com', 'https://api.dicebear.com/9.x/notionists/svg?seed=maya', TRUE),
('Jake Holloway', 'jake.h@fastmail.com', 'https://api.dicebear.com/9.x/notionists/svg?seed=jakeh', TRUE),
('Aisha Mbeki', 'aisha.m@gmail.com', 'https://api.dicebear.com/9.x/notionists/svg?seed=aisha', TRUE),
('Tomas Guerrero', 'tomas.g@outlook.com', 'https://api.dicebear.com/9.x/notionists/svg?seed=tomas', TRUE),
('Nina Petrov', 'nina.p@protonmail.com', 'https://api.dicebear.com/9.x/notionists/svg?seed=nina', TRUE),
('Marcus Chen', 'mchen@hey.com', 'https://api.dicebear.com/9.x/notionists/svg?seed=marcus', TRUE),
('Priya Sharma', 'priya.s@icloud.com', 'https://api.dicebear.com/9.x/notionists/svg?seed=priya', TRUE),
('Daniel Okafor', 'd.okafor@gmail.com', 'https://api.dicebear.com/9.x/notionists/svg?seed=daniel', TRUE),
('Emma Lindqvist', 'emma.l@yahoo.com', 'https://api.dicebear.com/9.x/notionists/svg?seed=emmal', TRUE),
('Kevin Tran', 'ktran@college.edu', 'https://api.dicebear.com/9.x/notionists/svg?seed=kevint', TRUE),
('Sofia Navarro', 'sofia.nav@protonmail.com', 'https://api.dicebear.com/9.x/notionists/svg?seed=sofian', TRUE),
('Ryan Patterson', 'rpatterson@gmail.com', 'https://api.dicebear.com/9.x/notionists/svg?seed=ryanp', TRUE),
('Lena Hoffmann', 'lena.h@hey.com', 'https://api.dicebear.com/9.x/notionists/svg?seed=lenah', TRUE),
('Raj Mehta', 'raj.m@outlook.com', 'https://api.dicebear.com/9.x/notionists/svg?seed=rajm', TRUE),
('Crystal Washington', 'c.washington@gmail.com', 'https://api.dicebear.com/9.x/notionists/svg?seed=crystal', TRUE),
('Dae-Jung Kim', 'djkim@fastmail.com', 'https://api.dicebear.com/9.x/notionists/svg?seed=daejung', TRUE),
('Olive Martins', 'olive.m@protonmail.com', 'https://api.dicebear.com/9.x/notionists/svg?seed=olive', TRUE),
('Felix Moreau', 'felix.m@gmail.com', 'https://api.dicebear.com/9.x/notionists/svg?seed=felixm', TRUE),
('Anika Desai', 'anika.d@hey.com', 'https://api.dicebear.com/9.x/notionists/svg?seed=anika', TRUE),
('Zach Whitaker', 'zach.w@outlook.com', 'https://api.dicebear.com/9.x/notionists/svg?seed=zachw', TRUE),
('Jamie Osei', 'jamie.osei@gmail.com', 'https://api.dicebear.com/9.x/notionists/svg?seed=jamieo', TRUE),
('Mia Sorensen', 'mia.s@fastmail.com', 'https://api.dicebear.com/9.x/notionists/svg?seed=mias', TRUE),
('DeShawn Mitchell', 'dmitch@college.edu', 'https://api.dicebear.com/9.x/notionists/svg?seed=deshawn', TRUE),
('Yuki Tanaka', 'yuki.t@protonmail.com', 'https://api.dicebear.com/9.x/notionists/svg?seed=yukit', TRUE),
('Gloria Vasquez', 'g.vasquez@hey.com', 'https://api.dicebear.com/9.x/notionists/svg?seed=gloria', TRUE),
('Brian ONeill', 'b.oneill@gmail.com', 'https://api.dicebear.com/9.x/notionists/svg?seed=briano', TRUE),
('Fatima Al-Rashid', 'fatima.ar@outlook.com', 'https://api.dicebear.com/9.x/notionists/svg?seed=fatima', TRUE),
('Sam Erikson', 'sam.e@protonmail.com', 'https://api.dicebear.com/9.x/notionists/svg?seed=same', TRUE)
ON CONFLICT (email) DO NOTHING;

-- ============================================================
-- IDEAS - 30 realistic ideas
-- ============================================================
INSERT INTO ideas (name, pitch, target_customer, problem, revenue_model, category, stage, elo_score, wins, losses, user_id, created_at) VALUES
('LeadSniper', 'AI outreach tool that finds local businesses with outdated websites and drafts personalized cold emails automatically.', 'Small agency owners and freelancers', 'Finding qualified leads takes hours of manual research most freelancers cant afford to waste.', 'SaaS $49/mo per seat', 'AI', 'MVP', 1284, 5, 1, (SELECT id FROM users WHERE email='mchen@hey.com'), NOW() - INTERVAL '18 days'),
('InboxZero', 'AI email copilot that categorizes your inbox, drafts contextual replies, and auto-unsubscribes from noise.', 'Busy founders and product managers', 'Important emails get buried under newsletters and CC spam. You waste 3+ hours daily just triaging.', '$12/mo personal, $29/mo pro', 'AI', 'Launched', 1156, 3, 0, (SELECT id FROM users WHERE email='priya.s@icloud.com'), NOW() - INTERVAL '16 days'),
('FormWiz', 'Upload any PDF form and get a pre-fillable web version with AI autocomplete that learns your common answers.', 'HR coordinators and real estate agents', 'Re-entering the same name, address, and SSN across 30 different PDF forms per client is soul-crushing.', '$19/mo per user', 'AI', 'Revenue', 1234, 2, 0, (SELECT id FROM users WHERE email='emma.l@yahoo.com'), NOW() - INTERVAL '15 days'),
('RepBridge', 'AI that listens to sales calls, extracts objections, and generates personalized follow-up email sequences.', 'B2B SaaS sales teams', 'Reps forget 70% of call details by the time they write follow-ups. Generic follow-ups kill close rates.', '$89/mo per rep, enterprise custom', 'AI', 'MVP', 1071, 1, 1, (SELECT id FROM users WHERE email='raj.m@outlook.com'), NOW() - INTERVAL '10 days'),
('ContractLens', 'AI contract analyzer that flags risky clauses, summarizes obligations, and suggests negotiation points.', 'Founders without in-house legal', 'Founders sign contracts they dont fully understand because lawyer fees are $400/hr and deal velocity wont wait.', '$29/mo for 5 contracts, $99/mo unlimited', 'AI', 'Idea', 998, 0, 1, (SELECT id FROM users WHERE email='c.washington@gmail.com'), NOW() - INTERVAL '6 days'),
('ChurnShield', 'Analytics dashboard that predicts which customers will cancel next month and auto-triggers personalized retention flows.', 'SaaS companies with over $10k MRR', 'You dont know a customer is leaving until they already have. By then its too late.', 'SaaS $199/mo for up to 10k users', 'SaaS', 'Launched', 1190, 2, 1, (SELECT id FROM users WHERE email='lena.h@hey.com'), NOW() - INTERVAL '14 days'),
('PingBoard', 'Status page and incident comms tool that auto-detects downtime from your monitoring stack and notifies customers.', 'Dev teams running production APIs', 'Customers find out about downtime on Twitter before your team does. That destroys trust.', '$0-500 users free, $49/mo pro', 'SaaS', 'MVP', 1045, 1, 1, (SELECT id FROM users WHERE email='anika.d@hey.com'), NOW() - INTERVAL '8 days'),
('TimeDeck', 'Time tracker built for agencies with automatic project switching, client billing, and one-click invoice export.', 'Creative agencies and consultancies', 'Timesheets are always wrong because nobody remembers what they worked on 4 hours ago.', '$12/user/mo', 'SaaS', 'Idea', 965, 0, 1, (SELECT id FROM users WHERE email='felix.m@gmail.com'), NOW() - INTERVAL '4 days'),
('NeighborFit', 'Neighborhood matching platform that ranks areas by your actual lifestyle — walkability, nightlife, school quality, commute.', 'Apartment renters relocating to new cities', 'You pick apartments based on photos and price. But the neighborhood makes or breaks your life.', 'Referral fees from property managers and brokers', 'Local Business', 'MVP', 1043, 0, 2, (SELECT id FROM users WHERE email='nina.p@protonmail.com'), NOW() - INTERVAL '12 days'),
('TableSpark', 'Markdown-based menu builder for restaurants with instant QR code generation and Google Business integration.', 'Independent restaurant owners', 'Restaurants still upload JPEGs of their menu as their website. Updating prices means calling the web guy.', '$9/mo per location', 'Local Business', 'Idea', 978, 0, 1, (SELECT id FROM users WHERE email='tomas.g@outlook.com'), NOW() - INTERVAL '5 days'),
('GymPulse', 'Waitlist management and class scheduling for boutique gyms with automated SMS reminders and no-show tracking.', 'Boutique fitness studio owners', 'Classes are either packed or empty. Manual Instagram waitlists are chaos. No-shows waste 20% of spots.', '$29/mo per studio', 'Local Business', 'MVP', 1021, 0, 1, (SELECT id FROM users WHERE email='aisha.m@gmail.com'), NOW() - INTERVAL '9 days'),
('ClipArena', 'Short-form video battleground where creators submit clips on a theme and viewers vote on the best edit.', 'Content creators and social media managers', 'Creators need feedback on what editing style performs before spending 6 hours on a reel that flops.', 'Freemium, pro analytics at $19/mo', 'Consumer App', 'Idea', 1192, 2, 0, (SELECT id FROM users WHERE email='jake.h@fastmail.com'), NOW() - INTERVAL '17 days'),
('SplitMate', 'Group expense splitter that connects to Venmo and auto-calculates who owes whom, including shared subscriptions.', 'Friend groups, roommates, and trip planners', 'Every group trip ends with someone sending a spreadsheets of who owes what. That person is always resentful.', 'Free, premium at $2.99/mo', 'Consumer App', 'Launched', 1102, 1, 1, (SELECT id FROM users WHERE email='jamie.osei@gmail.com'), NOW() - INTERVAL '11 days'),
('LocalBite', 'Restaurant discovery app powered by food critic data, not tourist reviews. Highlights hidden gems locals actually eat at.', 'Foodies and travelers who hate tourist-trap restaurants', 'Yelp is gamed by owners. Google Maps shows whats popular, not whats actually good.', 'Restaurant promotion fees and premium listings', 'Consumer App', 'Idea', 958, 0, 1, (SELECT id FROM users WHERE email='felix.m@gmail.com'), NOW() - INTERVAL '3 days'),
('GigSwap', 'Marketplace where freelancers trade overflow work with vetted peers they trust, not anonymous randos on Upwork.', 'Freelancers and small agency owners', 'When youre overbooked you either turn down work or risk burning out. Theres no in-between.', '8% transaction fee on swapped gigs', 'Marketplace', 'MVP', 1089, 1, 1, (SELECT id FROM users WHERE email='mchen@hey.com'), NOW() - INTERVAL '13 days'),
('KitDrop', 'Marketplace for renting specialized equipment — camera lenses, projectors, DJ rigs — from local owners.', 'Event photographers and indie filmmakers', 'You need a $2K lens for one shoot. Buying it is insane. Current rental sites take 5 days to ship.', '12% commission on each rental', 'Marketplace', 'Idea', 1003, 0, 1, (SELECT id FROM users WHERE email='ktran@college.edu'), NOW() - INTERVAL '7 days'),
('ScriptShot', 'Chrome extension that summarizes YouTube videos into key bullet points with clickable timestamps.', 'YouTube power learners and researchers', 'You dont need to watch a 45-minute video for 3 key insights. But scrubbing through is painful.', 'Free tier + $5/mo unlimited', 'Chrome Extension', 'Revenue', 1211, 3, 0, (SELECT id FROM users WHERE email='mchen@hey.com'), NOW() - INTERVAL '16 days'),
('PriceHawk', 'Chrome extension that auto-applies coupon codes and tracks price drops on any product page.', 'Online shoppers who hate leaving money on the table', 'You buy something and 3 days later its 30% off. Or you spend 20 mins Googling coupon codes that dont work.', 'Affiliate commission + $3.99/mo premium alerts', 'Chrome Extension', 'MVP', 1068, 1, 1, (SELECT id FROM users WHERE email='dmitch@college.edu'), NOW() - INTERVAL '9 days'),
('TutorCredits', 'Peer-to-peer homework help platform where students earn credits by answering questions and spend them to get help.', 'College students grinding through STEM classes', 'Tutors cost $40/hr. Your classmate already took the class and will explain it for free credits.', '10% commission on purchased credit packs', 'Education', 'Idea', 1034, 0, 1, (SELECT id FROM users WHERE email='ktran@college.edu'), NOW() - INTERVAL '7 days'),
('SkillSprint', '7-day micro-courses where you build and ship a real project every week instead of watching 40hr video courses.', 'Self-taught developers who never finish courses', 'Nobody finishes online courses. The completion rate is 3%. You learn by building, not by watching.', '$29 per sprint, unlimited $19/mo', 'Education', 'MVP', 1056, 1, 1, (SELECT id FROM users WHERE email='anika.d@hey.com'), NOW() - INTERVAL '8 days'),
('MerchForge', 'Crowdsourced merch platform where fans vote on designs and winning designs get printed on demand.', 'YouTubers, Twitch streamers, podcasters', 'Creators want merch but cant afford inventory risk. And their audience has better design ideas than they do.', '15% cut on each sale', 'Creator Tools', 'MVP', 1108, 1, 1, (SELECT id FROM users WHERE email='priya.s@icloud.com'), NOW() - INTERVAL '11 days'),
('CaptionWave', 'AI that generates captions, hashtags, and post variations from a single video clip for every platform.', 'Social media managers pulling 60-hour weeks', 'You spend 2 hours writing captions for a 15-second video thatll be relevant for 6 hours.', '$24/mo creator, $79/mo agency', 'Creator Tools', 'Launched', 1141, 2, 0, (SELECT id FROM users WHERE email='jamie.osei@gmail.com'), NOW() - INTERVAL '13 days'),
('LayoutLab', 'Drag-and-drop thumbnail and social graphic builder with AI background removal and text overlays.', 'YouTubers and TikTokers with no design skills', 'Click-through rate is 80% thumbnail, but youre making them in Canva using templates everyone else uses too.', 'Free tier, $9/mo pro', 'Creator Tools', 'Idea', 987, 0, 1, (SELECT id FROM users WHERE email='ktran@college.edu'), NOW() - INTERVAL '3 days'),
('WildCard', 'Monthly surprise box themed around whatever the internet was obsessed about — memes, trends, viral moments.', 'Gen Z and millennials who want surprise over predictability', 'Every subscription box becomes boring after month 3. The whole point is surprise.', '$34.99/mo physical, $5/mo digital', 'E-commerce', 'Idea', 942, 0, 1, (SELECT id FROM users WHERE email='rpatterson@gmail.com'), NOW() - INTERVAL '4 days'),
('DropKit', 'All-in-one dropshipping toolkit that finds trending products, generates product pages, and manages fulfillment.', 'First-time e-commerce entrepreneurs', 'You want to start selling online but Alibaba is overwhelming, Shopify takes weeks to set up, and you dont know what sells.', '$49/mo, 3% transaction fee', 'E-commerce', 'MVP', 1015, 0, 1, (SELECT id FROM users WHERE email='mia.s@fastmail.com'), NOW() - INTERVAL '6 days'),
('GhostKitchen', 'Cloud kitchen marketplace where home cooks sell meals from their own kitchen to neighbors via subscription.', 'Home cooks who want to monetize and busy professionals wanting home-cooked food', 'Restaurant food is overpriced and microwave dinners are depressing. Someone on your block makes amazing lasagna.', '15% commission + delivery logistics fee', 'Wild Ideas', 'Idea', 967, 0, 1, (SELECT id FROM users WHERE email='yuki.t@protonmail.com'), NOW() - INTERVAL '2 days'),
('DreamLog', 'Dream journal app that uses AI to find patterns in your dreams and reveals recurring themes over time.', 'People interested in self-reflection and lucid dreaming', 'You forget 95% of your dreams within 5 minutes of waking. No app makes journaling them easy or insightful.', 'Free with $4.99/mo AI analysis tier', 'Wild Ideas', 'Idea', 912, 0, 1, (SELECT id FROM users WHERE email='olive.m@protonmail.com'), NOW() - INTERVAL '1 day'),
('RentAFriend VR', 'Virtual hangout platform where you can rent someone to explore VR worlds, play games, or just chat in immersive 3D.', 'Lonely people and VR headset owners wanting social experiences', 'VR headsets collect dust because theres nothing social to do. Existing metaverses are ghost towns with ads.', '$15/hr sessions, 20% platform cut', 'Wild Ideas', 'Idea', 934, 0, 0, (SELECT id FROM users WHERE email='zach.w@outlook.com'), NOW() - INTERVAL '2 days'),
('ParkingPirate', 'App that lets people rent out their driveway as a parking spot during events and peak times.', 'Urban homeowners near venues and desperate drivers circling the block', 'You spend 20 minutes circling for parking. Meanwhile someones empty driveway is 50 feet from the venue.', '$2/hr booking, 15% commission', 'Local Business', 'Idea', 1058, 1, 1, (SELECT id FROM users WHERE email='c.washington@gmail.com'), NOW() - INTERVAL '8 days'),
('NomadCV', 'Platform that turns your GitHub, Figma, and LinkedIn into a single verified portfolio with credential badges.', 'Remote-first developers and designers applying globally', 'Resumes are lies. Portfolios are scattered across 5 platforms. Recruiters cant verify anything fast.', '$0 free tier, $14/mo verified + custom domain', 'SaaS', 'Idea', 993, 0, 0, (SELECT id FROM users WHERE email='anika.d@hey.com'), NOW() - INTERVAL '3 days');

-- ============================================================
-- BATTLES — 15 matchups
-- ============================================================
INSERT INTO battles (idea_a_id, idea_b_id, created_at) VALUES
((SELECT id FROM ideas WHERE name='LeadSniper'), (SELECT id FROM ideas WHERE name='TutorCredits'), NOW() - INTERVAL '16 days'),
((SELECT id FROM ideas WHERE name='InboxZero'), (SELECT id FROM ideas WHERE name='NeighborFit'), NOW() - INTERVAL '15 days'),
((SELECT id FROM ideas WHERE name='ChurnShield'), (SELECT id FROM ideas WHERE name='SplitMate'), NOW() - INTERVAL '14 days'),
((SELECT id FROM ideas WHERE name='ScriptShot'), (SELECT id FROM ideas WHERE name='WildCard'), NOW() - INTERVAL '13 days'),
((SELECT id FROM ideas WHERE name='MerchForge'), (SELECT id FROM ideas WHERE name='GymPulse'), NOW() - INTERVAL '12 days'),
((SELECT id FROM ideas WHERE name='FormWiz'), (SELECT id FROM ideas WHERE name='PingBoard'), NOW() - INTERVAL '11 days'),
((SELECT id FROM ideas WHERE name='CaptionWave'), (SELECT id FROM ideas WHERE name='LocalBite'), NOW() - INTERVAL '10 days'),
((SELECT id FROM ideas WHERE name='GigSwap'), (SELECT id FROM ideas WHERE name='SkillSprint'), NOW() - INTERVAL '9 days'),
((SELECT id FROM ideas WHERE name='PriceHawk'), (SELECT id FROM ideas WHERE name='DropKit'), NOW() - INTERVAL '8 days'),
((SELECT id FROM ideas WHERE name='RepBridge'), (SELECT id FROM ideas WHERE name='ParkingPirate'), NOW() - INTERVAL '7 days'),
((SELECT id FROM ideas WHERE name='ContractLens'), (SELECT id FROM ideas WHERE name='LayoutLab'), NOW() - INTERVAL '6 days'),
((SELECT id FROM ideas WHERE name='ClipArena'), (SELECT id FROM ideas WHERE name='TimeDeck'), NOW() - INTERVAL '5 days'),
((SELECT id FROM ideas WHERE name='TableSpark'), (SELECT id FROM ideas WHERE name='GhostKitchen'), NOW() - INTERVAL '4 days'),
((SELECT id FROM ideas WHERE name='KitDrop'), (SELECT id FROM ideas WHERE name='DreamLog'), NOW() - INTERVAL '3 days'),
((SELECT id FROM ideas WHERE name='RentAFriend VR'), (SELECT id FROM ideas WHERE name='NomadCV'), NOW() - INTERVAL '2 days');

-- ============================================================
-- VOTES — realistic voting patterns
-- ============================================================
INSERT INTO votes (battle_id, user_id, winner_id, reason, created_at) VALUES
-- Battle 1: LeadSniper vs TutorCredits
((SELECT id FROM battles WHERE idea_a_id=(SELECT id FROM ideas WHERE name='TutorCredits') OR idea_b_id=(SELECT id FROM ideas WHERE name='TutorCredits') LIMIT 1), (SELECT id FROM users WHERE email='maya.r@protonmail.com'), (SELECT id FROM ideas WHERE name='LeadSniper'), 'AI outreach beats peer credits for making real money', NOW() - INTERVAL '15 days 20h'),
((SELECT id FROM battles WHERE idea_a_id=(SELECT id FROM ideas WHERE name='TutorCredits') OR idea_b_id=(SELECT id FROM ideas WHERE name='TutorCredits') LIMIT 1), (SELECT id FROM users WHERE email='aisha.m@gmail.com'), (SELECT id FROM ideas WHERE name='TutorCredits'), 'students need this way more than another AI tool', NOW() - INTERVAL '15 days 16h'),
((SELECT id FROM battles WHERE idea_a_id=(SELECT id FROM ideas WHERE name='TutorCredits') OR idea_b_id=(SELECT id FROM ideas WHERE name='TutorCredits') LIMIT 1), (SELECT id FROM users WHERE email='d.okafor@gmail.com'), (SELECT id FROM ideas WHERE name='LeadSniper'), 'cold outreach is proven revenue', NOW() - INTERVAL '15 days 14h'),
((SELECT id FROM battles WHERE idea_a_id=(SELECT id FROM ideas WHERE name='TutorCredits') OR idea_b_id=(SELECT id FROM ideas WHERE name='TutorCredits') LIMIT 1), (SELECT id FROM users WHERE email='sofia.nav@protonmail.com'), (SELECT id FROM ideas WHERE name='LeadSniper'), NULL, NOW() - INTERVAL '15 days 12h'),
((SELECT id FROM battles WHERE idea_a_id=(SELECT id FROM ideas WHERE name='TutorCredits') OR idea_b_id=(SELECT id FROM ideas WHERE name='TutorCredits') LIMIT 1), (SELECT id FROM users WHERE email='raj.m@outlook.com'), (SELECT id FROM ideas WHERE name='LeadSniper'), 'automation that scales wins every time', NOW() - INTERVAL '15 days 10h'),
((SELECT id FROM battles WHERE idea_a_id=(SELECT id FROM ideas WHERE name='TutorCredits') OR idea_b_id=(SELECT id FROM ideas WHERE name='TutorCredits') LIMIT 1), (SELECT id FROM users WHERE email='olive.m@protonmail.com'), (SELECT id FROM ideas WHERE name='TutorCredits'), 'education impact > B2B spam tools', NOW() - INTERVAL '15 days 8h'),
((SELECT id FROM battles WHERE idea_a_id=(SELECT id FROM ideas WHERE name='TutorCredits') OR idea_b_id=(SELECT id FROM ideas WHERE name='TutorCredits') LIMIT 1), (SELECT id FROM users WHERE email='zach.w@outlook.com'), (SELECT id FROM ideas WHERE name='LeadSniper'), NULL, NOW() - INTERVAL '15 days 6h'),

-- Battle 2: InboxZero vs NeighborFit
((SELECT id FROM battles WHERE idea_a_id=(SELECT id FROM ideas WHERE name='NeighborFit') OR idea_b_id=(SELECT id FROM ideas WHERE name='NeighborFit') LIMIT 1), (SELECT id FROM users WHERE email='jake.h@fastmail.com'), (SELECT id FROM ideas WHERE name='InboxZero'), 'email is universal pain, neighborhood matching is too niche', NOW() - INTERVAL '14 days 20h'),
((SELECT id FROM battles WHERE idea_a_id=(SELECT id FROM ideas WHERE name='NeighborFit') OR idea_b_id=(SELECT id FROM ideas WHERE name='NeighborFit') LIMIT 1), (SELECT id FROM users WHERE email='tomas.g@outlook.com'), (SELECT id FROM ideas WHERE name='InboxZero'), NULL, NOW() - INTERVAL '14 days 18h'),
((SELECT id FROM battles WHERE idea_a_id=(SELECT id FROM ideas WHERE name='NeighborFit') OR idea_b_id=(SELECT id FROM ideas WHERE name='NeighborFit') LIMIT 1), (SELECT id FROM users WHERE email='priya.s@icloud.com'), (SELECT id FROM ideas WHERE name='NeighborFit'), 'location specificity gives a real moat', NOW() - INTERVAL '14 days 16h'),
((SELECT id FROM battles WHERE idea_a_id=(SELECT id FROM ideas WHERE name='NeighborFit') OR idea_b_id=(SELECT id FROM ideas WHERE name='NeighborFit') LIMIT 1), (SELECT id FROM users WHERE email='ktran@college.edu'), (SELECT id FROM ideas WHERE name='InboxZero'), 'would actually pay for this today', NOW() - INTERVAL '14 days 14h'),
((SELECT id FROM battles WHERE idea_a_id=(SELECT id FROM ideas WHERE name='NeighborFit') OR idea_b_id=(SELECT id FROM ideas WHERE name='NeighborFit') LIMIT 1), (SELECT id FROM users WHERE email='lena.h@hey.com'), (SELECT id FROM ideas WHERE name='InboxZero'), 'TAM is so much bigger for email', NOW() - INTERVAL '14 days 12h'),
((SELECT id FROM battles WHERE idea_a_id=(SELECT id FROM ideas WHERE name='NeighborFit') OR idea_b_id=(SELECT id FROM ideas WHERE name='NeighborFit') LIMIT 1), (SELECT id FROM users WHERE email='djkim@fastmail.com'), (SELECT id FROM ideas WHERE name='NeighborFit'), 'less competition in prop tech', NOW() - INTERVAL '14 days 10h'),
((SELECT id FROM battles WHERE idea_a_id=(SELECT id FROM ideas WHERE name='NeighborFit') OR idea_b_id=(SELECT id FROM ideas WHERE name='NeighborFit') LIMIT 1), (SELECT id FROM users WHERE email='mia.s@fastmail.com'), (SELECT id FROM ideas WHERE name='InboxZero'), NULL, NOW() - INTERVAL '14 days 8h'),

-- Battle 3: ChurnShield vs SplitMate
((SELECT id FROM battles WHERE idea_a_id=(SELECT id FROM ideas WHERE name='SplitMate') OR idea_b_id=(SELECT id FROM ideas WHERE name='SplitMate') LIMIT 1), (SELECT id FROM users WHERE email='maya.r@protonmail.com'), (SELECT id FROM ideas WHERE name='ChurnShield'), 'retention is the 1 problem for any sub business', NOW() - INTERVAL '13 days 20h'),
((SELECT id FROM battles WHERE idea_a_id=(SELECT id FROM ideas WHERE name='SplitMate') OR idea_b_id=(SELECT id FROM ideas WHERE name='SplitMate') LIMIT 1), (SELECT id FROM users WHERE email='aisha.m@gmail.com'), (SELECT id FROM ideas WHERE name='SplitMate'), 'splitwise already exists but sucks', NOW() - INTERVAL '13 days 18h'),
((SELECT id FROM battles WHERE idea_a_id=(SELECT id FROM ideas WHERE name='SplitMate') OR idea_b_id=(SELECT id FROM ideas WHERE name='SplitMate') LIMIT 1), (SELECT id FROM users WHERE email='mchen@hey.com'), (SELECT id FROM ideas WHERE name='ChurnShield'), 'B2B = higher LTV per customer', NOW() - INTERVAL '13 days 16h'),
((SELECT id FROM battles WHERE idea_a_id=(SELECT id FROM ideas WHERE name='SplitMate') OR idea_b_id=(SELECT id FROM ideas WHERE name='SplitMate') LIMIT 1), (SELECT id FROM users WHERE email='emma.l@yahoo.com'), (SELECT id FROM ideas WHERE name='SplitMate'), 'consumer apps spread faster', NOW() - INTERVAL '13 days 14h'),
((SELECT id FROM battles WHERE idea_a_id=(SELECT id FROM ideas WHERE name='SplitMate') OR idea_b_id=(SELECT id FROM ideas WHERE name='SplitMate') LIMIT 1), (SELECT id FROM users WHERE email='c.washington@gmail.com'), (SELECT id FROM ideas WHERE name='ChurnShield'), '199/mo vs 2.99/mo clear winner on revenue', NOW() - INTERVAL '13 days 12h'),
((SELECT id FROM battles WHERE idea_a_id=(SELECT id FROM ideas WHERE name='SplitMate') OR idea_b_id=(SELECT id FROM ideas WHERE name='SplitMate') LIMIT 1), (SELECT id FROM users WHERE email='jamie.osei@gmail.com'), (SELECT id FROM ideas WHERE name='SplitMate'), 'everyone needs this not just SaaS companies', NOW() - INTERVAL '13 days 8h'),

-- Battle 4: ScriptShot vs WildCard
((SELECT id FROM battles WHERE idea_a_id=(SELECT id FROM ideas WHERE name='WildCard') OR idea_b_id=(SELECT id FROM ideas WHERE name='WildCard') LIMIT 1), (SELECT id FROM users WHERE email='jake.h@fastmail.com'), (SELECT id FROM ideas WHERE name='ScriptShot'), 'solves a real problem I have daily', NOW() - INTERVAL '12 days 20h'),
((SELECT id FROM battles WHERE idea_a_id=(SELECT id FROM ideas WHERE name='WildCard') OR idea_b_id=(SELECT id FROM ideas WHERE name='WildCard') LIMIT 1), (SELECT id FROM users WHERE email='nina.p@protonmail.com'), (SELECT id FROM ideas WHERE name='WildCard'), 'the surprise angle is differentiated', NOW() - INTERVAL '12 days 18h'),
((SELECT id FROM battles WHERE idea_a_id=(SELECT id FROM ideas WHERE name='WildCard') OR idea_b_id=(SELECT id FROM ideas WHERE name='WildCard') LIMIT 1), (SELECT id FROM users WHERE email='d.okafor@gmail.com'), (SELECT id FROM ideas WHERE name='ScriptShot'), 'chrome extensions have insane distribution', NOW() - INTERVAL '12 days 16h'),
((SELECT id FROM battles WHERE idea_a_id=(SELECT id FROM ideas WHERE name='WildCard') OR idea_b_id=(SELECT id FROM ideas WHERE name='WildCard') LIMIT 1), (SELECT id FROM users WHERE email='rpatterson@gmail.com'), (SELECT id FROM ideas WHERE name='ScriptShot'), NULL, NOW() - INTERVAL '12 days 14h'),
((SELECT id FROM battles WHERE idea_a_id=(SELECT id FROM ideas WHERE name='WildCard') OR idea_b_id=(SELECT id FROM ideas WHERE name='WildCard') LIMIT 1), (SELECT id FROM users WHERE email='felix.m@gmail.com'), (SELECT id FROM ideas WHERE name='ScriptShot'), 'I would literally install this right now', NOW() - INTERVAL '12 days 12h'),
((SELECT id FROM battles WHERE idea_a_id=(SELECT id FROM ideas WHERE name='WildCard') OR idea_b_id=(SELECT id FROM ideas WHERE name='WildCard') LIMIT 1), (SELECT id FROM users WHERE email='yuki.t@protonmail.com'), (SELECT id FROM ideas WHERE name='ScriptShot'), 'utility > novelty', NOW() - INTERVAL '12 days 8h'),

-- Battle 5: MerchForge vs GymPulse
((SELECT id FROM battles WHERE idea_a_id=(SELECT id FROM ideas WHERE name='GymPulse') OR idea_b_id=(SELECT id FROM ideas WHERE name='GymPulse') LIMIT 1), (SELECT id FROM users WHERE email='tomas.g@outlook.com'), (SELECT id FROM ideas WHERE name='MerchForge'), 'creator economy is massive right now', NOW() - INTERVAL '11 days 20h'),
((SELECT id FROM battles WHERE idea_a_id=(SELECT id FROM ideas WHERE name='GymPulse') OR idea_b_id=(SELECT id FROM ideas WHERE name='GymPulse') LIMIT 1), (SELECT id FROM users WHERE email='priya.s@icloud.com'), (SELECT id FROM ideas WHERE name='GymPulse'), 'boutique fitness is booming post-covid', NOW() - INTERVAL '11 days 18h'),
((SELECT id FROM battles WHERE idea_a_id=(SELECT id FROM ideas WHERE name='GymPulse') OR idea_b_id=(SELECT id FROM ideas WHERE name='GymPulse') LIMIT 1), (SELECT id FROM users WHERE email='sofia.nav@protonmail.com'), (SELECT id FROM ideas WHERE name='MerchForge'), NULL, NOW() - INTERVAL '11 days 16h'),
((SELECT id FROM battles WHERE idea_a_id=(SELECT id FROM ideas WHERE name='GymPulse') OR idea_b_id=(SELECT id FROM ideas WHERE name='GymPulse') LIMIT 1), (SELECT id FROM users WHERE email='lena.h@hey.com'), (SELECT id FROM ideas WHERE name='MerchForge'), 'no inventory risk is a huge advantage', NOW() - INTERVAL '11 days 14h'),
((SELECT id FROM battles WHERE idea_a_id=(SELECT id FROM ideas WHERE name='GymPulse') OR idea_b_id=(SELECT id FROM ideas WHERE name='GymPulse') LIMIT 1), (SELECT id FROM users WHERE email='jamie.osei@gmail.com'), (SELECT id FROM ideas WHERE name='MerchForge'), 'as a creator I want this', NOW() - INTERVAL '11 days 10h'),

-- Battle 6: FormWiz vs PingBoard
((SELECT id FROM battles WHERE idea_a_id=(SELECT id FROM ideas WHERE name='PingBoard') OR idea_b_id=(SELECT id FROM ideas WHERE name='PingBoard') LIMIT 1), (SELECT id FROM users WHERE email='aisha.m@gmail.com'), (SELECT id FROM ideas WHERE name='FormWiz'), 'form filling is pain I live every week', NOW() - INTERVAL '10 days 20h'),
((SELECT id FROM battles WHERE idea_a_id=(SELECT id FROM ideas WHERE name='PingBoard') OR idea_b_id=(SELECT id FROM ideas WHERE name='PingBoard') LIMIT 1), (SELECT id FROM users WHERE email='mchen@hey.com'), (SELECT id FROM ideas WHERE name='FormWiz'), 'AI that actually saves measurable time', NOW() - INTERVAL '10 days 18h'),
((SELECT id FROM battles WHERE idea_a_id=(SELECT id FROM ideas WHERE name='PingBoard') OR idea_b_id=(SELECT id FROM ideas WHERE name='PingBoard') LIMIT 1), (SELECT id FROM users WHERE email='emma.l@yahoo.com'), (SELECT id FROM ideas WHERE name='PingBoard'), 'status pages have clearer monetization path', NOW() - INTERVAL '10 days 16h'),
((SELECT id FROM battles WHERE idea_a_id=(SELECT id FROM ideas WHERE name='PingBoard') OR idea_b_id=(SELECT id FROM ideas WHERE name='PingBoard') LIMIT 1), (SELECT id FROM users WHERE email='raj.m@outlook.com'), (SELECT id FROM ideas WHERE name='FormWiz'), NULL, NOW() - INTERVAL '10 days 14h'),
((SELECT id FROM battles WHERE idea_a_id=(SELECT id FROM ideas WHERE name='PingBoard') OR idea_b_id=(SELECT id FROM ideas WHERE name='PingBoard') LIMIT 1), (SELECT id FROM users WHERE email='g.vasquez@hey.com'), (SELECT id FROM ideas WHERE name='FormWiz'), 'bigger TAM not just devs', NOW() - INTERVAL '10 days 10h'),

-- Battle 7: CaptionWave vs LocalBite
((SELECT id FROM battles WHERE idea_a_id=(SELECT id FROM ideas WHERE name='LocalBite') OR idea_b_id=(SELECT id FROM ideas WHERE name='LocalBite') LIMIT 1), (SELECT id FROM users WHERE email='maya.r@protonmail.com'), (SELECT id FROM ideas WHERE name='CaptionWave'), 'creator tools are hot and this saves real hours', NOW() - INTERVAL '9 days 20h'),
((SELECT id FROM battles WHERE idea_a_id=(SELECT id FROM ideas WHERE name='LocalBite') OR idea_b_id=(SELECT id FROM ideas WHERE name='LocalBite') LIMIT 1), (SELECT id FROM users WHERE email='d.okafor@gmail.com'), (SELECT id FROM ideas WHERE name='LocalBite'), 'restaurant discovery isnt solved well yet', NOW() - INTERVAL '9 days 18h'),
((SELECT id FROM battles WHERE idea_a_id=(SELECT id FROM ideas WHERE name='LocalBite') OR idea_b_id=(SELECT id FROM ideas WHERE name='LocalBite') LIMIT 1), (SELECT id FROM users WHERE email='ktran@college.edu'), (SELECT id FROM ideas WHERE name='CaptionWave'), NULL, NOW() - INTERVAL '9 days 16h'),
((SELECT id FROM battles WHERE idea_a_id=(SELECT id FROM ideas WHERE name='LocalBite') OR idea_b_id=(SELECT id FROM ideas WHERE name='LocalBite') LIMIT 1), (SELECT id FROM users WHERE email='c.washington@gmail.com'), (SELECT id FROM ideas WHERE name='CaptionWave'), 'social media is a daily pain for every business', NOW() - INTERVAL '9 days 14h'),
((SELECT id FROM battles WHERE idea_a_id=(SELECT id FROM ideas WHERE name='LocalBite') OR idea_b_id=(SELECT id FROM ideas WHERE name='LocalBite') LIMIT 1), (SELECT id FROM users WHERE email='mia.s@fastmail.com'), (SELECT id FROM ideas WHERE name='CaptionWave'), 'I built something similar and people pay for it', NOW() - INTERVAL '9 days 12h'),

-- Battle 8: GigSwap vs SkillSprint
((SELECT id FROM battles WHERE idea_a_id=(SELECT id FROM ideas WHERE name='SkillSprint') OR idea_b_id=(SELECT id FROM ideas WHERE name='SkillSprint') LIMIT 1), (SELECT id FROM users WHERE email='jake.h@fastmail.com'), (SELECT id FROM ideas WHERE name='GigSwap'), 'freelancer pain is huge and underserved', NOW() - INTERVAL '8 days 20h'),
((SELECT id FROM battles WHERE idea_a_id=(SELECT id FROM ideas WHERE name='SkillSprint') OR idea_b_id=(SELECT id FROM ideas WHERE name='SkillSprint') LIMIT 1), (SELECT id FROM users WHERE email='nina.p@protonmail.com'), (SELECT id FROM ideas WHERE name='SkillSprint'), 'courses dont work project-based is the future', NOW() - INTERVAL '8 days 18h'),
((SELECT id FROM battles WHERE idea_a_id=(SELECT id FROM ideas WHERE name='SkillSprint') OR idea_b_id=(SELECT id FROM ideas WHERE name='SkillSprint') LIMIT 1), (SELECT id FROM users WHERE email='sofia.nav@protonmail.com'), (SELECT id FROM ideas WHERE name='GigSwap'), NULL, NOW() - INTERVAL '8 days 16h'),
((SELECT id FROM battles WHERE idea_a_id=(SELECT id FROM ideas WHERE name='SkillSprint') OR idea_b_id=(SELECT id FROM ideas WHERE name='SkillSprint') LIMIT 1), (SELECT id FROM users WHERE email='lena.h@hey.com'), (SELECT id FROM ideas WHERE name='GigSwap'), '8% commission on real money changing hands', NOW() - INTERVAL '8 days 14h'),
((SELECT id FROM battles WHERE idea_a_id=(SELECT id FROM ideas WHERE name='SkillSprint') OR idea_b_id=(SELECT id FROM ideas WHERE name='SkillSprint') LIMIT 1), (SELECT id FROM users WHERE email='anika.d@hey.com'), (SELECT id FROM ideas WHERE name='SkillSprint'), 'education needs disruption badly', NOW() - INTERVAL '8 days 12h'),
((SELECT id FROM battles WHERE idea_a_id=(SELECT id FROM ideas WHERE name='SkillSprint') OR idea_b_id=(SELECT id FROM ideas WHERE name='SkillSprint') LIMIT 1), (SELECT id FROM users WHERE email='dmitch@college.edu'), (SELECT id FROM ideas WHERE name='SkillSprint'), 'as a self-taught dev this resonates', NOW() - INTERVAL '8 days 10h'),

-- Battle 9: PriceHawk vs DropKit
((SELECT id FROM battles WHERE idea_a_id=(SELECT id FROM ideas WHERE name='DropKit') OR idea_b_id=(SELECT id FROM ideas WHERE name='DropKit') LIMIT 1), (SELECT id FROM users WHERE email='aisha.m@gmail.com'), (SELECT id FROM ideas WHERE name='PriceHawk'), 'I use honey but it barely works on half the sites I visit', NOW() - INTERVAL '7 days 20h'),
((SELECT id FROM battles WHERE idea_a_id=(SELECT id FROM ideas WHERE name='DropKit') OR idea_b_id=(SELECT id FROM ideas WHERE name='DropKit') LIMIT 1), (SELECT id FROM users WHERE email='priya.s@icloud.com'), (SELECT id FROM ideas WHERE name='DropKit'), 'dropshipping still has massive demand', NOW() - INTERVAL '7 days 18h'),
((SELECT id FROM battles WHERE idea_a_id=(SELECT id FROM ideas WHERE name='DropKit') OR idea_b_id=(SELECT id FROM ideas WHERE name='DropKit') LIMIT 1), (SELECT id FROM users WHERE email='rpatterson@gmail.com'), (SELECT id FROM ideas WHERE name='PriceHawk'), NULL, NOW() - INTERVAL '7 days 16h'),
((SELECT id FROM battles WHERE idea_a_id=(SELECT id FROM ideas WHERE name='DropKit') OR idea_b_id=(SELECT id FROM ideas WHERE name='DropKit') LIMIT 1), (SELECT id FROM users WHERE email='djkim@fastmail.com'), (SELECT id FROM ideas WHERE name='DropKit'), 'e-commerce tooling is a proven category', NOW() - INTERVAL '7 days 14h'),
((SELECT id FROM battles WHERE idea_a_id=(SELECT id FROM ideas WHERE name='DropKit') OR idea_b_id=(SELECT id FROM ideas WHERE name='DropKit') LIMIT 1), (SELECT id FROM users WHERE email='zach.w@outlook.com'), (SELECT id FROM ideas WHERE name='PriceHawk'), 'chrome extensions win on distribution', NOW() - INTERVAL '7 days 12h'),

-- Battle 10: RepBridge vs ParkingPirate
((SELECT id FROM battles WHERE idea_a_id=(SELECT id FROM ideas WHERE name='ParkingPirate') OR idea_b_id=(SELECT id FROM ideas WHERE name='ParkingPirate') LIMIT 1), (SELECT id FROM users WHERE email='maya.r@protonmail.com'), (SELECT id FROM ideas WHERE name='RepBridge'), 'B2B sales tools monetize so much better', NOW() - INTERVAL '6 days 20h'),
((SELECT id FROM battles WHERE idea_a_id=(SELECT id FROM ideas WHERE name='ParkingPirate') OR idea_b_id=(SELECT id FROM ideas WHERE name='ParkingPirate') LIMIT 1), (SELECT id FROM users WHERE email='mchen@hey.com'), (SELECT id FROM ideas WHERE name='ParkingPirate'), 'parking is a daily pain point for millions', NOW() - INTERVAL '6 days 18h'),
((SELECT id FROM battles WHERE idea_a_id=(SELECT id FROM ideas WHERE name='ParkingPirate') OR idea_b_id=(SELECT id FROM ideas WHERE name='ParkingPirate') LIMIT 1), (SELECT id FROM users WHERE email='emma.l@yahoo.com'), (SELECT id FROM ideas WHERE name='RepBridge'), NULL, NOW() - INTERVAL '6 days 16h'),
((SELECT id FROM battles WHERE idea_a_id=(SELECT id FROM ideas WHERE name='ParkingPirate') OR idea_b_id=(SELECT id FROM ideas WHERE name='ParkingPirate') LIMIT 1), (SELECT id FROM users WHERE email='c.washington@gmail.com'), (SELECT id FROM ideas WHERE name='ParkingPirate'), 'simple two-sided marketplace proven model', NOW() - INTERVAL '6 days 14h');

-- ============================================================
-- Update battle vote counts and winners from actual votes
-- ============================================================
UPDATE battles SET
  idea_a_votes = (SELECT COUNT(*) FROM votes WHERE votes.battle_id = battles.id AND votes.winner_id = battles.idea_a_id),
  idea_b_votes = (SELECT COUNT(*) FROM votes WHERE votes.battle_id = battles.id AND votes.winner_id = battles.idea_b_id),
  winner_id = CASE
    WHEN (SELECT COUNT(*) FROM votes WHERE votes.battle_id = battles.id AND votes.winner_id = battles.idea_a_id) >
         (SELECT COUNT(*) FROM votes WHERE votes.battle_id = battles.id AND votes.winner_id = battles.idea_b_id)
    THEN battles.idea_a_id
    ELSE battles.idea_b_id
  END;

-- Update idea wins/losses from actual data
UPDATE ideas SET
  wins = (SELECT COUNT(*) FROM battles WHERE battles.winner_id = ideas.id),
  losses = (SELECT COUNT(*) FROM battles
            WHERE (battles.idea_a_id = ideas.id OR battles.idea_b_id = ideas.id)
            AND battles.winner_id != ideas.id);

-- ============================================================
-- Update idea elo scores based on wins/losses
-- ============================================================
UPDATE ideas SET elo_score = 1000 + (wins * 32) - (losses * 24);

-- ============================================================
-- COMMENTS — realistic discussion
-- ============================================================
INSERT INTO comments (idea_id, user_id, body, created_at) VALUES
((SELECT id FROM ideas WHERE name='LeadSniper'), (SELECT id FROM users WHERE email='aisha.m@gmail.com'), 'Cold email tools feel saturated but the local business angle is a genuinely underserved niche. The question is whether small business owners will actually open these emails.', NOW() - INTERVAL '17 days'),
((SELECT id FROM ideas WHERE name='LeadSniper'), (SELECT id FROM users WHERE email='raj.m@outlook.com'), 'I tested something similar last year. The AI-generated personalization genuinely increased response rates by 3x. This could work.', NOW() - INTERVAL '16 days'),
((SELECT id FROM ideas WHERE name='LeadSniper'), (SELECT id FROM users WHERE email='zach.w@outlook.com'), 'The pricing feels low for the value youre delivering. Consider a usage-based tier.', NOW() - INTERVAL '15 days'),
((SELECT id FROM ideas WHERE name='InboxZero'), (SELECT id FROM users WHERE email='ktran@college.edu'), 'Would instantly pay $29/mo for this. My inbox is a war zone.', NOW() - INTERVAL '15 days'),
((SELECT id FROM ideas WHERE name='InboxZero'), (SELECT id FROM users WHERE email='c.washington@gmail.com'), 'Concerned about privacy. How do you handle sensitive emails? Thats the one thing that would stop me.', NOW() - INTERVAL '14 days'),
((SELECT id FROM ideas WHERE name='InboxZero'), (SELECT id FROM users WHERE email='mchen@hey.com'), 'Launched and charging means youve validated this. Respect.', NOW() - INTERVAL '14 days'),
((SELECT id FROM ideas WHERE name='FormWiz'), (SELECT id FROM users WHERE email='emma.l@yahoo.com'), 'As someone in real estate I can confirm this is a 10-hour-per-week problem. The AI autocomplete learning common answers is the killer feature.', NOW() - INTERVAL '14 days'),
((SELECT id FROM ideas WHERE name='FormWiz'), (SELECT id FROM users WHERE email='felix.m@gmail.com'), 'Is this GDPR compliant? EU market for this would be massive.', NOW() - INTERVAL '13 days'),
((SELECT id FROM ideas WHERE name='ClipArena'), (SELECT id FROM users WHERE email='jamie.osei@gmail.com'), 'The gamification angle is what sets this apart from every other creator tool. People love voting on stuff.', NOW() - INTERVAL '16 days'),
((SELECT id FROM ideas WHERE name='ClipArena'), (SELECT id FROM users WHERE email='nina.p@protonmail.com'), 'TikToks algorithm already does this. Why would creators upload here too?', NOW() - INTERVAL '15 days'),
((SELECT id FROM ideas WHERE name='ScriptShot'), (SELECT id FROM users WHERE email='anika.d@hey.com'), 'I built a janky version of this for myself. The demand is real — every knowledge worker watches educational YouTube.', NOW() - INTERVAL '15 days'),
((SELECT id FROM ideas WHERE name='ScriptShot'), (SELECT id FROM users WHERE email='jake.h@fastmail.com'), 'Already paying for YouTube Premium to skip ads. Would absolutely pay extra to skip content too.', NOW() - INTERVAL '14 days'),
((SELECT id FROM ideas WHERE name='ChurnShield'), (SELECT id FROM users WHERE email='lena.h@hey.com'), 'Predicting churn before it happens is the holy grail for SaaS. If the model actually works this prints money.', NOW() - INTERVAL '13 days'),
((SELECT id FROM ideas WHERE name='ChurnShield'), (SELECT id FROM users WHERE email='priya.s@icloud.com'), 'How do you handle false positives? Predicting churn that doesnt happen can be worse than missing it.', NOW() - INTERVAL '13 days'),
((SELECT id FROM ideas WHERE name='MerchForge'), (SELECT id FROM users WHERE email='mia.s@fastmail.com'), 'As a small creator I love no-inventory models. The crowd-voting design angle actually engages my audience.', NOW() - INTERVAL '11 days'),
((SELECT id FROM ideas WHERE name='MerchForge'), (SELECT id FROM users WHERE email='c.washington@gmail.com'), '15% cut is reasonable but you need volume to make it work. How do you plan to acquire creators?', NOW() - INTERVAL '10 days'),
((SELECT id FROM ideas WHERE name='CaptionWave'), (SELECT id FROM users WHERE email='d.okafor@gmail.com'), 'Social media managers will love this. The agency pricing tier suggests you understand the market.', NOW() - INTERVAL '12 days'),
((SELECT id FROM ideas WHERE name='CaptionWave'), (SELECT id FROM users WHERE email='ktran@college.edu'), 'Can it handle different brand voices? Thats the hard part with AI captions.', NOW() - INTERVAL '12 days'),
((SELECT id FROM ideas WHERE name='NeighborFit'), (SELECT id FROM users WHERE email='nina.p@protonmail.com'), 'Moving to a new city and picking a neighborhood based on photos is insane. This actually solves a real problem.', NOW() - INTERVAL '11 days'),
((SELECT id FROM ideas WHERE name='NeighborFit'), (SELECT id FROM users WHERE email='djkim@fastmail.com'), 'Data acquisition is the hard part. Where does the lifestyle data come from?', NOW() - INTERVAL '10 days'),
((SELECT id FROM ideas WHERE name='SplitMate'), (SELECT id FROM users WHERE email='maya.r@protonmail.com'), 'Splitwise exists but it still requires manual entry. Auto-connecting to Venmo is the differentiator here.', NOW() - INTERVAL '10 days'),
((SELECT id FROM ideas WHERE name='SplitMate'), (SELECT id FROM users WHERE email='jamie.osei@gmail.com'), 'The shared subscription splitting feature is genius. Thats actually harder to do manually than trip expenses.', NOW() - INTERVAL '9 days'),
((SELECT id FROM ideas WHERE name='SkillSprint'), (SELECT id FROM users WHERE email='ktran@college.edu'), 'Finally someone addressing the 3% completion rate problem. Building > watching.', NOW() - INTERVAL '8 days'),
((SELECT id FROM ideas WHERE name='GigSwap'), (SELECT id FROM users WHERE email='lena.h@hey.com'), 'The trust element is key. Vetted peers is the only way this works — Upwork feels like the wild west.', NOW() - INTERVAL '9 days'),
((SELECT id FROM ideas WHERE name='ParkingPirate'), (SELECT id FROM users WHERE email='c.washington@gmail.com'), 'Simple two-sided marketplace with clear value prop. Event parking is genuinely painful.', NOW() - INTERVAL '8 days'),
((SELECT id FROM ideas WHERE name='ParkingPirate'), (SELECT id FROM users WHERE email='zach.w@outlook.com'), 'Regulatory nightmare though. Most cities have laws against renting driveway spots.', NOW() - INTERVAL '7 days'),
((SELECT id FROM ideas WHERE name='ContractLens'), (SELECT id FROM users WHERE email='d.okafor@gmail.com'), '$400/hr for a lawyer to review a contract is insane. This is a real pain point.', NOW() - INTERVAL '5 days'),
((SELECT id FROM ideas WHERE name='GhostKitchen'), (SELECT id FROM users WHERE email='yuki.t@protonmail.com'), 'The regulatory hurdles are massive. Cottage food laws vary wildly by state.', NOW() - INTERVAL '2 days'),
((SELECT id FROM ideas WHERE name='GhostKitchen'), (SELECT id FROM users WHERE email='tomas.g@outlook.com'), 'Covid proved people want home-cooked meals delivered. The demand is there.', NOW() - INTERVAL '1 day'),
((SELECT id FROM ideas WHERE name='DreamLog'), (SELECT id FROM users WHERE email='olive.m@protonmail.com'), 'Niche but passionate audience. Dream journalers are extremely dedicated once they start.', NOW() - INTERVAL '1 day');

COMMIT;
