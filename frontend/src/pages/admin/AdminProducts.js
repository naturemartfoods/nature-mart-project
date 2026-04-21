// import { useEffect, useState } from "react";
// import { useAuth } from "../../AuthContext";
// import "./Admin.css";

// const EMPTY = { name: "", price: "", description: "", weight: "", stock: 100, image: "" };
// const API_URL = "https://nature-mart-project.onrender.com";
// export default function AdminProducts() {
//   const { authFetch } = useAuth();
//   const [products, setProducts] = useState([]);
//   const [loading, setLoading]   = useState(true);
//   const [modal, setModal]       = useState(null); // null | "add" | "edit"
//   const [form, setForm]         = useState(EMPTY);
//   const [editId, setEditId]     = useState(null);
//   const [saving, setSaving]     = useState(false);

//   const load = () => {
//     authFetch(`${API_URL}/api/admin/products`)
//       .then(r => r.json())
//       .then(d => { setProducts(d); setLoading(false); });
//   };

//   useEffect(() => { load(); }, []);

//   const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });

//   const openAdd  = () => { setForm(EMPTY); setEditId(null); setModal("add"); };
//   const openEdit = (p)  => {
//     setForm({ name: p.name, price: p.price, description: p.description,
//               weight: p.weight || "", stock: p.stock, image: p.image || "" });
//     setEditId(p.id);
//     setModal("edit");
//   };

//   const save = async (e) => {
//     e.preventDefault();
//     setSaving(true);
//     const url    = modal === "add"
//       ? `${API_URL}//api/admin/products`
//       : `${API_URL}//api/admin/products/${editId}`;
//     const method = modal === "add" ? "POST" : "PUT";
//     await authFetch(url, { method, body: JSON.stringify({ ...form, price: Number(form.price), stock: Number(form.stock) }) });
//     setSaving(false);
//     setModal(null);
//     load();
//   };

//   const remove = async (id) => {
//     if (!window.confirm("Delete this product?")) return;
//     await authFetch(`${API_URL}//api/admin/products/${id}`, { method: "DELETE" });
//     load();
//   };

//   if (loading) return <div className="page-loader"><div className="spinner"></div><p>Loading products…</p></div>;

//   return (
//     <div className="admin-page">
//       <div className="admin-header">
//         <div>
//           <h1>Products</h1>
//           <p>{products.length} items in store</p>
//         </div>
//         <button className="btn-add-product" onClick={openAdd}>+ Add Product</button>
//       </div>

//       <div className="admin-card">
//         <div className="table-wrap">
//           <table className="admin-table">
//             <thead>
//               <tr><th>ID</th><th>Image</th><th>Name</th><th>Price</th><th>Stock</th><th>Weight</th><th>Status</th><th>Actions</th></tr>
//             </thead>
//             <tbody>
//               {products.map(p => (
//                 <tr key={p.id}>
//                   <td>#{p.id}</td>
//                   <td>
//                     {p.image
//                       ? <img src={p.image} alt={p.name} className="product-thumb" />
//                       : <div className="product-thumb-placeholder">🌿</div>}
//                   </td>
//                   <td className="td-name">{p.name}</td>
//                   <td className="td-price">₹{p.price}</td>
//                   <td>{p.stock}</td>
//                   <td>{p.weight || "—"}</td>
//                   <td>
//                     <span className={`status-badge ${p.is_active ? "status-active" : "status-inactive"}`}>
//                       {p.is_active ? "Active" : "Hidden"}
//                     </span>
//                   </td>
//                   <td className="td-actions">
//                     <button className="btn-table-toggle" onClick={() => openEdit(p)}>Edit</button>
//                     <button className="btn-table-del"    onClick={() => remove(p.id)}>Delete</button>
//                   </td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </div>
//       </div>

