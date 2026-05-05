
import os
import pickle
import json
import numpy as np
import pandas as pd

from sklearn.model_selection import train_test_split, StratifiedKFold, cross_validate
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    roc_auc_score, confusion_matrix, roc_curve, precision_recall_curve
)
from scipy.stats import ks_2samp
from xgboost import XGBClassifier
import shap

from preprocess import load_data, clean_data, split_data
from feature_engineering import create_features

# load & preprocess
print("Loading data...")
base_path = os.path.dirname(os.path.abspath(__file__))
data_path = os.path.join(base_path, "..", "data", "Credit Risk Benchmark Dataset.csv")

df = load_data(data_path)
df = clean_data(df)

X, y = split_data(df)
X = create_features(X)

# Save columns (IMPORTANT)
os.makedirs("../artifacts", exist_ok=True)
pickle.dump(X.columns.tolist(), open("../artifacts/columns.pkl", "wb"))

# Split — stratified to preserve class distribution
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

# Fit cleaning thresholds on TRAINING DATA ONLY (fixes data leakage)
train_thresholds = {
    "monthly_inc_99": float(X_train["monthly_inc"].quantile(0.99)),
    "debt_ratio_99": float(X_train["debt_ratio"].quantile(0.99)),
}
with open("../artifacts/train_thresholds.json", "w") as f:
    json.dump(train_thresholds, f, indent=2)
print(f"📊 Train thresholds saved: {train_thresholds}")

# model: xgboost
# Using XGBoost alone (not stacking) so SHAP TreeExplainer is consistent
print("Training XGBoost...")
xgb = XGBClassifier(
    n_estimators=400,
    max_depth=7,
    learning_rate=0.03,
    subsample=0.9,
    colsample_bytree=0.9,
    scale_pos_weight=1.2,
    random_state=42,
    eval_metric="logloss",
)

xgb.fit(X_train, y_train)

# cross-validation (5-fold stratified)
print("Running 5-fold cross-validation...")
cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
cv_results = cross_validate(
    xgb, X, y, cv=cv,
    scoring=["accuracy", "precision", "recall", "f1", "roc_auc"],
    return_train_score=False
)

cv_summary = {}
for metric in ["accuracy", "precision", "recall", "f1", "roc_auc"]:
    key = f"test_{metric}"
    cv_summary[metric] = {
        "mean": round(float(np.mean(cv_results[key])), 4),
        "std": round(float(np.std(cv_results[key])), 4),
        "folds": [round(float(v), 4) for v in cv_results[key]],
    }
    print(f"  {metric}: {cv_summary[metric]['mean']:.4f} ± {cv_summary[metric]['std']:.4f}")

# test set evaluation
print("Evaluating on test set...")
y_pred = xgb.predict(X_test)
y_prob = xgb.predict_proba(X_test)[:, 1]

THRESHOLD = 0.4
y_pred_tuned = (y_prob > THRESHOLD).astype(int)

accuracy = round(float(accuracy_score(y_test, y_pred_tuned)), 4)
precision = round(float(precision_score(y_test, y_pred_tuned, zero_division=0)), 4)
recall_val = round(float(recall_score(y_test, y_pred_tuned, zero_division=0)), 4)
f1 = round(float(f1_score(y_test, y_pred_tuned, zero_division=0)), 4)
roc_auc = round(float(roc_auc_score(y_test, y_prob)), 4)

# KS Statistic
ks = ks_2samp(y_prob[y_test == 1], y_prob[y_test == 0])
ks_stat = round(float(ks.statistic), 4)

# Gini
gini = round(2 * roc_auc - 1, 4)

# Confusion matrix
cm = confusion_matrix(y_test, y_pred_tuned).tolist()

