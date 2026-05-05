

from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional
import pickle
import json
import numpy as np
import pandas as pd
import sys
import os
import io
from pathlib import Path

# Add model folder to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'model')))

from feature_engineering import create_features

app = FastAPI(
    title="CreditIQ API",
    description="Explainable AI Credit Risk Prediction",
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# artifact loading (graceful)
ARTIFACTS_DIR = Path(__file__).resolve().parent.parent / "artifacts"

def load_artifact(name):
    
    path = ARTIFACTS_DIR / name
    if not path.exists():
        print(f"⚠️  Artifact not found: {path}")
        return None
    try:
        with open(path, "rb") as f:
            return pickle.load(f)
    except Exception as e:
        print(f"⚠️  Failed to load {name}: {e}")
        return None

# Use XGBoost for BOTH prediction and SHAP — fixes model/explainer mismatch
model = load_artifact("xgb_model.pkl")
explainer = load_artifact("explainer.pkl")
columns = load_artifact("columns.pkl")

# Load pre-computed metrics if available
metrics_data = None
metrics_path = ARTIFACTS_DIR / "metrics.json"
if metrics_path.exists():
    with open(metrics_path) as f:
        metrics_data = json.load(f)

# Load global SHAP summary if available
global_shap_data = None
global_shap_path = ARTIFACTS_DIR / "global_shap.json"
if global_shap_path.exists():
    with open(global_shap_path) as f:
        global_shap_data = json.load(f)

# Load fairness data if available
fairness_data = None
fairness_path = ARTIFACTS_DIR / "fairness.json"
if fairness_path.exists():
    with open(fairness_path) as f:
        fairness_data = json.load(f)


# pydantic models (input validation)
class CreditApplication(BaseModel):
    
    rev_util: float = Field(..., ge=0, le=5, description="Revolving utilization ratio")
    age: int = Field(..., ge=18, le=120, description="Borrower age")
    late_30_59: int = Field(..., ge=0, le=50, description="Number of 30-59 day late payments")
    late_60_89: int = Field(..., ge=0, le=50, description="Number of 60-89 day late payments")
    late_90: int = Field(..., ge=0, le=50, description="Number of 90+ day late payments")
    debt_ratio: float = Field(..., ge=0, le=100, description="Monthly debt / income ratio")
    monthly_inc: float = Field(..., ge=0, le=1000000, description="Monthly income")
    open_credit: int = Field(..., ge=0, le=100, description="Number of open credit lines")
    real_estate: int = Field(..., ge=0, le=50, description="Number of real estate loans")
    dependents: int = Field(..., ge=0, le=20, description="Number of dependents")

class PredictionResponse(BaseModel):
    risk: int
    probability: float
    risk_label: str
    top_reasons: list[str]
    shap_values: dict[str, float]
    threshold: float


# helper functions
THRESHOLD = 0.4  # Tuned classification threshold

def format_explanation(shap_values, feature_names):
    
    exp = dict(zip(feature_names, [float(v) for v in shap_values]))
    sorted_exp = sorted(exp.items(), key=lambda x: abs(x[1]), reverse=True)

    reasons = [
        f"{k} {'increased' if v > 0 else 'decreased'} risk"
        for k, v in sorted_exp[:5]
    ]
    return reasons, exp

def get_risk_label(probability):
    
    if probability < 0.3:
        return "LOW"
    elif probability < 0.6:
        return "MEDIUM"
    else:
        return "HIGH"


# endpoints
@app.get("/")
def home():
    return {"message": "CreditIQ API running", "version": "2.0.0"}

@app.get("/health")
def health():
    
    model_loaded = model is not None
    explainer_loaded = explainer is not None

    accuracy = None
    roc_auc = None
    f1 = None
    if metrics_data:
        accuracy = metrics_data.get("accuracy")
        roc_auc = metrics_data.get("roc_auc")
        f1 = metrics_data.get("f1")

    return {
        "status": "healthy" if model_loaded and explainer_loaded else "degraded",
        "model_loaded": model_loaded,
        "explainer_loaded": explainer_loaded,
        "model_type": "XGBoost",
        "threshold": THRESHOLD,
        "accuracy": accuracy,
        "roc_auc": roc_auc,
        "f1": f1,
        "version": "2.0.0",
    }


@app.post("/predict", response_model=PredictionResponse)
def predict(data: CreditApplication):
    
    if model is None or explainer is None or columns is None:
        raise HTTPException(status_code=503, detail="Model artifacts not loaded. Run training first.")

    df = pd.DataFrame([data.model_dump()])

    # Apply feature engineering
    df = create_features(df)

    # Ensure correct column order
    df = df.reindex(columns=columns, fill_value=0)

    # Prediction (XGBoost — matches SHAP explainer)
    prob = float(model.predict_proba(df)[0][1])
    pred = int(prob > THRESHOLD)

    # SHAP explanation (same model used for prediction)
    shap_vals = explainer.shap_values(df)[0]
    top_reasons, shap_dict = format_explanation(shap_vals, columns)

    return PredictionResponse(
        risk=pred,
        probability=prob,
        risk_label=get_risk_label(prob),
        top_reasons=top_reasons,
        shap_values=shap_dict,
        threshold=THRESHOLD,
    )


@app.get("/metrics")
def get_metrics():
    
    if metrics_data is None:
        raise HTTPException(status_code=404, detail="Metrics not computed. Run evaluate.py first.")
    return metrics_data


@app.get("/global-shap")
def get_global_shap():
    
    if global_shap_data is None:
        raise HTTPException(status_code=404, detail="Global SHAP not computed. Run train.py first.")
    return global_shap_data


@app.get("/fairness")
def get_fairness():
    
    if fairness_data is None:
        raise HTTPException(status_code=404, detail="Fairness analysis not computed. Run evaluate.py first.")
    return fairness_data


@app.post("/predict/batch")
async def predict_batch(file: UploadFile = File(...)):
    
    if model is None or explainer is None or columns is None:
        raise HTTPException(status_code=503, detail="Model artifacts not loaded.")

    # Read uploaded CSV
    content = await file.read()
    try:
        df = pd.read_csv(io.BytesIO(content))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid CSV: {e}")

    required_cols = ['rev_util', 'age', 'late_30_59', 'late_60_89', 'late_90',
                     'debt_ratio', 'monthly_inc', 'open_credit', 'real_estate', 'dependents']
    missing = [c for c in required_cols if c not in df.columns]
    if missing:
        raise HTTPException(status_code=400, detail=f"Missing columns: {missing}")

    results = []
    for _, row in df.iterrows():
        try:
            input_df = pd.DataFrame([row[required_cols].to_dict()])
            input_df = create_features(input_df)
            input_df = input_df.reindex(columns=columns, fill_value=0)

            prob = float(model.predict_proba(input_df)[0][1])
            pred = int(prob > THRESHOLD)
            shap_vals = explainer.shap_values(input_df)[0]
            top_reasons, shap_dict = format_explanation(shap_vals, columns)

            results.append({
                "risk": pred,
                "probability": round(prob, 4),
                "risk_label": get_risk_label(prob),
                "top_reasons": top_reasons[:3],
                "input": row[required_cols].to_dict(),
            })
        except Exception as e:
            results.append({"error": str(e), "input": row[required_cols].to_dict()})

    return {
        "total": len(results),
        "results": results,
        "high_risk_count": sum(1 for r in results if r.get("risk") == 1),
        "low_risk_count": sum(1 for r in results if r.get("risk") == 0),
    }