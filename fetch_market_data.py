from __future__ import annotations

import argparse
from pathlib import Path

import pandas as pd


DEFAULT_UNIVERSE = [
    {"ticker": "VTI", "instrument_name": "Vanguard Total Stock Market ETF", "asset_class": "Broad Market ETF", "category": "core", "risk_level": "moderate", "expense_ratio": 0.0003, "liquidity_score": 0.93},
    {"ticker": "SPY", "instrument_name": "SPDR S&P 500 ETF Trust", "asset_class": "Broad Market ETF", "category": "core", "risk_level": "moderate", "expense_ratio": 0.0009, "liquidity_score": 0.99},
    {"ticker": "VOO", "instrument_name": "Vanguard S&P 500 ETF", "asset_class": "Broad Market ETF", "category": "core", "risk_level": "moderate", "expense_ratio": 0.0003, "liquidity_score": 0.95},
    {"ticker": "QQQ", "instrument_name": "Invesco QQQ Trust", "asset_class": "Growth ETF", "category": "growth", "risk_level": "high", "expense_ratio": 0.0020, "liquidity_score": 0.97},
    {"ticker": "IWM", "instrument_name": "iShares Russell 2000 ETF", "asset_class": "Small Cap ETF", "category": "growth", "risk_level": "high", "expense_ratio": 0.0019, "liquidity_score": 0.90},
    {"ticker": "BND", "instrument_name": "Vanguard Total Bond Market ETF", "asset_class": "Bond ETF", "category": "stability", "risk_level": "low", "expense_ratio": 0.0003, "liquidity_score": 0.88},
    {"ticker": "AGG", "instrument_name": "iShares Core US Aggregate Bond ETF", "asset_class": "Bond ETF", "category": "stability", "risk_level": "low", "expense_ratio": 0.0003, "liquidity_score": 0.89},
    {"ticker": "SCHD", "instrument_name": "Schwab US Dividend Equity ETF", "asset_class": "Dividend ETF", "category": "income", "risk_level": "moderate", "expense_ratio": 0.0006, "liquidity_score": 0.87},
    {"ticker": "GLD", "instrument_name": "SPDR Gold Shares", "asset_class": "Gold ETF", "category": "hedge", "risk_level": "moderate", "expense_ratio": 0.0040, "liquidity_score": 0.91},
    {"ticker": "IAU", "instrument_name": "iShares Gold Trust", "asset_class": "Gold ETF", "category": "hedge", "risk_level": "moderate", "expense_ratio": 0.0025, "liquidity_score": 0.85},
    {"ticker": "FBGRX", "instrument_name": "Fidelity Blue Chip Growth Fund", "asset_class": "Mutual Fund", "category": "growth", "risk_level": "high", "expense_ratio": 0.0079, "liquidity_score": 0.67},
    {"ticker": "VWINX", "instrument_name": "Vanguard Wellesley Income Fund", "asset_class": "Mutual Fund", "category": "income", "risk_level": "low", "expense_ratio": 0.0023, "liquidity_score": 0.62},
    {"ticker": "BRK-B", "instrument_name": "Berkshire Hathaway Class B", "asset_class": "US Stock", "category": "quality", "risk_level": "moderate", "expense_ratio": 0.0, "liquidity_score": 0.86},
    {"ticker": "MSFT", "instrument_name": "Microsoft Corp.", "asset_class": "US Stock", "category": "quality", "risk_level": "moderate", "expense_ratio": 0.0, "liquidity_score": 0.98},
]


def compute_metrics(history: pd.DataFrame) -> dict[str, float]:
    history = history.copy()
    history["return"] = history["Close"].pct_change()
    returns = history["return"].dropna()
    if returns.empty:
        return {
            "annual_return_1y": 0.0,
            "annualized_volatility_1y": 0.0,
            "max_drawdown_1y": 0.0,
        }

    cumulative = (1 + returns).cumprod()
    rolling_peak = cumulative.cummax()
    drawdown = cumulative / rolling_peak - 1

    total_return = cumulative.iloc[-1] - 1
    annualized_volatility = returns.std() * (252 ** 0.5)
    max_drawdown = abs(drawdown.min())

    return {
        "annual_return_1y": float(total_return),
        "annualized_volatility_1y": float(annualized_volatility),
        "max_drawdown_1y": float(max_drawdown),
    }


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--start", type=str, default="2024-01-01")
    parser.add_argument("--out", type=str, default="../data/market_universe.csv")
    args = parser.parse_args()

    try:
        import yfinance as yf
    except ImportError:
        raise SystemExit("Install yfinance first: pip install yfinance")

    rows = []
    for item in DEFAULT_UNIVERSE:
        df = yf.download(item["ticker"], start=args.start, auto_adjust=True, progress=False)
        if df.empty:
            continue

        df = df.reset_index()
        metrics = compute_metrics(df)
        rows.append(
            {
                **item,
                **metrics,
            }
        )

    if not rows:
        raise SystemExit("No market data downloaded.")

    out = pd.DataFrame(rows).sort_values(["asset_class", "annual_return_1y"], ascending=[True, False])
    Path(args.out).parent.mkdir(parents=True, exist_ok=True)
    out.to_csv(args.out, index=False)
    print(f"Saved {len(out)} rows to {args.out}")


if __name__ == "__main__":
    main()
