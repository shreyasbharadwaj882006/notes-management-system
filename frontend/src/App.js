import React, { useEffect, useState } from "react";
import "./App.css";

const API_URL = "http://localhost:5000/api";

function App() {
  const [isLogin, setIsLogin] = useState(true);

  const [user, setUser] = useState(() => {
    const savedUser =
      localStorage.getItem("notesUser");

    return savedUser
      ? JSON.parse(savedUser)
      : null;
  });

  const [token, setToken] = useState(() => {
    return localStorage.getItem("notesToken");
  });

  const [notes, setNotes] = useState([]);

  const [loading, setLoading] = useState(false);

  const [message, setMessage] = useState("");

  const [search, setSearch] = useState("");

  const [showModal, setShowModal] =
    useState(false);

  const [editingNote, setEditingNote] =
    useState(null);

  /* =========================
     LOGIN FORM
  ========================= */

  const [loginForm, setLoginForm] = useState({
    username: "",
    password: "",
  });

  /* =========================
     REGISTER FORM
  ========================= */

  const [registerForm, setRegisterForm] =
    useState({
      username: "",
      phone: "",
      email: "",
      password: "",
    });

  /* =========================
     NOTE FORM
  ========================= */

  const [noteForm, setNoteForm] = useState({
    title: "",
    content: "",
    color: "yellow",
  });

  /* =========================
     FETCH NOTES
  ========================= */

  const fetchNotes = async () => {
    if (!token) return;

    try {
      setLoading(true);

      const response = await fetch(
        `${API_URL}/notes`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 401) {
        logout();
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to fetch notes"
        );
      }

      setNotes(data);
    } catch (error) {
      console.error(error);

      setMessage(
        error.message || "Failed to fetch notes"
      );
    } finally {
      setLoading(false);
    }
  };

  /* =========================
     LOAD NOTES AFTER LOGIN
  ========================= */

  useEffect(() => {
    if (token) {
      fetchNotes();
    }
  }, [token]);

  /* =========================
     LOGIN
  ========================= */

  const handleLogin = async (event) => {
    event.preventDefault();

    setMessage("");

    if (
      !loginForm.username ||
      !loginForm.password
    ) {
      setMessage(
        "Please enter username and password."
      );
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        `${API_URL}/auth/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(loginForm),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Login failed"
        );
      }

      localStorage.setItem(
        "notesToken",
        data.token
      );

      localStorage.setItem(
        "notesUser",
        JSON.stringify(data.user)
      );

      setToken(data.token);
      setUser(data.user);

      setLoginForm({
        username: "",
        password: "",
      });

      setMessage("");
    } catch (error) {
      console.error(error);

      setMessage(
        error.message ||
          "Unable to connect to backend."
      );
    } finally {
      setLoading(false);
    }
  };

  /* =========================
     REGISTER
  ========================= */

  const handleRegister = async (event) => {
    event.preventDefault();

    setMessage("");

    const {
      username,
      phone,
      email,
      password,
    } = registerForm;

    if (
      !username ||
      !phone ||
      !email ||
      !password
    ) {
      setMessage(
        "Please fill all fields."
      );
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        `${API_URL}/auth/register`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(
            registerForm
          ),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Registration failed"
        );
      }

      setRegisterForm({
        username: "",
        phone: "",
        email: "",
        password: "",
      });

      setLoginForm({
        username,
        password,
      });

      setIsLogin(true);

      setMessage(
        "Account created successfully! Please login."
      );
    } catch (error) {
      console.error(error);

      setMessage(
        error.message ||
          "Unable to connect to backend."
      );
    } finally {
      setLoading(false);
    }
  };

  /* =========================
     LOGOUT
  ========================= */

  const logout = async () => {
    try {
      if (token) {
        await fetch(
          `${API_URL}/auth/logout`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
      }
    } catch (error) {
      console.error(error);
    }

    localStorage.removeItem("notesToken");
    localStorage.removeItem("notesUser");

    setToken(null);
    setUser(null);
    setNotes([]);
    setMessage("");
  };

  /* =========================
     OPEN CREATE MODAL
  ========================= */

  const openCreateModal = () => {
    setEditingNote(null);

    setNoteForm({
      title: "",
      content: "",
      color: "yellow",
    });

    setShowModal(true);
  };

  /* =========================
     OPEN EDIT MODAL
  ========================= */

  const openEditModal = (note) => {
    setEditingNote(note);

    setNoteForm({
      title: note.title,
      content: note.content,
      color: note.color,
    });

    setShowModal(true);
  };

  /* =========================
     CREATE / UPDATE NOTE
  ========================= */

  const handleSaveNote = async (event) => {
    event.preventDefault();

    if (
      !noteForm.title.trim() ||
      !noteForm.content.trim()
    ) {
      return;
    }

    try {
      setLoading(true);

      const url = editingNote
        ? `${API_URL}/notes/${editingNote._id}`
        : `${API_URL}/notes`;

      const method = editingNote
        ? "PUT"
        : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(noteForm),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to save note"
        );
      }

      if (editingNote) {
        setNotes((currentNotes) =>
          currentNotes.map((note) =>
            note._id === editingNote._id
              ? data
              : note
          )
        );
      } else {
        setNotes((currentNotes) => [
          data,
          ...currentNotes,
        ]);
      }

      setShowModal(false);
      setEditingNote(null);

      setNoteForm({
        title: "",
        content: "",
        color: "yellow",
      });
    } catch (error) {
      console.error(error);

      setMessage(
        error.message ||
          "Failed to save note"
      );
    } finally {
      setLoading(false);
    }
  };

  /* =========================
     DELETE NOTE
  ========================= */

  const deleteNote = async (id) => {
    const confirmDelete =
      window.confirm(
        "Are you sure you want to delete this note?"
      );

    if (!confirmDelete) return;

    try {
      const response = await fetch(
        `${API_URL}/notes/${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to delete note"
        );
      }

      setNotes((currentNotes) =>
        currentNotes.filter(
          (note) => note._id !== id
        )
      );
    } catch (error) {
      console.error(error);

      setMessage(
        error.message ||
          "Failed to delete note"
      );
    }
  };

  /* =========================
     FAVORITE NOTE
  ========================= */

  const toggleFavorite = async (note) => {
    try {
      const response = await fetch(
        `${API_URL}/notes/${note._id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            favorite: !note.favorite,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to update favorite"
        );
      }

      setNotes((currentNotes) =>
        currentNotes.map((item) =>
          item._id === note._id
            ? data
            : item
        )
      );
    } catch (error) {
      console.error(error);

      setMessage(
        error.message ||
          "Failed to update favorite"
      );
    }
  };

  /* =========================
     FILTER NOTES
  ========================= */

  const filteredNotes = notes.filter(
    (note) => {
      const text =
        `${note.title} ${note.content}`.toLowerCase();

      return text.includes(
        search.toLowerCase()
      );
    }
  );

  const favoriteCount = notes.filter(
    (note) => note.favorite
  ).length;

  /* =========================
     LOGIN PAGE
  ========================= */

  if (!token || !user) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <div className="auth-logo">
            📝
          </div>

          {isLogin ? (
            <>
              <h1>Welcome to Notes</h1>

              <p className="auth-subtitle">
                Sign in to access your personal
                notes
              </p>

              {message && (
                <div className="message">
                  {message}
                </div>
              )}

              <form onSubmit={handleLogin}>
                <label>
                  Username
                </label>

                <input
                  type="text"
                  placeholder="Enter username"
                  value={
                    loginForm.username
                  }
                  onChange={(event) =>
                    setLoginForm({
                      ...loginForm,
                      username:
                        event.target.value,
                    })
                  }
                />

                <label>
                  Password
                </label>

                <input
                  type="password"
                  placeholder="Enter password"
                  value={
                    loginForm.password
                  }
                  onChange={(event) =>
                    setLoginForm({
                      ...loginForm,
                      password:
                        event.target.value,
                    })
                  }
                />

                <button
                  className="auth-button"
                  type="submit"
                  disabled={loading}
                >
                  {loading
                    ? "Signing In..."
                    : "Sign In"}
                </button>
              </form>

              <button
                className="switch-button"
                onClick={() => {
                  setIsLogin(false);
                  setMessage("");
                }}
              >
                Don't have an account?
                Create one
              </button>
            </>
          ) : (
            <>
              <h1>Create Account</h1>

              <p className="auth-subtitle">
                Create your account and start
                taking notes
              </p>

              {message && (
                <div className="message">
                  {message}
                </div>
              )}

              <form
                onSubmit={handleRegister}
              >
                <label>
                  Username
                </label>

                <input
                  type="text"
                  placeholder="Choose username"
                  value={
                    registerForm.username
                  }
                  onChange={(event) =>
                    setRegisterForm({
                      ...registerForm,
                      username:
                        event.target.value,
                    })
                  }
                />

                <label>
                  Phone Number
                </label>

                <input
                  type="tel"
                  placeholder="Enter phone number"
                  value={
                    registerForm.phone
                  }
                  onChange={(event) =>
                    setRegisterForm({
                      ...registerForm,
                      phone:
                        event.target.value,
                    })
                  }
                />

                <label>
                  Email
                </label>

                <input
                  type="email"
                  placeholder="Enter email"
                  value={
                    registerForm.email
                  }
                  onChange={(event) =>
                    setRegisterForm({
                      ...registerForm,
                      email:
                        event.target.value,
                    })
                  }
                />

                <label>
                  Password
                </label>

                <input
                  type="password"
                  placeholder="Create password"
                  value={
                    registerForm.password
                  }
                  onChange={(event) =>
                    setRegisterForm({
                      ...registerForm,
                      password:
                        event.target.value,
                    })
                  }
                />

                <button
                  className="auth-button"
                  type="submit"
                  disabled={loading}
                >
                  {loading
                    ? "Creating Account..."
                    : "Create Account"}
                </button>
              </form>

              <button
                className="switch-button"
                onClick={() => {
                  setIsLogin(true);
                  setMessage("");
                }}
              >
                Already have an account?
                Sign In
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  /* =========================
     DASHBOARD
  ========================= */

  return (
    <div className="app">
      {/* SIDEBAR */}

      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">
            📝
          </div>

          <div>
            <h2>Notes</h2>
            <span>My workspace</span>
          </div>
        </div>

        <button
          className="new-note-button"
          onClick={openCreateModal}
        >
          + &nbsp; New Note
        </button>

        <div className="sidebar-nav">
          <button className="nav-item active">
            📝
            <span>All Notes</span>
            <b>{notes.length}</b>
          </button>

          <button className="nav-item">
            ⭐
            <span>Favorites</span>
            <b>{favoriteCount}</b>
          </button>
        </div>

        <div className="sidebar-bottom">
          <div className="profile">
            <div className="avatar">
              {user.username
                ?.charAt(0)
                .toUpperCase()}
            </div>

            <div>
              <strong>
                {user.username}
              </strong>

              <small>
                {user.email}
              </small>
            </div>
          </div>

          <button
            className="logout-button"
            onClick={logout}
          >
            🚪 &nbsp; Logout
          </button>
        </div>
      </aside>

      {/* MAIN */}

      <main className="main">
        <div className="header">
          <div>
            <h1>
              Welcome, {user.username} 👋
            </h1>

            <p>
              Capture your thoughts and ideas
            </p>
          </div>

          <div className="search-box">
            🔍

            <input
              type="text"
              placeholder="Search notes..."
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
            />
          </div>
        </div>

        {message && (
          <div className="dashboard-message">
            {message}
          </div>
        )}

        {/* STATS */}

        <div className="stats">
          <div className="stat-card">
            <div className="stat-icon">
              📒
            </div>

            <div>
              <span>Total Notes</span>
              <strong>
                {notes.length}
              </strong>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">
              ⭐
            </div>

            <div>
              <span>Favorites</span>
              <strong>
                {favoriteCount}
              </strong>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">
              ✨
            </div>

            <div>
              <span>Workspace</span>
              <strong>Active</strong>
            </div>
          </div>
        </div>

        {/* NOTES */}

        <div className="notes-grid">
          {loading && notes.length === 0 ? (
            <div className="empty-state">
              <div>⏳</div>
              <h2>
                Loading notes...
              </h2>
            </div>
          ) : filteredNotes.length ===
            0 ? (
            <div className="empty-state">
              <div>📝</div>

              <h2>
                No notes found
              </h2>

              <p>
                Create your first note to get
                started.
              </p>

              <button
                className="new-note-button"
                onClick={
                  openCreateModal
                }
              >
                + New Note
              </button>
            </div>
          ) : (
            filteredNotes.map((note) => (
              <div
                className={`note-card ${
                  note.color || "yellow"
                }`}
                key={note._id}
              >
                <div className="note-top">
                  <h3>
                    {note.title}
                  </h3>

                  <button
                    className="favorite-button"
                    onClick={() =>
                      toggleFavorite(note)
                    }
                  >
                    {note.favorite
                      ? "⭐"
                      : "☆"}
                  </button>
                </div>

                <p>
                  {note.content}
                </p>

                <div className="note-footer">
                  <span>
                    {new Date(
                      note.createdAt
                    ).toLocaleDateString()}
                  </span>

                  <div className="note-actions">
                    <button
                      onClick={() =>
                        openEditModal(note)
                      }
                      title="Edit"
                    >
                      ✏️
                    </button>

                    <button
                      onClick={() =>
                        deleteNote(
                          note._id
                        )
                      }
                      title="Delete"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      {/* CREATE / EDIT MODAL */}

      {showModal && (
        <div
          className="modal-overlay"
          onClick={() =>
            setShowModal(false)
          }
        >
          <div
            className="modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <div className="modal-header">
              <h2>
                {editingNote
                  ? "Edit Note"
                  : "Create New Note"}
              </h2>

              <button
                onClick={() =>
                  setShowModal(false)
                }
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={handleSaveNote}
            >
              <label>
                Title
              </label>

              <input
                type="text"
                placeholder="Note title"
                value={noteForm.title}
                onChange={(event) =>
                  setNoteForm({
                    ...noteForm,
                    title:
                      event.target.value,
                  })
                }
              />

              <label>
                Content
              </label>

              <textarea
                rows="6"
                placeholder="Write your note..."
                value={
                  noteForm.content
                }
                onChange={(event) =>
                  setNoteForm({
                    ...noteForm,
                    content:
                      event.target.value,
                  })
                }
              />

              <label>
                Color
              </label>

              <select
                value={noteForm.color}
                onChange={(event) =>
                  setNoteForm({
                    ...noteForm,
                    color:
                      event.target.value,
                  })
                }
              >
                <option value="yellow">
                  Yellow
                </option>

                <option value="blue">
                  Blue
                </option>

                <option value="green">
                  Green
                </option>

                <option value="purple">
                  Purple
                </option>

                <option value="orange">
                  Orange
                </option>
              </select>

              <div className="modal-actions">
                <button
                  type="button"
                  onClick={() =>
                    setShowModal(false)
                  }
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="save-button"
                  disabled={loading}
                >
                  {editingNote
                    ? "Update Note"
                    : "Create Note"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;