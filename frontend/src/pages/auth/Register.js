import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../AuthContext";
import "./Auth.css";

export default function Register() {
  const { login } = useAuth();
  const navigate  = useNavigate();
  const API_URL = "https://your-backend.onrender.com";

  const [form, setForm]   = useState({ name: "", email: "", password: "", confirm: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (form.password !== form.confirm) { setError("Passwords do not match"); return; }
    if (form.password.length < 6)       { setError("Password must be at least 6 characters"); return; }
    setLoading(true);
    try {
      const res  = await fetch(`${API_URL}/api/auth/register`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ name: form.name, email: form.email, password: form.password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); setLoading(false); return; }
      login(data.user, data.token);
      navigate("/");
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
        <h1 className="auth-tagline">Join the natural<br />living community.</h1>
        <p className="auth-sub">Create your account and start shopping organic superfoods.</p>
        <div className="auth-decor"></div>
      </div>

      <div className="auth-right">
        <div className="auth-card">
          <h2 className="auth-title">Create account</h2>
          <p className="auth-hint">Already have an account? <Link to="/login">Sign in</Link></p>

          {error && <div className="auth-error">{error}</div>}

          <form onSubmit={submit} className="auth-form">
            <label>Full name</label>
            <input
              type="text" name="name" required
              placeholder="Your name"
              value={form.name} onChange={handle}
            />

            <label>Email address</label>
            <input
              type="email" name="email" required
              placeholder="you@example.com"
              value={form.email} onChange={handle}
            />

            <label>Password</label>
            <input
              type="password" name="password" required
              placeholder="Min. 6 characters"
              value={form.password} onChange={handle}
            />

            <label>Confirm password</label>
            <input
              type="password" name="confirm" required
              placeholder="Repeat your password"
              value={form.confirm} onChange={handle}
            />

            <button className="auth-btn" type="submit" disabled={loading}>
              {loading ? "Creating account…" : "Create Account →"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}