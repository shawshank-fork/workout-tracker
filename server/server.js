const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
    res.json({
        message: "workout tracker api is running",
    });
});

app.get("/api/workouts", (req, res) => {
    const workouts = [
        {
            id: 1,
            name: "push day",
            date: "2 aug 2026"
        },
        {
            id: 2,
            name: "pull day",
            date: "22 aug 2026",
        },
    ];
    res.json(workouts);
})

app.post("/api/workouts", (req, res) => {
    const{name, date} = req.body;

    const newWorkout = {
        id: 3,
        name: name,
        date: date,
    };
    res.status(201).json(newWorkout);
});

const PORT = 5000;

app.listen(PORT, () =>  {
    console.log(`Server running on http://localhost:${PORT}`);
});