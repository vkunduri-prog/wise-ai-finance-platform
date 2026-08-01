from __future__ import annotations

import argparse
from pathlib import Path
import joblib
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, accuracy_score
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder


NUMERIC = ["age", "income_annual", "monthly_expenses", "cash_savings", "total_assets", "total_debt", "goal_years", "target_amount"]
CATEGORICAL = ["risk_tolerance", "knowledge_level"]


def train(data_path: str, out_dir: str):
    df = pd.read_csv(data_path)
    X = df[NUMERIC + CATEGORICAL]
    y = df["label"]

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)

    preprocessor = ColumnTransformer(
        transformers=[
            ("cat", OneHotEncoder(handle_unknown="ignore"), CATEGORICAL),
            ("num", "passthrough", NUMERIC),
        ]
    )

    model = RandomForestClassifier(
        n_estimators=250,
        max_depth=14,
        random_state=42,
        class_weight="balanced_subsample",
    )

    pipeline = Pipeline([
        ("preprocessor", preprocessor),
        ("model", model),
    ])

    pipeline.fit(X_train, y_train)
    preds = pipeline.predict(X_test)
    print("Accuracy:", round(accuracy_score(y_test, preds), 4))
    print(classification_report(y_test, preds))

    out_path = Path(out_dir)
    out_path.mkdir(parents=True, exist_ok=True)
    joblib.dump(pipeline, out_path / "recommender.joblib")
    print(f"Saved model to {out_path / 'recommender.joblib'}")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--data", type=str, required=True)
    parser.add_argument("--out", type=str, default="../backend/app/ml_artifacts")
    args = parser.parse_args()
    train(args.data, args.out)


if __name__ == "__main__":
    main()
