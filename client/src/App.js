import React, { useState, useEffect, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { Toaster } from 'react-hot-toast';
import ErrorBoundary from './components/ErrorBoundary';
import CommandPalette from './components/CommandPalette';
import Navbar from './components/Navbar';

// Eagerly loaded critical initial routes
import Home from './pages/Home';
import Questions from './pages/Questions';
import Login from './pages/Login';
import Register from './pages/Register';
import QuestionDetail from './pages/QuestionDetail';

// Code-split secondary routes
const AskQuestion = lazy(() => import('./pages/AskQuestion'));
const Tags = lazy(() => import('./pages/Tags'));
const Users = lazy(() => import('./pages/Users'));
const Profile = lazy(() => import('./pages/Profile'));
const GuruPortal = lazy(() => import('./pages/GuruPortal'));
const AdminPanel = lazy(() => import('./pages/AdminPanel'));
const AIChat = lazy(() => import('./pages/AIChat'));
const ReviewQueues = lazy(() => import('./pages/ReviewQueues'));
const Bounties = lazy(() => import('./pages/Bounties'));
const AuthCallback = lazy(() => import('./pages/AuthCallback'));
const Scriptures = lazy(() => import('./pages/Scriptures'));
const Debates = lazy(() => import('./pages/Debates'));
const CreateDebate = lazy(() => import('./pages/CreateDebate'));
const DebateDetail = lazy(() => import('./pages/DebateDetail'));

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

const PageLoader = () => (
  <div className="min-h-[60vh] flex items-center justify-center">
    <div className="w-8 h-8 border-3 border-brand/30 border-t-brand rounded-full animate-spin"></div>
  </div>
);

function App() {
  const [paletteOpen, setPaletteOpen] = useState(false);

  // ⌘K / Ctrl+K toggle
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setPaletteOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <Router>
            <div className="min-h-screen bg-cream dark:bg-[#141110] transition-colors duration-300">
              <Navbar onOpenPalette={() => setPaletteOpen(true)} />
              <main className="container mx-auto px-4 py-6">
                <Suspense fallback={<PageLoader />}>
                  <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/questions" element={<Questions />} />
                    <Route path="/questions/ask" element={<ProtectedRoute><AskQuestion /></ProtectedRoute>} />
                    <Route path="/questions/:id" element={<QuestionDetail />} />
                    <Route path="/tags" element={<Tags />} />
                    <Route path="/users" element={<Users />} />
                    <Route path="/profile/:id" element={<Profile />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/auth/callback" element={<AuthCallback />} />
                    <Route path="/guru" element={<GuruPortal />} />
                    <Route path="/admin" element={<AdminPanel />} />
                    <Route path="/chat" element={<ProtectedRoute><AIChat /></ProtectedRoute>} />
                    <Route path="/reviews" element={<ReviewQueues />} />
                    <Route path="/bounties" element={<Bounties />} />
                    <Route path="/scriptures" element={<Scriptures />} />
                    <Route path="/debates" element={<Debates />} />
                    <Route path="/debates/create" element={<ProtectedRoute><CreateDebate /></ProtectedRoute>} />
                    <Route path="/debates/:id" element={<DebateDetail />} />
                  </Routes>
                </Suspense>
              </main>
              <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
              <Toaster position="top-right" />
            </div>
          </Router>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
