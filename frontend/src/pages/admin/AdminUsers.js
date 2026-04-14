import { useEffect, useState } from "react";
import { useAuth } from "../../AuthContext";
import "./Admin.css";

export default function AdminUsers() {
  const { authFetch } = useAuth();
  const [users, setUsers]   = useState([]);
  const [loading, setLoading] = useState(true);
  const API_URL = "https://nature-mart-project.onrender.com"

  const load = () => {
    authFetch(`${API_URL}/api/admin/users`)
      .then(r => r.json())
      .then(d => { setUsers(d); setLoading(false); });
  };

  useEffect(() => { load(); }, []);

  const toggle = async (id) => {
    authFetch(`${API_URL}/api/admin/users/${id}/toggle`, { method: "PUT" })
    load();
  };

  const remove = async (id) => {
    if (!window.confirm("Delete this user?")) return;
    authFetch(`${API_URL}/api/admin/users/${id}`, { method: "DELETE" })
    load();
  };

  if (loading) return <div className="page-loader"><div className="spinner"></div><p>Loading users…</p></div>;

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1>Manage Users</h1>
        <p>{users.length} registered accounts</p>
      </div>

      <div className="admin-card">
        <div className="table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th><th>Name</th><th>Email</th>
                <th>Role</th><th>Joined</th><th>Status</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td>#{u.id}</td>
                  <td className="td-name">{u.name}</td>
                  <td className="td-email">{u.email}</td>
                  <td><span className={`role-badge role-${u.role}`}>{u.role}</span></td>
                  <td>{u.created_at?.slice(0, 10)}</td>
                  <td>
                    <span className={`status-badge ${u.is_active ? "status-active" : "status-inactive"}`}>
                      {u.is_active ? "Active" : "Disabled"}
                    </span>
                  </td>
                  <td className="td-actions">
                    {u.role !== "admin" && (
                      <>
                        <button className="btn-table-toggle" onClick={() => toggle(u.id)}>
                          {u.is_active ? "Disable" : "Enable"}
                        </button>
                        <button className="btn-table-del" onClick={() => remove(u.id)}>Delete</button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}