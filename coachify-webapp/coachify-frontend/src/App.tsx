import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import AthletesPage from './pages/AthletesPage';
import LandingPage from './pages/LandingPage';
import MyTeamsPage from './pages/MyTeamsPage';
import ProfilePage from './pages/ProfilePage'; // ÚJ import
import Navbar from './components/Navbar';
import { useAuthStore } from './store/authStore';
import Dashboard from './pages/Dashboard';
import TrainingPlansPage from './pages/TrainingPlansPage';
import AthleteDetailsPage from './pages/AthleteDetailsPage';
import Silk from './components/Silk';
import { Toaster } from './components/ui/toaster';

function AppContent() {
  const expiry = useAuthStore(state => state.expiry);
  const logout = useAuthStore(state => state.logout);
  const token = useAuthStore(state => state.token);
  const location = useLocation();

  // Hide Navbar on landing, login, and register pages
  const showNavbar = (location.pathname !== '/' && location.pathname !== '/login' && location.pathname !== '/register');
  
  // Show Silk background on landing, login, and register pages
  const showSilkBackground = (location.pathname === '/' || location.pathname === '/login' || location.pathname === '/register') && !token;

  return (
    <>
      {/* Persistent Silk Background for auth pages */}
      {showSilkBackground && (
        <div className="fixed inset-0 z-0" style={{ width: '100vw', height: '100vh', pointerEvents: 'none' }}>
          <Silk 
            speed={2}
            scale={0.8}
            color="#662E37"
            noiseIntensity={0.5}
            rotation={5.6}
          />
        </div>
      )}
      
      {showNavbar && <Navbar />}
      <Routes>
        <Route path="/" element={!token ? <LandingPage /> : <Navigate to="/dashboard" />} />
        <Route path="/dashboard" element={token ? <Dashboard /> : <Navigate to="/login" />} />
        <Route path="/login" element={!token ? <LoginPage /> : <Navigate to="/" />} />
        <Route path="/register" element={!token ? <RegisterPage /> : <Navigate to="/athletes" />} />
        <Route path="/athletes" element={token ? <AthletesPage /> : <Navigate to="/login" />} />
        <Route path="/athletes/:id" element={token ? <AthleteDetailsPage /> : <Navigate to="/login" />} />
        <Route path="/my-teams" element={token ? <MyTeamsPage /> : <Navigate to="/login" />} />
        <Route path="/training-plans" element={token ? <TrainingPlansPage /> : <Navigate to="/login" />} />
        <Route path="/profile" element={token ? <ProfilePage /> : <Navigate to="/login" />} /> {/* ÚJ route */}
      </Routes>
      <Toaster />
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;