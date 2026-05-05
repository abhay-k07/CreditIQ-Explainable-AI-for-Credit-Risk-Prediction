---
title: CreditIQ Explainable AI
emoji: 📊
colorFrom: blue
colorTo: indigo
sdk: docker
pinned: false
app_port: 7860
---
# Explainable Credit Risk Prediction

This project is a credit risk prediction application that explains its decisions. It uses an XGBoost model to predict whether a loan applicant is a high, medium, or low risk, and then uses SHAP to show exactly which financial factors pushed the score up or down.

The backend is built with FastAPI and the frontend is a React application that visualizes the risk score and feature impacts. It also includes a fairness analysis module that checks the prediction rates across different age groups.

## Features

- **XGBoost Classifier:** The core model used for predicting risk.
- **SHAP Integration:** Shows the impact of each feature on the final prediction using a TreeExplainer.
- **Fairness Analysis:** Checks the disparate impact ratio across different age demographics.
- **Interactive Dashboard:** A React frontend that allows you to input applicant data and see the real-time prediction and explanation.
- **What-If Simulation:** Sliders on the frontend let you tweak input values to see how they change the predicted risk score.
- **API Endpoints:** A FastAPI backend that handles validation and prediction requests.

## Tech Stack

- **Backend:** Python, FastAPI, Pydantic, XGBoost, SHAP, Scikit-learn
- **Frontend:** React 19, React Router, Tailwind CSS, Recharts
- **Deployment:** Docker, Docker Compose

## Model Performance

The model was evaluated using 5-fold stratified cross-validation. 

- **Accuracy:** 0.7716
- **Precision:** 0.7403
- **Recall:** 0.8387
- **F1 Score:** 0.7864
- **ROC-AUC:** 0.8530

## How It Works

1. The frontend collects financial data (income, debt, credit history, etc.) and sends it to the FastAPI backend.
2. The backend uses Pydantic to validate the input ranges.
3. The data is passed through a preprocessing pipeline that applies log transformations and calculates derived ratios.
4. The XGBoost model generates a risk probability.
5. SHAP calculates the exact feature contributions for that specific prediction.
6. The backend returns the probability and the SHAP values to the frontend.
7. The React dashboard visualizes the prediction using a risk gauge and a feature impact chart.

## Project Structure

- `model/`: The machine learning pipeline, including data preprocessing, feature engineering, and training scripts.
- `backend/`: The FastAPI application that serves the predictions.
- `frontend/`: The React dashboard.
- `artifacts/`: Saved model weights, the SHAP explainer, and evaluation metrics.
- `data/`: The credit risk benchmark dataset used for training.

## Run Locally

### Backend

```bash
cd backend
pip install -r ../requirements.txt
python -m uvicorn app:app --reload
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Docker

You can also run both the frontend and backend using Docker Compose:

```bash
docker compose up --build
```

The frontend will be available at `http://localhost:3000` and the API at `http://localhost:8000`.

## API Endpoints

- `GET /health`: Returns the API status and model version.
- `POST /predict`: Takes an applicant profile and returns the risk prediction and SHAP explanation.
- `GET /metrics`: Returns the model evaluation metrics (ROC, confusion matrix, cross-validation results).
- `GET /global-shap`: Returns the overall feature importance calculated across the test set.
- `GET /fairness`: Returns the age-based fairness analysis results.
- `POST /predict/batch`: Processes a batch of predictions from an uploaded CSV file.
