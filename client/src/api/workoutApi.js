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

export async function updateWorkout(id, workout) {
    const response = await fetch(`${API_URL}/${id}`, {
        method: 'PUT',
        headers: {
            "Content-Type" : "application/json",
        },
        body: JSON.stringify(workout),
    });

    if(!response.ok) {
        throw new Error("Failed to update workout");
    }
    return response.json();
}

export async function deleteWorkout(id) {
    const response = await fetch(`${API_URL}/${id}`, {
        method: "DELETE",
    });
    
    if(!response.ok) {
        throw new Error("Failed to delete workout");
    }

    return response.json();
}

export async function getExercises(workoutId) {
    const response = await fetch(`${API_URL}/${workoutId}/exercises`);

    if(!response.ok) {
        throw new Error("Failed to fetch exercises");
    }
    return response.json();
}

export async function createExercise(workoutId, exercise) {
    const response = await fetch(`${API_URL}/${workoutId}/exercises`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(exercise),
    });

    if(!response.ok) {
        throw new Error("Failed to create exercise");
    }

    return response.json();
}

export async function createSet(exerciseId, set) {
    const response = await fetch(`http://localhost:5000/api/exercises/${exerciseId}/sets`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(set),
    });

    if(!response.ok) {
        throw new Error("Failed to create Set");
    }

    return response.json()
}