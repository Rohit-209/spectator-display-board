# Win-probability model

Offline training of the logistic-regression win-probability model for the
2nd-innings chase. Produces `lib/win-prob-coeffs.json`, which the runtime
in `lib/win-prob.ts` evaluates against the live match state.

## Retrain

```bash
# one-time
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# fetch Cricsheet IPL JSON (~1200 matches, ~5 MB zipped)
curl -sSL -o /tmp/ipl_json.zip https://cricsheet.org/downloads/ipl_json.zip
mkdir -p data/raw && (cd data/raw && unzip -q /tmp/ipl_json.zip)

# train, evaluate, and export
python train.py
```

Outputs:

| Path | What |
| --- | --- |
| `../lib/win-prob-coeffs.json` | Scaler mean/scale, logreg coeffs, intercept, test-season metrics (loaded by `lib/win-prob.ts`) |
| `out/metrics.json` | Brier, log-loss for the full model and the RRR-only baseline |
| `out/calibration.png` | Reliability curve on held-out seasons |

## Design notes

- **Features** (plan §3.3): `runs_needed`, `balls_remaining`, `wickets_in_hand`,
  `rrr`, `crr`. All continuous; standardised before fitting.
- **Split**: Hold out the two most recent IPL seasons as test — avoids
  within-match leakage between adjacent balls and tests seasonal drift.
- **Baseline**: Logistic regression on `rrr` alone, so the report can quote
  the improvement from adding the other features.
- **Filtering**: Drop DLS-affected chases and matches with no result; T20-only.
- **No Python at runtime**: Only `lib/win-prob-coeffs.json` ships to the
  Next.js server; Node evaluates the sigmoid directly.