//       {/* Modal */}
//       {modal && (
//         <div className="modal-backdrop" onClick={() => setModal(null)}>
//           <div className="modal" onClick={e => e.stopPropagation()}>
//             <h2>{modal === "add" ? "Add Product" : "Edit Product"}</h2>
//             <form onSubmit={save} className="modal-form">
//               <div className="form-row">
//                 <div className="form-group">
//                   <label>Name</label>
//                   <input name="name" value={form.name} onChange={handle} required />
//                 </div>
//                 <div className="form-group">
//                   <label>Price (₹)</label>
//                   <input name="price" type="number" value={form.price} onChange={handle} required />
//                 </div>
//               </div>
//               <div className="form-row">
//                 <div className="form-group">
//                   <label>Weight</label>
//                   <input name="weight" value={form.weight} onChange={handle} placeholder="e.g. 250g" />
//                 </div>
//                 <div className="form-group">
//                   <label>Stock</label>
//                   <input name="stock" type="number" value={form.stock} onChange={handle} />
//                 </div>
//               </div>
//               <div className="form-group">
//                 <label>Image path <span className="optional">(e.g. /images/product.jpg)</span></label>
//                 <input name="image" value={form.image} onChange={handle} placeholder="/images/product.jpg" />
//               </div>
//               <div className="form-group">
//                 <label>Description</label>
//                 <textarea name="description" value={form.description} onChange={handle} rows={3} />
//               </div>
//               <div className="modal-actions">
//                 <button type="button" className="btn-cancel" onClick={() => setModal(null)}>Cancel</button>
//                 <button type="submit" className="btn-save" disabled={saving}>
//                   {saving ? "Saving…" : modal === "add" ? "Add Product" : "Save Changes"}
//                 </button>
//               </div>
//             </form>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }


import { useEffect, useRef, useState } from "react";
import { useAuth } from "../../AuthContext";
import "./Admin.css";

const API_URL = "https://nature-mart-project.onrender.com";
const EMPTY = { name: "", price: "", description: "", weight: "", stock: 100, image: "" };

