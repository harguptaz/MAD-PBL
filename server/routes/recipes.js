const express = require('express');
const fetch = require('node-fetch');

const router = express.Router();
const API_BASE = 'https://api.spoonacular.com';

/**
 * GET /api/recipes/search?query=...&number=12
 * Proxies to Spoonacular complexSearch endpoint.
 * API key is injected server-side — never exposed to client.
 */
router.get('/search', async (req, res) => {
  try {
    const { query, number = 12 } = req.query;

    if (!query) {
      return res.status(400).json({ error: 'Search query is required.' });
    }

    const apiKey = process.env.SPOONACULAR_API_KEY;
    if (!apiKey || apiKey === 'YOUR_API_KEY_HERE') {
      return res.status(500).json({
        error: 'Spoonacular API key not configured. Add your key to server/.env',
      });
    }

    const url = `${API_BASE}/recipes/complexSearch?query=${encodeURIComponent(
      query
    )}&number=${number}&addRecipeInformation=true&apiKey=${apiKey}`;

    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: data.message || 'Spoonacular API error.',
      });
    }

    res.json(data);
  } catch (err) {
    console.error('Recipe search error:', err);
    res.status(500).json({ error: 'Failed to fetch recipes.' });
  }
});

/**
 * GET /api/recipes/:id
 * Proxies to Spoonacular recipe information endpoint.
 * Returns full recipe details including extendedIngredients.
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Handle custom AI recipes
    if (String(id).startsWith('ai-')) {
      const fs = require('fs');
      const path = require('path');
      const CUSTOM_RECIPES_FILE = path.join(__dirname, '..', 'data', 'custom_recipes.json');
      
      if (fs.existsSync(CUSTOM_RECIPES_FILE)) {
        const customRecipes = JSON.parse(fs.readFileSync(CUSTOM_RECIPES_FILE, 'utf-8'));
        if (customRecipes[id]) {
          return res.json(customRecipes[id]);
        }
      }
      return res.status(404).json({ error: 'Custom AI recipe not found.' });
    }

    const apiKey = process.env.SPOONACULAR_API_KEY;
    if (!apiKey || apiKey === 'YOUR_API_KEY_HERE') {
      return res.status(500).json({
        error: 'Spoonacular API key not configured. Add your key to server/.env',
      });
    }

    const url = `${API_BASE}/recipes/${id}/information?apiKey=${apiKey}`;

    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: data.message || 'Spoonacular API error.',
      });
    }

    res.json(data);
  } catch (err) {
    console.error('Recipe detail error:', err);
    res.status(500).json({ error: 'Failed to fetch recipe details.' });
  }
});

module.exports = router;
