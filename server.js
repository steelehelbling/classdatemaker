const express = require("express");
const fs = require("node:fs/promises");
const path = require("node:path");

const app = express();
const PORT = process.env.PORT || 3000;

const DATA_FILE = path.join(__dirname, "classes.json");

app.use(express.json());

// Read the classes from the JSON file.
async function readClasses() {
  const data = await fs.readFile(DATA_FILE, "utf8");
  return JSON.parse(data);
}

// Save the classes to the JSON file.
async function saveClasses(classes) {
  await fs.writeFile(
    DATA_FILE,
    JSON.stringify(classes, null, 2)
  );
}

// Check that a class has all required fields.
function isValidClass(data) {
  return (
    data &&
    ["className", "day", "room", "time", "teacher"].every(
      (field) =>
        typeof data[field] === "string" &&
        data[field].trim().length > 0
    )
  );
}

// Root endpoint: check whether the API is running.
app.get("/", (req, res) => {
  res.json({ message: "Class Schedule API is running!" });
});

// GET: retrieve every class.
app.get("/api/classes", async (req, res, next) => {
  try {
    res.json(await readClasses());
  } catch (error) {
    next(error);
  }
});

// GET: retrieve one class by ID.
app.get("/api/classes/:id", async (req, res, next) => {
  try {
    const classes = await readClasses();
    const classItem = classes.find(
      (item) => item.id === Number(req.params.id)
    );

    if (!classItem) {
      return res.status(404).json({
        error: "Class not found"
      });
    }

    res.json(classItem);
  } catch (error) {
    next(error);
  }
});

// POST: create a new class.
app.post("/api/classes", async (req, res, next) => {
  try {
    if (!isValidClass(req.body)) {
      return res.status(400).json({
        error:
          "Provide className, day, room, time, and teacher as non-empty strings."
      });
    }

    const classes = await readClasses();
    const nextId = classes.reduce(
      (max, item) => Math.max(max, item.id),
      0
    ) + 1;

    const newClass = {
      id: nextId,
      className: req.body.className.trim(),
      day: req.body.day.trim(),
      room: req.body.room.trim(),
      time: req.body.time.trim(),
      teacher: req.body.teacher.trim()
    };

    classes.push(newClass);
    await saveClasses(classes);

    res.status(201).json(newClass);
  } catch (error) {
    next(error);
  }
});

// PUT: update an existing class.
app.put("/api/classes/:id", async (req, res, next) => {
  try {
    if (!isValidClass(req.body)) {
      return res.status(400).json({
        error: "All five class fields are required."
      });
    }

    const classes = await readClasses();
    const index = classes.findIndex(
      (item) => item.id === Number(req.params.id)
    );

    if (index === -1) {
      return res.status(404).json({
        error: "Class not found"
      });
    }

    const updatedClass = {
      id: classes[index].id,
      className: req.body.className.trim(),
      day: req.body.day.trim(),
      room: req.body.room.trim(),
      time: req.body.time.trim(),
      teacher: req.body.teacher.trim()
    };

    classes[index] = updatedClass;
    await saveClasses(classes);

    res.json(updatedClass);
  } catch (error) {
    next(error);
  }
});

// DELETE: remove a class by ID.
app.delete("/api/classes/:id", async (req, res, next) => {
  try {
    const classes = await readClasses();
    const index = classes.findIndex(
      (item) => item.id === Number(req.params.id)
    );

    if (index === -1) {
      return res.status(404).json({
        error: "Class not found"
      });
    }

    classes.splice(index, 1);
    await saveClasses(classes);

    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

// Handle unexpected server errors.
app.use((error, req, res, next) => {
  console.error(error);
  res.status(500).json({
    error: "Internal server error"
  });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});