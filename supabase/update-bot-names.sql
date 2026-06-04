-- Update bot predictor names to sound more like real people
-- Safe to run repeatedly

UPDATE users SET name = CASE email
  WHEN 'bot.signal-scout@likelyr.local' THEN 'Riley Jacobs'
  WHEN 'bot.market-maven@likelyr.local' THEN 'Marco Ellis'
  WHEN 'bot.launch-oracle@likelyr.local' THEN 'Chris Roads'
  WHEN 'bot.revenue-radar@likelyr.local' THEN 'Jae Huang'
  WHEN 'bot.crowd-whisperer@likelyr.local' THEN 'Nadia Petrov'
  WHEN 'bot.moat-mapper@likelyr.local' THEN 'Trevor Callos'
  WHEN 'bot.traction-taster@likelyr.local' THEN 'Imani Brooks'
  WHEN 'bot.tam-reader@likelyr.local' THEN 'Victor Salazar'
  WHEN 'bot.painkiller-picker@likelyr.local' THEN 'Rowan Pierce'
  WHEN 'bot.idea-referee@likelyr.local' THEN 'Kim Tanaka'
  WHEN 'bot.growth-gauge@likelyr.local' THEN 'Drew Harrison'
  WHEN 'bot.demand-decoder@likelyr.local' THEN 'Alma Fernandez'
  ELSE name
END
WHERE email LIKE 'bot.%@likelyr.local';