from __future__ import annotations

import argparse
import numpy as np
import pandas as pd


RISK_LEVELS = ["low", "moderate", "high"]
KNOWLEDGE_LEVELS = ["beginner", "intermediate", "advanced"]


def assign_label(row):
    savings_months = row["cash_savings"] / max(row["monthly_expenses"], 1)
    debt_ratio = row["total_debt"] / max(row["total_assets"] + row["cash_savings"], 1)

    if savings_months < 3 or debt_ratio > 0.7:
        return "capital_preservation"
    if row["risk_tolerance"] == "low" or row["knowledge_level"] == "beginner":
        return "income_focus"
    if row["goal_years"] <= 5:
        return "balanced_short_term"
    if row["risk_tolerance"] == "high" and row["goal_years"] >= 10:
        return "growth_aggressive"
    return "balanced_long_term"


def generate(rows: int, seed: int = 42):
    rng = np.random.default_rng(seed)
    data = []
    for _ in range(rows):
        age = int(rng.integers(18, 70))
        income = float(np.clip(rng.normal(85000, 45000), 12000, 400000))
        monthly_expenses = float(np.clip(rng.normal(income / 12 * 0.55, 1200), 500, income / 12 * 0.95))
        cash_savings = float(np.clip(rng.normal(income * 0.25, 25000), 0, 500000))
        total_assets = float(np.clip(rng.normal(income * 1.5, 120000), 0, 2000000))
        total_debt = float(np.clip(rng.normal(income * 0.35, 40000), 0, 500000))
        risk_tolerance = rng.choice(RISK_LEVELS, p=[0.35, 0.45, 0.20])
        knowledge_level = rng.choice(KNOWLEDGE_LEVELS, p=[0.5, 0.35, 0.15])
        goal_years = int(rng.integers(1, 30))
        target_amount = float(np.clip(rng.normal(1000000, 750000), 10000, 10000000))

        row = {
            "age": age,
            "income_annual": round(income, 2),
            "monthly_expenses": round(monthly_expenses, 2),
            "cash_savings": round(cash_savings, 2),
            "total_assets": round(total_assets, 2),
            "total_debt": round(total_debt, 2),
            "risk_tolerance": risk_tolerance,
            "knowledge_level": knowledge_level,
            "goal_years": goal_years,
            "target_amount": round(target_amount, 2),
            "label": assign_label({
                "monthly_expenses": monthly_expenses,
                "cash_savings": cash_savings,
                "total_debt": total_debt,
                "total_assets": total_assets,
                "risk_tolerance": risk_tolerance,
                "knowledge_level": knowledge_level,
                "goal_years": goal_years,
            }),
        }
        data.append(row)
    return pd.DataFrame(data)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--rows", type=int, default=20000)
    parser.add_argument("--out", type=str, default="../data/users.csv")
    args = parser.parse_args()
    df = generate(args.rows)
    df.to_csv(args.out, index=False)
    print(f"Saved {len(df)} rows to {args.out}")


if __name__ == "__main__":
    main()
