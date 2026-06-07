#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const BOT_COUNT = 48;
const BOT_EMAIL_DOMAIN = 'likelyr.local';
const CATEGORY = 'SaaS';
const MIN_TARGET_VOTES = 11;
const TARGET_VOTE_RANGE = 9;
const DRY_RUN = process.argv.includes('--dry-run');

function loadEnvFile(fileName) {
  const envPath = path.join(process.cwd(), fileName);
  if (!fs.existsSync(envPath)) return;

  const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match) continue;

    const key = match[1];
    let value = match[2].trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    process.env[key] ||= value;
  }
}

loadEnvFile('.env.local');
loadEnvFile('.env');

const { sql } = await import('@vercel/postgres');

function hashString(value) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function random01(seed) {
  return hashString(seed) / 0xffffffff;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function targetVotesFor(seed) {
  return MIN_TARGET_VOTES + (hashString(seed) % TARGET_VOTE_RANGE);
}

function calculateIdeaElo(winnerRating, loserRating) {
  const expectedWinnerScore = 1 / (1 + Math.pow(10, (loserRating - winnerRating) / 400));
  const expectedLoserScore = 1 / (1 + Math.pow(10, (winnerRating - loserRating) / 400));

  return {
    winnerNewRating: Math.round(winnerRating + 32 * (1 - expectedWinnerScore)),
    loserNewRating: Math.round(loserRating + 32 * (0 - expectedLoserScore)),
  };
}

function getPredictionTarget(ideaAVotes, ideaBVotes, ideaAId, ideaBId) {
  if (ideaAVotes > ideaBVotes) return ideaAId;
  if (ideaBVotes > ideaAVotes) return ideaBId;
  return null;
}

function isRankedPredictionSignal(ideaAVotes, ideaBVotes) {
  return ideaAVotes + ideaBVotes > 0 && ideaAVotes !== ideaBVotes;
}

function getPredictionDifficulty(ideaAVotes, ideaBVotes) {
  const total = ideaAVotes + ideaBVotes;
  if (total === 0) return 1;

  const spread = Math.abs(ideaAVotes - ideaBVotes) / total;
  if (spread <= 0.15) return 1.2;
  if (spread <= 0.3) return 1.05;
  return 0.9;
}

function calculatePredictionElo(currentElo, correct, ideaAVotes, ideaBVotes) {
  const expectedScore = 0.5;
  const actualScore = correct ? 1 : 0;
  const multiplier = getPredictionDifficulty(ideaAVotes, ideaBVotes);
  return Math.round(currentElo + 24 * multiplier * (actualScore - expectedScore));
}

function ideaStrength(idea) {
  const stageWeights = {
    MVP: 28,
    Revenue: 54,
    Growth: 68,
    Idea: 0,
  };

  const revenue = String(idea.revenue_model || '').toLowerCase();
  const revenueBoost =
    revenue.includes('$') || revenue.includes('subscription') || revenue.includes('/mo')
      ? 28
      : revenue.includes('free')
        ? 4
        : 12;

  return (
    Number(idea.elo_score || 1000) +
    (stageWeights[idea.stage] ?? 10) +
    revenueBoost +
    (hashString(`${idea.id}:strength`) % 35)
  );
}

function chooseWinnerId(battle, voteIndex, botId) {
  const aStrength = ideaStrength(battle.idea_a);
  const bStrength = ideaStrength(battle.idea_b);
  const rawProbabilityA = 1 / (1 + Math.pow(10, (bStrength - aStrength) / 320));
  const probabilityA = clamp(rawProbabilityA, 0.27, 0.73);
  return random01(`${battle.id}:${voteIndex}:${botId}:winner`) <= probabilityA
    ? battle.idea_a_id
    : battle.idea_b_id;
}

function voteCreatedAt(seed) {
  const daysAgo = 2 + (hashString(`${seed}:days`) % 18);
  const minutesAgo = hashString(`${seed}:minutes`) % 1440;
  return new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000 - minutesAgo * 60 * 1000);
}

