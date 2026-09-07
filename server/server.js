import express from "express";
import cors from "cors";
import prisma from "./lib/prisma.js";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
    res.json({
        message: "workout tracker api is running",
    });
});

//to display workouts
app.get("/api/workouts", async (req, res) => {
    try {
        const workouts = await prisma.workout.findMany({
            include: {
                exercises: true,
            },
        });
        res.json(workouts);
    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "failed to fetch workouts",
        });
    }
});

//to add a workout
app.post("/api/workouts", async (req, res) => {
    try {
        const {name, date} = req.body;

        const workout = await prisma.workout.create({
            data: {
                name: name,
                date: new Date(date),
            },
        });
        res.status(201).json(workout);
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Failed to create workout",
        });  
    }
});

//to update the workout info
app.put("/api/workouts/:id", async (req, res) => {
    try {
        const id = Number(req.params.id);
        const {name, date} = req.body;

        const workout = await prisma.workout.update({
            where: {
                id: id,
            },
            data: {
                name: name,
                date: new Date(date),
            },
        });

        res.json(workout);
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Failed to upate workout",
        });
    }
});

//to delete a workout
app.delete("/api/workouts/:id", async (req, res) => {
    try {
        const id = Number(req.params.id);

        await prisma.workout.delete({
            where: {
                id: id,
            },
        });
        
        res.json({
            message: "Workout deleted successfully",
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Failed to delete workout",
        });
    }
});

//to add an exercsie to a selected workout
app.post("/api/workouts/:workoutId/exercises", async(req, res) => {
    try {
        const workoutId = Number(req.params.workoutId);
        const { name } = req.body;

        const exercise = await prisma.exercise.create ({
            data: {
                name: name,
                workoutId: workoutId,
            },
        });

        res.status(201).json(exercise);
    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Failed to create exercise",
        });
    }
    
});

//to display the exercsies in a selected workout
app.get("/api/workouts/:workoutId/exercises", async (req, res) => {
    try {
        const workoutId = Number(req.params.workoutId);

        const exercises = await prisma.exercise.findMany({
            where: {
                workoutId: workoutId,
            },
        });

        res.json(exercises);

    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: " Failed to fetch exercises",
        });
    }
});

//to add sets in a exercsie for a selected workout
app.post("/api/exercises/:exerciseId/sets", async (req,res) => {
    try {
        const exerciseId = Number(req.params.exerciseId);
        const { weight, reps} = req.body;

        const set = await prisma.set.create({
            data: {
                weight: weight,
                reps: reps,
                exerciseId: exerciseId,
            },
        });

        res.status(201).json(set);

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Failed to create set",
        });
    }
});

//to display sets in a exercsie for a selected workout
app.get("/api/exercises/:exerciseId/sets", async (req,res) => {
    try {
        const exerciseId = Number(req.params.exerciseId);

        const sets = await prisma.set.findMany({
            where: {
                exerciseId: exerciseId,
            },
        });

        res.json(sets);
    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Failed to fetch sets",
        });
    }
})

//to delete a particular set in a exercise
app.delete("api/sets/:id", async (req, res) => {
    try {
        const id = Number(req.params.id);

        await prisma.set.delete({
            where: {
                id: id,
            },
        });

        res.json({
            message: "Set deleted sucessfully"
        });
        
    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Failed to delete set",
        });
    }
    
});

//to update a set in a exercise
app.put("/api/sets/:id", async (req, res) => {
    try {
        const id = Number(req.params.id);

        const {weight, reps} = req.body;

        const sets = await prisma.set.update({
            where: {
                id: id
            },
            data: {
                weight: weight,
                reps: reps,
            }
        })
        res.json(sets);

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Failed to update set",
        });
    }
});

app.get("/api/test-db", async (req, res) => {
    try {
        const workouts = await prisma.workout.findMany();

        res.json(workouts);
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Database connection failed",
        });
    }
});

const PORT = 5000;

app.listen(PORT, () =>  {
    console.log(`Server running on http://localhost:${PORT}`);
});