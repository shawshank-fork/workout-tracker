import { useEffect, useState } from "react";
import WorkoutCard from "./components/workoutCard";

function App() {

  const [workouts, setWorkouts] = useState([]);
  const [workoutName, setWorkoutName] = useState("");

  useEffect(() => {
    fetch("http://localhost:5000/api/workouts")
    .then((response) => response.json())
    .then((data) => {
      setWorkouts(data);
    })
  }, []);


  async function addWorkout() {
    
    if (workoutName.trim() === ""){
      return;
    }

    const newWorkout = {
      name: workoutName,
      date: "aug 20, 2026"
    };

    const response = await fetch("http://localhost:5000/api/workouts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(newWorkout),
    });

    const createdWorkout = await response.json();
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
          name={workout.name}
          date={workout.date}
        />
      ))}

      <button onClick={addWorkout}>Add workout</button> {/* we write addworkout because w want to call it when clicked, if we would have written addworkout() that would have called it while redering the comp */}
    </div>
  );
}
export default App;

/*http://localhost:5173/ */