function battleCreatedAt(seed) {
  const daysAgo = 24 + (hashString(`${seed}:battle-days`) % 12);
  const minutesAgo = hashString(`${seed}:battle-minutes`) % 1440;
  return new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000 - minutesAgo * 60 * 1000);
}

async function getApprovedSaasIdeas(db) {
  const result = await db.sql`
    SELECT id, name, category, stage, revenue_model, elo_score
    FROM ideas
    WHERE category = ${CATEGORY}
      AND COALESCE(status, 'approved') = 'approved'
    ORDER BY created_at ASC, name ASC
  `;
  return result.rows;
}

async function getSaasBattles(db) {
  const result = await db.sql`
    SELECT
      b.id,
      b.idea_a_id,
      b.idea_b_id,
      b.idea_a_votes,
      b.idea_b_votes,
      b.winner_id,
      ia.id AS idea_a_pk,
      ia.name AS idea_a_name,
      ia.category AS idea_a_category,
      ia.stage AS idea_a_stage,
      ia.revenue_model AS idea_a_revenue_model,
      ia.elo_score AS idea_a_elo_score,
      ib.id AS idea_b_pk,
      ib.name AS idea_b_name,
      ib.category AS idea_b_category,
      ib.stage AS idea_b_stage,
      ib.revenue_model AS idea_b_revenue_model,
      ib.elo_score AS idea_b_elo_score,
      COUNT(v.id)::int AS vote_rows,
      COALESCE(SUM(CASE WHEN v.winner_id = b.idea_a_id THEN 1 ELSE 0 END), 0)::int AS idea_a_vote_rows,
      COALESCE(SUM(CASE WHEN v.winner_id = b.idea_b_id THEN 1 ELSE 0 END), 0)::int AS idea_b_vote_rows
    FROM battles b
    JOIN ideas ia ON ia.id = b.idea_a_id
    JOIN ideas ib ON ib.id = b.idea_b_id
    LEFT JOIN votes v ON v.battle_id = b.id
    WHERE ia.category = ${CATEGORY}
      AND ib.category = ${CATEGORY}
      AND COALESCE(ia.status, 'approved') = 'approved'
      AND COALESCE(ib.status, 'approved') = 'approved'
    GROUP BY b.id, ia.id, ib.id
    ORDER BY b.created_at ASC, b.id ASC
  `;

  return result.rows.map((row) => ({
    id: row.id,
    idea_a_id: row.idea_a_id,
    idea_b_id: row.idea_b_id,
    idea_a_votes: Number(row.idea_a_votes || 0),
    idea_b_votes: Number(row.idea_b_votes || 0),
    winner_id: row.winner_id,
    vote_rows: Number(row.vote_rows || 0),
    idea_a_vote_rows: Number(row.idea_a_vote_rows || 0),
    idea_b_vote_rows: Number(row.idea_b_vote_rows || 0),
    idea_a: {
      id: row.idea_a_pk,
      name: row.idea_a_name,
      category: row.idea_a_category,
      stage: row.idea_a_stage,
      revenue_model: row.idea_a_revenue_model,
      elo_score: Number(row.idea_a_elo_score || 1000),
    },
    idea_b: {
      id: row.idea_b_pk,
      name: row.idea_b_name,
      category: row.idea_b_category,
      stage: row.idea_b_stage,
      revenue_model: row.idea_b_revenue_model,
      elo_score: Number(row.idea_b_elo_score || 1000),
    },
  }));
}

function pairKey(firstId, secondId) {
  return [firstId, secondId].sort().join(':');
}

function getAllIdeaPairs(ideas) {
  const pairs = [];
  for (let first = 0; first < ideas.length; first += 1) {
    for (let second = first + 1; second < ideas.length; second += 1) {
      pairs.push([ideas[first], ideas[second]]);
    }
  }
  return pairs;
}

