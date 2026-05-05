import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, Cell, ResponsiveContainer, Tooltip,
  LineChart, Line, AreaChart, Area, PieChart, Pie,
  CartesianGrid, Legend,
} from 'recharts';
import { Brain, Target, TrendingUp, Award, Layers, Percent } from 'lucide-react';
import { fetchMetrics, fetchGlobalShap } from '../services/api';

const COLORS = ['#3b82f6', '#22c55e', '#eab308', '#ef4444', '#a78bfa', '#f472b6', '#06b6d4', '#f97316'];

function StatCard({ icon: Icon, label, value, sub, color }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-2xl p-5 border border-white/5 shadow-xl"
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-inner" style={{ background: `${color}15`, border: `1px solid ${color}30` }}>
          <Icon size={18} style={{ color }} />
        </div>
        <span className="font-space text-[11px] uppercase tracking-wider text-[#8e90a2] font-semibold">{label}</span>
      </div>
      <p className="text-[28px] font-space font-bold text-white tracking-tight leading-none mb-1">{value}</p>
      {sub && <p className="font-space text-[10px] uppercase tracking-widest text-[#8e90a2]/70 mt-2">{sub}</p>}
    </motion.div>
  );
}

export default function MetricsDashboard() {
  const [metrics, setMetrics] = useState(null);
  const [globalShap, setGlobalShap] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([fetchMetrics(), fetchGlobalShap()])
      .then(([m, gs]) => {
        setMetrics(m);
        setGlobalShap(gs);
      })
      .catch((e) => setError(e?.response?.data?.detail || 'Failed to load metrics. Run train.py first.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="bg-[#051424] min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 rounded-full border-2 border-[#2E5BFF]/20 border-t-[#2E5BFF] animate-spin mx-auto mb-3 shadow-[0_0_15px_rgba(46,91,255,0.5)]" />
          <p className="font-space text-[11px] uppercase tracking-widest text-[#8e90a2]">Loading model metrics…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-[#051424] min-h-screen flex items-center justify-center">
        <div className="glass rounded-2xl p-8 max-w-md text-center border border-[#ef4444]/20 shadow-[0_0_30px_rgba(239,68,68,0.1)]">
          <p className="text-[#ef4444] font-inter text-sm mb-2">⚠️ {error}</p>
          <p className="text-[#8e90a2] font-inter text-xs">Run <code className="text-[#2E5BFF] bg-[#2E5BFF]/10 px-1.5 py-0.5 rounded">python model/train.py</code> to generate metrics.</p>
        </div>
      </div>
    );
  }

  const cm = metrics.confusion_matrix || [[0,0],[0,0]];
  const cmData = [
    { name: 'True Neg', value: cm[0][0], color: '#22c55e' },
    { name: 'False Pos', value: cm[0][1], color: '#ef4444' },
    { name: 'False Neg', value: cm[1][0], color: '#f97316' },
    { name: 'True Pos', value: cm[1][1], color: '#3b82f6' },
  ];

  const cv = metrics.cross_validation || {};
  const cvBarData = Object.entries(cv).map(([metric, vals]) => ({
    metric: metric.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase()),
    mean: vals.mean,
    std: vals.std,
  }));

  const classDist = metrics.class_distribution || {};

  return (
    <div className="bg-[#051424] text-[#d4e4fa] min-h-screen font-inter selection:bg-[#2E5BFF]/30 pb-24">
      {/* Header */}
      <header className="glass border-b border-white/5 px-6 py-4 flex items-center gap-3 sticky top-0 z-40">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#2E5BFF] to-[#124af0] flex items-center justify-center shadow-[0_0_15px_rgba(46,91,255,0.4)]">
          <TrendingUp size={20} className="text-white" />
        </div>
        <div>
          <h1 className="text-white font-manrope font-bold text-lg leading-none tracking-tight">Model Performance</h1>
          <p className="text-[#8e90a2] font-space text-[11px] uppercase tracking-widest mt-1">Evaluation metrics & cross-validation</p>
        </div>
      </header>

      <div className="p-6" style={{ maxWidth: 1400, margin: '0 auto' }}>

        {/* key metric cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          <StatCard icon={Target} label="Accuracy" value={`${(metrics.accuracy * 100).toFixed(1)}%`} sub={cv.accuracy ? `CV: ${(cv.accuracy.mean * 100).toFixed(1)}% ± ${(cv.accuracy.std * 100).toFixed(1)}%` : null} color="#22c55e" />
          <StatCard icon={Award} label="ROC-AUC" value={`${(metrics.roc_auc * 100).toFixed(1)}%`} sub={cv.roc_auc ? `CV: ${(cv.roc_auc.mean * 100).toFixed(1)}%` : null} color="#3b82f6" />
          <StatCard icon={Layers} label="F1 Score" value={`${(metrics.f1 * 100).toFixed(1)}%`} sub={cv.f1 ? `CV: ${(cv.f1.mean * 100).toFixed(1)}%` : null} color="#a78bfa" />
          <StatCard icon={Percent} label="Precision" value={`${(metrics.precision * 100).toFixed(1)}%`} color="#f472b6" />
          <StatCard icon={TrendingUp} label="KS Stat" value={metrics.ks_statistic} sub="Discriminative power" color="#eab308" />
          <StatCard icon={Brain} label="Gini" value={metrics.gini} sub={`Threshold: ${metrics.threshold}`} color="#06b6d4" />
        </div>

        {/* charts row 1: roc + pr + confusion matrix */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">

          {/* ROC Curve */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl p-5 border border-white/5 shadow-xl">
            <h3 className="text-[15px] font-manrope font-semibold text-white mb-1 tracking-tight">ROC Curve</h3>
            <p className="font-space text-[10px] uppercase tracking-widest text-[#8e90a2] mb-3">AUC = {metrics.roc_auc}</p>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={metrics.roc_curve}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="fpr" tick={{ fill: '#8e90a2', fontSize: 10, fontFamily: 'Space Grotesk' }} label={{ value: 'FPR', position: 'insideBottom', fill: '#8e90a2', fontSize: 10, dy: 10, fontFamily: 'Space Grotesk' }} />
                <YAxis tick={{ fill: '#8e90a2', fontSize: 10, fontFamily: 'Space Grotesk' }} label={{ value: 'TPR', position: 'insideLeft', fill: '#8e90a2', fontSize: 10, angle: -90, fontFamily: 'Space Grotesk' }} />
                <Tooltip contentStyle={{ background: 'rgba(5,20,36,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, fontSize: 11, fontFamily: 'Inter' }} />
                <Area type="monotone" dataKey="tpr" stroke="#2E5BFF" fill="url(#colorUv)" strokeWidth={2} />
                <defs>
                  <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2E5BFF" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#2E5BFF" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <Line type="linear" dataKey="fpr" stroke="rgba(255,255,255,0.15)" strokeDasharray="4 4" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>

          {/* PR Curve */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass rounded-2xl p-5 border border-white/5 shadow-xl">
            <h3 className="text-[15px] font-manrope font-semibold text-white mb-1 tracking-tight">Precision-Recall Curve</h3>
            <p className="font-space text-[10px] uppercase tracking-widest text-[#8e90a2] mb-3">Trade-off at threshold {metrics.threshold}</p>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={metrics.pr_curve}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="recall" tick={{ fill: '#8e90a2', fontSize: 10, fontFamily: 'Space Grotesk' }} label={{ value: 'Recall', position: 'insideBottom', fill: '#8e90a2', fontSize: 10, dy: 10, fontFamily: 'Space Grotesk' }} />
                <YAxis tick={{ fill: '#8e90a2', fontSize: 10, fontFamily: 'Space Grotesk' }} label={{ value: 'Precision', position: 'insideLeft', fill: '#8e90a2', fontSize: 10, angle: -90, fontFamily: 'Space Grotesk' }} />
                <Tooltip contentStyle={{ background: 'rgba(5,20,36,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, fontSize: 11, fontFamily: 'Inter' }} />
                <Line type="monotone" dataKey="precision" stroke="#b8c3ff" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Confusion Matrix */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass rounded-2xl p-5 border border-white/5 shadow-xl flex flex-col">
            <h3 className="text-[15px] font-manrope font-semibold text-white mb-1 tracking-tight">Confusion Matrix</h3>
            <p className="font-space text-[10px] uppercase tracking-widest text-[#8e90a2] mb-3">Predicted vs Actual</p>
            <div className="grid grid-cols-2 gap-3 mt-auto mb-auto">
              {[
                { label: 'True Negative', val: cm[0][0], color: '#10b981', sub: 'Correct: No Default' },
                { label: 'False Positive', val: cm[0][1], color: '#ef4444', sub: 'Type I Error' },
                { label: 'False Negative', val: cm[1][0], color: '#f59e0b', sub: 'Type II Error' },
                { label: 'True Positive', val: cm[1][1], color: '#2E5BFF', sub: 'Correct: Default' },
              ].map(({ label, val, color, sub }) => (
                <div key={label} className="rounded-xl p-3 text-center" style={{ background: `${color}15`, border: `1px solid ${color}30` }}>
                  <p className="text-2xl font-space font-bold" style={{ color }}>{val.toLocaleString()}</p>
                  <p className="text-xs font-inter font-medium text-white mt-1">{label}</p>
                  <p className="text-[10px] font-space uppercase tracking-widest mt-1 opacity-70" style={{ color }}>{sub}</p>
                </div>
              ))}
            </div>
            {/* Axis labels */}
            <div className="flex justify-between mt-3 px-1">
              <span className="font-space text-[10px] uppercase tracking-widest text-[#8e90a2]">← Predicted →</span>
              <span className="font-space text-[10px] uppercase tracking-widest text-[#8e90a2]">↑ Actual ↓</span>
            </div>
          </motion.div>
        </div>

        {/* charts row 2: cross-validation + global shap + class dist */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">

          {/* Cross-Validation Results */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass rounded-2xl p-5 border border-white/5 shadow-xl">
            <h3 className="text-[15px] font-manrope font-semibold text-white mb-1 tracking-tight">5-Fold Cross-Validation</h3>
            <p className="font-space text-[10px] uppercase tracking-widest text-[#8e90a2] mb-3">Mean ± Std across folds</p>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={cvBarData} layout="vertical" margin={{ left: 10, right: 20 }}>
                <XAxis type="number" domain={[0, 1]} tick={{ fill: '#8e90a2', fontSize: 10, fontFamily: 'Space Grotesk' }} tickFormatter={v => `${(v*100).toFixed(0)}%`} />
                <YAxis dataKey="metric" type="category" width={80} tick={{ fill: '#d4e4fa', fontSize: 10, fontFamily: 'Inter' }} />
                <Tooltip contentStyle={{ background: 'rgba(5,20,36,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, fontSize: 11, fontFamily: 'Inter' }} formatter={(v) => `${(v*100).toFixed(1)}%`} />
                <Bar dataKey="mean" radius={[0, 4, 4, 0]}>
                  {cvBarData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Global SHAP Feature Importance */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="glass rounded-2xl p-5 border border-white/5 shadow-xl">
            <h3 className="text-[15px] font-manrope font-semibold text-white mb-1 tracking-tight">Global Feature Importance</h3>
            <p className="font-space text-[10px] uppercase tracking-widest text-[#8e90a2] mb-3">Mean |SHAP| across {globalShap?.sample_size || '?'} test samples</p>
            {globalShap?.feature_importance && (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart
                  data={globalShap.feature_importance.slice(0, 8).map(f => ({
                    ...f,
                    label: f.feature.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
                  }))}
                  layout="vertical"
                  margin={{ left: 10, right: 20 }}
                >
                  <XAxis type="number" tick={{ fill: '#8e90a2', fontSize: 10, fontFamily: 'Space Grotesk' }} />
                  <YAxis dataKey="label" type="category" width={120} tick={{ fill: '#d4e4fa', fontSize: 10, fontFamily: 'Inter' }} />
                  <Tooltip contentStyle={{ background: 'rgba(5,20,36,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, fontSize: 11, fontFamily: 'Inter' }} />
                  <Bar dataKey="importance" radius={[0, 4, 4, 0]}>
                    {globalShap.feature_importance.slice(0, 8).map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </motion.div>

          {/* Class Distribution */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="glass rounded-2xl p-5 border border-white/5 shadow-xl">
            <h3 className="text-[15px] font-manrope font-semibold text-white mb-1 tracking-tight">Class Distribution</h3>
            <p className="font-space text-[10px] uppercase tracking-widest text-[#8e90a2] mb-3">{classDist.total?.toLocaleString()} total samples</p>
            <div className="flex items-center justify-center">
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={[
                      { name: 'No Default', value: classDist.negative || 0 },
                      { name: 'Default', value: classDist.positive || 0 },
                    ]}
                    cx="50%" cy="50%"
                    innerRadius={45} outerRadius={70}
                    paddingAngle={3}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent*100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    <Cell fill="#10b98188" stroke="#10b981" />
                    <Cell fill="#ef444488" stroke="#ef4444" />
                  </Pie>
                  <Tooltip contentStyle={{ background: 'rgba(5,20,36,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, fontSize: 11, fontFamily: 'Inter' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-4 mt-2">
              <span className="font-space text-[10px] uppercase tracking-widest text-[#10b981]">● No Default ({classDist.negative?.toLocaleString()})</span>
              <span className="font-space text-[10px] uppercase tracking-widest text-[#ef4444]">● Default ({classDist.positive?.toLocaleString()})</span>
            </div>
          </motion.div>
        </div>

      </div>
    </div>
  );
}
