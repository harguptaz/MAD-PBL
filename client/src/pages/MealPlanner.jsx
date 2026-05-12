import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import api from '../utils/api';
import IngredientChecklist from '../components/IngredientChecklist';
import { useToast } from '../components/Toast';

export default function MealPlanner() {
  const [preferences, setPreferences] = useState({
    vegetarian: false,
    vegan: false,
    glutenFree: false,
    highProtein: false,
  });
  const [calories, setCalories] = useState(null);
  const [mealPlan, setMealPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { showToast } = useToast();

  // Load saved plan on mount
  useEffect(() => {
    const fetchSavedPlan = async () => {
      try {
        const data = await api.get('/user/meal-plan');
        if (data.mealPlan) {
          setMealPlan(data.mealPlan);
        }
      } catch (err) {
        console.error('Failed to load meal plan', err);
      }
    };
    fetchSavedPlan();
  }, []);

  const handleSavePlan = async () => {
    if (!mealPlan) return;
    try {
      await api.post('/user/meal-plan', { mealPlan });
      showToast('Meal plan saved successfully! 📅');
    } catch (err) {
      showToast(err.message || 'Failed to save meal plan', 'error');
    }
  };

  const handleToggle = (key) => {
    setPreferences((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const generatePlan = async (e) => {
    e.preventDefault();
    if (calories < 500) {
      setError('Please enter a valid calorie goal (minimum 500).');
      return;
    }

    setLoading(true);
    setError(null);
    setMealPlan(null);

    const activePreferences = Object.entries(preferences)
      .filter(([_, isActive]) => isActive)
      .map(([key]) => key.replace(/([A-Z])/g, ' $1').toLowerCase()); // e.g. glutenFree -> gluten free

    try {
      const data = await api.post('/ai/meal-plan', {
        preferences: activePreferences,
        calories
      });
      setMealPlan(data.mealPlan);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="meal-page fade-in">
      <div className="meal-hero">
        <span className="meal-hero-badge">
          <img src="/icons/ai.png" className="icon-img" alt="AI" />
          AI Generated
        </span>
        <h1 className="meal-hero-title">7-Day Meal Planner</h1>
        <p className="meal-hero-subtitle">
          Let our AI craft a personalized weekly meal plan tailored to your diet and calorie goals.
        </p>
      </div>

      <div className="meal-config card">
        <form onSubmit={generatePlan} className="meal-form">
          <div className="meal-form-section">
            <h3 className="meal-section-title">Dietary Preferences</h3>
            <div className="meal-toggles">
              <label className={`meal-toggle ${preferences.vegetarian ? 'active' : ''}`}>
                <input type="checkbox" checked={preferences.vegetarian} onChange={() => handleToggle('vegetarian')} />
                Vegetarian
              </label>
              <label className={`meal-toggle ${preferences.vegan ? 'active' : ''}`}>
                <input type="checkbox" checked={preferences.vegan} onChange={() => handleToggle('vegan')} />
                Vegan
              </label>
              <label className={`meal-toggle ${preferences.glutenFree ? 'active' : ''}`}>
                <input type="checkbox" checked={preferences.glutenFree} onChange={() => handleToggle('glutenFree')} />
                Gluten-Free
              </label>
              <label className={`meal-toggle ${preferences.highProtein ? 'active' : ''}`}>
                <input type="checkbox" checked={preferences.highProtein} onChange={() => handleToggle('highProtein')} />
                High Protein
              </label>
            </div>
          </div>

          <div className="meal-form-section">
            <h3 className="meal-section-title">Daily Calorie Goal</h3>
            <div className="meal-input-wrapper">
              <span className="meal-input-icon">
                <img src="/icons/calories.png" className="icon-img" alt="Calories" />
              </span>
              <input
                placeholder='e.g. 2000'
                type="number"
                className="form-input meal-input"
                value={calories}
                onChange={(e) => setCalories(Number(e.target.value))}
                min="500"
                step="50"
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary meal-btn" disabled={loading}>
            {loading ? <span className="cook-spinner"></span> : 'Generate Plan'}
          </button>
        </form>
        {error && <div className="meal-error">⚠️ {error}</div>}
      </div>

      {loading && (
        <motion.div
          className="meal-loading"
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
        >
          <div className="spinner"></div>
          <p>Crafting your perfect week...</p>
        </motion.div>
      )}

      {mealPlan && (
        <div className="meal-plan-results fade-in">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <h2 className="meal-results-title" style={{ margin: 0 }}>Your Weekly Plan</h2>
            <button className="btn btn-secondary" onClick={handleSavePlan}>
              <img src="/icons/save.png" className="icon-img" alt="Save" />
              Save Meal Plan
            </button>
          </div>
          <div className="meal-grid">
            {mealPlan.map((dayPlan, i) => (
              <div key={i} className="meal-card card">
                <div className="meal-card-header">
                  <h3>{dayPlan.day}</h3>
                  <span className="meal-total-cals">{dayPlan.totalCalories} kcal</span>
                </div>
                <div className="meal-card-body">
                  <div className="meal-slot">
                    <span className="meal-slot-label">
                      <img src="/icons/breakfast.png" className="icon-img" alt="Breakfast" />
                      Breakfast
                    </span>
                    <p className="meal-slot-name">{dayPlan.breakfast.name}</p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span className="meal-slot-cals">{dayPlan.breakfast.calories} kcal</span>
                    </div>
                    {dayPlan.breakfast.ingredients && (
                      <div style={{ marginTop: '1rem' }}>
                        <IngredientChecklist
                          ingredients={dayPlan.breakfast.ingredients}
                          recipeId={`meal-${dayPlan.day}-breakfast`}
                        />
                      </div>
                    )}
                  </div>
                  <div className="meal-slot">
                    <span className="meal-slot-label">
                      <img src="/icons/lunch.png" className="icon-img" alt="Lunch" />
                      Lunch
                    </span>
                    <p className="meal-slot-name">{dayPlan.lunch.name}</p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span className="meal-slot-cals">{dayPlan.lunch.calories} kcal</span>
                    </div>
                    {dayPlan.lunch.ingredients && (
                      <div style={{ marginTop: '1rem' }}>
                        <IngredientChecklist
                          ingredients={dayPlan.lunch.ingredients}
                          recipeId={`meal-${dayPlan.day}-lunch`}
                        />
                      </div>
                    )}
                  </div>
                  <div className="meal-slot">
                    <span className="meal-slot-label">
                      <img src="/icons/dinner.png" className="icon-img" alt="Dinner" />
                      Dinner
                    </span>
                    <p className="meal-slot-name">{dayPlan.dinner.name}</p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span className="meal-slot-cals">{dayPlan.dinner.calories} kcal</span>
                    </div>
                    {dayPlan.dinner.ingredients && (
                      <div style={{ marginTop: '1rem' }}>
                        <IngredientChecklist
                          ingredients={dayPlan.dinner.ingredients}
                          recipeId={`meal-${dayPlan.day}-dinner`}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
