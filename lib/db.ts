import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

const DB_PATH = path.resolve(process.cwd(), "data", "board.db");

type DBHandle = ReturnType<typeof Database> & { __initialised?: boolean };

const g = globalThis as unknown as { __board_db__?: DBHandle };

function init(db: DBHandle): void {
  if (db.__initialised) return;
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  db.exec(`
    CREATE TABLE IF NOT EXISTS matches (
      match_id TEXT PRIMARY KEY,
      team_a TEXT NOT NULL,
      team_b TEXT NOT NULL,
      batting_first TEXT NOT NULL,
      batting_second TEXT NOT NULL,
      season TEXT,
      date TEXT,
      venue TEXT,
      city TEXT,
      winner TEXT,
      total_overs INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS batter_season_stats (
      batter TEXT NOT NULL,
      season TEXT NOT NULL,
      innings INTEGER NOT NULL,
      runs INTEGER NOT NULL,
      balls INTEGER NOT NULL,
      fours INTEGER NOT NULL,
      sixes INTEGER NOT NULL,
      highest INTEGER NOT NULL,
      PRIMARY KEY (batter, season)
    );

    CREATE TABLE IF NOT EXISTS batter_career_stats (
      batter TEXT PRIMARY KEY,
      innings INTEGER NOT NULL,
      runs INTEGER NOT NULL,
      balls INTEGER NOT NULL,
      fours INTEGER NOT NULL,
      sixes INTEGER NOT NULL,
      highest INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS insight_audit (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ts INTEGER NOT NULL,
      match_id TEXT NOT NULL,
      trigger TEXT NOT NULL,
      over TEXT NOT NULL,
      fact_pack TEXT NOT NULL,
      llm_attempted INTEGER NOT NULL,
      llm_text TEXT,
      llm_error TEXT,
      validator_passed INTEGER,
      source TEXT NOT NULL,
      final_text TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS engagement_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ts INTEGER NOT NULL,
      session_id TEXT NOT NULL,
      match_id TEXT,
      kind TEXT NOT NULL,
      payload TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_engagement_session ON engagement_events(session_id);
    CREATE INDEX IF NOT EXISTS idx_engagement_kind ON engagement_events(kind);
    CREATE INDEX IF NOT EXISTS idx_insight_match ON insight_audit(match_id);
  `);
  db.__initialised = true;
}

export function getDb(): DBHandle {
  if (!g.__board_db__) {
    fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
    const db = new Database(DB_PATH) as DBHandle;
    init(db);
    g.__board_db__ = db;
  }
  return g.__board_db__;
}

export const DB_FILE_PATH = DB_PATH;
