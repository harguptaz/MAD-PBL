import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../utils/api';
import RecipeCard from '../components/RecipeCard';
import { useToast } from '../components/Toast';

const listVariants = {
  visible: { transition: { staggerChildren: 0.1 } },
  hidden: {}
};

export default function Search() {
  const [query, setQuery] = useState('');
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [savedIds, setSavedIds] = useState([]);
  const [session, setSession] = useState(null);
  const { showToast } = useToast();
  const navigate = useNavigate();

  // Load saved recipe IDs and session state on mount
  useEffect(() => {
    api.get('/user/saved')
      .then((data) => setSavedIds(data.saved.map((r) => r.id)))
      .catch(() => {});

    api.get('/user/session')
      .then((data) => setSession(data.session))
      .catch(() => {});
  }, []);

  const searchRecipes = async (searchQuery) => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    setSearched(true);
    try {
      const data = await api.get(`/recipes/search?query=${encodeURIComponent(searchQuery)}`);
      setRecipes(data.results || []);
      // Save search to session
      api.post('/user/session', { lastSearch: searchQuery }).catch(() => {});
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    searchRecipes(query);
  };

  const handleContinueSearch = () => {
    if (session?.lastSearch) {
      setQuery(session.lastSearch);
      searchRecipes(session.lastSearch);
      setSession(null);
    }
  };

  const handleContinueRecipe = () => {
    if (session?.lastRecipeId) {
      navigate(`/recipe/${session.lastRecipeId}`);
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

  const showContinueBanner = session && (session.lastSearch || session.lastRecipeId) && !searched;

  return (
    <div>
      {/* Continue Where You Left Off Banner */}
      {showContinueBanner && (
        <div className="continue-banner">
          <p>
            👋 <strong>Welcome back!</strong>{' '}
            {session.lastSearch && <>Your last search was "<strong>{session.lastSearch}</strong>". </>}
            {session.lastRecipeTitle && <>You were viewing "<strong>{session.lastRecipeTitle}</strong>". </>}
          </p>
          <div className="continue-banner-actions">
            {session.lastSearch && (
              <button className="btn btn-sm btn-primary" onClick={handleContinueSearch}>
                🔍 Search again
              </button>
            )}
            {session.lastRecipeId && (
              <button className="btn btn-sm btn-secondary" onClick={handleContinueRecipe}>
                📖 View recipe
              </button>
            )}
          </div>
        </div>
      )}

      {/* Search Hero */}
      <div className="search-hero">
        <h1>What's Cooking? 🍽️</h1>
        <p>Search thousands of recipes and build your grocery checklist instantly</p>
        <form className="search-bar" onSubmit={handleSubmit}>
          <span className="search-bar-icon">🔍</span>
          <input
            className="form-input"
            type="text"
            placeholder="Search recipes... (e.g., pasta, chicken curry)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            id="search-input"
          />
          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? '...' : 'Search'}
          </button>
        </form>
        
        <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'center', gap: '10px' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', alignSelf: 'center' }}>
            Not sure what to cook?
          </p>
          <button 
            className="btn btn-sm btn-secondary" 
            onClick={() => navigate('/meal-plan')}
          >
            ✨ Try our AI Meal Planner
          </button>
        </div>
      </div>

      {/* Loading Skeletons */}
      {loading && (
        <div className="recipes-grid">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="skeleton skeleton-card" />
          ))}
        </div>
      )}

      {/* Results */}
      {!loading && searched && recipes.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">🍳</div>
          <h2>No recipes found</h2>
          <p>Try a different search term like "pizza", "salad", or "chocolate cake"</p>
        </div>
      )}

      {!loading && recipes.length > 0 && (
        <motion.div 
          className="recipes-grid"
          variants={listVariants}
          initial="hidden"
          animate="visible"
        >
          {recipes.map((recipe) => (
            <RecipeCard
              key={recipe.id}
              recipe={recipe}
              savedIds={savedIds}
              onToggleSave={handleToggleSave}
            />
          ))}
        </motion.div>
      )}
    </div>
  );
}