function summarizePlan(ideas, battles) {
  const allPairs = getAllIdeaPairs(ideas);
  const existingKeys = new Set(
    battles.map((battle) => pairKey(battle.idea_a_id, battle.idea_b_id)),
  );
  const missingPairs = allPairs.filter(([ideaA, ideaB]) => !existingKeys.has(pairKey(ideaA.id, ideaB.id)));

  const mismatchedCounters = battles.filter(
    (battle) =>
      battle.idea_a_votes !== battle.idea_a_vote_rows ||
      battle.idea_b_votes !== battle.idea_b_vote_rows,
  );

  const votesNeededForExisting = battles.reduce((total, battle) => {
    return total + Math.max(0, targetVotesFor(battle.id) - battle.vote_rows);
  }, 0);

  const votesNeededForMissing = missingPairs.reduce((total, [ideaA, ideaB]) => {
    return total + targetVotesFor(pairKey(ideaA.id, ideaB.id));
  }, 0);

  return {
    ideaCount: ideas.length,
    targetPairCount: allPairs.length,
    existingBattleCount: battles.length,
    missingBattleCount: missingPairs.length,
    mismatchedCounterCount: mismatchedCounters.length,
    votesNeededForExisting,
    votesNeededForMissing,
    totalVotesNeeded: votesNeededForExisting + votesNeededForMissing,
    missingPairs,
  };
}

async function ensureCommunityBots(db) {
  const bots = [];
  for (let index = 1; index <= BOT_COUNT; index += 1) {
    const number = String(index).padStart(3, '0');
    const email = `bot.community-${number}@${BOT_EMAIL_DOMAIN}`;
    const name = `Community Scout ${number}`;

    await db.sql`
      INSERT INTO users (email, name, is_bot, prediction_elo, prediction_wins, prediction_losses, prediction_streak, created_at)
      VALUES (${email}, ${name}, true, 1000, 0, 0, 0, NOW())
      ON CONFLICT (email) DO UPDATE
      SET is_bot = true,
          name = EXCLUDED.name
    `;

    bots.push(email);
  }

  const result = await db.sql`
    SELECT id, email
    FROM users
    WHERE email LIKE ${`bot.community-%@${BOT_EMAIL_DOMAIN}`}
    ORDER BY email ASC
  `;

  return result.rows.filter((bot) => bots.includes(bot.email));
}

async function createMissingSaasBattles(db, missingPairs) {
  let created = 0;

  for (const [ideaA, ideaB] of missingPairs) {
    const createdAt = battleCreatedAt(pairKey(ideaA.id, ideaB.id)).toISOString();
    const result = await db.sql`
      INSERT INTO battles (idea_a_id, idea_b_id, idea_a_votes, idea_b_votes, created_at)
      SELECT ${ideaA.id}, ${ideaB.id}, 0, 0, ${createdAt}
      WHERE NOT EXISTS (
        SELECT 1
        FROM battles
        WHERE (idea_a_id = ${ideaA.id} AND idea_b_id = ${ideaB.id})
           OR (idea_a_id = ${ideaB.id} AND idea_b_id = ${ideaA.id})
      )
      RETURNING id
    `;

    created += result.rowCount;
  }

  return created;
}

async function getExistingVotersByBattle(db, battleIds) {
  if (battleIds.length === 0) return new Map();

  const result = await db.query(
    'SELECT battle_id, user_id FROM votes WHERE battle_id = ANY($1::uuid[])',
    [battleIds],
  );
  const votersByBattle = new Map();

  for (const row of result.rows) {
    const battleVoters = votersByBattle.get(row.battle_id) ?? new Set();
    battleVoters.add(row.user_id);
    votersByBattle.set(row.battle_id, battleVoters);
  }

  return votersByBattle;
}

async function getIdeaStates(db, ideaIds) {
  const result = await db.query(
    `SELECT id, elo_score, wins, losses
     FROM ideas
     WHERE id = ANY($1::uuid[])
     FOR UPDATE`,
    [ideaIds],
  );

  return new Map(
    result.rows.map((idea) => [
      idea.id,
      {
        id: idea.id,
        elo_score: Number(idea.elo_score || 1000),
        wins: Number(idea.wins || 0),
        losses: Number(idea.losses || 0),
      },
    ]),
  );
}

