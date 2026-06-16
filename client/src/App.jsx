import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './components/Toast';
import Header from './components/Header';
import ProtectedRoute from './components/ProtectedRoute';
import Search from './pages/Search';
import RecipeDetail from './pages/RecipeDetail';
import SavedRecipes from './pages/SavedRecipes';
import Login from './pages/Login';
import Register from './pages/Register';
import CookNow from './pages/CookNow';
import MealPlanner from './pages/MealPlanner';
import Heritage from './pages/Heritage';
import PageTransition from './components/PageTransition';

function AppRoutes() {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="spinner"></div>;
  }

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
      <Route
        path="/login"
        element={<PageTransition>{isAuthenticated ? <Navigate to="/" replace /> : <Login />}</PageTransition>}
      />
      <Route
        path="/register"
        element={<PageTransition>{isAuthenticated ? <Navigate to="/" replace /> : <Register />}</PageTransition>}
      />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <PageTransition><Search /></PageTransition>
          </ProtectedRoute>
        }
      />
      <Route
        path="/recipe/:id"
        element={
          <ProtectedRoute>
            <PageTransition><RecipeDetail /></PageTransition>
          </ProtectedRoute>
        }
      />
      <Route
        path="/saved"
        element={
          <ProtectedRoute>
            <PageTransition><SavedRecipes /></PageTransition>
          </ProtectedRoute>
        }
      />
      <Route
        path="/cook-now"
        element={
          <ProtectedRoute>
            <PageTransition><CookNow /></PageTransition>
          </ProtectedRoute>
        }
      />
      <Route
        path="/meal-plan"
        element={
          <ProtectedRoute>
            <PageTransition><MealPlanner /></PageTransition>
          </ProtectedRoute>
        }
      />
      <Route
        path="/heritage"
        element={
          <ProtectedRoute>
            <PageTransition><Heritage /></PageTransition>
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <ToastProvider>
            <Header />
            <main className="app-container">
              <AppRoutes />
            </main>
          </ToastProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
