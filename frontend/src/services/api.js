import axios from 'axios';

// FORCE the HTTPS Hugging Face URL here
const API_BASE = 'https://abhay-k07-creditiq.hf.space';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

// The rest of your code remains exactly the same...

/**
 * Single credit risk prediction.
 * Returns: { risk, probability, risk_label, top_reasons, shap_values, threshold }
 */
export async function predictRisk(values) {
  const payload = {
    rev_util:   parseFloat(values.rev_util)   || 0,
    age:        parseInt(values.age)           || 30,
    late_30_59: parseInt(values.late_30_59)    || 0,
    late_60_89: parseInt(values.late_60_89)    || 0,
    late_90:    parseInt(values.late_90)       || 0,
    debt_ratio: parseFloat(values.debt_ratio)  || 0,
    monthly_inc:parseFloat(values.monthly_inc) || 0,
    open_credit:parseInt(values.open_credit)   || 0,
    real_estate:parseInt(values.real_estate)   || 0,
    dependents: parseInt(values.dependents)    || 0,
  };
  const { data } = await api.post('/predict', payload);
  return data;
}

/**
 * Health check — returns model status, accuracy, version.
 */
export async function fetchHealth() {
  const { data } = await api.get('/health');
  return data;
}

/**
 * Model evaluation metrics — confusion matrix, ROC, PR, CV results.
 */
export async function fetchMetrics() {
  const { data } = await api.get('/metrics');
  return data;
}

/**
 * Global SHAP feature importance.
 */
export async function fetchGlobalShap() {
  const { data } = await api.get('/global-shap');
  return data;
}

/**
 * Fairness analysis data.
 */
export async function fetchFairness() {
  const { data } = await api.get('/fairness');
  return data;
}

/**
 * Batch prediction from CSV file.
 */
export async function predictBatch(file) {
  const formData = new FormData();
  formData.append('file', file);
  const { data } = await api.post('/predict/batch', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

export default api;