async function getBotStates(db, botIds) {
  const result = await db.query(
    `SELECT id, prediction_elo, prediction_wins, prediction_losses, prediction_streak
     FROM users
     WHERE id = ANY($1::uuid[])
     FOR UPDATE`,
    [botIds],
  );

  return new Map(
    result.rows.map((bot) => [
      bot.id,
      {
        id: bot.id,
        prediction_elo: Number(bot.prediction_elo || 1000),
        prediction_wins: Number(bot.prediction_wins || 0),
        prediction_losses: Number(bot.prediction_losses || 0),
        prediction_streak: Number(bot.prediction_streak || 0),
      },
    ]),
  );
}

function buildSeedRows(battles, bots, votersByBattle, ideaStates, botStates) {
  const voteRows = [];
  const historyRows = [];
  const battleUpdates = [];

  for (const battle of battles) {
    const targetVotes = targetVotesFor(battle.id);
    const votesToAdd = Math.max(0, targetVotes - battle.vote_rows);
    const existingVoters = votersByBattle.get(battle.id) ?? new Set();
    const availableBots = bots.filter((bot) => !existingVoters.has(bot.id));

    if (availableBots.length < votesToAdd) {
      throw new Error(
        `Battle ${battle.id} needs ${votesToAdd} votes but only ${availableBots.length} bot voters are available`,
      );
    }

    let ideaAVotes = battle.idea_a_vote_rows;
    let ideaBVotes = battle.idea_b_vote_rows;
    const startIndex = hashString(`${battle.id}:bot-start`) % Math.max(availableBots.length, 1);

    for (let index = 0; index < votesToAdd; index += 1) {
      const bot = availableBots[(startIndex + index) % availableBots.length];
      const botState = botStates.get(bot.id);
      const ideaAState = ideaStates.get(battle.idea_a_id);
      const ideaBState = ideaStates.get(battle.idea_b_id);

      if (!botState) throw new Error(`Bot state ${bot.id} was not loaded`);
      if (!ideaAState || !ideaBState) throw new Error(`Idea state was not loaded for battle ${battle.id}`);

      const battleForVote = {
        ...battle,
        idea_a: { ...battle.idea_a, elo_score: ideaAState.elo_score },
        idea_b: { ...battle.idea_b, elo_score: ideaBState.elo_score },
      };
      const winnerId = chooseWinnerId(battleForVote, battle.vote_rows + index, bot.id);
      const predictionTargetId = getPredictionTarget(
        ideaAVotes,
        ideaBVotes,
        battle.idea_a_id,
        battle.idea_b_id,
      );
      const predictionRanked = isRankedPredictionSignal(ideaAVotes, ideaBVotes);
      const predictionCorrect = predictionTargetId ? winnerId === predictionTargetId : null;
      const voterEloBefore = botState.prediction_elo;
      const voterEloAfter =
        predictionRanked && predictionCorrect !== null
          ? calculatePredictionElo(voterEloBefore, predictionCorrect, ideaAVotes, ideaBVotes)
          : voterEloBefore;
      const createdAt = voteCreatedAt(`${battle.id}:${bot.id}:${index}`).toISOString();

      voteRows.push([
        battle.id,
        bot.id,
        winnerId,
        predictionTargetId,
        predictionCorrect,
        predictionRanked,
        voterEloBefore,
        voterEloAfter,
        null,
        createdAt,
      ]);

      const winnerIdea = winnerId === battle.idea_a_id ? ideaAState : ideaBState;
      const loserIdea = winnerId === battle.idea_a_id ? ideaBState : ideaAState;
      const winnerEloBefore = winnerIdea.elo_score;
      const loserEloBefore = loserIdea.elo_score;
      const { winnerNewRating, loserNewRating } = calculateIdeaElo(winnerEloBefore, loserEloBefore);

      historyRows.push([
        winnerIdea.id,
        battle.id,
        winnerEloBefore,
        winnerNewRating,
        'win',
        createdAt,
      ]);
      historyRows.push([
        loserIdea.id,
        battle.id,
        loserEloBefore,
        loserNewRating,
        'loss',
        createdAt,
      ]);

      winnerIdea.elo_score = winnerNewRating;
      winnerIdea.wins += 1;
      loserIdea.elo_score = loserNewRating;
      loserIdea.losses += 1;

      if (predictionRanked && predictionCorrect !== null) {
        botState.prediction_elo = voterEloAfter;
        if (predictionCorrect) {
          botState.prediction_wins += 1;
          botState.prediction_streak += 1;
        } else {
          botState.prediction_losses += 1;
          botState.prediction_streak = 0;
        }
      }

      if (winnerId === battle.idea_a_id) {
        ideaAVotes += 1;
      } else {
        ideaBVotes += 1;
      }
    }

    battleUpdates.push([
      battle.id,
      ideaAVotes,
      ideaBVotes,
      ideaAVotes > ideaBVotes ? battle.idea_a_id : ideaBVotes > ideaAVotes ? battle.idea_b_id : null,
    ]);
  }

  return {
    voteRows,
    historyRows,
    battleUpdates,
    ideaUpdates: [...ideaStates.values()].map((idea) => [
      idea.id,
      idea.elo_score,
      idea.wins,
      idea.losses,
    ]),
    botUpdates: [...botStates.values()].map((bot) => [
      bot.id,
      bot.prediction_elo,
      bot.prediction_wins,
      bot.prediction_losses,
      bot.prediction_streak,
    ]),
  };
}

