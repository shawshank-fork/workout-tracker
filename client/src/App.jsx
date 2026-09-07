import { useEffect, useState } from "react";
import WorkoutCard from "./components/workoutCard";
import { getWorkouts, createWorkout, deleteWorkout, getExercises, createExercise, createSet, getSets, deleteSet} from "./api/workoutApi";

function App() {

  const [workouts, setWorkouts] = useState([]);
  const [workoutName, setWorkoutName] = useState("");

  const [selectedWorkout, setSelectedWorkout] = useState(null); //selectedWorkout to find which workout os the user currently looking at
  const [exercises, setExercises] = useState([]); // to find what exercises belong to the selected workout for view
  const [exerciseName, setExerciseName] = useState("");
  const [weights, setWeights] = useState({}); //{} means we will be storing object now. Earlier: ""
  const [reps, setReps] = useState({});
  const [sets, setSets] = useState([]);

  useEffect(() => {
    getWorkouts()
      .then((data) =>{
        setWorkouts(data);
    })
  }, []);

  async function handleDelete(id) {
    await deleteWorkout(id);

    setWorkouts(workouts.filter((workout) => workout.id !== id));
  }

  async function handleSelectWorkout(workout) {
    setSelectedWorkout(workout);

    const data = await getExercises(workout.id);

    setExercises(data);

    const allSets = await Promise.all(
      data.map((exercise) => getSets(exercise.id))
    );

    setSets(allSets.flat());
  }

  async function handleAddExercise() {
    if(!exerciseName.trim() || !selectedWorkout) {
      return;
    }

    const newExercise = {
      name: exerciseName,
    };

    const createdExercise = await createExercise(
      selectedWorkout.id,
      newExercise
    );

    setExercises((currrentExercises) => [
      ...currrentExercises,
      createdExercise
    ]);
    setExerciseName("");
  }

  async function handleAddSet(exerciseId, weight, reps) {
    const newSet = {
      weight: Number(weight),
      reps: Number(reps),
    };

    const createdSet = await createSet(exerciseId, newSet);

    setSets((currrentSets) => [
      ...currrentSets,
      createdSet
    ]);

    setWeights((currentWeights) => ({
      ...currentWeights,
      [exerciseId]: ""
    }));

    setReps((currentReps) => ({
      ...currentReps,
      [exerciseId]: ""
    }));
  }

  async function handleDeleteSet(id) {
    await deleteSet(id);

    setSets((currrentSets) => 
      currrentSets.filter((set) => set.id !== id)
    );
  }


  async function addWorkout() {
    
    if (workoutName.trim() === ""){
      return;
    }

    const newWorkout = {
      name: workoutName,
      date: "2026-08-27"
    };

    const createdWorkout = await createWorkout(newWorkout);

    setWorkouts([...workouts, createdWorkout]);
    setWorkoutName("");
  }

  return (
    <div>
      <h1> Workout Tracker</h1>
      <p>Track your daily workout progress for consistent growth</p>

      <input 
        type="text"
        placeholder="Enter workout name"
        value={workoutName}
        onChange={(event) => setWorkoutName(event.target.value)}
      />

      {workouts.map((workout) => (
        <WorkoutCard
          key={workout.id}
          id={workout.id}
          name={workout.name}
          date={workout.date}
          onDelete={handleDelete} 
          onSelect={handleSelectWorkout}
        />
      ))}

      {selectedWorkout && (
        <div>
          <h2>{selectedWorkout.name} Exercises</h2>

          <input
            type="text"
            placeholder="Enter exercise name"
            value={exerciseName}
            onChange={(event) => setExerciseName(event.target.value)}
          />

          <button onClick={handleAddExercise}>
            Add Exercise
          </button>

          {exercises.map((exercise) => (
            <div key={exercise.id}>
              <h3>{exercise.name}</h3>

              <input
                type="number"
                placeholder="weight"
                value={weights[exercise.id] || ""}
                onChange={(e) => 
                  setWeights({
                    ...weights,
                    [exercise.id]: e.target.value
                  })
                }

              />

              <input
                type="number"
                placeholder="Reps"
                value={reps[exercise.id] || ""}
                onChange={(e) =>
                  setReps((currentReps) => ({
                    ...currentReps,
                    [exercise.id]: e.target.value
                  }))
                }
              />

              <button onClick={() => handleAddSet(exercise.id, weights[exercise.id], reps[exercise.id])}>
                Add Set
              </button>

              {sets
                .filter((set) => set.exerciseId === exercise.id)
                .map((set, index) => (
                  <div key={set.id}>
                    <p>
                      Set {index + 1}: {set.weight} kg x {set.reps} reps
                    </p>

                    <button onClick={() => handleDeleteSet(set.id)}>
                      Delete
                    </button>
                  </div>
                ))
              }
            </div>
          ))}
        </div>
      )}

      <button onClick={addWorkout}>Add workout</button> {/* we write addworkout because w want to call it when clicked, if we would have written addworkout() that would have called it while redering the comp */}
    </div>
  );
}
export default App;

/*http://localhost:5173/ */