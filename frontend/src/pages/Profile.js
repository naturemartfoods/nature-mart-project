import { useState } from "react";
import { useAuth } from "../AuthContext";
import config from "../config";
import "../App.css";

export default function Profile() {
  const { user, authFetch, login, getToken } = useAuth();  // ✅ uses authFetch
  const [form, setForm]       = useState({ name: user?.name || "", password: "", confirm: "" });
  const [msg, setMsg]         = useState("");
  const [error, setError]     = useState("");
  const [loading, setLoading] = useState(false);

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setMsg(""); setError("");
    if (form.password && form.password !== form.confirm) {
      setError("Passwords do not match"); return;
    }
    setLoading(true);
    const body = { name: form.name };
    if (form.password) body.password = form.password;

    const res  = await authFetch(`${config.API_URL}/api/auth/profile`, {  // ✅ config.API_URL
      method: "PUT",
      body: JSON.stringify(body),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error || "Update failed"); return; }
    login({ ...user, name: form.name }, getToken());
    setMsg("Profile updated successfully ✓");
    setForm(f => ({ ...f, password: "", confirm: "" }));
  };

  return (
    <div className="profile-page">
      <div className="page-header">
        <h1 className="page-title">My Profile</h1>
      </div>

      <div className="profile-grid">
        {/* Info card */}
        <div className="profile-info-card">
          <div className="profile-avatar">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <h3>{user?.name}</h3>
          <p>{user?.email}</p>
          <span className={`role-badge role-${user?.role}`}>{user?.role}</span>
        </div>

        {/* Edit form */}
        <div className="profile-form-card">
          <h2>Edit Profile</h2>
          {msg   && <div className="success-banner">{msg}</div>}
          {error && <div className="error-banner">{error}</div>}

          <form onSubmit={submit}>
            <div className="form-group">
              <label>Full name</label>
              <input name="name" value={form.name} onChange={handle} placeholder="Your name" />
            </div>
            <div className="form-group">
              <label>New password <span className="optional">(leave blank to keep current)</span></label>
              <input type="password" name="password" value={form.password} onChange={handle} placeholder="••••••••" />
            </div>
            <div className="form-group">
              <label>Confirm new password</label>
              <input type="password" name="confirm" value={form.confirm} onChange={handle} placeholder="••••••••" />
            </div>
            <button className="btn-checkout" type="submit" disabled={loading}>
              {loading ? "Saving…" : "Save Changes"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}