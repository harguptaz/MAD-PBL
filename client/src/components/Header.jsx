import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from './ThemeToggle';

export default function Header() {
  const { user, logout, isAuthenticated } = useAuth();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <header className="header">
      <Link to="/" className="header-logo">
        <span>🍳</span> RecipeFinder
      </Link>

      <nav className="header-nav">
        {isAuthenticated && (
          <>
            <Link
              to="/"
              className={`nav-link ${isActive('/') ? 'active' : ''}`}
            >
              🔍 Search
            </Link>
            <Link
              to="/saved"
              className={`nav-link ${isActive('/saved') ? 'active' : ''}`}
            >
              🔖 Saved
            </Link>
            <Link
              to="/cook-now"
              className={`nav-link ${isActive('/cook-now') ? 'active' : ''}`}
            >
              🍳 Cook Now
            </Link>
            <Link
              to="/meal-plan"
              className={`nav-link ${isActive('/meal-plan') ? 'active' : ''}`}
            >
              📅 Meal Plan
            </Link>
            <Link
              to="/heritage"
              className={`nav-link ${isActive('/heritage') ? 'active' : ''}`}
            >
              🌍 Heritage
            </Link>
          </>
        )}
        <ThemeToggle />
        {isAuthenticated && (
          <div className="user-menu">
            <span className="user-greeting">Hi, {user?.username}</span>
            <button className="btn-logout" onClick={logout}>
              Logout
            </button>
          </div>
        )}
      </nav>
    </header>
  );
}
