import { useState, useEffect } from "react";
import { 
  Plus, 
  Trash2, 
  Edit3, 
  Check, 
  Search, 
  Filter, 
  X, 
  Clock, 
  AlertCircle, 
  ArrowUpDown,
  BookOpen
} from "lucide-react";
import { API_BASE_URL } from "../api";

function TaskManager({ userId }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form states (Add Task)
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [deadline, setDeadline] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [estimatedHours, setEstimatedHours] = useState(2);

  // Editing state
  const [editingTask, setEditingTask] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editSubject, setEditSubject] = useState("");
  const [editDeadline, setEditDeadline] = useState("");
  const [editPriority, setEditPriority] = useState("Medium");
  const [editEstimatedHours, setEditEstimatedHours] = useState(2);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [subjectFilter, setSubjectFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [sortBy, setSortBy] = useState("deadline"); // deadline, priority, title

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

  useEffect(() => {
    if (userId) {
      fetchTasks();
    }
  }, [userId]);

  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!title || !subject || !deadline) {
      alert("Please fill out the Title, Subject, and Deadline");
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/tasks`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": userId,
        },
        body: JSON.stringify({
          title,
          subject,
          deadline,
          priority,
          estimatedHours: Number(estimatedHours),
        }),
      });

      if (response.ok) {
        // Reset form
        setTitle("");
        setSubject("");
        setDeadline("");
        setPriority("Medium");
        setEstimatedHours(2);
        fetchTasks();
      }
    } catch (err) {
      console.error(err);
    }
  };

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

  const handleDeleteTask = async (id) => {
    if (!window.confirm("Are you sure you want to delete this study task?")) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/tasks/${id}`, {
        method: "DELETE",
      });
      if (response.ok) {
        fetchTasks();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const startEdit = (task) => {
    setEditingTask(task);
    setEditTitle(task.title);
    setEditSubject(task.subject);
    setEditDeadline(task.deadline);
    setEditPriority(task.priority || "Medium");
    setEditEstimatedHours(task.estimatedHours || 2);
  };

  const handleUpdateTask = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_BASE_URL}/api/tasks/${editingTask._id}/edit`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: editTitle,
          subject: editSubject,
          deadline: editDeadline,
          priority: editPriority,
          estimatedHours: Number(editEstimatedHours),
        }),
      });

      if (response.ok) {
        setEditingTask(null);
        fetchTasks();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Unique list of subjects for filter dropdown
  const uniqueSubjects = ["All", ...new Set(tasks.map(t => t.subject))];

  // Filtering Logic
  const filteredTasks = tasks.filter(task => {
    const matchesSearch = 
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.subject.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = 
      statusFilter === "All" ? true :
      statusFilter === "Completed" ? task.completed : !task.completed;
      
    const matchesSubject = 
      subjectFilter === "All" ? true : task.subject === subjectFilter;

    const matchesPriority = 
      priorityFilter === "All" ? true : task.priority === priorityFilter;

    return matchesSearch && matchesStatus && matchesSubject && matchesPriority;
  });

  // Sorting Logic
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    if (sortBy === "deadline") {
      return new Date(a.deadline) - new Date(b.deadline);
    }
    if (sortBy === "title") {
      return a.title.localeCompare(b.title);
    }
    if (sortBy === "priority") {
      const pMap = { High: 3, Medium: 2, Low: 1 };
      return (pMap[b.priority] || 2) - (pMap[a.priority] || 2);
    }
    return 0;
  });

  return (
    <div className="task-manager-view">
      <div className="view-title-section">
        <h1>Study Tasks Manager</h1>
        <p>Organize, schedule, and execute your learning pathways.</p>
      </div>

      <div className="task-manager-layout">
        {/* Left Side: Create / Edit Form */}
        <div className="task-form-panel">
          {editingTask ? (
            <div className="task-card-form editing">
              <div className="form-header">
                <h2>✏️ Edit Study Task</h2>
                <button className="close-btn" onClick={() => setEditingTask(null)}>
                  <X size={18} />
                </button>
              </div>
              <form onSubmit={handleUpdateTask}>
                <div className="form-field">
                  <label>Subject</label>
                  <input
                    type="text"
                    value={editSubject}
                    onChange={(e) => setEditSubject(e.target.value)}
                    required
                  />
                </div>
                <div className="form-field">
                  <label>Topic / Task Title</label>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    required
                  />
                </div>
                <div className="form-row">
                  <div className="form-field">
                    <label>Deadline</label>
                    <input
                      type="date"
                      value={editDeadline}
                      onChange={(e) => setEditDeadline(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-field">
                    <label>Est. Hours</label>
                    <input
                      type="number"
                      min="0.5"
                      step="0.5"
                      value={editEstimatedHours}
                      onChange={(e) => setEditEstimatedHours(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="form-field">
                  <label>Priority</label>
                  <select 
                    value={editPriority} 
                    onChange={(e) => setEditPriority(e.target.value)}
                  >
                    <option value="Low">Low Priority</option>
                    <option value="Medium">Medium Priority</option>
                    <option value="High">High Priority</option>
                  </select>
                </div>
                <button type="submit" className="form-submit-btn edit">
                  <Check size={18} />
                  <span>Update Task</span>
                </button>
                <button type="button" className="form-cancel-btn" onClick={() => setEditingTask(null)}>
                  Cancel
                </button>
              </form>
            </div>
          ) : (
            <div className="task-card-form">
              <h2>➕ Add New Study Task</h2>
              <form onSubmit={handleAddTask}>
                <div className="form-field">
                  <label>Subject</label>
                  <input
                    type="text"
                    placeholder="e.g. Physics, Data Structures"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    required
                  />
                </div>
                <div className="form-field">
                  <label>Topic / Task Title</label>
                  <input
                    type="text"
                    placeholder="e.g. Solve Practice Set 2, Read Chapter 4"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                </div>
                <div className="form-row">
                  <div className="form-field">
                    <label>Deadline</label>
                    <input
                      type="date"
                      value={deadline}
                      onChange={(e) => setDeadline(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-field">
                    <label>Est. Hours</label>
                    <input
                      type="number"
                      min="0.5"
                      step="0.5"
                      value={estimatedHours}
                      onChange={(e) => setEstimatedHours(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="form-field">
                  <label>Priority</label>
                  <select 
                    value={priority} 
                    onChange={(e) => setPriority(e.target.value)}
                  >
                    <option value="Low">Low Priority</option>
                    <option value="Medium">Medium Priority</option>
                    <option value="High">High Priority</option>
                  </select>
                </div>
                <button type="submit" className="form-submit-btn">
                  <Plus size={18} />
                  <span>Add Study Task</span>
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Right Side: Task List, Search, Sorting, Filters */}
        <div className="task-list-panel">
          {/* Filters Bar */}
          <div className="filters-container">
            <div className="search-box">
              <Search className="search-icon" size={18} />
              <input
                type="text"
                placeholder="Search subjects or topics..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="filters-grid">
              <div className="filter-select-group">
                <Filter size={14} className="filter-icon" />
                <select 
                  value={statusFilter} 
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="All">All Status</option>
                  <option value="Pending">Pending</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>

              <div className="filter-select-group">
                <BookOpen size={14} className="filter-icon" />
                <select 
                  value={subjectFilter} 
                  onChange={(e) => setSubjectFilter(e.target.value)}
                >
                  {uniqueSubjects.map(sub => (
                    <option key={sub} value={sub}>{sub}</option>
                  ))}
                </select>
              </div>

              <div className="filter-select-group">
                <AlertCircle size={14} className="filter-icon" />
                <select 
                  value={priorityFilter} 
                  onChange={(e) => setPriorityFilter(e.target.value)}
                >
                  <option value="All">All Priority</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>

              <div className="filter-select-group">
                <ArrowUpDown size={14} className="filter-icon" />
                <select 
                  value={sortBy} 
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="deadline">Sort by Deadline</option>
                  <option value="priority">Sort by Priority</option>
                  <option value="title">Sort by Title</option>
                </select>
              </div>
            </div>
          </div>

          {/* Cards List */}
          <div className="tasks-cards-scroll">
            {loading ? (
              <div className="loading-state">
                <div className="spinner"></div>
                <p>Loading study planner tasks...</p>
              </div>
            ) : sortedTasks.length === 0 ? (
              <div className="empty-tasks-state">
                <p>No study tasks found matching the criteria.</p>
                <p className="subtitle">Add a task on the left or clear your filters.</p>
              </div>
            ) : (
              sortedTasks.map(task => (
                <div 
                  key={task._id} 
                  className={`task-card-item ${task.completed ? 'completed' : ''} ${task.priority.toLowerCase()}`}
                >
                  <div className="task-card-left">
                    <input
                      type="checkbox"
                      checked={task.completed}
                      onChange={() => toggleTaskComplete(task._id, task.completed)}
                      className="task-checkbox"
                    />
                    <div className="task-details">
                      <h3>{task.title}</h3>
                      <div className="task-tags">
                        <span className="subject-tag">{task.subject}</span>
                        <span className="hours-tag">
                          <Clock size={12} />
                          {task.estimatedHours} hrs
                        </span>
                        <span className="date-tag">
                          Due: {task.deadline}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="task-card-right">
                    <span className={`priority-pill ${task.priority.toLowerCase()}`}>
                      {task.priority}
                    </span>
                    <div className="task-card-actions">
                      <button 
                        onClick={() => startEdit(task)} 
                        className="action-btn edit-btn" 
                        title="Edit Task"
                      >
                        <Edit3 size={16} />
                      </button>
                      <button 
                        onClick={() => handleDeleteTask(task._id)} 
                        className="action-btn delete-btn" 
                        title="Delete Task"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default TaskManager;
