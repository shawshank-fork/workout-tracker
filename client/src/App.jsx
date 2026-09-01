import { useEffect, useState } from "react";
import WorkoutCard from "./components/workoutCard";
import { getWorkouts, createWorkout, deleteWorkout, getExercises } from "./api/workoutApi";

function App() {

  const [workouts, setWorkouts] = useState([]);
  const [workoutName, setWorkoutName] = useState("");

  const [selectedWorkout, setSelectedWorkout] = useState(null); //selectedWorkout to find which workout os the user currently looking at
  const [exercises, setExercises] = useState([]); // to find what exercises belong to the selected workout for view

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

          {exercises.map((exercise) => (
            <p key={exercise.id}>
              {exercise.name}
            </p>
          ))}
        </div>
      )}

      <button onClick={addWorkout}>Add workout</button> {/* we write addworkout because w want to call it when clicked, if we would have written addworkout() that would have called it while redering the comp */}
    </div>
  );
}
export default App;

/*http://localhost:5173/ */