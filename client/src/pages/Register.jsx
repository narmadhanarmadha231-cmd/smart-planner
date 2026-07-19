import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BookOpen, User, Mail, Lock, UserPlus, AlertCircle, CheckCircle } from "lucide-react";
import { API_BASE_URL } from "../api";

function Register() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!name || !email || !password) {
      setError("Please fill in all fields");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/users/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Registration failed");
      }

      setSuccess("Account created successfully! Redirecting to login...");
      setTimeout(() => {
        navigate("/");
      }, 2000);
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-logo">
          <BookOpen className="logo-icon" size={40} />
          <h1>Smart Study Planner</h1>
        </div>
        <p className="auth-subtitle">Create your account to start planning your success.</p>

        {error && (
          <div className="error-banner">
            <AlertCircle size={20} className="error-icon" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="success-banner">
            <CheckCircle size={20} className="success-icon" />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleRegister} className="auth-form">
          <div className="input-group">
            <User className="input-icon" size={20} />
            <input
              type="text"
              placeholder="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <Mail className="input-icon" size={20} />
            <input
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <Lock className="input-icon" size={20} />
            <input
              type="password"
              placeholder="Password (min. 6 characters)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="auth-button" disabled={loading || success}>
            {loading ? (
              <span className="spinner"></span>
            ) : (
              <>
                <UserPlus size={20} />
                <span>Register</span>
              </>
            )}
          </button>
        </form>

        <p className="auth-footer">
          Already have an account?{" "}
          <Link to="/" className="auth-link">
            Log In
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Register;
