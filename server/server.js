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

app.get("/api/workouts", async (req, res) => {
    try {
        const workouts = await prisma.workout.findMany();
        res.json(workouts);
    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "failed to fetch workouts",
        });
    }
});

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