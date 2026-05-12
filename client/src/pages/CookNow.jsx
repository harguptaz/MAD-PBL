import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import api from '../utils/api';
import IngredientChecklist from '../components/IngredientChecklist';
import { useToast } from '../components/Toast';

export default function CookNow() {
  const [ingredients, setIngredients] = useState('');
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [asked, setAsked] = useState(false);
  const [savedIds, setSavedIds] = useState([]);
  const { showToast } = useToast();

  useEffect(() => {
    api.get('/user/saved')
      .then((data) => setSavedIds(data.saved.map((r) => r.id)))
      .catch(() => {});
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = ingredients.trim();
    if (!trimmed) return;

    setLoading(true);
    setError('');
    setRecipes([]);
    setAsked(true);

    try {
      const data = await api.post('/ai/suggest-recipes', { ingredients: trimmed });
      setRecipes(data.recipes || []);
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSave = async (recipe) => {
    try {
      if (savedIds.includes(recipe.id)) {
        await api.delete(`/user/saved/${recipe.id}`);
        setSavedIds((prev) => prev.filter((id) => id !== recipe.id));
        showToast('Recipe removed');
      } else {
        await api.post('/user/saved', { recipe });
        setSavedIds((prev) => [...prev, recipe.id]);
        showToast('Recipe saved! 🔖');
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const exampleIngredients = [
    'eggs, cheese, spinach',
    'chicken, garlic, lemon',
    'pasta, tomato, basil',
    'potato, butter, cream',
  ];

  return (
    <div className="cook-page">
      {/* ── Hero ── */}
      <div className="cook-hero">
        <div className="cook-hero-badge">✨ AI-Powered</div>
        <h1 className="cook-hero-title">What Can I Cook?</h1>
        <p className="cook-hero-subtitle">
          Tell us what's in your fridge and our AI chef will suggest 3 recipes you can make right now.
        </p>

        <form className="cook-form" onSubmit={handleSubmit} id="cook-form">
          <div className="cook-input-wrapper">
            <span className="cook-input-icon">🥕</span>
            <input
              id="ingredient-input"
              className="form-input cook-input"
              type="text"
              placeholder="e.g. eggs, tomato, cheese, garlic..."
              value={ingredients}
              onChange={(e) => setIngredients(e.target.value)}
              disabled={loading}
            />
          </div>
          <button
            id="cook-submit-btn"
            className="btn btn-primary cook-btn"
            type="submit"
            disabled={loading || !ingredients.trim()}
          >
            {loading ? (
              <>
                <span className="cook-spinner" />
                Thinking...
              </>
            ) : (
              <>🍳 Suggest Recipes</>
            )}
          </button>
        </form>

        {/* Example chips */}
        {!asked && (
          <div className="cook-examples">
            <span className="cook-examples-label">Try:</span>
            {exampleIngredients.map((ex) => (
              <button
                key={ex}
                className="cook-chip"
                type="button"
                onClick={() => setIngredients(ex)}
              >
                {ex}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Loading Skeletons ── */}
      {loading && (
        <div className="cook-results" style={{ display: 'flex', justifyContent: 'center' }}>
          <motion.div 
            className="cook-card cook-card-skeleton" 
            style={{ width: '100%', maxWidth: '800px', padding: '2rem' }}
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
          >
            <div className="skeleton cook-skeleton-title" style={{ width: '50%', marginBottom: '2rem' }} />
            <div className="skeleton cook-skeleton-line" />
            <div className="skeleton cook-skeleton-line short" />
            <div className="skeleton cook-skeleton-line" />
            <div className="skeleton cook-skeleton-line" style={{ width: '80%', marginTop: '2rem' }} />
            <div className="skeleton cook-skeleton-line short" />
          </motion.div>
        </div>
      )}

      {/* ── Error ── */}
      {error && !loading && (
        <div className="cook-error">
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {/* ── Single Structured Recipe Card ── */}
      {!loading && recipes.length > 0 && (
        <>
          <div className="cook-results-header">
            <h2>Here are your AI Suggestions 🎉</h2>
            <p>Based on: <em>{ingredients}</em></p>
          </div>

          <div className="cook-results" style={{ display: 'flex', justifyContent: 'center' }}>
            <div className="cook-card card" style={{ width: '100%', maxWidth: '800px', padding: '2.5rem', textAlign: 'left' }}>
              {recipes.map((recipe, index) => (
                <div key={recipe.id} style={{ marginBottom: index === recipes.length - 1 ? '0' : '3rem', borderBottom: index === recipes.length - 1 ? 'none' : '1px solid var(--border-color)', paddingBottom: index === recipes.length - 1 ? '0' : '2rem' }}>
                  
                  {/* Title and Save Button */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                    <h2 style={{ color: 'var(--primary-color)', fontSize: '1.8rem', margin: 0 }}>
                      {index + 1}. {recipe.title}
                    </h2>
                    <button
                      className={`btn btn-sm ${savedIds.includes(recipe.id) ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => handleToggleSave(recipe)}
                    >
                      {savedIds.includes(recipe.id) ? '♥ Saved' : '♡ Save'}
                    </button>
                  </div>

                  {/* Meta Info */}
                  <div style={{ display: 'flex', gap: '1rem', color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                    {recipe.readyInMinutes && <span>⏱ {recipe.readyInMinutes} mins</span>}
                    {recipe.servings && <span>🍽 {recipe.servings} servings</span>}
                  </div>

                  {/* Summary */}
                  {recipe.summary && (
                    <p style={{ lineHeight: '1.6', marginBottom: '1.5rem' }}>{recipe.summary}</p>
                  )}

                  {/* Interactive Ingredients Checklist */}
                  <h3 style={{ color: 'var(--secondary-color)', fontSize: '1.2rem', marginBottom: '1rem', marginTop: '1.5rem' }}>🛒 Ingredients Checklist</h3>
                  {recipe.extendedIngredients && recipe.extendedIngredients.length > 0 ? (
                    <IngredientChecklist ingredients={recipe.extendedIngredients} recipeId={recipe.id} />
                  ) : (
                    <p>No ingredients listed.</p>
                  )}

                  {/* Instructions */}
                  <h3 style={{ color: 'var(--secondary-color)', fontSize: '1.2rem', marginBottom: '1rem', marginTop: '1.5rem' }}>👨‍🍳 Quick Steps</h3>
                  <div style={{ marginLeft: '1rem' }}>
                    {recipe.analyzedInstructions?.[0]?.steps?.length > 0 ? (
                      recipe.analyzedInstructions[0].steps.map(step => (
                        <div key={step.number} style={{ display: 'flex', gap: '0.8rem', marginBottom: '0.8rem', lineHeight: '1.6' }}>
                          <span style={{ fontWeight: 'bold', color: 'var(--primary-color)' }}>{step.number}.</span>
                          <span>{step.step}</span>
                        </div>
                      ))
                    ) : (
                      <p>No instructions provided.</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="cook-retry" style={{ marginTop: '2rem' }}>
            <button
              className="btn btn-secondary"
              onClick={() => {
                setRecipes([]);
                setAsked(false);
                setIngredients('');
              }}
            >
              🔄 Try Different Ingredients
            </button>
          </div>
        </>
      )}
    </div>
  );
}
