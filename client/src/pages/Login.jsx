import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BookOpen, Mail, Lock, LogIn, AlertCircle } from "lucide-react";
import { API_BASE_URL } from "../api";

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState("Logging in...");

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Please enter email and password");
      return;
    }

    setLoading(true);
    setLoadingMsg("Logging in...");

    try {
      const response = await fetch(`${API_BASE_URL}/api/users/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Invalid credentials");
      }

      localStorage.setItem("user", JSON.stringify(data.user));
      navigate("/dashboard");
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
        <p className="auth-subtitle">Welcome back! Sign in to manage your studies.</p>

        {error && (
          <div className="error-banner">
            <AlertCircle size={20} className="error-icon" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="auth-form">
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
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="auth-button"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner"></span>
                <span>{loadingMsg}</span>
              </>
            ) : (
              <>
                <LogIn size={20} />
                <span>Login</span>
              </>
            )}
          </button>
        </form>

        <p className="auth-footer">
          Don't have an account?{" "}
          <Link to="/register" className="auth-link">
            Create Account
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Login;
