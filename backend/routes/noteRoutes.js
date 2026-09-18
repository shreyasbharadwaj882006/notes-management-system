const express = require("express");

const Note = require("../models/Note");

const {
  authenticate,
} = require("./authRoutes");

const router = express.Router();

/* =========================
   READ ALL NOTES
   GET /api/notes
========================= */

router.get("/", authenticate, async (req, res) => {
  try {
    const notes = await Note.find({
      user: req.userId,
    }).sort({
      createdAt: -1,
    });

    res.json(notes);
  } catch (error) {
    console.error(
      "Fetch notes error:",
      error.message
    );

    res.status(500).json({
      message: "Failed to fetch notes",
    });
  }
});

/* =========================
   CREATE NOTE
   POST /api/notes
========================= */

router.post("/", authenticate, async (req, res) => {
  try {
    const {
      title,
      content,
      color,
    } = req.body;

    if (!title || !content) {
      return res.status(400).json({
        message:
          "Title and content are required",
      });
    }

    const note = await Note.create({
      title: title.trim(),
      content,
      color: color || "yellow",
      favorite: false,
      user: req.userId,
    });

    res.status(201).json(note);
  } catch (error) {
    console.error(
      "Create note error:",
      error.message
    );

    res.status(500).json({
      message: "Failed to create note",
    });
  }
});

/* =========================
   UPDATE NOTE
   PUT /api/notes/:id
========================= */

router.put("/:id", authenticate, async (req, res) => {
  try {
    const {
      title,
      content,
      color,
      favorite,
    } = req.body;

    const updateData = {};

    if (title !== undefined) {
      updateData.title = title.trim();
    }

    if (content !== undefined) {
      updateData.content = content;
    }

    if (color !== undefined) {
      updateData.color = color;
    }

    if (favorite !== undefined) {
      updateData.favorite = favorite;
    }

    const note =
      await Note.findOneAndUpdate(
        {
          _id: req.params.id,
          user: req.userId,
        },
        updateData,
        {
          new: true,
          runValidators: true,
        }
      );

    if (!note) {
      return res.status(404).json({
        message: "Note not found",
      });
    }

    res.json(note);
  } catch (error) {
    console.error(
      "Update note error:",
      error.message
    );

    res.status(500).json({
      message: "Failed to update note",
    });
  }
});

/* =========================
   DELETE NOTE
   DELETE /api/notes/:id
========================= */

router.delete(
  "/:id",
  authenticate,
  async (req, res) => {
    try {
      const note =
        await Note.findOneAndDelete({
          _id: req.params.id,
          user: req.userId,
        });

      if (!note) {
        return res.status(404).json({
          message: "Note not found",
        });
      }

      res.json({
        message: "Note deleted successfully",
      });
    } catch (error) {
      console.error(
        "Delete note error:",
        error.message
      );

      res.status(500).json({
        message: "Failed to delete note",
      });
    }
  }
);

module.exports = router;