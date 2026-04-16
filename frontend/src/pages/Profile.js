import { useState, useEffect } from "react";
import { useAuth } from "../AuthContext";
import config from "../config";
import "../App.css";

const STATES = [
  "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh","Goa",
  "Gujarat","Haryana","Himachal Pradesh","Jharkhand","Karnataka","Kerala",
  "Madhya Pradesh","Maharashtra","Manipur","Meghalaya","Mizoram","Nagaland",
  "Odisha","Punjab","Rajasthan","Sikkim","Tamil Nadu","Telangana","Tripura",
  "Uttar Pradesh","Uttarakhand","West Bengal","Delhi","Jammu & Kashmir","Ladakh"
];

export default function Profile() {
  const { user, authFetch, login, getToken } = useAuth();

  const [form, setForm]           = useState({ name: user?.name || "", password: "", confirm: "" });
  const [address, setAddress]     = useState({ phone: "", address_line: "", city: "", state: "", pincode: "" });
  const [addressMsg, setAddressMsg] = useState("");
  const [addressErr, setAddressErr] = useState("");
  const [editingAddress, setEditingAddress] = useState(false);
  const [hasAddress, setHasAddress]   = useState(false);
  const [msg, setMsg]             = useState("");
  const [error, setError]         = useState("");
  const [loading, setLoading]     = useState(false);
  const [addrLoading, setAddrLoading] = useState(false);

  // ✅ Load saved address on mount
  useEffect(() => {
    const loadAddress = async () => {
      try {
        const res  = await authFetch(`${config.API_URL}/api/users/address`);
        const data = await res.json();
        if (data.address) {
          setAddress(data.address);
          setHasAddress(true);
        }
      } catch {}
    };
    loadAddress();
  }, []);

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const handleAddr = (e) => setAddress({ ...address, [e.target.name]: e.target.value });

  // ─── Profile Update ───────────────────────────────────────────────────────
  const submitProfile = async (e) => {
    e.preventDefault();
    setMsg(""); setError("");
    if (form.password && form.password !== form.confirm) {
      setError("Passwords do not match"); return;
    }
    setLoading(true);
    const body = { name: form.name };
    if (form.password) body.password = form.password;

    const res  = await authFetch(`${config.API_URL}/api/auth/profile`, {
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

  // ─── Address Validation ───────────────────────────────────────────────────
  const validateAddress = () => {
    if (!/^[6-9]\d{9}$/.test(address.phone)) {
      setAddressErr("Enter valid 10-digit mobile number"); return false;
    }
    if (!address.address_line.trim()) {
      setAddressErr("Address is required"); return false;
    }
    if (!address.city.trim()) {
      setAddressErr("City is required"); return false;
    }
    if (!address.state) {
      setAddressErr("Please select a state"); return false;
    }
    if (!/^\d{6}$/.test(address.pincode)) {
      setAddressErr("Enter valid 6-digit PIN code"); return false;
    }
    return true;
  };

  // ─── Save Address ─────────────────────────────────────────────────────────
  const submitAddress = async (e) => {
    e.preventDefault();
    setAddressMsg(""); setAddressErr("");
    if (!validateAddress()) return;

    setAddrLoading(true);
    const res  = await authFetch(`${config.API_URL}/api/users/address`, {
      method: "PUT",
      body: JSON.stringify(address),
    });
    const data = await res.json();
    setAddrLoading(false);
    if (!res.ok) { setAddressErr(data.error || "Failed to save address"); return; }
    setAddressMsg("Default address saved ✓");
    setHasAddress(true);
    setEditingAddress(false);
  };

  return (
    <div className="profile-page">
      <div className="page-header">
        <h1 className="page-title">My Profile</h1>
      </div>

      <div className="profile-grid">

        {/* ── Info Card ── */}
        <div className="profile-info-card">
          <div className="profile-avatar">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <h3>{user?.name}</h3>
          <p>{user?.email}</p>
          <span className={`role-badge role-${user?.role}`}>{user?.role}</span>
        </div>

        {/* ── Edit Profile ── */}
        <div className="profile-form-card">
          <h2>Edit Profile</h2>
          {msg   && <div className="success-banner">{msg}</div>}
          {error && <div className="error-banner">{error}</div>}

          <form onSubmit={submitProfile}>
            <div className="form-group">
              <label>Full Name</label>
              <input name="name" value={form.name} onChange={handle} placeholder="Your name" />
            </div>
            <div className="form-group">
              <label>New Password <span className="optional">(leave blank to keep current)</span></label>
              <input type="password" name="password" value={form.password} onChange={handle} placeholder="••••••••" />
            </div>
            <div className="form-group">
              <label>Confirm New Password</label>
              <input type="password" name="confirm" value={form.confirm} onChange={handle} placeholder="••••••••" />
            </div>
            <button className="btn-checkout" type="submit" disabled={loading}>
              {loading ? "Saving…" : "Save Changes"}
            </button>
          </form>
        </div>

        {/* ── Default Address ── */}
        <div className="profile-form-card profile-address-card">
          <div className="profile-address-header">
            <h2>📍 Default Address</h2>
            {hasAddress && !editingAddress && (
              <button className="co-edit-link" onClick={() => setEditingAddress(true)}>
                ✏️ Change Address
              </button>
            )}
          </div>

          {addressMsg && <div className="success-banner">{addressMsg}</div>}
          {addressErr && <div className="error-banner">{addressErr}</div>}

          {/* Show saved address */}
          {hasAddress && !editingAddress ? (
            <div className="saved-address-view">
              <p>📞 {address.phone}</p>
              <p>🏠 {address.address_line}</p>
              <p>🏙️ {address.city}, {address.state} — {address.pincode}</p>
              <p className="address-default-badge">✅ Default Address</p>
            </div>
          ) : (
            /* Address Form */
            <form onSubmit={submitAddress}>
              <div className="form-group">
                <label>Mobile Number *</label>
                <input
                  name="phone"
                  value={address.phone}
                  maxLength={10}
                  onChange={e => setAddress({ ...address, phone: e.target.value.replace(/\D/g, "") })}
                  placeholder="10-digit mobile number"
                />
              </div>
              <div className="form-group">
                <label>Address *</label>
                <textarea
                  name="address_line"
                  value={address.address_line}
                  onChange={handleAddr}
                  placeholder="House No., Street, Area, Landmark"
                  rows={3}
                />
              </div>
              <div className="form-group">
                <label>City *</label>
                <input name="city" value={address.city} onChange={handleAddr} placeholder="City" />
              </div>
              <div className="form-group">
                <label>State *</label>
                <select name="state" value={address.state} onChange={handleAddr}>
                  <option value="">Select State</option>
                  {STATES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>PIN Code *</label>
                <input
                  name="pincode"
                  value={address.pincode}
                  maxLength={6}
                  onChange={e => setAddress({ ...address, pincode: e.target.value.replace(/\D/g, "") })}
                  placeholder="6-digit PIN code"
                />
              </div>
              <div className="profile-addr-btns">
                {editingAddress && (
                  <button type="button" className="co-btn-outline" onClick={() => { setEditingAddress(false); setAddressErr(""); }}>
                    Cancel
                  </button>
                )}
                <button className="btn-checkout" type="submit" disabled={addrLoading}>
                  {addrLoading ? "Saving…" : "Save Default Address"}
                </button>
              </div>
            </form>
          )}
        </div>

      </div>
    </div>
  );
}