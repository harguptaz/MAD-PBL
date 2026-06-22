import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import IngredientChecklist from '../components/IngredientChecklist';
import { useToast } from '../components/Toast';

export default function RecipeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    const fetchRecipe = async () => {
      try {
        const data = await api.get(`/recipes/${id}`);
        setRecipe(data);

        // Save to session for "continue where you left off"
        api.post('/user/session', {
          lastRecipeId: data.id,
          lastRecipeTitle: data.title,
        }).catch(() => {});

        // Check if saved
        const savedData = await api.get('/user/saved');
        setIsSaved(savedData.saved.some((r) => r.id === data.id));
      } catch (err) {
        showToast(err.message, 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchRecipe();
  }, [id]);

  const handleToggleSave = async () => {
    try {
      if (isSaved) {
        await api.delete(`/user/saved/${recipe.id}`);
        setIsSaved(false);
        showToast('Recipe removed');
      } else {
        await api.post('/user/saved', { recipe });
        setIsSaved(true);
        showToast('Recipe saved! 🔖');
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  if (loading) {
    return <div className="spinner"></div>;
  }

  if (!recipe) {
    return (
      <div className="empty-state">
        <div className="empty-icon">😕</div>
        <h2>Recipe not found</h2>
        <button className="btn btn-primary" onClick={() => navigate('/')}>
          Back to Search
        </button>
      </div>
    );
  }

  // Parse instructions into steps
  const instructionSteps = recipe.analyzedInstructions?.[0]?.steps || [];

  const isCustomOrAI = recipe.isCustom || (typeof recipe.id === 'string' && recipe.id.startsWith('ai-'));
  const imageUrl = isCustomOrAI ? '/api/images/cover.jpg' : (recipe.image || '/api/images/cover.jpg');

  return (
    <div>
      <button className="detail-back" onClick={() => navigate(-1)}>
        ← Back
      </button>

      {/* Hero Image */}
      <div className="detail-hero">
        <img
          src={imageUrl}
          alt={recipe.title}
        />
        <div className="detail-hero-overlay">
          <h1>{recipe.title}</h1>
          <div className="detail-meta">
            {recipe.readyInMinutes && <span>⏱ {recipe.readyInMinutes} min</span>}
            {recipe.servings && <span>🍽 {recipe.servings} servings</span>}
            {recipe.healthScore !== undefined && <span>💚 Health: {recipe.healthScore}%</span>}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="detail-actions">
        <button
          className={`btn ${isSaved ? 'btn-primary' : 'btn-secondary'}`}
          onClick={handleToggleSave}
        >
          {isSaved ? '♥ Saved' : '♡ Save Recipe'}
        </button>
      </div>

      {/* Summary */}
      {recipe.summary && (
        <div className="detail-section">
          <h2>📝 Summary</h2>
          <div
            className="detail-summary"
            dangerouslySetInnerHTML={{ __html: recipe.summary }}
          />
        </div>
      )}

      {/* Ingredients Checklist */}
      {recipe.extendedIngredients?.length > 0 && (
        <div className="detail-section">
          <h2>🛒 Ingredients ({recipe.extendedIngredients.length})</h2>
          <IngredientChecklist
            ingredients={recipe.extendedIngredients}
            recipeId={recipe.id}
          />
        </div>
      )}

      {/* Instructions */}
      {instructionSteps.length > 0 && (
        <div className="detail-section instructions">
          <h2>👨‍🍳 Instructions</h2>
          <ol>
            {instructionSteps.map((step) => (
              <li key={step.number}>{step.step}</li>
            ))}
          </ol>
        </div>
      )}

      {/* Fallback instructions */}
      {instructionSteps.length === 0 && recipe.instructions && (
        <div className="detail-section">
          <h2>👨‍🍳 Instructions</h2>
          <div
            className="detail-summary"
            dangerouslySetInnerHTML={{ __html: recipe.instructions }}
          />
        </div>
      )}
    </div>
  );
}