async function bulkInsert(db, tableName, columns, rows, casts, chunkSize = 400) {
  if (rows.length === 0) return;

  for (let offset = 0; offset < rows.length; offset += chunkSize) {
    const chunk = rows.slice(offset, offset + chunkSize);
    const values = [];
    const rowPlaceholders = chunk.map((row) => {
      const placeholders = row.map((value, columnIndex) => {
        values.push(value);
        return `$${values.length}${casts[columnIndex] ? `::${casts[columnIndex]}` : ''}`;
      });
      return `(${placeholders.join(', ')})`;
    });

    await db.query(
      `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES ${rowPlaceholders.join(', ')}`,
      values,
    );
  }
}

async function bulkUpdateFromValues(db, tableName, alias, columns, rows, casts, setClause, chunkSize = 400) {
  if (rows.length === 0) return;

  for (let offset = 0; offset < rows.length; offset += chunkSize) {
    const chunk = rows.slice(offset, offset + chunkSize);
    const values = [];
    const rowPlaceholders = chunk.map((row) => {
      const placeholders = row.map((value, columnIndex) => {
        values.push(value);
        return `$${values.length}${casts[columnIndex] ? `::${casts[columnIndex]}` : ''}`;
      });
      return `(${placeholders.join(', ')})`;
    });

    await db.query(
      `UPDATE ${tableName} AS ${alias}
       SET ${setClause}
       FROM (VALUES ${rowPlaceholders.join(', ')}) AS data(${columns.join(', ')})
       WHERE ${alias}.id = data.id`,
      values,
    );
  }
}

async function getFinalSummary(db) {
  const result = await db.sql`
    WITH saas_battles AS (
      SELECT b.id, COUNT(v.id)::int AS vote_rows
      FROM battles b
      JOIN ideas ia ON ia.id = b.idea_a_id
      JOIN ideas ib ON ib.id = b.idea_b_id
      LEFT JOIN votes v ON v.battle_id = b.id
      WHERE ia.category = ${CATEGORY}
        AND ib.category = ${CATEGORY}
        AND COALESCE(ia.status, 'approved') = 'approved'
        AND COALESCE(ib.status, 'approved') = 'approved'
      GROUP BY b.id
    )
    SELECT
      COUNT(*)::int AS battle_count,
      COALESCE(SUM(vote_rows), 0)::int AS vote_count,
      COALESCE(MIN(vote_rows), 0)::int AS min_votes,
      COALESCE(MAX(vote_rows), 0)::int AS max_votes,
      COALESCE(ROUND(AVG(vote_rows)::numeric, 1), 0)::text AS avg_votes
    FROM saas_battles
  `;
  return result.rows[0];
}

const db = await sql.connect();

