import { useEffect, useState } from "react";
import { 
  BarChart2, 
  Clock, 
  CheckSquare, 
  Calendar, 
  Award, 
  ShieldCheck,
  Zap,
  TrendingUp,
  Smile
} from "lucide-react";
import { API_BASE_URL } from "../api";

function ProgressReport({ userId }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (userId) {
      fetchTasks();
    }
  }, [userId]);

  // Statistics
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.completed);
  const completedCount = completedTasks.length;
  const pendingCount = totalTasks - completedCount;
  
  // Total Hours
  const totalHours = tasks.reduce((sum, t) => sum + (t.estimatedHours || 0), 0);
  const completedHours = completedTasks.reduce((sum, t) => sum + (t.estimatedHours || 0), 0);

  // Group by Subject
  const subjectStats = {};
  tasks.forEach(task => {
    if (!subjectStats[task.subject]) {
      subjectStats[task.subject] = { total: 0, completed: 0, hours: 0 };
    }
    subjectStats[task.subject].total += 1;
    if (task.completed) {
      subjectStats[task.subject].completed += 1;
      subjectStats[task.subject].hours += (task.estimatedHours || 0);
    }
  });

  // Convert to array
  const subjectList = Object.keys(subjectStats).map(subject => {
    const stats = subjectStats[subject];
    return {
      name: subject,
      total: stats.total,
      completed: stats.completed,
      hours: stats.hours,
      percent: stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0,
    };
  });

  // Milestones system
  const milestones = [
    {
      id: "first_step",
      title: "First Step",
      description: "Complete your first study task",
      unlocked: completedCount >= 1,
      icon: Smile,
      badgeColor: "#10b981",
    },
    {
      id: "five_club",
      title: "Focus Master",
      description: "Complete 5 study tasks",
      unlocked: completedCount >= 5,
      icon: Zap,
      badgeColor: "#3b82f6",
    },
    {
      id: "scholar",
      title: "Super Scholar",
      description: "Complete 10 study tasks",
      unlocked: completedCount >= 10,
      icon: Award,
      badgeColor: "#8b5cf6",
    },
    {
      id: "deep_work_10",
      title: "Deep Work Novice",
      description: "Log 10 hours of completed study",
      unlocked: completedHours >= 10,
      icon: Clock,
      badgeColor: "#f59e0b",
    },
    {
      id: "deep_work_25",
      title: "Productivity Sage",
      description: "Log 25 hours of completed study",
      unlocked: completedHours >= 25,
      icon: ShieldCheck,
      badgeColor: "#ec4899",
    },
  ];

  const unlockedMilestones = milestones.filter(m => m.unlocked).length;

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Calculating your academic progress...</p>
      </div>
    );
  }

  return (
    <div className="progress-report-view">
      <div className="view-title-section">
        <h1>Progress & Performance Report</h1>
        <p>Visualize your accomplishments, study duration, and milestones.</p>
      </div>

      {/* Overview stats block */}
      <div className="analytics-overview-row">
        <div className="metric-box">
          <CheckSquare className="metric-icon completed" size={28} />
          <div className="metric-details">
            <h3>{completedCount} / {totalTasks}</h3>
            <p>Tasks Completed</p>
          </div>
        </div>

        <div className="metric-box">
          <Clock className="metric-icon hours" size={28} />
          <div className="metric-details">
            <h3>{completedHours} hrs</h3>
            <p>Study Time Logged</p>
          </div>
        </div>

        <div className="metric-box">
          <Award className="metric-icon milestones" size={28} />
          <div className="metric-details">
            <h3>{unlockedMilestones} / {milestones.length}</h3>
            <p>Milestones Achieved</p>
          </div>
        </div>
      </div>

      <div className="progress-grid">
        {/* Left Side: Subject Completion Percentages */}
        <div className="progress-panel">
          <h2>📚 Completion Rate by Subject</h2>
          {subjectList.length === 0 ? (
            <div className="empty-panel-state">
              <p>No study history available.</p>
              <p className="hint">Start adding and completing tasks to see subject analytics.</p>
            </div>
          ) : (
            <div className="subject-analytics-list">
              {subjectList.map(sub => (
                <div key={sub.name} className="subject-progress-card">
                  <div className="sub-header-row">
                    <span className="sub-name">{sub.name}</span>
                    <span className="sub-fraction">
                      {sub.completed}/{sub.total} Tasks ({sub.percent}%)
                    </span>
                  </div>
                  <div className="sub-bar-bg">
                    <div 
                      className="sub-bar-fill" 
                      style={{ width: `${sub.percent}%` }}
                    ></div>
                  </div>
                  <div className="sub-footer-row">
                    <span>Hours studied: {sub.hours} hrs</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Side: Milestones Badges */}
        <div className="progress-panel">
          <h2>🏆 Achievement Badges</h2>
          <div className="milestones-list">
            {milestones.map(m => {
              const Icon = m.icon;
              return (
                <div key={m.id} className={`milestone-badge-card ${m.unlocked ? 'unlocked' : 'locked'}`}>
                  <div className="badge-icon-circle" style={{ backgroundColor: m.unlocked ? m.badgeColor : "#2d2d44" }}>
                    <Icon size={24} color={m.unlocked ? "#fff" : "#6b7280"} />
                  </div>
                  <div className="badge-info">
                    <h4>{m.title}</h4>
                    <p>{m.description}</p>
                    <span className="badge-status-text">
                      {m.unlocked ? "🔓 Unlocked" : "🔒 Locked"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Study History Log */}
      <div className="progress-panel study-history-section">
        <h2>📜 Study History & Completion Log</h2>
        {completedTasks.length === 0 ? (
          <div className="empty-panel-state">
            <p>No tasks completed yet.</p>
            <p className="hint">Toggle completion in the Dashboard or Task Manager to record history.</p>
          </div>
        ) : (
          <div className="history-table-wrapper">
            <table className="history-table">
              <thead>
                <tr>
                  <th>Topic</th>
                  <th>Subject</th>
                  <th>Duration</th>
                  <th>Completed Date</th>
                </tr>
              </thead>
              <tbody>
                {completedTasks.map(task => (
                  <tr key={task._id}>
                    <td className="history-title">{task.title}</td>
                    <td>
                      <span className="history-subject-tag">{task.subject}</span>
                    </td>
                    <td>{task.estimatedHours} hrs</td>
                    <td>
                      <span className="history-date">
                        {task.completedAt 
                          ? new Date(task.completedAt).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric"
                            })
                          : task.deadline}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default ProgressReport;
