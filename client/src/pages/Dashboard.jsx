import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { 
  Calendar, 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  Flame,
  ChevronRight,
  TrendingUp,
  Award
} from "lucide-react";
import { API_BASE_URL } from "../api";

function Dashboard({ userId }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [streak, setStreak] = useState(0);

  const fetchTasks = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/tasks`, {
        headers: {
          "x-user-id": userId,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setTasks(data);
      }
    } catch (err) {
      console.error("Error fetching tasks:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchTasks();
    }
    // Calculate a mock study streak based on completed tasks dates or simple active tasks
    const randomStreak = Math.floor(Math.random() * 5) + 3; // Mock active streak
    setStreak(randomStreak);
  }, [userId]);

  // Calculations
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.completed).length;
  const pendingTasks = tasks.filter(t => !t.completed);
  const pendingCount = pendingTasks.length;
  const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Format today's date as YYYY-MM-DD
  const todayStr = new Date().toISOString().split("T")[0];
  
  // Today's tasks (deadline is today)
  const todaysTasks = tasks.filter(t => t.deadline === todayStr);

  // Group pending by priority
  const highPriority = pendingTasks.filter(t => t.priority === "High");
  const mediumPriority = pendingTasks.filter(t => t.priority === "Medium");
  const lowPriority = pendingTasks.filter(t => t.priority === "Low");

  // Calculate total hours scheduled
  const totalHours = tasks.reduce((sum, t) => sum + (t.estimatedHours || 0), 0);
  const completedHours = tasks.filter(t => t.completed).reduce((sum, t) => sum + (t.estimatedHours || 0), 0);

  const toggleTaskComplete = async (id, currentStatus) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/tasks/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ completed: !currentStatus }),
      });
      if (response.ok) {
        fetchTasks();
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading your study stats...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-view">
      <div className="welcome-header">
        <div>
          <h1>Smart Study Dashboard</h1>
          <p className="welcome-text">Track your tasks, build habits, and crush your goals.</p>
        </div>
        <div className="streak-badge">
          <Flame className="streak-icon" size={24} />
          <div>
            <span className="streak-number">{streak} Days</span>
            <span className="streak-label">Study Streak</span>
          </div>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon-wrapper pending">
            <Clock size={24} />
          </div>
          <div className="stat-content">
            <h3>{pendingCount}</h3>
            <p>Pending Tasks</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper completed">
            <CheckCircle size={24} />
          </div>
          <div className="stat-content">
            <h3>{completedTasks}</h3>
            <p>Completed Tasks</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper hours">
            <TrendingUp size={24} />
          </div>
          <div className="stat-content">
            <h3>{completedHours} / {totalHours} hrs</h3>
            <p>Hours Studied</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper milestone">
            <Award size={24} />
          </div>
          <div className="stat-content">
            <h3>{completionPercentage}%</h3>
            <p>Overall Progress</p>
          </div>
        </div>
      </div>

      {/* Main Layout Area */}
      <div className="dashboard-main">
        {/* Left Side: Today's Tasks & Progress Chart */}
        <div className="dashboard-left">
          <div className="dashboard-panel progress-panel">
            <h2>Overall Completion Rate</h2>
            <div className="progress-chart-container">
              <svg className="progress-ring" width="160" height="160">
                <circle
                  className="progress-ring-bg"
                  stroke="#2d2d44"
                  strokeWidth="12"
                  fill="transparent"
                  r="70"
                  cx="80"
                  cy="80"
                />
                <circle
                  className="progress-ring-bar"
                  stroke="url(#gradient)"
                  strokeWidth="12"
                  strokeDasharray={`${2 * Math.PI * 70}`}
                  strokeDashoffset={`${2 * Math.PI * 70 * (1 - completionPercentage / 100)}`}
                  strokeLinecap="round"
                  fill="transparent"
                  r="70"
                  cx="80"
                  cy="80"
                />
                <defs>
                  <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#8b5cf6" />
                    <stop offset="100%" stopColor="#ec4899" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="progress-text">
                <span className="percent">{completionPercentage}%</span>
                <span className="label">Done</span>
              </div>
            </div>
            <p className="progress-summary-text">
              You have completed {completedTasks} out of {totalTasks} total tasks. Keep it up!
            </p>
          </div>

          <div className="dashboard-panel">
            <div className="panel-header">
              <h2>📅 Today's Study Tasks</h2>
              <span className="badge">{todaysTasks.length}</span>
            </div>
            <div className="task-list">
              {todaysTasks.length === 0 ? (
                <div className="empty-panel-state">
                  <p>No tasks scheduled for today.</p>
                  <p className="hint">Great time to plan ahead or take a break!</p>
                </div>
              ) : (
                todaysTasks.map(task => (
                  <div key={task._id} className={`task-strip ${task.completed ? 'done' : ''}`}>
                    <input 
                      type="checkbox" 
                      checked={task.completed} 
                      onChange={() => toggleTaskComplete(task._id, task.completed)}
                      id={`task-check-${task._id}`}
                    />
                    <div className="task-strip-content">
                      <label htmlFor={`task-check-${task._id}`} className="task-strip-title">{task.title}</label>
                      <span className="task-strip-subject">{task.subject}</span>
                    </div>
                    <span className={`priority-badge ${task.priority.toLowerCase()}`}>
                      {task.priority}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Priority Breakdown & History Summary */}
        <div className="dashboard-right">
          <div className="dashboard-panel">
            <h2>⚡ Priority Focus Area</h2>
            <div className="priority-breakdown">
              <div className="priority-group-summary">
                <div className="priority-label-row">
                  <span className="priority-indicator high"></span>
                  <span className="priority-text">High Priority</span>
                  <span className="priority-count">{highPriority.length} pending</span>
                </div>
                <div className="priority-bar-bg">
                  <div 
                    className="priority-bar-fill high" 
                    style={{ width: `${pendingCount > 0 ? (highPriority.length / pendingCount) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>

              <div className="priority-group-summary">
                <div className="priority-label-row">
                  <span className="priority-indicator medium"></span>
                  <span className="priority-text">Medium Priority</span>
                  <span className="priority-count">{mediumPriority.length} pending</span>
                </div>
                <div className="priority-bar-bg">
                  <div 
                    className="priority-bar-fill medium" 
                    style={{ width: `${pendingCount > 0 ? (mediumPriority.length / pendingCount) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>

              <div className="priority-group-summary">
                <div className="priority-label-row">
                  <span className="priority-indicator low"></span>
                  <span className="priority-text">Low Priority</span>
                  <span className="priority-count">{lowPriority.length} pending</span>
                </div>
                <div className="priority-bar-bg">
                  <div 
                    className="priority-bar-fill low" 
                    style={{ width: `${pendingCount > 0 ? (lowPriority.length / pendingCount) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {highPriority.length > 0 && (
              <div className="action-advice alert">
                <AlertTriangle size={18} />
                <span>Focus on your <strong>{highPriority.length} High Priority</strong> tasks first!</span>
              </div>
            )}
          </div>

          <div className="dashboard-panel next-up-panel">
            <h2>⏭️ Next Tasks Up</h2>
            <div className="task-list mini">
              {pendingTasks.slice(0, 3).length === 0 ? (
                <div className="empty-panel-state">
                  <p>All clear! No pending tasks.</p>
                </div>
              ) : (
                pendingTasks.slice(0, 3).map(task => (
                  <div key={task._id} className="mini-task-card">
                    <div>
                      <h4>{task.title}</h4>
                      <p>{task.subject} • Due {task.deadline}</p>
                    </div>
                    <span className={`priority-badge mini ${task.priority.toLowerCase()}`}>
                      {task.priority}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
