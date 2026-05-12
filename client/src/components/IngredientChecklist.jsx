import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../utils/api';

export default function IngredientChecklist({ ingredients, recipeId }) {
  const storageKey = `checklist_${recipeId}`;

  const [checked, setChecked] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(storageKey)) || {};
    } catch {
      return {};
    }
  });

  const [substituteIndex, setSubstituteIndex] = useState(null);
  const [substituteData, setSubstituteData] = useState({});
  const [loadingSub, setLoadingSub] = useState(false);

  const handleSubstitute = async (index, ingredientText) => {
    if (substituteIndex === index) {
      setSubstituteIndex(null);
      return;
    }
    setSubstituteIndex(index);
    if (substituteData[index]) return; // Already cached

    setLoadingSub(true);
    try {
      const data = await api.post('/ai/substitute', { ingredient: ingredientText });
      setSubstituteData(prev => ({ ...prev, [index]: data.substitution }));
    } catch (err) {
      setSubstituteData(prev => ({ ...prev, [index]: err.message || 'Error connecting to server.' }));
    } finally {
      setLoadingSub(false);
    }
  };

  const toggleItem = (index) => {
    const updated = { ...checked, [index]: !checked[index] };
    setChecked(updated);
    localStorage.setItem(storageKey, JSON.stringify(updated));
  };

  const checkAll = () => {
    const all = {};
    ingredients.forEach((_, i) => { all[i] = true; });
    setChecked(all);
    localStorage.setItem(storageKey, JSON.stringify(all));
  };

  const clearAll = () => {
    setChecked({});
    localStorage.removeItem(storageKey);
  };

  const checkedCount = Object.values(checked).filter(Boolean).length;

  return (
    <div>
      <div className="checklist-actions">
        <button className="btn btn-sm btn-secondary" onClick={checkAll}>
          ✅ Check All
        </button>
        <button className="btn btn-sm btn-secondary" onClick={clearAll}>
          ↩ Clear All
        </button>
        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>
          {checkedCount}/{ingredients.length} done
        </span>
      </div>
      <ul className="checklist">
        <AnimatePresence>
          {ingredients.map((item, index) => (
            <motion.div 
              key={index} 
              style={{ marginBottom: '8px', overflow: 'hidden' }}
              layout
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <li
              className={`checklist-item ${checked[index] ? 'checked' : ''}`}
              onClick={() => toggleItem(index)}
              style={{ paddingRight: '8px' }}
            >
              <span className={`checklist-checkbox ${checked[index] ? 'checked' : ''}`}>
                {checked[index] ? '✓' : ''}
              </span>
              <span className="checklist-text" style={{ flex: 1 }}>{item.original}</span>
              <button
                className="btn btn-sm btn-secondary"
                style={{ padding: '6px 10px', fontSize: '0.75rem', marginLeft: '8px' }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleSubstitute(index, item.name || item.original);
                }}
              >
                🔄 Substitute
              </button>
            </li>
            {substituteIndex === index && (
              <div style={{
                marginTop: '4px', padding: '12px 16px', background: 'var(--bg-card)',
                border: '1px solid var(--border)', borderRadius: 'var(--radius-md)',
                fontSize: '0.85rem', color: 'var(--text-secondary)',
                lineHeight: '1.6', boxShadow: 'var(--shadow-sm)'
              }}>
                {loadingSub && !substituteData[index] ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div className="cook-spinner" style={{ width: '14px', height: '14px', borderColor: 'var(--accent)' }}></div>
                    Finding substitutes...
                  </div>
                ) : (
                  <div style={{ whiteSpace: 'pre-wrap' }}>
                    {substituteData[index]}
                  </div>
                )}
              </div>
            )}
            </motion.div>
          ))}
        </AnimatePresence>
      </ul>
    </div>
  );
}
