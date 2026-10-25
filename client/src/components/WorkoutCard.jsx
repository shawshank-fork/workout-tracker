function WorkoutCard({ workout, onDelete, onSelect }) {
  const { id, name, date, exercises = [] } = workout;

  // Format date nicely (e.g. "Oct 24, 2024")
  const formattedDate = new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  // Calculate total sets if exercises are populated
  const totalExercises = exercises.length;
  const totalSets = exercises.reduce((acc, ex) => acc + (ex.sets ? ex.sets.length : 0), 0);

  // Derive a category/split label from workout name if possible, or default
  const getCategory = (workoutName = "") => {
    const lower = workoutName.toLowerCase();
    if (lower.includes("hypertrophy") || lower.includes("chest") || lower.includes("upper")) return "Hypertrophy A";
    if (lower.includes("strength") || lower.includes("lower") || lower.includes("leg")) return "Strength Heavy";
    if (lower.includes("push") || lower.includes("pull") || lower.includes("ppl")) return "PPL Split";
    if (lower.includes("cardio") || lower.includes("run")) return "Conditioning";
    if (lower.includes("deload") || lower.includes("recovery")) return "Active Recovery";
    return "Strength Focus";
  };

  const category = getCategory(name);

  return (
    <div className="workout-card">
      <div className="workout-card-body">
        <div className="workout-card-top">
          <span className="category-tag">{category}</span>
          <button
            className="icon-btn-delete"
            title="Delete Workout"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(id);
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>
              delete
            </span>
          </button>
        </div>

        <div>
          <h3 className="workout-title">{name}</h3>
          <p className="workout-date">{formattedDate}</p>
        </div>

        <div className="workout-stats-pills">
          <span className="stat-chip">
            {totalExercises} {totalExercises === 1 ? "exercise" : "exercises"}
          </span>
          {totalSets > 0 && (
            <>
              <span className="stat-dot">·</span>
              <span className="stat-chip">
                {totalSets} {totalSets === 1 ? "set" : "sets"}
              </span>
            </>
          )}
          <span className="stat-dot">·</span>
          <span className="stat-chip">45 min</span>
        </div>
      </div>

      <div className="workout-card-footer">
        <span className="footer-rpe">RPE 8.0 avg</span>
        <button
          className="btn-view-workout"
          onClick={() => onSelect(workout)}
        >
          <span>View Workout</span>
          <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>
            arrow_forward
          </span>
        </button>
      </div>
    </div>
  );
}

export default WorkoutCard;