export default function AdminProducts() {
  const { authFetch } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [modal, setModal]       = useState(null); // null | "add" | "edit"
  const [form, setForm]         = useState(EMPTY);
  const [editId, setEditId]     = useState(null);
  const [saving, setSaving]     = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState("");
  const fileInputRef = useRef(null);

  // ─── Load products ──────────────────────────────────────────
  const load = () => {
    authFetch(`${API_URL}/api/admin/products`)
      .then(r => r.json())
      .then(d => { setProducts(d); setLoading(false); });
  };

  useEffect(() => { load(); }, []);

  // ─── Form field change ──────────────────────────────────────
  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  // ─── Open modals ────────────────────────────────────────────
  const openAdd = () => {
    setForm(EMPTY);
    setEditId(null);
    setImagePreview("");
    setModal("add");
  };

  const openEdit = (p) => {
    setForm({
      name:        p.name,
      price:       p.price,
      description: p.description,
      weight:      p.weight || "",
      stock:       p.stock,
      image:       p.image || "",
      is_active:   p.is_active,
    });
    setEditId(p.id);
    // Show existing image as preview
    setImagePreview(p.image ? (p.image.startsWith("http") ? p.image : `${API_URL}${p.image}`) : "");
    setModal("edit");
  };

  // ─── Image upload ────────────────────────────────────────────
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Show local preview immediately
    const localPreview = URL.createObjectURL(file);
    setImagePreview(localPreview);

    // Upload to backend
    setUploading(true);
    const formData = new FormData();
    formData.append("image", file);

    try {
      // NOTE: Do NOT set Content-Type header — browser sets it automatically with correct boundary
      const res = await authFetch(`${API_URL}/api/admin/products/upload-image`, {
        method: "POST",
        body:   formData,
      });
      const data = await res.json();
      if (data.image_url) {
        setForm(prev => ({ ...prev, image: data.image_url }));
        setImagePreview(`${API_URL}${data.image_url}`);
      } else {
        alert("Image upload failed: " + (data.error || "Unknown error"));
        setImagePreview("");
      }
    } catch (err) {
      alert("Image upload failed. Please try again.");
      setImagePreview("");
    } finally {
      setUploading(false);
    }
  };

  const removeImage = () => {
    setForm(prev => ({ ...prev, image: "" }));
    setImagePreview("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ─── Save product (add or edit) ──────────────────────────────
  const save = async (e) => {
    e.preventDefault();
    setSaving(true);

    const url    = modal === "add"
      ? `${API_URL}/api/admin/products`
      : `${API_URL}/api/admin/products/${editId}`;
    const method = modal === "add" ? "POST" : "PUT";

    await authFetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        price: Number(form.price),
        stock: Number(form.stock),
      }),
    });

    setSaving(false);
    setModal(null);
    load();
  };

  // ─── Delete product ──────────────────────────────────────────
  const remove = async (id) => {
    if (!window.confirm("Delete this product?")) return;
    await authFetch(`${API_URL}/api/admin/products/${id}`, { method: "DELETE" });
    load();
  };

  // ─── Helpers ─────────────────────────────────────────────────
  const getImageSrc = (image) => {
    if (!image) return null;
    return image.startsWith("http") ? image : `${API_URL}${image}`;
  };

  if (loading) return (
    <div className="page-loader">
      <div className="spinner"></div>
      <p>Loading products…</p>
    </div>
  );

  return (
    <div className="admin-page">
      <div className="admin-header">
        <div>
          <h1>Products</h1>
          <p>{products.length} items in store</p>
        </div>
        <button className="btn-add-product" onClick={openAdd}>+ Add Product</button>
      </div>

      {/* Products Table */}
      <div className="admin-card">
        <div className="table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Image</th>
                <th>Name</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Weight</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map(p => (
                <tr key={p.id}>
                  <td>#{p.id}</td>
                  <td>
                    {getImageSrc(p.image)
                      ? <img src={getImageSrc(p.image)} alt={p.name} className="product-thumb" />
                      : <div className="product-thumb-placeholder">🌿</div>
                    }
                  </td>
                  <td className="td-name">{p.name}</td>
                  <td className="td-price">₹{p.price}</td>
                  <td>{p.stock}</td>
                  <td>{p.weight || "—"}</td>
                  <td>
                    <span className={`status-badge ${p.is_active ? "status-active" : "status-inactive"}`}>
                      {p.is_active ? "Active" : "Hidden"}
                    </span>
                  </td>
                  <td className="td-actions">
                    <button className="btn-table-toggle" onClick={() => openEdit(p)}>Edit</button>
                    <button className="btn-table-del"    onClick={() => remove(p.id)}>Delete</button>
                  </td>
                </tr>
              ))}
              {products.length === 0 && (
                <tr>
                  <td colSpan="8" style={{ textAlign: "center", padding: "40px", color: "#888" }}>
                    No products yet. Add your first product!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {modal && (
        <div className="modal-backdrop" onClick={() => setModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>{modal === "add" ? "Add Product" : "Edit Product"}</h2>

            <form onSubmit={save} className="modal-form">

              {/* ── Image Upload Section ── */}
              <div className="form-group">
                <label>Product Image</label>

                {/* Preview */}
                {imagePreview ? (
                  <div className="image-preview-wrap">
                    <img src={imagePreview} alt="Preview" className="image-preview" />
                    <button
                      type="button"
                      className="btn-remove-image"
                      onClick={removeImage}
                      title="Remove image"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  /* Upload Box — click to open file picker */
                  <div
                    className="image-upload-box"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {uploading ? (
                      <>
                        <div className="spinner small"></div>
                        <span>Uploading…</span>
                      </>
                    ) : (
                      <>
                        <span className="upload-icon">📷</span>
                        <span>Click to upload image</span>
                        <small>PNG, JPG, JPEG, GIF, WEBP</small>
                      </>
                    )}
                  </div>
                )}

                {/* Hidden file input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png, image/jpg, image/jpeg, image/gif, image/webp"
                  onChange={handleImageUpload}
                  style={{ display: "none" }}
                />

                {/* Show upload button again if image already set but user wants to change */}
                {imagePreview && !uploading && (
                  <button
                    type="button"
                    className="btn-change-image"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Change Image
                  </button>
                )}
              </div>

              {/* ── Name & Price ── */}
              <div className="form-row">
                <div className="form-group">
                  <label>Name</label>
                  <input name="name" value={form.name} onChange={handle} required />
                </div>
                <div className="form-group">
                  <label>Price (₹)</label>
                  <input name="price" type="number" value={form.price} onChange={handle} required />
                </div>
              </div>

              {/* ── Weight & Stock ── */}
              <div className="form-row">
                <div className="form-group">
                  <label>Weight</label>
                  <input name="weight" value={form.weight} onChange={handle} placeholder="e.g. 250g" />
                </div>
                <div className="form-group">
                  <label>Stock</label>
                  <input name="stock" type="number" value={form.stock} onChange={handle} />
                </div>
              </div>

              {/* ── Description ── */}
              <div className="form-group">
                <label>Description</label>
                <textarea name="description" value={form.description} onChange={handle} rows={3} />
              </div>

              {/* ── Actions ── */}
              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setModal(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn-save" disabled={saving || uploading}>
                  {saving ? "Saving…" : modal === "add" ? "Add Product" : "Save Changes"}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
}