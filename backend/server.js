const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const crypto = require("crypto");

const connectDB = require("./config/db");
const User = require("./models/User");

const authRoutes = require("./routes/authRoutes");
const noteRoutes = require("./routes/noteRoutes");

dotenv.config();

const app = express();

const PORT = process.env.PORT || 5000;

// ===============================
// MIDDLEWARE
// ===============================

// Allow React frontend from any localhost port
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

app.use(express.json());

// ===============================
// DEFAULT USER
// ===============================

async function createDefaultUser() {
  try {
    const existingUser = await User.findOne({
      email: "shreyasbharadwaj.882006@gmail.com",
    });

    if (existingUser) {
      console.log("Default user already exists");
      return;
    }

    const salt = crypto.randomBytes(16).toString("hex");

    const passwordHash = crypto
      .scryptSync("123456", salt, 64)
      .toString("hex");

    await User.create({
      username: "Shreyas",
      phone: "6360708526",
      email: "shreyasbharadwaj.882006@gmail.com",
      passwordHash,
      salt,
    });

    console.log("Default user created successfully");
  } catch (error) {
    console.error(
      "Failed to create default user:",
      error.message
    );
  }
}

// ===============================
// TEST ROUTE
// ===============================

app.get("/", (req, res) => {
  res.json({
    message: "Notes App Backend is running",
  });
});

// ===============================
// API ROUTES
// ===============================

app.use("/api/auth", authRoutes.router);
app.use("/api/notes", noteRoutes);

// ===============================
// START SERVER
// ===============================

connectDB()
  .then(async () => {
    console.log("MongoDB Atlas connected successfully");

    await createDefaultUser();

    app.listen(PORT, () => {
      console.log(
        `Server running on http://localhost:${PORT}`
      );
    });
  })
  .catch((error) => {
    console.error(
      "Unable to start server:",
      error.message
    );
  });