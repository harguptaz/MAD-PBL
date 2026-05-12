# Full-Stack Recipe Progressive Web App (PWA)
**Project Description for Mobile Application Development (MAD)**

## 1. Project Overview
This project is a **Full-Stack Recipe Progressive Web App (PWA)**. It is designed to bridge the gap between traditional web applications and native Android applications by utilizing modern web APIs to deliver a native-like experience on mobile devices. 

The application allows users to search for recipes, manage automated grocery lists, and securely save their favorite recipes. It is architected with a **mobile-first approach**, ensuring that the UI/UX feels completely natural on an Android device.

## 2. Relevance to Mobile App Development (MAD)
While built with web technologies, this project directly addresses core Mobile Application Development principles through the implementation of **PWA standards**:
* **Installability (Add to Home Screen):** By utilizing a `manifest.json`, the application can be installed directly onto an Android device's home screen, functioning alongside native `.apk` apps without requiring distribution through the Google Play Store.
* **Offline Capabilities & Caching:** The project implements a **Service Worker** (`sw.js`) which acts as a network proxy. This allows the app to cache critical assets and API responses, enabling it to launch and function (e.g., viewing saved recipes) even when the Android device is offline or on a flaky network.
* **Native-Like Experience:** The app runs in a standalone window without browser UI (address bar, navigation buttons), providing a seamless, immersive experience identical to native Android apps.
* **Responsive, Touch-Friendly UI:** The frontend is rigorously designed for mobile viewports, including touch-friendly targets, bottom navigation patterns, and a dynamic dark/light theme adapting to the Android system settings.

## 3. Technology Stack
The project utilizes a modern JavaScript-based MERN-like stack, separated into distinct Client and Server environments:

### Frontend (Client)
* **Framework:** React.js (v19) powered by Vite for rapid mobile-optimized builds.
* **Routing:** React Router DOM for seamless, single-page application (SPA) navigation.
* **PWA Assets:** Custom Service Worker (`sw.js`) for caching and `manifest.json` for Android OS integration.

### Backend (Server)
* **Runtime:** Node.js
* **Framework:** Express.js
* **Authentication:** JSON Web Tokens (JWT) for secure, stateless session management, and `bcryptjs` for password hashing.
* **Networking:** `node-fetch` for server-side API requests.

### External Services
* **Spoonacular API:** Used as the primary data source for querying vast recipe databases and nutritional information.

## 4. Architecture & Security
* **API Proxy Pattern:** To ensure security on mobile devices, the Android client does not directly communicate with the Spoonacular API. Instead, the Node.js backend acts as a secure proxy. This prevents the API keys from being exposed in the mobile client's bundled code.
* **Stateless Authentication:** Mobile user sessions are managed via JWTs. Once a user logs in, the token is stored securely on the device and sent with subsequent requests to access protected routes (like saved grocery lists).
* **Persistent Sessions:** The app implements a "Continue Where You Left Off" feature, ensuring that when an Android user minimizes the app and returns later, their state is preserved.

## 5. Key Features
1. **Recipe Discovery:** Search and filter recipes using the Spoonacular API.
2. **Automated Grocery Lists:** Extract ingredients from chosen recipes and compile them into a managed list.
3. **User Accounts & Auth:** Secure signup/login system to persist personal data across devices.
4. **Offline Access:** Save favorite recipes for offline viewing using Service Worker caching.
5. **Cross-Platform Synchronization:** Because it is a PWA backed by a centralized server, a user can manage their grocery list on their Android phone and view it on a desktop seamlessly.

## 6. Conclusion
This project demonstrates advanced mobile development concepts by leveraging the open web. It showcases how to build lightweight, installable, and network-resilient applications that rival the capabilities of traditional native Android development while maintaining a single, unified codebase.
