const API_URL = "http://localhost:5000/api/workouts";

export async function getWorkouts() {
    const response = await fetch(API_URL);

    if(!response.ok) {
        throw new Error("Failed to fetch workouts");
    }
    return response.json();
}

export async function createWorkout(workout) {
    const response = await fetch(API_URL, {
        method: "POST",
        headers: {
            "Content-Type" : "application/json",
        },
        body : JSON.stringify(workout),
    });

    if(!response.ok) {
        throw new Error("Failed to create workout");
    }
    return response.json();
}