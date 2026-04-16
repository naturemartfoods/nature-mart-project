import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";
import config from "../config";

const STATES = [
  "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh","Goa",
  "Gujarat","Haryana","Himachal Pradesh","Jharkhand","Karnataka","Kerala",
  "Madhya Pradesh","Maharashtra","Manipur","Meghalaya","Mizoram","Nagaland",
  "Odisha","Punjab","Rajasthan","Sikkim","Tamil Nadu","Telangana","Tripura",
  "Uttar Pradesh","Uttarakhand","West Bengal","Delhi","Jammu & Kashmir","Ladakh"
];

export default function Profile() {
  const { user, authFetch, login, getToken } = useAuth();
  const navigate = useNavigate();

  const [form, setForm]               = useState({ name: user?.name || "", password: "", confirm: "" });
  const [address, setAddress]         = useState({ phone: "", address_line: "", city: "", state: "", pincode: "" });
  const [addressMsg, setAddressMsg]   = useState("");
  const [addressErr, setAddressErr]   = useState("");
  const [editingAddress, setEditingAddress] = useState(false);
  const [hasAddress, setHasAddress]   = useState(false);
  const [hasOrders, setHasOrders]     = useState(false);
  const [msg, setMsg]                 = useState("");
  const [error, setError]             = useState("");
  const [loading, setLoading]         = useState(false);
  const [addrLoading, setAddrLoading] = useState(false);

  useEffect(() => {
    // Load saved address
    const loadAddress = async () => {
      try {
        const res  = await authFetch(`${config.API_URL}/api/users/address`);
        const data = await res.json();
        if (data.address) { setAddress(data.address); setHasAddress(true); }
      } catch {}
    };

    // Check if user has any previous orders
    const loadOrders = async () => {
      try {
        const res  = await authFetch(`${config.API_URL}/api/orders`);
        const data = await res.json();
        if (Array.isArray(data.orders) && data.orders.length > 0) setHasOrders(true);
      } catch {}
    };

    loadAddress();
    loadOrders();
  }, []);

  const handle     = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const handleAddr = (e) => setAddress({ ...address, [e.target.name]: e.target.value });

  // ── Profile Update ──────────────────────────────────────────────────────────
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
      method: "PUT", body: JSON.stringify(body),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error || "Update failed"); return; }
    login({ ...user, name: form.name }, getToken());
    setMsg("Profile updated successfully ✓");
    setForm(f => ({ ...f, password: "", confirm: "" }));
  };

  // ── Address Validation ──────────────────────────────────────────────────────
  const validateAddress = () => {
    if (!/^[6-9]\d{9}$/.test(address.phone))
      return setAddressErr("Enter valid 10-digit mobile number"), false;
    if (!address.address_line.trim())
      return setAddressErr("Address is required"), false;
    if (!address.city.trim())
      return setAddressErr("City is required"), false;
    if (!address.state)
      return setAddressErr("Please select a state"), false;
    if (!/^\d{6}$/.test(address.pincode))
      return setAddressErr("Enter valid 6-digit PIN code"), false;
    return true;
  };

  // ── Save Address ────────────────────────────────────────────────────────────
  const submitAddress = async (e) => {
    e.preventDefault();
    setAddressMsg(""); setAddressErr("");
    if (!validateAddress()) return;

    setAddrLoading(true);
    const res  = await authFetch(`${config.API_URL}/api/users/address`, {
      method: "PUT", body: JSON.stringify(address),
    });
    const data = await res.json();
    setAddrLoading(false);
    if (!res.ok) { setAddressErr(data.error || "Failed to save address"); return; }
    setAddressMsg("Default address saved ✓");
    setHasAddress(true);
    setEditingAddress(false);
  };

  // Show address section only if user has orders OR already saved an address
  const showAddressSection = hasAddress || hasOrders;

  return (
    <div className="profile-page">
      <div className="profile-page-header">
        <h1>My Profile</h1>
        <span className="profile-breadcrumb">/ account</span>
      </div>

      <div className="profile-layout">

        {/* ── Left Sidebar ── */}
        <aside className="profile-sidebar">
          <div className="profile-avatar-card">
            <div className="profile-avatar-circle">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="profile-avatar-name">{user?.name}</div>
            <div className="profile-avatar-email">{user?.email}</div>
            <span className={`role-badge role-${user?.role}`}>{user?.role}</span>
          </div>

          <nav className="profile-nav">
            <div className="profile-nav-item active">
              <span className="pni-dot" /> Profile
            </div>
            <div className="profile-nav-item" onClick={() => navigate("/orders")}>
              📦 Orders
            </div>
            <div className="profile-nav-item" onClick={() => navigate("/cart")}>
              🛒 Cart
            </div>
          </nav>
        </aside>

        {/* ── Right Content ── */}
        <div className="profile-content">

          {/* Edit Profile Card */}
          <div className="profile-card">
            <h2 className="profile-card-title">Edit Profile</h2>

            {msg   && <div className="success-banner">{msg}</div>}
            {error && <div className="error-banner">{error}</div>}

            <form onSubmit={submitProfile}>
              <div className="form-row-2">
                <div className="form-group">
                  <label>Full Name</label>
                  <input name="name" value={form.name} onChange={handle} placeholder="Your name" />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input value={user?.email || ""} disabled />
                </div>
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label>New Password <span className="optional">(leave blank to keep)</span></label>
                  <input type="password" name="password" value={form.password} onChange={handle} placeholder="••••••••" />
                </div>
                <div className="form-group">
                  <label>Confirm Password</label>
                  <input type="password" name="confirm" value={form.confirm} onChange={handle} placeholder="••••••••" />
                </div>
              </div>

              <div className="profile-form-actions">
                <button className="btn-save" type="submit" disabled={loading}>
                  {loading ? "Saving…" : "Save Changes"}
                </button>
              </div>
            </form>
          </div>

          {/* Address Card — only if user has orders or already saved an address */}
          {showAddressSection ? (
            <div className="profile-card">
              <div className="profile-card-header">
                <h2 className="profile-card-title">📍 Delivery Address</h2>
                {hasAddress && !editingAddress && (
                  <button className="btn-edit-link" onClick={() => setEditingAddress(true)}>
                    ✏️ Edit Address
                  </button>
                )}
              </div>

              {addressMsg && <div className="success-banner">{addressMsg}</div>}
              {addressErr && <div className="error-banner">{addressErr}</div>}

              {hasAddress && !editingAddress ? (
                /* ── Saved Address View ── */
                <div className="saved-address-view">
                  <div className="addr-field">
                    <span className="addr-field-label">Address</span>
                    <span className="addr-field-value">{address.address_line}</span>
                  </div>
                  <div className="addr-row-3">
                    <div className="addr-field">
                      <span className="addr-field-label">City</span>
                      <span className="addr-field-value">{address.city}</span>
                    </div>
                    <div className="addr-field">
                      <span className="addr-field-label">State</span>
                      <span className="addr-field-value">{address.state}</span>
                    </div>
                    <div className="addr-field">
                      <span className="addr-field-label">PIN Code</span>
                      <span className="addr-field-value">{address.pincode}</span>
                    </div>
                  </div>
                  <div className="addr-field">
                    <span className="addr-field-label">Mobile</span>
                    <span className="addr-field-value">{address.phone}</span>
                  </div>
                  <span className="default-address-badge">✅ Default Address</span>
                </div>
              ) : (
                /* ── Address Form ── */
                <form onSubmit={submitAddress}>
                  <div className="form-group">
                    <label>Mobile Number *</label>
                    <input
                      name="phone" value={address.phone} maxLength={10}
                      onChange={e => setAddress({ ...address, phone: e.target.value.replace(/\D/g, "") })}
                      placeholder="10-digit mobile number"
                    />
                  </div>
                  <div className="form-group">
                    <label>Address *</label>
                    <textarea
                      name="address_line" value={address.address_line}
                      onChange={handleAddr} rows={3}
                      placeholder="House No., Street, Area, Landmark"
                    />
                  </div>
                  <div className="form-row-2">
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
                  </div>
                  <div className="form-group">
                    <label>PIN Code *</label>
                    <input
                      name="pincode" value={address.pincode} maxLength={6}
                      onChange={e => setAddress({ ...address, pincode: e.target.value.replace(/\D/g, "") })}
                      placeholder="6-digit PIN code"
                    />
                  </div>
                  <div className="profile-form-actions">
                    {editingAddress && (
                      <button type="button" className="btn-cancel"
                        onClick={() => { setEditingAddress(false); setAddressErr(""); }}>
                        Cancel
                      </button>
                    )}
                    <button className="btn-save" type="submit" disabled={addrLoading}>
                      {addrLoading ? "Saving…" : "Save Address"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          ) : (
            /* ── No Orders Yet — hide address ── */
            <div className="profile-no-address-card">
              <div className="no-addr-icon">📦</div>
              <div className="no-addr-text">
                <strong>No delivery address yet</strong>
                Place your first order and your address section will appear here.
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}