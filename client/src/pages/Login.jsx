import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BookOpen, Mail, Lock, LogIn, AlertCircle, Wifi } from "lucide-react";
import { API_BASE_URL } from "../api";

// Warm up the server in background as soon as page loads
function useServerWarmup() {
  const [serverReady, setServerReady] = useState(false);
  const [warming, setWarming] = useState(true);

  useEffect(() => {
    const ping = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/health`, {
          method: "GET",
          signal: AbortSignal.timeout(15000),
        });
        if (res.ok) {
          setServerReady(true);
          setWarming(false);
        }
      } catch {
        // Server still waking up — retry after 3 seconds
        setTimeout(ping, 3000);
      }
    };

    // Only warm up if there's a remote API (not local dev proxy)
    if (API_BASE_URL) {
      ping();
    } else {
      setServerReady(true);
      setWarming(false);
    }
  }, []);

  return { serverReady, warming };
}

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState("Logging in...");

  const { serverReady, warming } = useServerWarmup();

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

        {/* Server warm-up banner */}
        {warming && (
          <div className="warmup-banner">
            <Wifi size={16} className="warmup-icon" />
            <span>Connecting to server<span className="dots-anim">...</span></span>
            <span className="warmup-sub">First load may take ~30s on free hosting</span>
          </div>
        )}

        {!warming && serverReady && (
          <div className="ready-banner">
            ✅ Server is ready
          </div>
        )}

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
