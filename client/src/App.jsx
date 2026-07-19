import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  LayoutDashboard, 
  CheckSquare, 
  Sparkles, 
  BarChart3, 
  LogOut, 
  User, 
  BookOpen 
} from "lucide-react";

import Dashboard from "./pages/Dashboard";
import TaskManager from "./pages/TaskManager";
import AIScheduler from "./pages/AIScheduler";
import ProgressReport from "./pages/ProgressReport";
import "./App.css";

function App() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState("dashboard"); // dashboard, tasks, ai-planner, progress
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (!userStr) {
      navigate("/");
    } else {
      setCurrentUser(JSON.parse(userStr));
    }
    setCheckingAuth(false);
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/");
  };

  if (checkingAuth) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!currentUser) return null;

  return (
    <div className="app-layout">
      {/* Sidebar Navigation */}
      <aside className="app-sidebar">
        <div className="sidebar-logo">
          <BookOpen size={28} className="logo-icon" />
          <span>Smart Study</span>
        </div>

        <nav className="sidebar-nav">
          <button 
            className={`nav-item ${activeTab === "dashboard" ? "active" : ""}`}
            onClick={() => setActiveTab("dashboard")}
          >
            <LayoutDashboard size={20} />
            <span>Dashboard</span>
          </button>

          <button 
            className={`nav-item ${activeTab === "tasks" ? "active" : ""}`}
            onClick={() => setActiveTab("tasks")}
          >
            <CheckSquare size={20} />
            <span>Study Tasks</span>
          </button>

          <button 
            className={`nav-item ${activeTab === "ai-planner" ? "active" : ""}`}
            onClick={() => setActiveTab("ai-planner")}
          >
            <Sparkles size={20} />
            <span>AI Scheduler</span>
          </button>

          <button 
            className={`nav-item ${activeTab === "progress" ? "active" : ""}`}
            onClick={() => setActiveTab("progress")}
          >
            <BarChart3 size={20} />
            <span>Progress Report</span>
          </button>
        </nav>

        {/* User profile section at the bottom */}
        <div className="sidebar-footer">
          <div className="user-profile">
            <div className="user-avatar">
              <User size={18} />
            </div>
            <div className="user-info">
              <span className="user-name">{currentUser.name}</span>
              <span className="user-email">{currentUser.email}</span>
            </div>
          </div>

          <button className="logout-btn" onClick={handleLogout} title="Logout">
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="app-main-content">
        <header className="content-header">
          <div className="header-greeting">
            <h3>Hello, {currentUser.name.split(" ")[0]}! 👋</h3>
            <span className="header-date">
              {new Date().toLocaleDateString("en-US", {
                weekday: "long",
                month: "short",
                day: "numeric",
              })}
            </span>
          </div>
        </header>

        <div className="tab-view-container">
          {activeTab === "dashboard" && <Dashboard userId={currentUser._id} />}
          {activeTab === "tasks" && <TaskManager userId={currentUser._id} />}
          {activeTab === "ai-planner" && <AIScheduler userId={currentUser._id} />}
          {activeTab === "progress" && <ProgressReport userId={currentUser._id} />}
        </div>
      </main>
    </div>
  );
}

export default App;