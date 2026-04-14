import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../AuthContext";
import "./Auth.css";

export default function Login() {
  const { login } = useAuth();
  const navigate  = useNavigate();
  const API_URL = "https://your-backend.onrender.com";

  const [form, setForm]   = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res  = await fetch(`${API_URL}/api/auth/login`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); setLoading(false); return; }
      login(data.user, data.token);
      navigate(data.user.role === "admin" ? "/admin" : "/");
    } catch {
      setError("Server error. Is Flask running?");
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-left">
        <div className="auth-brand">
          <span className="auth-leaf">🌿</span>
          <span>Nature Mart</span>
        </div>
        <h1 className="auth-tagline">Pure &amp; organic,<br />delivered to you.</h1>
        <p className="auth-sub">Sign in to your account to continue shopping.</p>
        <div className="auth-decor"></div>
      </div>

      <div className="auth-right">
        <div className="auth-card">
          <h2 className="auth-title">Welcome back</h2>
          <p className="auth-hint">Don't have an account? <Link to="/register">Register</Link></p>

          {error && <div className="auth-error">{error}</div>}

          <form onSubmit={submit} className="auth-form">
            <label>Email address</label>
            <input
              type="email" name="email" required
              placeholder="you@example.com"
              value={form.email} onChange={handle}
            />

            <label>Password</label>
            <input
              type="password" name="password" required
              placeholder="••••••••"
              value={form.password} onChange={handle}
            />

            <button className="auth-btn" type="submit" disabled={loading}>
              {loading ? "Signing in…" : "Sign In →"}
            </button>
          </form>

          <div className="auth-demo">
            <p>Demo credentials</p>
            <span onClick={() => setForm({ email: "admin@naturemart.com", password: "admin123" })}>
              Admin
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}