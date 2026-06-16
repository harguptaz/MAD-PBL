# Full-Stack AI-Powered Recipe PWA

## Topic Name
**Flavor & Heritage: A Full-Stack AI Recipe PWA**
An installable, mobile-first web application designed to help users discover modern recipes, utilize AI for meal planning, and preserve the rich culinary heritage of India through regional and historically significant dishes.

---

## Objectives
1. **Seamless Mobile Experience:** Deliver a native-like application experience directly through the browser using Progressive Web App (PWA) standards, including offline capabilities and home-screen installability.
2. **Intelligent Culinary Assistance:** Utilize AI to generate dynamic meal plans, suggest smart ingredient substitutions, and allow users to "Cook Now" based on the ingredients they currently have at home.
3. **Automated Organization:** Simplify meal prep by allowing users to extract ingredients from recipes and compile them into automated, persistent grocery checklists.
4. **Cultural Preservation (Future Goal):** Document, digitize, and revive lost or rare Indian recipes, ensuring the origins and histories behind these dishes are passed on to the next generation.

---

## Current Technology Stack
This project is built using a modern, scalable MERN-like stack:

*   **Frontend (Client):** 
    *   **React.js & Vite:** For a highly responsive, component-driven user interface.
    *   **React Router:** Enabling seamless Single Page Application (SPA) navigation.
    *   **PWA Integrations:** Custom `manifest.json` and Service Workers for caching and offline access.
*   **Backend (Server):** 
    *   **Node.js & Express.js:** A robust API proxy to securely handle requests.
    *   **JWT & bcryptjs:** Secure, stateless user authentication and password hashing.
    *   **Local Storage/SQLite:** For persistent user data and session management.
*   **External APIs:** 
    *   **Spoonacular API:** Supplying comprehensive recipe data and nutritional information.
    *   **Gemini/Groq AI:** Powering the AI-driven Meal Planner and custom recipe generation features.

---

## Future Implementations

As the application evolves, the next major phase of development will focus on the rich culinary tapestry of the Indian subcontinent:

1. **The "Lost Recipes" Initiative:**
   *   **Reviving History:** We plan to introduce a dedicated section featuring rare Indian recipes that are rarely or no longer made today.
   *   **Historical Context:** Beyond just the ingredients and instructions, each "lost recipe" will include an educational deep-dive into its origins, the era it belongs to, and the historical or cultural significance behind its creation.

2. **Region-Wise Culinary Mapping:**
   *   **Authentic State Dishes:** We will add categorized collections of famous, authentic dishes from specific Indian regions (e.g., authentic Rajasthani Laal Maas, traditional Kerala Sadya dishes, or specific regional street foods).
   *   **Interactive Discovery:** Users will be able to explore the map of India and discover the staple diets, traditional spices, and unique cooking methods localized to each state.
