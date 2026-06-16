const express = require('express');
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

const router = express.Router();
const API_BASE = 'https://api.spoonacular.com';

/**
 * GET /api/recipes/search?query=...&number=12
 * Proxies to Spoonacular complexSearch endpoint.
 * Has an AI Fallback if Spoonacular returns 0 results.
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

    // AI Fallback Logic
    if (data.results && data.results.length === 0) {
      console.log(`No results from Spoonacular for "${query}". Triggering AI Fallback...`);
      const groqApiKey = process.env.GROQ_API_KEY;

      if (groqApiKey && groqApiKey !== 'your_groq_api_key_here') {
        const prompt = `Provide 3 highly detailed, authentic recipes for "${query}".
CRITICAL INSTRUCTION: The instructions must be highly detailed, comprehensive, and exhaustive. Break the recipe down into many small, distinct steps (at least 8-12 steps). Explain EXACTLY how to prepare, cook, and serve the dish in full detail.
IMPORTANT: You must respond ONLY with a valid JSON array containing exactly 3 recipe objects matching this exact schema:
[
  {
    "title": "Recipe Name",
    "readyInMinutes": 45,
    "servings": 4,
    "image": "/api/images/cover.jpg",
    "extendedIngredients": [
      { "original": "2 cups ingredient", "name": "ingredient" }
    ],
    "analyzedInstructions": [
      {
        "steps": [
          { "number": 1, "step": "Very detailed step 1..." },
          { "number": 2, "step": "Very detailed step 2..." }
        ]
      }
    ]
  }
]
Do NOT wrap the JSON in markdown code blocks. Return ONLY the raw JSON array.`;

        const groqRes = await fetch(
          'https://api.groq.com/openai/v1/chat/completions',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${groqApiKey}`
            },
            body: JSON.stringify({
              model: 'llama-3.3-70b-versatile',
              messages: [{ role: 'user', content: prompt }],
              temperature: 0.7,
              max_tokens: 4000,
            }),
          }
        );

        if (groqRes.ok) {
          const aiData = await groqRes.json();
          const text = aiData?.choices?.[0]?.message?.content;

          if (text) {
            try {
              const cleanedText = text.replace(/```json/gi, '').replace(/```/g, '').trim();
              const parsedRecipes = JSON.parse(cleanedText);

              const CUSTOM_RECIPES_FILE = path.join(__dirname, '..', 'data', 'custom_recipes.json');
              let customData = {};
              if (fs.existsSync(CUSTOM_RECIPES_FILE)) {
                customData = JSON.parse(fs.readFileSync(CUSTOM_RECIPES_FILE, 'utf-8'));
              }

              const formattedResults = parsedRecipes.map((r, index) => {
                const aiId = 'ai-search-' + Date.now() + '-' + index;
                const fullRecipe = {
                  ...r,
                  id: aiId,
                  source: 'ai-fallback'
                };

                // Save to custom_recipes.json so /:id endpoint can fetch the details later
                customData[aiId] = fullRecipe;

                // Return Spoonacular-style summary for the search results page
                return {
                  id: aiId,
                  title: fullRecipe.title,
                  image: fullRecipe.image,
                  readyInMinutes: fullRecipe.readyInMinutes,
                  servings: fullRecipe.servings
                };
              });

              fs.writeFileSync(CUSTOM_RECIPES_FILE, JSON.stringify(customData, null, 2));

              // Return the generated recipes pretending they came from Spoonacular
              return res.json({
                results: formattedResults,
                offset: 0,
                number: formattedResults.length,
                totalResults: formattedResults.length
              });

            } catch (parseErr) {
              console.error('Failed to parse AI search fallback JSON:', text);
            }
          }
        }
      }
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
