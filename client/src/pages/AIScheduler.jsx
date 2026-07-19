import { useState, useEffect } from "react";
import { 
  Sparkles, 
  Calendar, 
  Clock, 
  BookOpen, 
  Save, 
  Check, 
  HelpCircle,
  AlertCircle
} from "lucide-react";
import { API_BASE_URL } from "../api";

function AIScheduler({ userId }) {
  const [tasks, setTasks] = useState([]);
  const [examDate, setExamDate] = useState("");
  const [dailyHours, setDailyHours] = useState(3);
  const [selectedSubjects, setSelectedSubjects] = useState([]);
  const [generatedPlan, setGeneratedPlan] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [saveStatus, setSaveStatus] = useState("");

  useEffect(() => {
    // Fetch user's existing tasks to auto-extract unique subjects
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
          // Set initial unique subjects
          const subs = [...new Set(data.map(t => t.subject))].map(sub => ({
            name: sub,
            priority: "Medium",
            selected: true,
          }));
          setSelectedSubjects(subs);
        }
      } catch (err) {
        console.error(err);
      }
    };
    if (userId) {
      fetchTasks();
    }
  }, [userId]);

  const handlePriorityChange = (index, value) => {
    const updated = [...selectedSubjects];
    updated[index].priority = value;
    setSelectedSubjects(updated);
  };

  const handleCheckboxChange = (index) => {
    const updated = [...selectedSubjects];
    updated[index].selected = !updated[index].selected;
    setSelectedSubjects(updated);
  };

  const [newSubjectName, setNewSubjectName] = useState("");
  const handleAddNewSubject = (e) => {
    e.preventDefault();
    if (!newSubjectName.trim()) return;
    
    // Check duplicate
    if (selectedSubjects.some(s => s.name.toLowerCase() === newSubjectName.trim().toLowerCase())) {
      alert("Subject already exists!");
      return;
    }

    setSelectedSubjects([
      ...selectedSubjects,
      {
        name: newSubjectName.trim(),
        priority: "Medium",
        selected: true,
      }
    ]);
    setNewSubjectName("");
  };

  const handleGeneratePlan = (e) => {
    e.preventDefault();
    setGeneratedPlan(null);
    setSaveStatus("");

    if (!examDate) {
      alert("Please select an exam date.");
      return;
    }

    const exam = new Date(examDate);
    const today = new Date();
    today.setHours(0,0,0,0);
    
    const diffTime = exam - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= 0) {
      alert("The exam date must be in the future!");
      return;
    }

    const activeSubjects = selectedSubjects.filter(s => s.selected);
    if (activeSubjects.length === 0) {
      alert("Please select or add at least one subject to study.");
      return;
    }

    setGenerating(true);

    // Simulate AI scheduling logic
    setTimeout(() => {
      const schedule = [];
      const priorityWeights = { High: 3, Medium: 2, Low: 1 };
      
      // Determine existing tasks that can be slotted
      const pendingUserTasks = tasks.filter(t => !t.completed && activeSubjects.some(sub => sub.name === t.subject));

      // Calculate total weight to distribute hours
      let totalWeight = 0;
      activeSubjects.forEach(sub => {
        totalWeight += priorityWeights[sub.priority];
      });

      // Distribute core study modules for each day leading to the exam
      // Day 1 to Day N-1 are study/review days.
      // Day N (day before exam) is Revision Day.
      for (let day = 1; day <= diffDays; day++) {
        const currentDate = new Date();
        currentDate.setDate(today.getDate() + day - 1);
        const dateString = currentDate.toISOString().split("T")[0];

        // Format nice date string
        const formattedDate = currentDate.toLocaleDateString("en-US", {
          weekday: "short",
          month: "short",
          day: "numeric",
        });

        const daySchedule = {
          dayNumber: day,
          date: dateString,
          formattedDate,
          sessions: [],
          isRevisionDay: day === diffDays,
        };

        if (day === diffDays) {
          // Last day before exam: Comprehensive Revision
          daySchedule.sessions.push({
            subject: "All Subjects",
            topic: "Final Review & Cheat-Sheet Revision",
            hours: Math.min(4, dailyHours),
            type: "Revision",
            notes: "Review summary cards, practice formulas, and rest early.",
          });
        } else {
          // Normal study day
          // Pick subjects based on weights & round robin
          let hoursAllocated = 0;
          let subIndex = (day - 1) % activeSubjects.length;

          // Try to allocate tasks or fallback to generic topics
          while (hoursAllocated < dailyHours) {
            const currentSub = activeSubjects[subIndex];
            const sessionHours = Math.min(2, dailyHours - hoursAllocated);

            // Look for a pending user task for this subject
            const matchingTask = pendingUserTasks.find(t => t.subject === currentSub.name && !t.slotted);
            let topicName = "";
            let isUserTask = false;
            let taskId = null;

            if (matchingTask) {
              topicName = matchingTask.title;
              matchingTask.slotted = true;
              isUserTask = true;
              taskId = matchingTask._id;
            } else {
              // Generate AI recommendations based on day order
              const modules = [
                "Foundation Theory & Core Concepts",
                "Textbook Review & Summary Notes",
                "Advanced Problems & Concept Application",
                "Flashcard Active Recall Session",
                "Solve Question Bank & Practice Exam Questions",
                "Doubt Clearing & Reference Material Review"
              ];
              const moduleIdx = Math.floor((day - 1) / 2) % modules.length;
              topicName = `${modules[moduleIdx]}`;
            }

            daySchedule.sessions.push({
              subject: currentSub.name,
              topic: topicName,
              hours: sessionHours,
              type: "Study Session",
              isUserTask,
              taskId,
              notes: isUserTask ? "From your task list." : `Recommended AI modules for ${currentSub.name} (${currentSub.priority} Priority).`,
            });

            hoursAllocated += sessionHours;
            subIndex = (subIndex + 1) % activeSubjects.length;

            // Simple safety break if loop hangs
            if (activeSubjects.length === 0) break;
          }
        }

        schedule.push(daySchedule);
      }

      setGeneratedPlan({
        examDate,
        totalDays: diffDays,
        dailyHours,
        schedule,
      });
      setGenerating(false);
    }, 1200);
  };

  const handleSaveToTasks = async () => {
    if (!generatedPlan) return;
    setSaveStatus("saving");

    try {
      let savedCount = 0;
      for (const day of generatedPlan.schedule) {
        for (const session of day.sessions) {
          // Avoid re-saving tasks that came from database already
          if (session.isUserTask) continue;

          const response = await fetch(`${API_BASE_URL}/api/tasks`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-user-id": userId,
            },
            body: JSON.stringify({
              title: `[AI Plan] ${session.topic}`,
              subject: session.subject,
              deadline: day.date,
              priority: selectedSubjects.find(s => s.name === session.subject)?.priority || "Medium",
              estimatedHours: session.hours,
            }),
          });
          if (response.ok) {
            savedCount++;
          }
        }
      }
      setSaveStatus("success");
      alert(`AI Study Plan saved! Added ${savedCount} new study tasks to your planner.`);
    } catch (err) {
      console.error(err);
      setSaveStatus("error");
    }
  };

  return (
    <div className="ai-scheduler-view">
      <div className="view-title-section">
        <h1>AI Study Schedule Generator</h1>
        <p>Auto-generate intelligent study schedules based on your timeline and priorities.</p>
      </div>

      <div className="ai-scheduler-layout">
        {/* Left Side: Setup Form */}
        <div className="scheduler-setup-panel">
          <div className="setup-card">
            <h2>⚙️ Schedule Parameters</h2>
            <form onSubmit={handleGeneratePlan}>
              <div className="form-field">
                <label>📅 Exam Date</label>
                <input
                  type="date"
                  value={examDate}
                  onChange={(e) => setExamDate(e.target.value)}
                  required
                />
              </div>

              <div className="form-field">
                <label>⏰ Study Hours per Day</label>
                <input
                  type="number"
                  min="1"
                  max="12"
                  value={dailyHours}
                  onChange={(e) => setDailyHours(Number(e.target.value))}
                  required
                />
              </div>

              <div className="subject-selection-header">
                <label>📚 Include Subjects & Weights</label>
              </div>

              {selectedSubjects.length === 0 ? (
                <div className="no-subjects-alert">
                  <AlertCircle size={16} />
                  <span>No subjects active. Add one below!</span>
                </div>
              ) : (
                <div className="subjects-selection-list">
                  {selectedSubjects.map((sub, idx) => (
                    <div key={sub.name} className="subject-select-item">
                      <div className="subject-check-name">
                        <input
                          type="checkbox"
                          checked={sub.selected}
                          onChange={() => handleCheckboxChange(idx)}
                          id={`sub-check-${idx}`}
                        />
                        <label htmlFor={`sub-check-${idx}`}>{sub.name}</label>
                      </div>
                      {sub.selected && (
                        <select
                          className="sub-prio-select"
                          value={sub.priority}
                          onChange={(e) => handlePriorityChange(idx, e.target.value)}
                        >
                          <option value="Low">Low</option>
                          <option value="Medium">Medium</option>
                          <option value="High">High</option>
                        </select>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Add Custom Subject */}
              <div className="add-sub-inline-form">
                <input
                  type="text"
                  placeholder="Add custom subject..."
                  value={newSubjectName}
                  onChange={(e) => setNewSubjectName(e.target.value)}
                />
                <button type="button" onClick={handleAddNewSubject}>
                  Add
                </button>
              </div>

              <button type="submit" className="generate-plan-btn" disabled={generating}>
                <Sparkles size={18} />
                <span>{generating ? "Generating Plan..." : "Generate AI Study Plan"}</span>
              </button>
            </form>
          </div>
        </div>

        {/* Right Side: Generated Roadmap */}
        <div className="scheduler-output-panel">
          {generating ? (
            <div className="generating-state">
              <div className="ai-spinner">
                <Sparkles className="spark-spin" size={32} />
              </div>
              <h3>Assembling Study Roadmap...</h3>
              <p>Balancing study workloads, structuring break intervals, and scheduling topic priorities.</p>
            </div>
          ) : generatedPlan ? (
            <div className="generated-plan-container">
              <div className="plan-summary-header">
                <div>
                  <h2>🎯 Customized Study Roadmap</h2>
                  <p>
                    {generatedPlan.totalDays} Days until Exam • {generatedPlan.totalDays * generatedPlan.dailyHours} total study hours planned.
                  </p>
                </div>
                <button 
                  onClick={handleSaveToTasks} 
                  className="save-plan-btn" 
                  disabled={saveStatus === "success" || saveStatus === "saving"}
                >
                  {saveStatus === "success" ? (
                    <>
                      <Check size={16} />
                      <span>Saved to Tasks!</span>
                    </>
                  ) : saveStatus === "saving" ? (
                    <span>Saving...</span>
                  ) : (
                    <>
                      <Save size={16} />
                      <span>Sync to Task List</span>
                    </>
                  )}
                </button>
              </div>

              <div className="roadmap-timeline">
                {generatedPlan.schedule.map(day => (
                  <div key={day.dayNumber} className={`timeline-day-card ${day.isRevisionDay ? 'revision-day' : ''}`}>
                    <div className="day-number-col">
                      <span className="day-pill">Day {day.dayNumber}</span>
                      <span className="day-date">{day.formattedDate}</span>
                    </div>

                    <div className="day-sessions-col">
                      {day.sessions.map((session, sIdx) => (
                        <div key={sIdx} className="session-stripe">
                          <div className="session-meta">
                            <span className="session-subject">{session.subject}</span>
                            <span className="session-hours">
                              <Clock size={12} />
                              {session.hours} hrs
                            </span>
                            <span className={`session-badge ${session.type.toLowerCase().replace(" ", "-")}`}>
                              {session.type}
                            </span>
                          </div>
                          <h4 className="session-topic">{session.topic}</h4>
                          <p className="session-notes">{session.notes}</p>
                        </div>
                      ))}

                      {!day.isRevisionDay && (
                        <div className="break-stripe">
                          <span className="break-label">☕ Break Time</span>
                          <span className="break-details">Take a 30-min break between sessions to maximize retention.</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="empty-plan-state">
              <Sparkles className="empty-spark" size={48} />
              <h3>Your AI Study Plan Will Appear Here</h3>
              <p>Configure your exam date, daily hours, and subject difficulties, then click generate.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AIScheduler;
