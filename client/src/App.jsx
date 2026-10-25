import { useEffect, useState } from "react";
import WorkoutCard from "./components/WorkoutCard";
import {
  getWorkouts,
  createWorkout,
  deleteWorkout,
  getExercises,
  createExercise,
  deleteExercise,
  createSet,
  getSets,
  deleteSet,
  updateSet,
} from "./api/workoutApi";
import "./App.css";

function App() {
  // Main Data States
  const [workouts, setWorkouts] = useState([]);
  const [selectedWorkout, setSelectedWorkout] = useState(null);
  const [exercises, setExercises] = useState([]);
  const [sets, setSets] = useState([]);

  // Form & UI States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newWorkoutName, setNewWorkoutName] = useState("");
  const [newWorkoutDate, setNewWorkoutDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [newWorkoutCategory, setNewWorkoutCategory] = useState("Hypertrophy");
  const [newWorkoutNotes, setNewWorkoutNotes] = useState("");
  const [workoutError, setWorkoutError] = useState("");

  const [exerciseName, setExerciseName] = useState("");
  const [exerciseError, setExerciseError] = useState("");

  const [weights, setWeights] = useState({});
  const [reps, setReps] = useState({});
  const [setError, setSetError] = useState({});

  // Inline set editing states
  const [editingSetId, setEditingSetId] = useState(null);
  const [editWeight, setEditWeight] = useState("");
  const [editReps, setEditReps] = useState("");

  // Delete workout popover state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Initial Load
  useEffect(() => {
    fetchWorkoutsList();
  }, []);

  async function fetchWorkoutsList() {
    try {
      const data = await getWorkouts();
      setWorkouts(data);
    } catch (err) {
      console.error("Failed to load workouts:", err);
    }
  }

  // Handle selecting a workout to view detail
  async function handleSelectWorkout(workout) {
    setSelectedWorkout(workout);
    setShowDeleteConfirm(false);
    try {
      const exData = await getExercises(workout.id);
      setExercises(exData);

      const allSets = await Promise.all(
        exData.map((exercise) => getSets(exercise.id))
      );
      setSets(allSets.flat());
    } catch (err) {
      console.error("Failed to load exercise details:", err);
    }
  }

  // Handle return to dashboard
  function handleBackToDashboard() {
    setSelectedWorkout(null);
    setExercises([]);
    setSets([]);
    fetchWorkoutsList(); // Refresh list to update any set counts
  }

  // Create Workout via Modal
  async function handleCreateWorkout(e) {
    if (e) e.preventDefault();
    if (!newWorkoutName.trim()) {
      setWorkoutError("Workout title cannot be blank.");
      return;
    }

    setWorkoutError("");
    const newWorkoutPayload = {
      name: newWorkoutName.trim(),
      date: newWorkoutDate || new Date().toISOString().split("T")[0],
    };

    try {
      const created = await createWorkout(newWorkoutPayload);
      setWorkouts((prev) => [created, ...prev]);
      setNewWorkoutName("");
      setNewWorkoutNotes("");
      setIsModalOpen(false);
    } catch (err) {
      console.error("Failed to create workout:", err);
      setWorkoutError("Failed to save workout. Please try again.");
    }
  }

  // Delete Workout
  async function handleDeleteWorkout(id) {
    try {
      await deleteWorkout(id);
      setWorkouts((prev) => prev.filter((w) => w.id !== id));
      if (selectedWorkout && selectedWorkout.id === id) {
        setSelectedWorkout(null);
      }
    } catch (err) {
      console.error("Failed to delete workout:", err);
      alert(
        "Could not delete workout. Make sure all nested exercises/sets are deleted first if restricted by foreign keys."
      );
    }
  }

  // Add Exercise to Selected Workout
  async function handleAddExercise(e) {
    if (e) e.preventDefault();
    if (!exerciseName.trim()) {
      setExerciseError("Movement designation cannot be empty.");
      return;
    }

    setExerciseError("");
    try {
      const createdExercise = await createExercise(selectedWorkout.id, {
        name: exerciseName.trim(),
      });
      setExercises((prev) => [...prev, createdExercise]);
      setExerciseName("");
    } catch (err) {
      console.error("Failed to add exercise:", err);
      setExerciseError("Failed to add exercise. Please try again.");
    }
  }

  // Delete Exercise
  async function handleDeleteExercise(id) {
    if (!window.confirm("Are you sure you want to delete this exercise and all its sets?")) {
      return;
    }
    try {
      await deleteExercise(id);
      setExercises((prev) => prev.filter((ex) => ex.id !== id));
      setSets((prev) => prev.filter((s) => s.exerciseId !== id));
    } catch (err) {
      console.error("Failed to delete exercise:", err);
      alert("Failed to delete exercise.");
    }
  }

  // Add Set to an Exercise
  async function handleAddSet(exerciseId) {
    const weightVal = weights[exerciseId];
    const repsVal = reps[exerciseId];

    if (!weightVal || !repsVal) {
      setSetError((prev) => ({
        ...prev,
        [exerciseId]: "Weight and reps are required.",
      }));
      return;
    }

    if (Number(weightVal) <= 0 || Number(repsVal) <= 0) {
      setSetError((prev) => ({
        ...prev,
        [exerciseId]: "Weight and reps must be greater than 0.",
      }));
      return;
    }

    setSetError((prev) => ({ ...prev, [exerciseId]: "" }));

    try {
      const createdSet = await createSet(exerciseId, {
        weight: Number(weightVal),
        reps: Number(repsVal),
      });

      setSets((prev) => [...prev, createdSet]);
      setWeights((prev) => ({ ...prev, [exerciseId]: "" }));
      setReps((prev) => ({ ...prev, [exerciseId]: "" }));
    } catch (err) {
      console.error("Failed to create set:", err);
      setSetError((prev) => ({
        ...prev,
        [exerciseId]: "Failed to save set.",
      }));
    }
  }

  // Start inline editing of set
  function startEditSet(set) {
    setEditingSetId(set.id);
    setEditWeight(set.weight);
    setEditReps(set.reps);
  }

  // Save inline set edit
  async function handleSaveSet(id) {
    if (Number(editWeight) <= 0 || Number(editReps) <= 0) {
      alert("Weight and reps must be greater than 0.");
      return;
    }

    try {
      const updated = await updateSet(id, {
        weight: Number(editWeight),
        reps: Number(editReps),
      });

      setSets((prev) => prev.map((s) => (s.id === id ? updated : s)));
      setEditingSetId(null);
    } catch (err) {
      console.error("Failed to update set:", err);
      alert("Failed to update set.");
    }
  }

  // Delete Set
  async function handleDeleteSet(id) {
    try {
      await deleteSet(id);
      setSets((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      console.error("Failed to delete set:", err);
    }
  }

  // Derived telemetry metrics
  const totalWorkoutsCount = workouts.length;
  const latestWorkout = workouts[0];
  const formattedLatest = latestWorkout
    ? new Date(latestWorkout.date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      })
    : "No logs yet";

  // Calculate detail session total tonnage
  const totalSessionVolume = sets.reduce(
    (acc, s) => acc + (Number(s.weight) || 0) * (Number(s.reps) || 0),
    0
  );

  return (
    <div className="min-h-screen">
      {/* Top Persistent App Bar */}
      <header className="app-header">
        <div className="header-inner">
          <div className="brand-group">
            <div className="brand-icon">
              <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>
                fitness_center
              </span>
            </div>
            <div className="brand-text">
              <div className="brand-title-row">
                <span className="brand-name">Workout Tracker</span>
                <span className="live-dot" title="System Active"></span>
              </div>
              <span className="brand-sub">Track your workouts. Stay consistent.</span>
            </div>
          </div>

          <nav className="nav-links">
            <button
              className={`nav-link ${!selectedWorkout ? "active" : ""}`}
              onClick={handleBackToDashboard}
            >
              Workouts
            </button>
            <button className="nav-link" onClick={() => alert("Routines library coming soon.")}>
              Routines
            </button>
            <button className="nav-link" onClick={() => alert("Telemetry metrics coming soon.")}>
              Metrics
            </button>
          </nav>

          <div className="header-actions">
            <div className="sync-badge">
              <span className="sync-dot"></span>
              <span>SYNCED</span>
            </div>
            <div className="user-avatar" title="Active Lifter">
              <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>
                person
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="main-wrapper">
        {selectedWorkout === null ? (
          /* =================================================================
             DASHBOARD VIEW
             ================================================================= */
          <div>
            {/* Header Area */}
            <div className="dashboard-header">
              <div>
                <div className="cadence-badge">
                  <span>LOGGING CADENCE</span>
                  <span className="live-dot"></span>
                  <span className="cadence-sub">SESSION OVERVIEW</span>
                </div>
                <h1 className="page-title">Workouts</h1>
                <p className="page-subtitle">
                  Track your workouts. Stay consistent with progressive overload.
                </p>
              </div>

              <div className="header-buttons">
                <button
                  className="btn-primary"
                  onClick={() => setIsModalOpen(true)}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>
                    add
                  </span>
                  <span>New Workout</span>
                </button>
              </div>
            </div>

            {/* Metrics Overview Grid */}
            <div className="metrics-grid">
              <div className="metric-card">
                <div className="metric-top">
                  <span>Total Workouts</span>
                  <span className="material-symbols-outlined" style={{ color: "var(--secondary)", fontSize: "18px" }}>
                    bar_chart
                  </span>
                </div>
                <div className="metric-value-row">
                  <span className="metric-number">{totalWorkoutsCount}</span>
                  <span className="metric-unit">logged</span>
                </div>
                <div className="metric-progress-bar">
                  <div
                    className="metric-progress-fill"
                    style={{ width: `${Math.min(totalWorkoutsCount * 15, 100)}%` }}
                  ></div>
                </div>
              </div>

              <div className="metric-card">
                <div className="metric-top">
                  <span>Last Session</span>
                  <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>
                    schedule
                  </span>
                </div>
                <div className="metric-value-row">
                  <span className="metric-number" style={{ fontSize: "20px" }}>
                    {formattedLatest}
                  </span>
                </div>
                <span className="metric-subtext">
                  {latestWorkout ? latestWorkout.name : "Ready to train"}
                </span>
              </div>

              <div className="metric-card">
                <div className="metric-top">
                  <span>Target Focus</span>
                  <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>
                    fitness_center
                  </span>
                </div>
                <div className="metric-value-row">
                  <span className="metric-number">Hypertrophy</span>
                </div>
                <div className="metric-trend">
                  <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>
                    trending_up
                  </span>
                  <span>Active microcycle</span>
                </div>
              </div>

              <div className="metric-card">
                <div className="metric-top">
                  <span>Consistency Rate</span>
                  <span className="material-symbols-outlined" style={{ color: "var(--secondary)", fontSize: "18px" }}>
                    verified
                  </span>
                </div>
                <div className="metric-value-row">
                  <span className="metric-number">94.2%</span>
                  <span className="metric-unit">Target 90%</span>
                </div>
                <span className="metric-subtext">Prisma DB synchronized</span>
              </div>
            </div>

            {/* Target Telemetry & Weekly Activity Banner */}
            <div className="telemetry-banner">
              <div className="banner-left">
                <div className="dial-wrapper">
                  <svg className="dial-circle" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="transparent"
                      stroke="var(--surface-container-high)"
                      strokeWidth="8"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="transparent"
                      stroke="var(--secondary)"
                      strokeWidth="8"
                      strokeDasharray="251"
                      strokeDashoffset="50"
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="dial-center">
                    <span className="dial-value">80%</span>
                    <span className="dial-label">WEEK 43</span>
                  </div>
                </div>

                <div className="banner-info">
                  <span className="banner-tag">Weekly Microcycle Target</span>
                  <h2 className="banner-title">4 of 5 target lift blocks logged</h2>
                  <p className="banner-desc">
                    Telemetry records synced to PostgreSQL. Ready to stage next movement session.
                  </p>
                </div>
              </div>

              <div className="activity-widget">
                <div className="activity-header">
                  <span style={{ textTransform: "uppercase", color: "var(--on-surface-variant)" }}>
                    Daily Activity Trend
                  </span>
                  <span style={{ color: "var(--secondary)", fontWeight: 600 }}>Past 7 Days</span>
                </div>
                <div className="activity-bars">
                  <div className="activity-bar-col">
                    <div className="activity-bar-fill" style={{ height: "35%" }}></div>
                    <span className="activity-bar-day">M</span>
                  </div>
                  <div className="activity-bar-col">
                    <div className="activity-bar-fill active" style={{ height: "80%" }}></div>
                    <span className="activity-bar-day">T</span>
                  </div>
                  <div className="activity-bar-col">
                    <div className="activity-bar-fill" style={{ height: "25%" }}></div>
                    <span className="activity-bar-day">W</span>
                  </div>
                  <div className="activity-bar-col">
                    <div className="activity-bar-fill active" style={{ height: "95%" }}></div>
                    <span className="activity-bar-day">T</span>
                  </div>
                  <div className="activity-bar-col">
                    <div className="activity-bar-fill" style={{ height: "20%" }}></div>
                    <span className="activity-bar-day">F</span>
                  </div>
                  <div className="activity-bar-col">
                    <div className="activity-bar-fill active" style={{ height: "65%" }}></div>
                    <span className="activity-bar-day">S</span>
                  </div>
                  <div className="activity-bar-col">
                    <div className="activity-bar-fill today" style={{ height: "85%" }}></div>
                    <span className="activity-bar-day today">S</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Workouts Grid Section */}
            <div>
              <div className="section-header">
                <div className="section-title-group">
                  <h2 className="section-title">Recent Workout Sessions</h2>
                  <span className="count-pill">{workouts.length} Listed</span>
                </div>
              </div>

              {workouts.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-icon">
                    <span className="material-symbols-outlined" style={{ fontSize: "32px" }}>
                      fitness_center
                    </span>
                  </div>
                  <span className="cadence-badge">ZERO LOGS PRESENT</span>
                  <h3 className="empty-state-title">No workouts recorded yet</h3>
                  <p className="empty-state-desc">
                    Start by logging your first workout session to track your strength journey,
                    sets progression, and progressive overload over time.
                  </p>
                  <div style={{ marginTop: "24px" }}>
                    <button
                      className="btn-primary"
                      onClick={() => setIsModalOpen(true)}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>
                        add
                      </span>
                      <span>Create Your First Workout</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="workouts-grid">
                  {workouts.map((workout) => (
                    <WorkoutCard
                      key={workout.id}
                      workout={workout}
                      onDelete={handleDeleteWorkout}
                      onSelect={handleSelectWorkout}
                    />
                  ))}

                  {/* Quick Create Card */}
                  <div
                    className="quick-create-card"
                    onClick={() => setIsModalOpen(true)}
                  >
                    <div className="quick-create-icon">
                      <span className="material-symbols-outlined" style={{ fontSize: "24px" }}>
                        add
                      </span>
                    </div>
                    <h3 className="quick-create-title">Record Next Session</h3>
                    <p className="quick-create-desc">
                      Start a blank entry or load from existing macro routines.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* =================================================================
             WORKOUT DETAIL & SET LOGGER VIEW
             ================================================================= */
          <div>
            {/* Top Navigation & Breadcrumb */}
            <div className="detail-top-nav">
              <button className="btn-back" onClick={handleBackToDashboard}>
                <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>
                  arrow_back
                </span>
                <span>Back to Workouts</span>
              </button>

              <div className="delete-workout-container">
                <button
                  className="btn-danger"
                  onClick={() => setShowDeleteConfirm(!showDeleteConfirm)}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>
                    delete
                  </span>
                  <span>Delete Workout</span>
                </button>

                {showDeleteConfirm && (
                  <div className="confirm-popover">
                    <p className="popover-title">Delete this workout log?</p>
                    <p className="popover-desc">
                      This will permanently remove "{selectedWorkout.name}".
                    </p>
                    <div className="popover-actions">
                      <button
                        className="btn-secondary"
                        style={{ padding: "4px 10px", fontSize: "11px" }}
                        onClick={() => setShowDeleteConfirm(false)}
                      >
                        Cancel
                      </button>
                      <button
                        className="btn-primary"
                        style={{
                          backgroundColor: "var(--error)",
                          padding: "4px 10px",
                          fontSize: "11px",
                        }}
                        onClick={() => handleDeleteWorkout(selectedWorkout.id)}
                      >
                        Confirm
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Header Telemetry */}
            <div className="detail-banner">
              <div>
                <div className="telemetry-tag">
                  <span>TELEMETRY ID // WOD-{selectedWorkout.id}</span>
                  <span className="live-dot"></span>
                  <span style={{ color: "var(--secondary)" }}>ARCHIVED LOG</span>
                </div>
                <h1 className="detail-workout-title">{selectedWorkout.name}</h1>
                <p className="detail-workout-date">
                  {new Date(selectedWorkout.date).toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
              </div>

              <div className="detail-pills">
                <div className="telemetry-pill">
                  <span className="material-symbols-outlined" style={{ fontSize: "16px", color: "var(--secondary)" }}>
                    exercise
                  </span>
                  <span>{exercises.length} exercises</span>
                </div>
                <div className="telemetry-pill">
                  <span className="material-symbols-outlined" style={{ fontSize: "16px", color: "var(--secondary)" }}>
                    check_circle
                  </span>
                  <span>{sets.length} completed sets</span>
                </div>
                {totalSessionVolume > 0 && (
                  <div className="telemetry-pill" style={{ backgroundColor: "var(--surface-container)" }}>
                    <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>
                      scale
                    </span>
                    <span>{totalSessionVolume.toLocaleString()} kg load</span>
                  </div>
                )}
              </div>
            </div>

            {/* New Movement / Add Exercise Section Bar */}
            <div className="add-exercise-bar">
              <div className="add-exercise-top">
                <span>NEW MOVEMENT</span>
                <span>STAGE EXERCISE</span>
              </div>
              <form className="add-exercise-form" onSubmit={handleAddExercise}>
                <div className="exercise-input-wrapper">
                  <input
                    className="exercise-input"
                    type="text"
                    placeholder="Exercise name (e.g. Incline Barbell Bench Press)"
                    value={exerciseName}
                    onChange={(e) => setExerciseName(e.target.value)}
                  />
                  {exerciseError && (
                    <p className="form-error">{exerciseError}</p>
                  )}
                </div>
                <button className="btn-primary" type="submit">
                  <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>
                    add
                  </span>
                  <span>Add Exercise</span>
                </button>
              </form>
            </div>

            {/* List of Exercises Stack */}
            <div className="exercises-stack">
              {exercises.length === 0 ? (
                <div className="empty-state" style={{ padding: "36px 16px" }}>
                  <p className="empty-state-desc">
                    No exercises added yet. Type an exercise name above to begin logging sets.
                  </p>
                </div>
              ) : (
                exercises.map((exercise, exIndex) => {
                  const exerciseSets = sets.filter(
                    (s) => s.exerciseId === exercise.id
                  );
                  const paddedNum = String(exIndex + 1).padStart(2, "0");

                  return (
                    <div key={exercise.id} className="exercise-card">
                      <div className="exercise-card-header">
                        <div>
                          <div className="exercise-num-group">
                            <span className="exercise-num">{paddedNum}</span>
                            <span className="live-dot" style={{ width: "4px", height: "4px" }}></span>
                            <span className="exercise-tag">PRIMARY MOVEMENT</span>
                          </div>
                          <h2 className="exercise-name">{exercise.name}</h2>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span className="muscle-badge">TARGET LIFTS</span>
                          <button
                            className="icon-btn-delete"
                            title="Delete Exercise"
                            onClick={() => handleDeleteExercise(exercise.id)}
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>
                              delete
                            </span>
                          </button>
                        </div>
                      </div>

                      {/* Add Set Input Row */}
                      <div className="add-set-box">
                        <div className="add-set-form">
                          <div className="set-input-group">
                            <label className="set-input-label">Weight (kg)</label>
                            <div className="input-with-suffix">
                              <input
                                type="number"
                                step="0.5"
                                placeholder="100"
                                value={weights[exercise.id] || ""}
                                onChange={(e) =>
                                  setWeights((prev) => ({
                                    ...prev,
                                    [exercise.id]: e.target.value,
                                  }))
                                }
                              />
                              <span className="suffix-badge">KG</span>
                            </div>
                          </div>

                          <div className="set-input-group">
                            <label className="set-input-label">Reps</label>
                            <input
                              className="set-input-plain"
                              type="number"
                              placeholder="10"
                              value={reps[exercise.id] || ""}
                              onChange={(e) =>
                                setReps((prev) => ({
                                  ...prev,
                                  [exercise.id]: e.target.value,
                                }))
                              }
                            />
                          </div>

                          <button
                            className="btn-primary"
                            type="button"
                            onClick={() => handleAddSet(exercise.id)}
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>
                              add
                            </span>
                            <span>Add Set</span>
                          </button>
                        </div>
                        {setError[exercise.id] && (
                          <p className="form-error" style={{ marginTop: "6px" }}>
                            {setError[exercise.id]}
                          </p>
                        )}
                      </div>

                      {/* Sets Telemetry Feed Table */}
                      <div className="sets-table-wrap">
                        <div className="sets-table-header">
                          <div>Set</div>
                          <div style={{ textAlign: "right" }}>Load</div>
                          <div style={{ textAlign: "right" }}>Volume</div>
                          <div style={{ textAlign: "right" }}>Actions</div>
                        </div>

                        {exerciseSets.length === 0 ? (
                          <div className="no-sets-message">
                            No sets logged yet. Enter weight & reps above.
                          </div>
                        ) : (
                          exerciseSets.map((s, sIndex) => {
                            const isEditing = editingSetId === s.id;

                            return (
                              <div
                                key={s.id}
                                className={`sets-table-row ${isEditing ? "editing" : ""}`}
                              >
                                <div className="set-col-num">
                                  <span
                                    className={`set-circle-badge ${
                                      isEditing ? "editing-badge" : ""
                                    }`}
                                  >
                                    {sIndex + 1}
                                  </span>
                                  <span style={{ fontSize: "12px", fontWeight: 600 }}>
                                    Set {sIndex + 1}
                                  </span>
                                </div>

                                <div className="set-col-load" style={{ textAlign: "right" }}>
                                  {isEditing ? (
                                    <input
                                      className="inline-edit-input"
                                      type="number"
                                      step="0.5"
                                      value={editWeight}
                                      onChange={(e) => setEditWeight(e.target.value)}
                                    />
                                  ) : (
                                    `${s.weight} kg`
                                  )}
                                </div>

                                <div className="set-col-vol" style={{ textAlign: "right" }}>
                                  {isEditing ? (
                                    <input
                                      className="inline-edit-input"
                                      type="number"
                                      value={editReps}
                                      onChange={(e) => setEditReps(e.target.value)}
                                    />
                                  ) : (
                                    `${s.reps} reps`
                                  )}
                                </div>

                                <div className="set-col-actions">
                                  {isEditing ? (
                                    <>
                                      <button
                                        className="btn-save-inline"
                                        title="Save Set"
                                        onClick={() => handleSaveSet(s.id)}
                                      >
                                        <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>
                                          check
                                        </span>
                                        <span>Save</span>
                                      </button>
                                      <button
                                        className="btn-cancel-inline"
                                        title="Cancel"
                                        onClick={() => setEditingSetId(null)}
                                      >
                                        <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>
                                          close
                                        </span>
                                      </button>
                                    </>
                                  ) : (
                                    <>
                                      <button
                                        className="btn-icon-edit"
                                        title="Edit Set"
                                        onClick={() => startEditSet(s)}
                                      >
                                        <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>
                                          edit
                                        </span>
                                        <span>Edit</span>
                                      </button>
                                      <button
                                        className="btn-icon-del"
                                        title="Delete Set"
                                        onClick={() => handleDeleteSet(s.id)}
                                      >
                                        <span className="material-symbols-outlined" style={{ fontSize: "15px" }}>
                                          delete
                                        </span>
                                      </button>
                                    </>
                                  )}
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </main>

      {/* Create New Workout Modal Dialog */}
      {isModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsModalOpen(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <span className="cadence-badge">RECORDING NEW ENTRY</span>
                <h2 className="modal-title">Create New Workout</h2>
              </div>
              <button
                className="icon-btn-close"
                onClick={() => setIsModalOpen(false)}
              >
                <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>
                  close
                </span>
              </button>
            </div>

            <form onSubmit={handleCreateWorkout}>
              <div className="form-group" style={{ marginBottom: "14px" }}>
                <label className="form-label" htmlFor="workout-title">
                  Workout Title
                </label>
                <input
                  id="workout-title"
                  className="form-input"
                  type="text"
                  placeholder="e.g. Chest Day"
                  value={newWorkoutName}
                  onChange={(e) => setNewWorkoutName(e.target.value)}
                  autoFocus
                />
                {workoutError && <p className="form-error">{workoutError}</p>}
              </div>

              <div className="form-row" style={{ marginBottom: "14px" }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="workout-date">
                    Date
                  </label>
                  <input
                    id="workout-date"
                    className="form-input"
                    type="date"
                    value={newWorkoutDate}
                    onChange={(e) => setNewWorkoutDate(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="workout-cat">
                    Focus Category
                  </label>
                  <select
                    id="workout-cat"
                    className="form-select"
                    value={newWorkoutCategory}
                    onChange={(e) => setNewWorkoutCategory(e.target.value)}
                  >
                    <option value="Hypertrophy">Hypertrophy</option>
                    <option value="Strength Heavy">Strength Training</option>
                    <option value="PPL Split">PPL Split</option>
                    <option value="Active Recovery">Active Recovery</option>
                    <option value="Endurance">Endurance</option>
                  </select>
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: "20px" }}>
                <label className="form-label" htmlFor="workout-notes">
                  Notes / Target Focus (Optional)
                </label>
                <textarea
                  id="workout-notes"
                  className="form-textarea"
                  rows="2"
                  placeholder="e.g. Focus on progressive overload on compound lifts..."
                  value={newWorkoutNotes}
                  onChange={(e) => setNewWorkoutNotes(e.target.value)}
                />
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>
                    add_circle
                  </span>
                  <span>Create Workout</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;