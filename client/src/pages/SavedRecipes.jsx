import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../utils/api';
import RecipeCard from '../components/RecipeCard';
import { useToast } from '../components/Toast';

const listVariants = {
  visible: { transition: { staggerChildren: 0.1 } },
  hidden: {}
};

export default function SavedRecipes() {
  const [saved, setSaved] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    api.get('/user/saved')
      .then((data) => setSaved(data.saved))
      .catch((err) => showToast(err.message, 'error'))
      .finally(() => setLoading(false));
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

  if (loading) {
    return <div className="spinner"></div>;
  }

  return (
    <div>
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
    </div>
  );
}
