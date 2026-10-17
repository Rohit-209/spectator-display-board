"""Train a logistic-regression win-probability model for IPL T20 chases.

Loads every Cricsheet IPL match under model/data/raw, walks the 2nd innings
ball-by-ball, extracts (runs_needed, balls_remaining, wickets_in_hand,
required_run_rate, current_run_rate) at each decision point, labels by
whether the chasing team eventually won, trains sklearn LogisticRegression
with season-based train/test split, and exports coefficients + scaler
params to lib/win-prob-coeffs.json for runtime evaluation in Node.
"""
from __future__ import annotations

import json
import math
import os
import sys
from dataclasses import dataclass
from pathlib import Path

import numpy as np
import pandas as pd
import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import brier_score_loss, log_loss
from sklearn.preprocessing import StandardScaler


HERE = Path(__file__).resolve().parent
RAW_DIR = HERE / "data" / "raw"
OUT_DIR = HERE / "out"
COEFF_PATH = HERE.parent / "lib" / "win-prob-coeffs.json"
FEATURES = [
    "runs_needed",
    "balls_remaining",
    "wickets_in_hand",
    "rrr",
    "crr",
]


@dataclass
class ChaseRow:
    match_id: str
    season: str
    runs_needed: float
    balls_remaining: int
    wickets_in_hand: int
    rrr: float
    crr: float
    won: int


def iter_chase_rows(match: dict, match_id: str) -> list[ChaseRow]:
    info = match["info"]
    if info.get("match_type") != "T20":
        return []
    if info.get("overs") != 20:
        return []
    outcome = info.get("outcome", {})
    if outcome.get("result") in {"no result"}:
        return []
    # DLS-affected chases distort the features; drop for a clean baseline.
    if outcome.get("method"):
        return []

    innings = match.get("innings", [])
    if len(innings) < 2:
        return []
    chase = innings[1]
    chasing_team = chase.get("team")
    target_info = chase.get("target")
    if not target_info or "runs" not in target_info:
        return []
    target = int(target_info["runs"])
    season = str(info.get("season", ""))

    winner = outcome.get("winner")
    if winner is None:
        # tie or super over — label chaser 0 (did not win in regulation chase)
        won_label = 0
    else:
        won_label = 1 if winner == chasing_team else 0

    runs = 0
    wickets = 0
    legal_balls = 0
    total_balls = 20 * 6
    rows: list[ChaseRow] = []

    for over_block in chase.get("overs", []):
        for d in over_block.get("deliveries", []):
            extras = d.get("extras", {}) or {}
            is_wide_or_nb = "wides" in extras or "noballs" in extras
            runs += int(d["runs"]["total"])
            if not is_wide_or_nb:
                legal_balls += 1
            if "wickets" in d:
                wickets += len(d["wickets"])

            runs_needed = target - runs
            balls_remaining = total_balls - legal_balls
            wickets_in_hand = 10 - wickets

            # Chase decided — stop recording rows for this match
            if runs_needed <= 0 or wickets_in_hand <= 0 or balls_remaining <= 0:
                return rows

            crr = (runs / legal_balls) * 6 if legal_balls > 0 else 0.0
            rrr = (runs_needed / balls_remaining) * 6

            rows.append(
                ChaseRow(
                    match_id=match_id,
                    season=season,
                    runs_needed=float(runs_needed),
                    balls_remaining=balls_remaining,
                    wickets_in_hand=wickets_in_hand,
                    rrr=float(rrr),
                    crr=float(crr),
                    won=won_label,
                )
            )
    return rows


def load_dataset() -> pd.DataFrame:
    rows: list[ChaseRow] = []
    files = sorted(RAW_DIR.glob("*.json"))
    for i, f in enumerate(files):
        if f.name in {"README.txt", "LICENSE.txt"}:
            continue
        try:
            with f.open() as fh:
                match = json.load(fh)
        except Exception as e:
            print(f"skip {f.name}: {e}", file=sys.stderr)
            continue
        rows.extend(iter_chase_rows(match, f.stem))
        if (i + 1) % 200 == 0:
            print(f"  processed {i + 1}/{len(files)} files, {len(rows)} rows so far")
    df = pd.DataFrame([r.__dict__ for r in rows])
    return df


def season_sort_key(s: str) -> tuple[int, str]:
    # Cricsheet uses both '2017' and '2020/21'; sort by starting year
    head = s.split("/")[0]
    try:
        return (int(head), s)
    except ValueError:
        return (0, s)


def split_by_season(df: pd.DataFrame):
    seasons_sorted = sorted(df["season"].unique(), key=season_sort_key)
    # Hold out the two most recent seasons as test (per plan §3.3)
    test_seasons = seasons_sorted[-2:]
    train = df[~df["season"].isin(test_seasons)].copy()
    test = df[df["season"].isin(test_seasons)].copy()
    return train, test, test_seasons


