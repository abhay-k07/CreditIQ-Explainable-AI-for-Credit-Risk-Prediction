import React from 'react';
import { motion } from 'framer-motion';
import { AlertCircle } from 'lucide-react';

const fields = [
  { key: 'rev_util', label: 'Revolving Utilization', placeholder: '0.0 – 1.0', step: '0.01', min: 0, max: 1 },
  { key: 'age', label: 'Age', placeholder: 'e.g. 35', step: '1', min: 18, max: 120 },
  { key: 'late_30_59', label: 'Late (30–59 Days)', placeholder: 'e.g. 2', step: '1', min: 0, max: 20 },
  { key: 'late_60_89', label: 'Late (60–89 Days)', placeholder: 'e.g. 1', step: '1', min: 0, max: 20 },
  { key: 'late_90', label: 'Late (90+ Days)', placeholder: 'e.g. 0', step: '1', min: 0, max: 20 },
  { key: 'debt_ratio', label: 'Debt Ratio', placeholder: '0.0 – 1.0+', step: '0.01', min: 0, max: 100 },
  { key: 'monthly_inc', label: 'Monthly Income ($)', placeholder: 'e.g. 5000', step: '100', min: 0, max: 1000000 },
  { key: 'open_credit', label: 'Open Credit Lines', placeholder: 'e.g. 8', step: '1', min: 0, max: 100 },
  { key: 'real_estate', label: 'Real Estate Loans', placeholder: 'e.g. 1', step: '1', min: 0, max: 50 },
  { key: 'dependents', label: 'Dependents', placeholder: 'e.g. 2', step: '1', min: 0, max: 20 },
];

export default function InputForm({ values, onChange, onSubmit, loading, error }) {
  const handleChange = (key, value) => {
    onChange({ ...values, [key]: value });
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
      className="glass rounded-2xl p-6 h-full flex flex-col"
    >
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-xl font-manrope font-semibold text-white tracking-tight">Applicant Profile</h2>
        <p className="text-[#8e90a2] font-inter text-sm mt-1">Enter financial attributes below</p>
      </div>

      {/* Fields */}
      <div className="flex-1 overflow-y-auto pr-1 space-y-3">
        {fields.map(({ key, label, placeholder, step, min, max }) => (
          <div key={key}>
            <label className="block text-[11px] font-space font-medium text-[#8e90a2] mb-1.5 uppercase tracking-wider">
              {label}
            </label>
            <input
              type="number"
              step={step}
              min={min}
              max={max}
              placeholder={placeholder}
              value={values[key] ?? ''}
              onChange={(e) => handleChange(key, e.target.value)}
              className="w-full bg-[#122131]/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm font-space text-white placeholder-[#8e90a2]/50 focus:outline-none focus:border-[#2E5BFF] focus:bg-[#1c2b3c] focus:shadow-[0_0_10px_rgba(46,91,255,0.2)] transition-all duration-200"
            />
          </div>
        ))}
      </div>

      {/* Error */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 flex items-start gap-2 bg-[#ef4444]/10 border border-[#ef4444]/20 rounded-xl px-4 py-3"
        >
          <AlertCircle size={16} className="text-[#ef4444] mt-0.5 flex-shrink-0" />
          <p className="text-[#ffb4ab] text-xs font-inter leading-relaxed">{error}</p>
        </motion.div>
      )}

      {/* Submit */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={onSubmit}
        disabled={loading}
        className="mt-5 w-full py-3.5 rounded-xl font-manrope font-semibold text-sm tracking-wide relative overflow-hidden transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed text-[#d4e4fa]"
        style={{
          background: loading
            ? 'rgba(46,91,255,0.2)'
            : '#2E5BFF',
          boxShadow: loading ? 'none' : '0 4px 20px rgba(46,91,255,0.4)',
        }}
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="white" strokeWidth="4" />
              <path className="opacity-75" fill="white" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Analyzing…
          </span>
        ) : (
          '⚡ Analyze Risk'
        )}
      </motion.button>
    </motion.div>
  );
}
