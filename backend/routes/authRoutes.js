const express = require("express");
const crypto = require("crypto");

const User = require("../models/User");
const Note = require("../models/Note");

const router = express.Router();

/* =========================
   PASSWORD FUNCTIONS
========================= */

function hashPassword(password, salt) {
  return crypto
    .scryptSync(password, salt, 64)
    .toString("hex");
}

function createToken() {
  return crypto.randomBytes(32).toString("hex");
}

/* =========================
   SESSIONS
========================= */

const sessions = new Map();

/* =========================
   DEMO NOTES
========================= */

async function createDemoNotes(userId) {
  const demoNotes = [
    {
      title: "Project Ideas",
      content:
        "Build a beautiful Notes App using React, Express and MongoDB.",
      color: "yellow",
      favorite: true,
      user: userId,
    },
    {
      title: "Meeting Notes",
      content:
        "Discuss project progress, assign tasks and review the next development steps.",
      color: "blue",
      favorite: false,
      user: userId,
    },
    {
      title: "Learning Goals",
      content:
        "Learn React, REST APIs, Express.js, MongoDB Atlas and full-stack development.",
      color: "green",
      favorite: true,
      user: userId,
    },
    {
      title: "Weekend Plans",
      content:
        "Finish the Notes App, test CRUD operations and prepare the project presentation.",
      color: "purple",
      favorite: false,
      user: userId,
    },
    {
      title: "Important Reminder",
      content:
        "Always save important work and test every CRUD operation.",
      color: "orange",
      favorite: false,
      user: userId,
    },
  ];

  await Note.insertMany(demoNotes);
}

/* =========================
   REGISTER
========================= */

router.post("/register", async (req, res) => {
  try {
    const {
      username,
      phone,
      email,
      password,
    } = req.body;

    if (!username || !phone || !email || !password) {
      return res.status(400).json({
        message: "All fields are required",
      });
    }

    const cleanUsername = username.trim();
    const cleanPhone = phone.trim();
    const cleanEmail = email.trim().toLowerCase();

    const existingUser = await User.findOne({
      $or: [
        { username: cleanUsername },
        { phone: cleanPhone },
        { email: cleanEmail },
      ],
    });

    if (existingUser) {
      return res.status(400).json({
        message:
          "Username, phone number or email already exists",
      });
    }

    const salt = crypto.randomBytes(16).toString("hex");

    const passwordHash = hashPassword(
      password,
      salt
    );

    const user = await User.create({
      username: cleanUsername,
      phone: cleanPhone,
      email: cleanEmail,
      passwordHash,
      salt,
    });

    // Create 5 demo notes for the new user
    await createDemoNotes(user._id);

    res.status(201).json({
      message:
        "Account created successfully. You can now login.",
      user: {
        id: user._id,
        username: user.username,
        phone: user.phone,
        email: user.email,
      },
    });
  } catch (error) {
    console.error(
      "Registration error:",
      error.message
    );

    res.status(500).json({
      message: "Registration failed",
    });
  }
});

/* =========================
   LOGIN
   USERNAME + PASSWORD ONLY
========================= */

router.post("/login", async (req, res) => {
  try {
    const {
      username,
      password,
    } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        message:
          "Username and password are required",
      });
    }

    const user = await User.findOne({
      username: username.trim(),
    });

    if (!user) {
      return res.status(401).json({
        message: "Username or password is incorrect",
      });
    }

    const enteredHash = hashPassword(
      password,
      user.salt
    );

    if (enteredHash !== user.passwordHash) {
      return res.status(401).json({
        message: "Username or password is incorrect",
      });
    }

    const token = createToken();

    sessions.set(
      token,
      user._id.toString()
    );

    res.json({
      message: "Login successful",

      token,

      user: {
        id: user._id,
        username: user.username,
        phone: user.phone,
        email: user.email,
      },
    });
  } catch (error) {
    console.error(
      "Login error:",
      error.message
    );

    res.status(500).json({
      message: "Login failed",
    });
  }
});

/* =========================
   LOGOUT
========================= */

router.post("/logout", (req, res) => {
  const authHeader =
    req.headers.authorization;

  if (authHeader) {
    const token =
      authHeader.split(" ")[1];

    sessions.delete(token);
  }

  res.json({
    message: "Logged out successfully",
  });
});

/* =========================
   AUTHENTICATION MIDDLEWARE
========================= */

function authenticate(req, res, next) {
  const authHeader =
    req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({
      message: "Authentication required",
    });
  }

  const token =
    authHeader.split(" ")[1];

  if (!token || !sessions.has(token)) {
    return res.status(401).json({
      message: "Invalid or expired session",
    });
  }

  req.userId = sessions.get(token);

  next();
}

module.exports = {
  router,
  authenticate,
};