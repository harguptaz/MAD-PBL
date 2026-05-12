import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

export default function RecipeCard({ recipe, savedIds, onToggleSave }) {
  const navigate = useNavigate();
  const isSaved = savedIds?.includes(recipe.id);

  const handleCardClick = () => {
    navigate(`/recipe/${recipe.id}`);
  };

  const handleSaveClick = (e) => {
    e.stopPropagation();
    onToggleSave(recipe);
  };

  return (
    <motion.div 
      className="card recipe-card" 
      onClick={handleCardClick}
      variants={itemVariants}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="recipe-card-img-wrapper">
        <img
          className="recipe-card-img"
          src={recipe.image || 'https://via.placeholder.com/400x300?text=No+Image'}
          alt={recipe.title}
          loading="lazy"
        />
        {recipe.readyInMinutes && (
          <span className="recipe-card-badge">
            <img src="/icons/time.png" className="icon-img" alt="Time" />
            {recipe.readyInMinutes} min
          </span>
        )}
        <motion.button
          className={`recipe-card-save ${isSaved ? 'saved' : ''}`}
          onClick={handleSaveClick}
          title={isSaved ? 'Remove from saved' : 'Save recipe'}
          whileTap={{ scale: 1.4 }}
          transition={{ type: "spring", stiffness: 400, damping: 10 }}
        >
          {isSaved ? (
            <img src="/icons/saved.png" className="icon-img" alt="Saved" />
          ) : (
            <img src="/icons/save.png" className="icon-img" alt="Save" />
          )}
        </motion.button>
      </div>
      <div className="recipe-card-body">
        <h3 className="recipe-card-title">{recipe.title}</h3>
        <div className="recipe-card-meta">
          {recipe.servings && (
            <span>
              <img src="/icons/servings.png" className="icon-img" alt="Servings" />
              {recipe.servings} servings
            </span>
          )}
          {recipe.healthScore !== undefined && (
            <span>
              <img src="/icons/health.png" className="icon-img" alt="Health" />
              {recipe.healthScore}% healthy
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}