try {
  const ideas = await getApprovedSaasIdeas(db);
  const battles = await getSaasBattles(db);
  const plan = summarizePlan(ideas, battles);

  console.log(
    JSON.stringify(
      {
        dryRun: DRY_RUN,
        category: CATEGORY,
        ideaCount: plan.ideaCount,
        targetPairCount: plan.targetPairCount,
        existingBattleCount: plan.existingBattleCount,
        missingBattleCount: plan.missingBattleCount,
        mismatchedCounterCount: plan.mismatchedCounterCount,
        votesNeededForExisting: plan.votesNeededForExisting,
        votesNeededForMissing: plan.votesNeededForMissing,
        totalVotesNeeded: plan.totalVotesNeeded,
      },
      null,
      2,
    ),
  );

  if (DRY_RUN) {
    process.exitCode = 0;
  } else {
    await db.sql`BEGIN`;

    const bots = await ensureCommunityBots(db);
    const createdBattles = await createMissingSaasBattles(db, plan.missingPairs);
    const refreshedBattles = await getSaasBattles(db);
    const syncedCounters = refreshedBattles.filter(
      (battle) =>
        battle.idea_a_votes !== battle.idea_a_vote_rows ||
        battle.idea_b_votes !== battle.idea_b_vote_rows,
    ).length;
    const battleIds = refreshedBattles.map((battle) => battle.id);
    const ideaIds = [
      ...new Set(
        refreshedBattles.flatMap((battle) => [battle.idea_a_id, battle.idea_b_id]),
      ),
    ];
    const botIds = bots.map((bot) => bot.id);
    const votersByBattle = await getExistingVotersByBattle(db, battleIds);
    const ideaStates = await getIdeaStates(db, ideaIds);
    const botStates = await getBotStates(db, botIds);
    const seedRows = buildSeedRows(refreshedBattles, bots, votersByBattle, ideaStates, botStates);

    await bulkInsert(
      db,
      'votes',
      [
        'battle_id',
        'user_id',
        'winner_id',
        'prediction_target_id',
        'prediction_correct',
        'prediction_ranked',
        'voter_elo_before',
        'voter_elo_after',
        'reason',
        'created_at',
      ],
      seedRows.voteRows,
      ['uuid', 'uuid', 'uuid', 'uuid', 'boolean', 'boolean', 'int', 'int', 'text', 'timestamp'],
    );
    await bulkInsert(
      db,
      'idea_score_history',
      ['idea_id', 'battle_id', 'elo_before', 'elo_after', 'result', 'created_at'],
      seedRows.historyRows,
      ['uuid', 'uuid', 'int', 'int', 'text', 'timestamp'],
    );
    await bulkUpdateFromValues(
      db,
      'battles',
      'battle',
      ['id', 'idea_a_votes', 'idea_b_votes', 'winner_id'],
      seedRows.battleUpdates,
      ['uuid', 'int', 'int', 'uuid'],
      'idea_a_votes = data.idea_a_votes, idea_b_votes = data.idea_b_votes, winner_id = data.winner_id',
    );
    await bulkUpdateFromValues(
      db,
      'ideas',
      'idea',
      ['id', 'elo_score', 'wins', 'losses'],
      seedRows.ideaUpdates,
      ['uuid', 'int', 'int', 'int'],
      'elo_score = data.elo_score, wins = data.wins, losses = data.losses',
    );
    await bulkUpdateFromValues(
      db,
      'users',
      'app_user',
      ['id', 'prediction_elo', 'prediction_wins', 'prediction_losses', 'prediction_streak'],
      seedRows.botUpdates,
      ['uuid', 'int', 'int', 'int', 'int'],
      'prediction_elo = data.prediction_elo, prediction_wins = data.prediction_wins, prediction_losses = data.prediction_losses, prediction_streak = data.prediction_streak',
    );

    const finalSummary = await getFinalSummary(db);
    await db.sql`COMMIT`;

    console.log(
      JSON.stringify(
        {
          createdBattles,
          syncedCounters,
          insertedVotes: seedRows.voteRows.length,
          finalSummary,
        },
        null,
        2,
      ),
    );
  }
} catch (error) {
  if (!DRY_RUN) {
    try {
      await db.sql`ROLLBACK`;
    } catch {
      // The original error is more useful.
    }
  }

  console.error(error);
  process.exitCode = 1;
} finally {
  db.release();
}
