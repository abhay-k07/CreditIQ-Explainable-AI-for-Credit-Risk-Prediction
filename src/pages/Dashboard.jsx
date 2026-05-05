import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Activity, Zap, Shield, Wifi, WifiOff } from 'lucide-react';

import InputForm from '../components/InputForm';
import RiskGauge from '../components/RiskGauge';
import ExplanationCards from '../components/ExplanationCards';
import FeatureImpactChart from '../components/FeatureImpactChart';
import WhatIfPanel from '../components/WhatIfPanel';
import InsightBox from '../components/InsightBox';
import Recommendations from '../components/Recommendations';
import { predictRisk, fetchHealth } from '../services/api';

const defaultValues = {
  rev_util: '',
  age: '',
  late_30_59: '',
  late_60_89: '',
  late_90: '',
  debt_ratio: '',
  monthly_inc: '',
  open_credit: '',
  real_estate: '',
  dependents: '',
};

export default function Dashboard() {
  const [formValues, setFormValues] = useState(defaultValues);
  const [result, setResult]         = useState(null);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState('');

  // Real API health check (fixes A4)
  const [apiStatus, setApiStatus]   = useState('checking');
  const [modelStats, setModelStats] = useState(null);

  useEffect(() => {
    fetchHealth()
      .then((data) => {
        setApiStatus(data.status === 'healthy' ? 'connected' : 'degraded');
        setModelStats(data);
      })
      .catch(() => setApiStatus('disconnected'));
  }, []);

  const STATS = [
    { icon: Brain,    label: 'Model',       value: modelStats?.model_type || 'XGBoost', color: '#60a5fa' },
    { icon: Activity, label: 'Accuracy',    value: modelStats?.accuracy ? `${(modelStats.accuracy * 100).toFixed(1)}%` : '—', color: '#22c55e' },
    { icon: Zap,      label: 'ROC-AUC',     value: modelStats?.roc_auc ? `${(modelStats.roc_auc * 100).toFixed(1)}%` : '—', color: '#a78bfa' },
    { icon: Shield,   label: 'Explainable', value: 'SHAP Values', color: '#f472b6' },
  ];

  const runPrediction = useCallback(async (values) => {
    const missing = Object.entries(values).filter(([, v]) => v === '' || v === null || v === undefined);
    if (missing.length) {
      setError(`Please fill all fields. Missing: ${missing.map(([k]) => k).join(', ')}`);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const data = await predictRisk(values);
      setResult(data);

      // Save to prediction history (for PredictionHistory page)
      const history = JSON.parse(localStorage.getItem('creditiq_history') || '[]');
      history.unshift({
        id: Date.now(),
        timestamp: new Date().toISOString(),
        input: { ...values },
        result: data,
      });
      // Keep last 50 predictions
      localStorage.setItem('creditiq_history', JSON.stringify(history.slice(0, 50)));
    } catch (err) {
      const msg =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        err?.message ||
        'Connection failed. Is the backend running at http://127.0.0.1:8000?';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSubmit = () => runPrediction(formValues);

  const handleWhatIfChange = useCallback(
    (updatedValues) => {
      setFormValues(updatedValues);
      if (result) runPrediction(updatedValues);
    },
    [result, runPrediction]
  );

  const statusColor = apiStatus === 'connected' ? 'bg-green-400'
                     : apiStatus === 'degraded' ? 'bg-yellow-400'
                     : apiStatus === 'checking' ? 'bg-blue-400'
                     : 'bg-red-400';

  const statusText = apiStatus === 'connected' ? 'API Connected'
                   : apiStatus === 'degraded' ? 'API Degraded'
                   : apiStatus === 'checking' ? 'Connecting…'
                   : 'API Disconnected';

  const StatusIcon = apiStatus === 'disconnected' ? WifiOff : Wifi;

  return (
    <div className="bg-[#051424] text-[#d4e4fa] min-h-screen font-inter selection:bg-[#2E5BFF]/30">
      {/* top nav */}
      <header className="glass border-b border-white/5 px-6 py-4 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#2E5BFF] to-[#124af0] flex items-center justify-center shadow-[0_0_15px_rgba(46,91,255,0.4)]">
            <Brain size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-white font-manrope font-bold text-lg leading-none tracking-tight">CreditIQ</h1>
            <p className="text-[#8e90a2] font-space text-[11px] uppercase tracking-widest mt-1">Explainable AI Credit Risk</p>
          </div>
        </div>

        {/* Model stats — fetched from /health */}
        <div className="hidden md:flex items-center gap-6">
          {STATS.map(({ icon: Icon, label, value, color }) => (
            <div key={label} className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-white/5">
                <Icon size={14} style={{ color }} />
              </div>
              <div>
                <p className="font-space text-[10px] uppercase tracking-wider text-[#8e90a2] leading-none">{label}</p>
                <p className="font-space font-medium text-[#d4e4fa] mt-1 leading-none">{value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Real connection status (fixes A4) */}
        <div className="flex items-center gap-2 bg-[#122131] px-3 py-1.5 rounded-full border border-white/5">
          <StatusIcon size={12} className={apiStatus === 'disconnected' ? 'text-[#ef4444]' : 'text-[#10b981]'} />
          <span className={`w-2 h-2 rounded-full ${statusColor} ${apiStatus === 'checking' ? 'animate-pulse' : ''} shadow-[0_0_8px_currentColor]`} />
          <span className="font-space text-[11px] uppercase tracking-wider text-[#8e90a2]">{statusText}</span>
        </div>
      </header>

      {/* main grid */}
      <div className="p-6 grid grid-cols-12 gap-5" style={{ maxWidth: 1600, margin: '0 auto' }}>

        {/* LEFT: Input Form */}
        <div className="col-span-12 lg:col-span-3 flex flex-col" style={{ minHeight: 600 }}>
          <InputForm
            values={formValues}
            onChange={setFormValues}
            onSubmit={handleSubmit}
            loading={loading}
            error={error}
          />
        </div>

        {/* CENTER + RIGHT */}
        <div className="col-span-12 lg:col-span-9 flex flex-col gap-5">

          {/* Top row: Gauge + What-If */}
          <div className="grid grid-cols-12 gap-5">
            <div className="col-span-12 md:col-span-5 flex flex-col gap-4">
              <RiskGauge probability={result?.probability ?? 0} />

              {/* AI Insight box — directly below gauge */}
              <AnimatePresence>
                {result && (
                  <InsightBox
                    topReasons={result.top_reasons}
                    probability={result.probability}
                  />
                )}
              </AnimatePresence>
            </div>

            <div className="col-span-12 md:col-span-7">
              <WhatIfPanel
                values={formValues}
                onChange={handleWhatIfChange}
                isLoading={loading}
              />
            </div>
          </div>

          {/* Results area */}
          <AnimatePresence>
            {result && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.5 }}
                className="flex flex-col gap-5"
              >
                {/* Explanations + Feature Impact — side by side */}
                <div className="grid grid-cols-12 gap-5">
                  <div className="col-span-12 md:col-span-6">
                    <ExplanationCards topReasons={result.top_reasons} />
                  </div>
                  <div className="col-span-12 md:col-span-6">
                    <FeatureImpactChart
                      topReasons={result.top_reasons}
                      shapValues={result.shap_values}
                    />
                  </div>
                </div>

                {/* Recommendations — full width */}
                <Recommendations topReasons={result.top_reasons} />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Empty state */}
          {!result && !loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="glass rounded-2xl p-10 flex flex-col items-center justify-center text-center border border-white/5"
              style={{ minHeight: 240 }}
            >
              <div className="w-16 h-16 rounded-2xl bg-[#2E5BFF]/10 flex items-center justify-center mb-4 border border-[#2E5BFF]/20 shadow-[0_0_20px_rgba(46,91,255,0.15)]">
                <Brain size={32} className="text-[#2E5BFF]" />
              </div>
              <h3 className="text-white font-manrope font-semibold text-xl mb-2 tracking-tight">Ready to Analyze</h3>
              <p className="text-[#8e90a2] text-sm max-w-sm leading-relaxed">
                Fill in the applicant&apos;s financial profile on the left and click{' '}
                <strong className="text-[#b8c3ff] font-medium">Analyze Risk</strong> to see the XAI prediction.
              </p>
            </motion.div>
          )}

          {/* Loading state */}
          {loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="glass rounded-2xl p-10 flex flex-col items-center justify-center border border-white/5"
              style={{ minHeight: 240 }}
            >
              <div className="relative w-12 h-12 mb-4">
                <div className="absolute inset-0 rounded-full border-2 border-[#2E5BFF]/20" />
                <div className="absolute inset-0 rounded-full border-t-2 border-[#2E5BFF] animate-spin shadow-[0_0_15px_rgba(46,91,255,0.5)]" />
              </div>
              <p className="font-space text-[#8e90a2] text-sm tracking-wide uppercase">Running prediction model…</p>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
