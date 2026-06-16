import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import IndiaMap from '../components/IndiaMap';
import RecipeCard from '../components/RecipeCard';

// A generic list of Indian States and UTs for the List View
const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
  "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
  "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana",
  "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal", "Andaman and Nicobar Islands",
  "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu", "Lakshadweep", "Delhi",
  "Puducherry", "Kashmir", "Ladakh"
].sort();

export default function Heritage() {
  const [viewMode, setViewMode] = useState('map'); // 'map' or 'list'
  const [selectedState, setSelectedState] = useState(null);
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [source, setSource] = useState(null);
  
  const { token } = useAuth();
  const { showToast } = useToast();

  const handleStateSelect = async (stateName) => {
    setSelectedState(stateName);
    setLoading(true);
    setRecipes([]);
    setSource(null);

    try {
      const response = await fetch(`/api/heritage/recipes?state=${encodeURIComponent(stateName)}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch recipes');
      }

      setRecipes(data.recipes || []);
      setSource(data.source);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="heritage-page">
      <header className="page-header">
        <div>
          <h2>Indian Heritage Recipes</h2>
          <p>Discover historical, rare, and authentic local dishes from across India.</p>
        </div>
        <div className="view-toggle">
          <button 
            className={`btn ${viewMode === 'map' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setViewMode('map')}
          >
            Map View
          </button>
          <button 
            className={`btn ${viewMode === 'list' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setViewMode('list')}
          >
            List View
          </button>
        </div>
      </header>

      <div className="heritage-content">
        {/* Left Side: Map or List Selector */}
        <div className="state-selector-container">
          {viewMode === 'map' ? (
            <IndiaMap onSelectState={handleStateSelect} />
          ) : (
            <div className="state-list">
              {INDIAN_STATES.map((stateName) => (
                <button 
                  key={stateName} 
                  className={`state-list-item ${selectedState === stateName ? 'active' : ''}`}
                  onClick={() => handleStateSelect(stateName)}
                >
                  {stateName}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Side: Selected State Results */}
        <div className="state-results">
          {selectedState ? (
            <>
              <h3 className="state-title">
                {selectedState} 
                {source === 'ai' && <span className="badge badge-ai">AI Generated</span>}
                {source === 'local' && <span className="badge badge-auth">Authentic Collection</span>}
              </h3>

              {loading ? (
                <div className="loading-state">
                  <div className="spinner"></div>
                  <p>Uncovering culinary history from {selectedState}...</p>
                </div>
              ) : recipes.length > 0 ? (
                <div className="heritage-recipes-list">
                  {recipes.map(recipe => (
                    <motion.div 
                      key={recipe.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="heritage-card"
                    >
                      {/* Heritage specific context section */}
                      {recipe.historicalContext && (
                        <div className="historical-context">
                          <h4><span role="img" aria-label="scroll">📜</span> Historical Origin</h4>
                          <p>{recipe.historicalContext}</p>
                        </div>
                      )}
                      {/* Reusing existing RecipeCard for the rest */}
                      <RecipeCard recipe={recipe} />
                    </motion.div>
                  ))}
                </div>
              ) : (
                <p className="no-results">No heritage recipes found for this state yet.</p>
              )}
            </>
          ) : (
            <div className="empty-state">
              <span role="img" aria-label="india" style={{fontSize: "3rem"}}>🇮🇳</span>
              <p>Select a state from the {viewMode} to explore its culinary heritage.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