# ROC curve data (sampled for frontend)
fpr, tpr, thresholds_roc = roc_curve(y_test, y_prob)
roc_data = [{"fpr": round(float(f), 4), "tpr": round(float(t), 4)}
            for f, t in zip(fpr[::max(1, len(fpr)//50)], tpr[::max(1, len(tpr)//50)])]

# Precision-Recall curve data
pr_precision, pr_recall, _ = precision_recall_curve(y_test, y_prob)
pr_data = [{"precision": round(float(p), 4), "recall": round(float(r), 4)}
           for p, r in zip(pr_precision[::max(1, len(pr_precision)//50)],
                           pr_recall[::max(1, len(pr_recall)//50)])]

# Class distribution
class_dist = {
    "total": int(len(y)),
    "positive": int(y.sum()),
    "negative": int(len(y) - y.sum()),
    "positive_pct": round(float(y.mean()) * 100, 1),
}

print(f"  Accuracy:  {accuracy}")
print(f"  Precision: {precision}")
print(f"  Recall:    {recall_val}")
print(f"  F1:        {f1}")
print(f"  ROC-AUC:   {roc_auc}")
print(f"  KS:        {ks_stat}")
print(f"  Gini:      {gini}")
print(f"  Class dist: {class_dist}")

# save metrics
metrics = {
    "accuracy": accuracy,
    "precision": precision,
    "recall": recall_val,
    "f1": f1,
    "roc_auc": roc_auc,
    "ks_statistic": ks_stat,
    "gini": gini,
    "threshold": THRESHOLD,
    "confusion_matrix": cm,
    "roc_curve": roc_data,
    "pr_curve": pr_data,
    "class_distribution": class_dist,
    "cross_validation": cv_summary,
}

with open("../artifacts/metrics.json", "w") as f:
    json.dump(metrics, f, indent=2)
print("✅ Metrics saved to artifacts/metrics.json")

# shap global summary
print("Computing global SHAP values...")
explainer_obj = shap.TreeExplainer(xgb)

# Use a sample of test data for global SHAP (faster)
sample_size = min(500, len(X_test))
X_sample = X_test.sample(n=sample_size, random_state=42)
shap_values = explainer_obj.shap_values(X_sample)

# Mean absolute SHAP per feature
mean_abs_shap = np.abs(shap_values).mean(axis=0)
feature_importance = sorted(
    [{"feature": col, "importance": round(float(v), 6)}
     for col, v in zip(X.columns, mean_abs_shap)],
    key=lambda x: x["importance"], reverse=True
)

global_shap = {
    "feature_importance": feature_importance,
    "sample_size": sample_size,
    "features": X.columns.tolist(),
}

with open("../artifacts/global_shap.json", "w") as f:
    json.dump(global_shap, f, indent=2)
print("✅ Global SHAP saved to artifacts/global_shap.json")

# fairness analysis (by age groups)
print("⚖️  Computing fairness analysis...")
X_test_copy = X_test.copy()
X_test_copy["y_true"] = y_test.values
X_test_copy["y_prob"] = y_prob
X_test_copy["y_pred"] = y_pred_tuned

# Age buckets
age_bins = [(18, 30, "18-30"), (31, 45, "31-45"), (46, 60, "46-60"), (61, 120, "61+")]
fairness_groups = []

for low, high, label in age_bins:
    mask = (X_test_copy["age"] >= low) & (X_test_copy["age"] <= high)
    group = X_test_copy[mask]
    if len(group) < 5:
        continue

    grp_acc = round(float(accuracy_score(group["y_true"], group["y_pred"])), 4)
    grp_pred_rate = round(float(group["y_pred"].mean()), 4)
    grp_true_rate = round(float(group["y_true"].mean()), 4)
    grp_avg_prob = round(float(group["y_prob"].mean()), 4)

    fairness_groups.append({
        "group": label,
        "count": int(len(group)),
        "accuracy": grp_acc,
        "prediction_rate": grp_pred_rate,
        "actual_default_rate": grp_true_rate,
        "avg_probability": grp_avg_prob,
    })

# Disparate impact: ratio of prediction rates (min group / max group)
pred_rates = [g["prediction_rate"] for g in fairness_groups if g["prediction_rate"] > 0]
disparate_impact = round(min(pred_rates) / max(pred_rates), 4) if pred_rates and max(pred_rates) > 0 else None

fairness_result = {
    "groups": fairness_groups,
    "disparate_impact_ratio": disparate_impact,
    "threshold_used": THRESHOLD,
    "interpretation": "A disparate impact ratio below 0.8 may indicate potential bias."
                      if disparate_impact and disparate_impact < 0.8
                      else "Disparate impact ratio is within acceptable range (≥ 0.8)."
                      if disparate_impact
                      else "Insufficient data for disparate impact calculation.",
}

with open("../artifacts/fairness.json", "w") as f:
    json.dump(fairness_result, f, indent=2)
print(f"✅ Fairness analysis saved. Disparate impact: {disparate_impact}")

# save model & explainer
pickle.dump(xgb, open("../artifacts/xgb_model.pkl", "wb"))
pickle.dump(explainer_obj, open("../artifacts/explainer.pkl", "wb"))
print("✅ XGBoost model + SHAP explainer saved!")
print("\n🎉 Training complete! All artifacts saved to ../artifacts/")