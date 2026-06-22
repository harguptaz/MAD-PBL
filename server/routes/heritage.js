const express = require('express');
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

const router = express.Router();
const HERITAGE_FILE = path.join(__dirname, '..', 'data', 'heritage_recipes.json');

// Get recipes for a specific state
router.get('/recipes', async (req, res) => {
  const { state } = req.query;

  if (!state) {
    return res.status(400).json({ error: 'State parameter is required.' });
  }

  try {
    let localData = {};
    if (fs.existsSync(HERITAGE_FILE)) {
      localData = JSON.parse(fs.readFileSync(HERITAGE_FILE, 'utf-8'));
    }

    // Check if we have manually curated recipes for this state
    if (localData[state]) {
      return res.json({ source: 'local', recipes: localData[state] });
    }

    // If not, fallback to AI generation
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey || apiKey === 'your_groq_api_key_here') {
      return res.status(500).json({ error: 'Groq API key is not configured on the server.' });
    }

    const prompt = `Provide 3 highly authentic, famous, or historical "lost" recipes from the Indian state of ${state}. 
Include a 'historicalContext' field explaining the dish's origins and history.
CRITICAL INSTRUCTION: The instructions must be highly detailed, comprehensive, and exhaustive. Break the recipe down into many small, distinct steps (at least 8-12 steps). Explain EXACTLY how to prepare, cook, and serve the dish in full detail, leaving no ambiguity for the cook.

IMPORTANT: You must respond ONLY with a valid JSON array containing exactly 3 recipe objects matching this exact schema:
[
  {
    "title": "Recipe Name",
    "state": "${state}",
    "historicalContext": "...",
    "readyInMinutes": 60,
    "servings": 4,
    "healthScore": 85,
    "image": "/api/images/cover.jpg",
    "extendedIngredients": [
      { "original": "2 cups ingredient", "name": "ingredient" }
    ],
    "analyzedInstructions": [
      {
        "steps": [
          { "number": 1, "step": "Very detailed step 1 explaining exactly what to do..." },
          { "number": 2, "step": "Very detailed step 2 explaining exactly what to do..." }
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
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.7,
          max_tokens: 4000,
        }),
      }
    );

    if (!groqRes.ok) {
      const errData = await groqRes.json().catch(() => ({}));
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

      const CUSTOM_RECIPES_FILE = path.join(__dirname, '..', 'data', 'custom_recipes.json');
      let customData = {};
      if (fs.existsSync(CUSTOM_RECIPES_FILE)) {
        customData = JSON.parse(fs.readFileSync(CUSTOM_RECIPES_FILE, 'utf-8'));
      }

      parsedRecipes = parsedRecipes.map(r => {
        const id = 'ai-heritage-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
        const fullRecipe = {
          ...r,
          id,
          isCustom: true,
          source: 'ai-heritage'
        };
        customData[id] = fullRecipe;
        return fullRecipe;
      });

      fs.writeFileSync(CUSTOM_RECIPES_FILE, JSON.stringify(customData, null, 2));

    } catch (parseErr) {
      console.error('Failed to parse AI JSON:', text);
      return res.status(502).json({ error: 'Failed to parse AI response into recipes.' });
    }

    res.json({ source: 'ai', recipes: parsedRecipes });
  } catch (err) {
    console.error('Heritage route error:', err);
    res.status(500).json({ error: 'Server error while fetching heritage recipes.' });
  }
});

module.exports = router;
