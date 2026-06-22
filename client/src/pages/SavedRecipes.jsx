import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../utils/api';
import RecipeCard from '../components/RecipeCard';
import { useToast } from '../components/Toast';

const listVariants = {
  visible: { transition: { staggerChildren: 0.1 } },
  hidden: {}
};

export default function SavedRecipes() {
  const [activeTab, setActiveTab] = useState('recipes'); // 'recipes' or 'plans'
  const [saved, setSaved] = useState([]);
  const [savedPlans, setSavedPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [plansLoading, setPlansLoading] = useState(true);
  const [generatingMeal, setGeneratingMeal] = useState(null);

  const { showToast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/user/saved')
      .then((data) => setSaved(data.saved))
      .catch((err) => showToast(err.message, 'error'))
      .finally(() => setLoading(false));

    api.get('/user/saved-plans')
      .then((data) => setSavedPlans(data.savedPlans || []))
      .catch((err) => showToast(err.message, 'error'))
      .finally(() => setPlansLoading(false));
  }, []);

  const savedIds = saved.map((r) => r.id);

  const handleToggleSave = async (recipe) => {
    try {
      await api.delete(`/user/saved/${recipe.id}`);
      setSaved((prev) => prev.filter((r) => r.id !== recipe.id));
      showToast('Recipe removed');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleViewRecipe = async (planId, day, mealType, meal) => {
    if (meal.generatedRecipeId) {
      navigate(`/recipe/${meal.generatedRecipeId}`);
      return;
    }

    const mealKey = `${planId}-${day}-${mealType}`;
    setGeneratingMeal(mealKey);

    try {
      const recipeRes = await api.post('/ai/meal-recipe', {
        mealName: meal.name,
        ingredients: meal.ingredients,
        calories: meal.calories
      });

      const newRecipeId = recipeRes.id;

      await api.patch(`/user/saved-plans/${planId}/meals`, {
        day,
        mealType,
        generatedRecipeId: newRecipeId
      });

      setSavedPlans(prevPlans => prevPlans.map(p => {
        if (p.id !== planId) return p;
        return {
          ...p,
          days: p.days.map(d => {
            if (d.day !== day) return d;
            return {
              ...d,
              [mealType]: {
                ...d[mealType],
                generatedRecipeId: newRecipeId
              }
            };
          })
        };
      }));

      navigate(`/recipe/${newRecipeId}`);
    } catch (err) {
      showToast(err.message || 'Failed to generate recipe', 'error');
    } finally {
      setGeneratingMeal(null);
    }
  };

  if (loading && activeTab === 'recipes') {
    return <div className="spinner"></div>;
  }

  return (
    <div>
      <div className="saved-tabs">
        <button 
          className={`saved-tab ${activeTab === 'recipes' ? 'active' : ''}`}
          onClick={() => setActiveTab('recipes')}
        >
          Recipes
        </button>
        <button 
          className={`saved-tab ${activeTab === 'plans' ? 'active' : ''}`}
          onClick={() => setActiveTab('plans')}
        >
          Meal Plans
        </button>
      </div>

      {activeTab === 'recipes' && (
        <>
          <div className="saved-header">
            <h1>🔖 Saved Recipes</h1>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              {saved.length} recipe{saved.length !== 1 ? 's' : ''}
            </span>
          </div>

          {saved.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📭</div>
              <h2>No saved recipes yet</h2>
              <p>Search for recipes and save your favorites here!</p>
              <Link to="/" className="btn btn-primary">
                🔍 Find Recipes
              </Link>
            </div>
          ) : (
            <motion.div 
              className="recipes-grid"
              variants={listVariants}
              initial="hidden"
              animate="visible"
            >
              {saved.map((recipe) => (
                <RecipeCard
                  key={recipe.id}
                  recipe={recipe}
                  savedIds={savedIds}
                  onToggleSave={handleToggleSave}
                />
              ))}
            </motion.div>
          )}
        </>
      )}

      {activeTab === 'plans' && (
        <>
          <div className="saved-header">
            <h1>🗓️ Saved Meal Plans</h1>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              {savedPlans.length} plan{savedPlans.length !== 1 ? 's' : ''}
            </span>
          </div>

          {plansLoading ? (
            <div className="spinner"></div>
          ) : savedPlans.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📅</div>
              <h2>No saved meal plans yet</h2>
              <p>Create a weekly plan and save it here!</p>
              <Link to="/meal-planner" className="btn btn-primary">
                ✨ Generate Plan
              </Link>
            </div>
          ) : (
            <motion.div 
              className="saved-plans-list"
              variants={listVariants}
              initial="hidden"
              animate="visible"
            >
              {[...savedPlans].reverse().map(plan => (
                <div key={plan.id} className="plan-card card">
                  <div className="plan-card-header">
                    <div style={{ fontWeight: 600, fontSize: '1.1rem' }}>
                      {new Date(plan.savedAt).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </div>
                    {plan.calories && <span className="plan-tag tag-cals">{plan.calories} kcal</span>}
                    {plan.preferences?.map(p => <span key={p} className="plan-tag tag-pref">{p}</span>)}
                    {plan.healthConditions?.map(h => <span key={h} className="plan-tag tag-health">{h}</span>)}
                  </div>
                  <div className="plan-weekly-grid">
                    {plan.days.map(dayObj => (
                      <div key={dayObj.day} className="plan-day-col">
                        <div className="plan-day-label">{dayObj.day}</div>
                        {['breakfast', 'lunch', 'dinner'].map(mealType => {
                          const meal = dayObj[mealType];
                          const mealKey = `${plan.id}-${dayObj.day}-${mealType}`;
                          const isGenerating = generatingMeal === mealKey;
                          
                          return (
                            <div key={mealType} className="plan-meal-slot">
                              <div className="plan-meal-type">{mealType}</div>
                              <div className="plan-meal-name">{meal.name}</div>
                              <div className="plan-meal-cals">{meal.calories} kcal</div>
                              <button 
                                className="plan-meal-btn"
                                disabled={isGenerating}
                                onClick={() => handleViewRecipe(plan.id, dayObj.day, mealType, meal)}
                              >
                                {isGenerating ? 'Generating...' : 'View Recipe'}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </motion.div>
          )}
        </>
      )}
    </div>
  );
}
