import { AuthProvider } from "./context/AuthContext.js";
import { useAuth } from "./hooks/useAuth.js";
import { LoginPage } from "./pages/LoginPage.js";
import { ChatPage } from "./pages/ChatPage.js";

function AppContent() {
  const { user, loading, logout } = useAuth();

  if (loading) return <div className="loading">Loading...</div>;
  if (!user) return <LoginPage />;

  return (
    <div className="app-layout">
      <header className="app-header">
        <h1>Chat-X</h1>
        <div className="header-right">
          <span>{user.username}</span>
          <button onClick={logout}>Logout</button>
        </div>
      </header>
      <main className="app-main">
        <ChatPage />
      </main>
    </div>
  );
}

export function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
