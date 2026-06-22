const express = require('express');
const fs = require('fs');
const path = require('path');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
const SAVED_FILE = path.join(__dirname, '..', 'data', 'saved.json');
const SESSIONS_FILE = path.join(__dirname, '..', 'data', 'sessions.json');
const MEAL_PLANS_FILE = path.join(__dirname, '..', 'data', 'meal_plans.json');
const SAVED_PLANS_FILE = path.join(__dirname, '..', 'data', 'saved_plans.json');

// All routes require authentication
router.use(authenticateToken);

// ── Helpers ──────────────────────────────────────────

function readJSON(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, '{}', 'utf-8');
      return {};
    }
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch {
    return {};
  }
}

function writeJSON(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

// ── Saved Recipes ────────────────────────────────────

/**
 * GET /api/user/saved
 * Returns the current user's saved recipes.
 */
router.get('/saved', (req, res) => {
  const allSaved = readJSON(SAVED_FILE);
  const userSaved = allSaved[req.user.id] || [];
  res.json({ saved: userSaved });
});

/**
 * POST /api/user/saved
 * Body: { recipe: { id, title, image, readyInMinutes, ... } }
 * Saves a recipe for the current user.
 */
router.post('/saved', (req, res) => {
  const { recipe } = req.body;

  if (!recipe || !recipe.id) {
    return res.status(400).json({ error: 'Recipe data is required.' });
  }

  const allSaved = readJSON(SAVED_FILE);
  const userSaved = allSaved[req.user.id] || [];

  // Don't save duplicates
  if (userSaved.find((r) => r.id === recipe.id)) {
    return res.json({ message: 'Recipe already saved.', saved: userSaved });
  }

  userSaved.push({
    id: recipe.id,
    title: recipe.title,
    image: recipe.image,
    readyInMinutes: recipe.readyInMinutes,
    servings: recipe.servings,
    savedAt: new Date().toISOString(),
  });

  allSaved[req.user.id] = userSaved;
  writeJSON(SAVED_FILE, allSaved);

  res.status(201).json({ message: 'Recipe saved!', saved: userSaved });
});

/**
 * DELETE /api/user/saved/:id
 * Removes a saved recipe by recipe ID.
 */
router.delete('/saved/:id', (req, res) => {
  const recipeId = req.params.id;                          // keep as raw string
  const allSaved = readJSON(SAVED_FILE);
  const userSaved = allSaved[req.user.id] || [];

  // String-compare both sides so numeric Spoonacular IDs
  // and string AI IDs (e.g. "ai-1778259446911-694") both match
  allSaved[req.user.id] = userSaved.filter(
    (r) => String(r.id) !== String(recipeId)
  );
  writeJSON(SAVED_FILE, allSaved);

  res.json({ message: 'Recipe removed.', saved: allSaved[req.user.id] });
});

// ── Session State (Continue Where You Left Off) ─────

/**
 * GET /api/user/session
 * Returns the user's last search query and last viewed recipe ID.
 */
router.get('/session', (req, res) => {
  const allSessions = readJSON(SESSIONS_FILE);
  const userSession = allSessions[req.user.id] || {};
  res.json({ session: userSession });
});

/**
 * POST /api/user/session
 * Body: { lastSearch?: string, lastRecipeId?: number, lastRecipeTitle?: string }
 * Updates the user's session state (merges with existing).
 */
router.post('/session', (req, res) => {
  const { lastSearch, lastRecipeId, lastRecipeTitle } = req.body;

  const allSessions = readJSON(SESSIONS_FILE);
  const userSession = allSessions[req.user.id] || {};

  if (lastSearch !== undefined) userSession.lastSearch = lastSearch;
  if (lastRecipeId !== undefined) userSession.lastRecipeId = lastRecipeId;
  if (lastRecipeTitle !== undefined) userSession.lastRecipeTitle = lastRecipeTitle;
  userSession.updatedAt = new Date().toISOString();

  allSessions[req.user.id] = userSession;
  writeJSON(SESSIONS_FILE, allSessions);

  res.json({ session: userSession });
});

// ── Meal Plans ───────────────────────────────────────

/**
 * GET /api/user/meal-plan
 * Returns the current user's saved meal plan.
 */
router.get('/meal-plan', (req, res) => {
  const allMealPlans = readJSON(MEAL_PLANS_FILE);
  const userPlan = allMealPlans[req.user.id] || null;
  res.json({ mealPlan: userPlan });
});

/**
 * POST /api/user/meal-plan
 * Body: { mealPlan: [...] }
 * Saves the meal plan for the current user.
 */
router.post('/meal-plan', (req, res) => {
  const { mealPlan } = req.body;

  if (!mealPlan) {
    return res.status(400).json({ error: 'Meal plan data is required.' });
  }

  const allMealPlans = readJSON(MEAL_PLANS_FILE);
  allMealPlans[req.user.id] = mealPlan;
  writeJSON(MEAL_PLANS_FILE, allMealPlans);

  res.json({ message: 'Meal plan saved!', mealPlan });
});

/**
 * GET /api/user/saved-plans
 * Returns all permanently saved plans for the user.
 */
router.get('/saved-plans', (req, res) => {
  const allSavedPlans = readJSON(SAVED_PLANS_FILE);
  const userPlans = allSavedPlans[req.user.id] || [];
  res.json({ savedPlans: userPlans });
});

/**
 * POST /api/user/saved-plans
 * Appends a new saved meal plan for the user.
 */
router.post('/saved-plans', (req, res) => {
  const { mealPlan, calories, preferences = [], healthConditions = [], avoidances = '' } = req.body;

  if (!mealPlan || !Array.isArray(mealPlan)) {
    return res.status(400).json({ error: 'Meal plan data is required.' });
  }

  const allSavedPlans = readJSON(SAVED_PLANS_FILE);
  const userPlans = allSavedPlans[req.user.id] || [];

  const planId = 'plan-' + Date.now() + '-' + Math.random().toString(36).substring(2, 8);
  const savedAt = new Date().toISOString();

  // Ensure generatedRecipeId is null on every slot
  const sanitizedPlan = mealPlan.map(day => ({
    ...day,
    breakfast: { ...day.breakfast, generatedRecipeId: null },
    lunch: { ...day.lunch, generatedRecipeId: null },
    dinner: { ...day.dinner, generatedRecipeId: null }
  }));

  const newPlan = {
    id: planId,
    savedAt,
    calories,
    preferences,
    healthConditions,
    avoidances,
    days: sanitizedPlan
  };

  userPlans.push(newPlan);
  allSavedPlans[req.user.id] = userPlans;
  writeJSON(SAVED_PLANS_FILE, allSavedPlans);

  res.status(201).json({ message: 'Plan saved successfully.', planId });
});

/**
 * PATCH /api/user/saved-plans/:planId/meals
 * Updates the generatedRecipeId for a specific meal slot.
 */
router.patch('/saved-plans/:planId/meals', (req, res) => {
  const { planId } = req.params;
  const { day, mealType, generatedRecipeId } = req.body;

  if (!day || !mealType || !generatedRecipeId) {
    return res.status(400).json({ error: 'day, mealType, and generatedRecipeId are required.' });
  }

  const allSavedPlans = readJSON(SAVED_PLANS_FILE);
  const userPlans = allSavedPlans[req.user.id] || [];

  const planIndex = userPlans.findIndex(p => p.id === planId);
  if (planIndex === -1) {
    return res.status(404).json({ error: 'Saved plan not found.' });
  }

  const dayObj = userPlans[planIndex].days.find(d => d.day === day);
  if (!dayObj || !dayObj[mealType]) {
    return res.status(404).json({ error: 'Day or meal slot not found in plan.' });
  }

  dayObj[mealType].generatedRecipeId = generatedRecipeId;
  writeJSON(SAVED_PLANS_FILE, allSavedPlans);

  res.json({ message: 'Recipe ID updated successfully.' });
});

module.exports = router;
