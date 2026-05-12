const express = require('express');
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
const CUSTOM_RECIPES_FILE = path.join(__dirname, '..', 'data', 'custom_recipes.json');

// Helper to save custom recipes
function saveCustomRecipes(recipes) {
  try {
    let customRecipes = {};
    if (fs.existsSync(CUSTOM_RECIPES_FILE)) {
      customRecipes = JSON.parse(fs.readFileSync(CUSTOM_RECIPES_FILE, 'utf-8'));
    }
    recipes.forEach(r => {
      customRecipes[r.id] = r;
    });
    fs.writeFileSync(CUSTOM_RECIPES_FILE, JSON.stringify(customRecipes, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to save custom recipes', err);
  }
}

/**
 * POST /api/ai/suggest-recipes
 * Body: { ingredients: "tomato, pasta, garlic" }
 * Calls the Groq API and returns AI-generated recipe suggestions.
 */
router.post('/suggest-recipes', authenticateToken, async (req, res) => {
  const { ingredients } = req.body;

  if (!ingredients || !ingredients.trim()) {
    return res.status(400).json({ error: 'Please provide at least one ingredient.' });
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey || apiKey === 'your_groq_api_key_here') {
    return res.status(500).json({ error: 'Groq API key is not configured on the server.' });
  }

  const prompt = `I have these ingredients: ${ingredients.trim()}. Suggest 3 recipes I can make. 
IMPORTANT: You must respond ONLY with a valid JSON array of recipe objects matching this exact schema:
[
  {
    "title": "Recipe Name",
    "readyInMinutes": 30,
    "servings": 2,
    "summary": "Short description of the recipe...",
    "extendedIngredients": [
      { "original": "2 cups pasta", "name": "pasta" }
    ],
    "analyzedInstructions": [
      {
        "steps": [
          { "number": 1, "step": "Boil water." },
          { "number": 2, "step": "Add pasta." }
        ]
      }
    ]
  }
]
Do NOT wrap the JSON in markdown code blocks like \`\`\`json. Return ONLY the raw JSON array.`;

  try {
    const groqRes = await fetch(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.7,
          max_tokens: 2500,
        }),
      }
    );

    if (!groqRes.ok) {
      const errData = await groqRes.json().catch(() => ({}));
      console.error('Groq API error:', errData);
      return res.status(502).json({ error: errData?.error?.message || 'Failed to reach Groq API.' });
    }

    const data = await groqRes.json();
    const text = data?.choices?.[0]?.message?.content;

    if (!text) {
      return res.status(502).json({ error: 'No response received from Groq.' });
    }

    let parsedRecipes = [];
    try {
      const cleanedText = text.replace(/```json/gi, '').replace(/```/g, '').trim();
      parsedRecipes = JSON.parse(cleanedText);
      
      // Add IDs and save
      parsedRecipes = parsedRecipes.map(r => ({
        ...r,
        id: 'ai-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
        isCustom: true,
        image: 'https://via.placeholder.com/600x400/f59e0b/ffffff?text=AI+Generated+Recipe'
      }));
      saveCustomRecipes(parsedRecipes);
      
    } catch (parseErr) {
      console.error('Failed to parse AI JSON:', text);
      return res.status(502).json({ error: 'Failed to parse AI response into recipes.' });
    }

    res.json({ recipes: parsedRecipes });
  } catch (err) {
    console.error('AI route error:', err);
    res.status(500).json({ error: 'Server error while contacting Groq API.' });
  }
});

/**
 * POST /api/ai/substitute
 * Body: { ingredient: "tomato" }
 * Calls the Groq API to get substitute suggestions.
 */
router.post('/substitute', authenticateToken, async (req, res) => {
  const { ingredient } = req.body;

  if (!ingredient || !ingredient.trim()) {
    return res.status(400).json({ error: 'Please provide an ingredient.' });
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey || apiKey === 'your_groq_api_key_here') {
    return res.status(500).json({ error: 'Groq API key is not configured on the server.' });
  }

  const prompt = `I don't have ${ingredient} for a recipe. Give me 2-3 common substitutes with brief explanations. Keep the response concise.`;

  try {
    const groqRes = await fetch(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.5,
          max_tokens: 600,
        }),
      }
    );

    if (!groqRes.ok) {
      const errData = await groqRes.json().catch(() => ({}));
      console.error('Groq API error:', errData);
      return res.status(502).json({ error: errData?.error?.message || 'Failed to reach Groq API.' });
    }

    const data = await groqRes.json();
    const text = data?.choices?.[0]?.message?.content;

    if (!text) {
      return res.status(502).json({ error: 'No response received from Groq.' });
    }

    res.json({ substitution: text });
  } catch (err) {
    console.error('AI substitution route error:', err);
    res.status(500).json({ error: 'Server error while contacting Groq API.' });
  }
});

/**
 * POST /api/ai/meal-plan
 * Body: { preferences: ["vegan", "high-protein"], calories: 2000 }
 * Calls the Groq API to get a 7-day meal plan as JSON.
 */
router.post('/meal-plan', authenticateToken, async (req, res) => {
  const { preferences = [], calories } = req.body;

  if (!calories || isNaN(calories) || calories < 500) {
    return res.status(400).json({ error: 'Please provide a valid daily calorie goal (min 500).' });
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey || apiKey === 'your_groq_api_key_here') {
    return res.status(500).json({ error: 'Groq API key is not configured on the server.' });
  }

  const prefsText = preferences.length > 0 ? preferences.join(', ') : 'no specific dietary restrictions';
  
  const prompt = `Create a 7-day meal plan for someone who is ${prefsText} with a daily calorie goal of ${calories}. 
For each day list breakfast, lunch, and dinner with approximate calories AND a concise list of ingredients for each. 
Return the response strictly as a JSON array of objects with exactly this structure:
[
  { 
    "day": "Monday", 
    "breakfast": { "name": "...", "calories": 500, "ingredients": [{ "original": "..." }] }, 
    "lunch": { "name": "...", "calories": 600, "ingredients": [{ "original": "..." }] }, 
    "dinner": { "name": "...", "calories": 900, "ingredients": [{ "original": "..." }] }, 
    "totalCalories": 2000 
  },
  ...
]
DO NOT include any markdown formatting like \`\`\`json or \`\`\`. Just return the raw JSON array.`;

  try {
    const groqRes = await fetch(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.5,
          max_tokens: 4000,
        }),
      }
    );

    if (!groqRes.ok) {
      const errData = await groqRes.json().catch(() => ({}));
      console.error('Groq API error:', errData);
      return res.status(502).json({ error: errData?.error?.message || 'Failed to reach Groq API.' });
    }

    const data = await groqRes.json();
    const text = data?.choices?.[0]?.message?.content;

    if (!text) {
      return res.status(502).json({ error: 'No response received from Groq.' });
    }

    // Try to parse the response as JSON to ensure validity
    let jsonResponse;
    try {
      jsonResponse = JSON.parse(text);
    } catch (parseError) {
      console.error('Failed to parse Groq response as JSON:', text);
      return res.status(502).json({ error: 'Groq response was not valid JSON.' });
    }

    res.json({ mealPlan: jsonResponse });
  } catch (err) {
    console.error('AI meal plan route error:', err);
    res.status(500).json({ error: 'Server error while contacting Groq API.' });
  }
});

module.exports = router;