def calibration_bins(y_true: np.ndarray, p: np.ndarray, bins: int = 10):
    edges = np.linspace(0, 1, bins + 1)
    xs, ys, ns = [], [], []
    for lo, hi in zip(edges[:-1], edges[1:]):
        mask = (p >= lo) & (p < hi)
        if mask.sum() == 0:
            continue
        xs.append(p[mask].mean())
        ys.append(y_true[mask].mean())
        ns.append(int(mask.sum()))
    return xs, ys, ns


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    print(f"Loading matches from {RAW_DIR} ...")
    df = load_dataset()
    print(f"  {len(df):,} rows across {df['match_id'].nunique()} matches, "
          f"{df['season'].nunique()} seasons")
    if df.empty:
        print("No rows extracted — nothing to train.", file=sys.stderr)
        sys.exit(1)

    train_df, test_df, test_seasons = split_by_season(df)
    print(f"  train: {len(train_df):,} rows ({train_df['season'].nunique()} seasons)")
    print(f"  test : {len(test_df):,} rows (held-out seasons: {test_seasons})")

    X_train = train_df[FEATURES].to_numpy()
    y_train = train_df["won"].to_numpy()
    X_test = test_df[FEATURES].to_numpy()
    y_test = test_df["won"].to_numpy()

    scaler = StandardScaler().fit(X_train)
    X_train_s = scaler.transform(X_train)
    X_test_s = scaler.transform(X_test)

    model = LogisticRegression(max_iter=1000, C=1.0)
    model.fit(X_train_s, y_train)
    p_test = model.predict_proba(X_test_s)[:, 1]

    # Required-rate-only baseline (one feature)
    base_scaler = StandardScaler().fit(train_df[["rrr"]].to_numpy())
    base_model = LogisticRegression(max_iter=1000).fit(
        base_scaler.transform(train_df[["rrr"]].to_numpy()), y_train
    )
    p_base = base_model.predict_proba(base_scaler.transform(test_df[["rrr"]].to_numpy()))[:, 1]

    metrics = {
        "n_matches_total": int(df["match_id"].nunique()),
        "n_rows_train": int(len(train_df)),
        "n_rows_test": int(len(test_df)),
        "test_seasons": test_seasons,
        "brier_full": float(brier_score_loss(y_test, p_test)),
        "logloss_full": float(log_loss(y_test, p_test, labels=[0, 1])),
        "brier_baseline_rrr_only": float(brier_score_loss(y_test, p_base)),
        "logloss_baseline_rrr_only": float(log_loss(y_test, p_base, labels=[0, 1])),
    }
    print(json.dumps(metrics, indent=2))

    # Calibration plot
    xs, ys, ns = calibration_bins(y_test, p_test)
    fig, ax = plt.subplots(figsize=(5, 5))
    ax.plot([0, 1], [0, 1], "--", color="#888", label="perfect")
    ax.plot(xs, ys, "o-", color="#2563eb", label="model")
    for x, y, n in zip(xs, ys, ns):
        ax.annotate(str(n), (x, y), textcoords="offset points", xytext=(4, 4), fontsize=7, color="#555")
    ax.set_xlabel("predicted P(chase wins)")
    ax.set_ylabel("observed win rate")
    ax.set_title(f"Calibration — IPL T20 chases, test seasons {test_seasons}")
    ax.set_xlim(0, 1); ax.set_ylim(0, 1)
    ax.legend()
    fig.tight_layout()
    plt.savefig(OUT_DIR / "calibration.png", dpi=140)
    plt.close(fig)

    with (OUT_DIR / "metrics.json").open("w") as fh:
        json.dump(metrics, fh, indent=2)

    # Export coefficients for Node runtime
    coeffs = {
        "model": "logreg",
        "features": FEATURES,
        "scaler_mean": scaler.mean_.tolist(),
        "scaler_scale": scaler.scale_.tolist(),
        "coef": model.coef_[0].tolist(),
        "intercept": float(model.intercept_[0]),
        "trained_on": {
            "source": "cricsheet IPL JSON",
            "n_matches": metrics["n_matches_total"],
            "n_rows_train": metrics["n_rows_train"],
            "n_rows_test": metrics["n_rows_test"],
            "test_seasons": test_seasons,
        },
        "test_metrics": {
            "brier": metrics["brier_full"],
            "log_loss": metrics["logloss_full"],
            "brier_baseline_rrr_only": metrics["brier_baseline_rrr_only"],
            "log_loss_baseline_rrr_only": metrics["logloss_baseline_rrr_only"],
        },
    }
    COEFF_PATH.parent.mkdir(parents=True, exist_ok=True)
    with COEFF_PATH.open("w") as fh:
        json.dump(coeffs, fh, indent=2)
    print(f"wrote {COEFF_PATH}")
    print(f"wrote {OUT_DIR / 'metrics.json'}")
    print(f"wrote {OUT_DIR / 'calibration.png'}")


if __name__ == "__main__":
    main()
