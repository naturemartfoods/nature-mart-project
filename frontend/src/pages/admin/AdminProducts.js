

import { useEffect, useRef, useState } from "react";
import { useAuth } from "../../AuthContext";
import "./Admin.css";

const API_URL = "https://nature-mart-project.onrender.com";
const EMPTY = {
  name: "", description: "", stock: 100, images: [],
  price_250g: "", price_500g: "", price_1kg: "",
};

const parseImages = (image) => {
  if (!image) return [];
  if (Array.isArray(image)) return image.filter(Boolean);
  return image.split(",").map(s => s.trim()).filter(Boolean);
};

// ✅ FIX: returns null for garbage values like "img-1", "img-2"
const getImageSrc = (image) => {
  if (!image) return null;
  if (image.startsWith("http")) return image;               // Cloudinary URLs
  if (image.startsWith("/")) return `${API_URL}${image}`;   // /images/...
  if (image.includes(".")) return `${API_URL}/images/${image}`; // bare filename
  return null; // garbage like "img-1", "img-2" → null → show placeholder
};

// ✅ FIX: filters out broken paths before rendering
function ThumbCarousel({ images }) {
  const [idx, setIdx] = useState(0);
  const validImages = images.filter(img => getImageSrc(img) !== null);

  if (!validImages.length) return <div className="product-thumb-placeholder">🌿</div>;

  if (validImages.length === 1) return (
    <img
      src={getImageSrc(validImages[0])}
      alt=""
      className="product-thumb"
      onError={(e) => { e.target.style.display = "none"; }}
    />
  );

  return (
    <div className="thumb-carousel">
      <img
        src={getImageSrc(validImages[idx])}
        alt=""
        className="product-thumb"
        onError={(e) => { e.target.style.display = "none"; }}
      />
      <div className="thumb-dots">
        {validImages.map((_, i) => (
          <span key={i} className={`thumb-dot ${i === idx ? "active" : ""}`} onClick={() => setIdx(i)} />
        ))}
      </div>
    </div>
  );
}

export default function AdminProducts() {
  const { authFetch } = useAuth();
  const [products, setProducts]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [modal, setModal]         = useState(null);
  const [form, setForm]           = useState(EMPTY);
  const [editId, setEditId]       = useState(null);
  const [saving, setSaving]       = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef              = useRef(null);

  const load = () => {
    authFetch(`${API_URL}/api/admin/products`)
      .then(r => r.json())
      .then(d => { setProducts(d); setLoading(false); });
  };
  useEffect(() => { load(); }, []);

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const openAdd = () => { setForm(EMPTY); setEditId(null); setModal("add"); };

  const openEdit = (p) => {
    setForm({
      name:        p.name,
      description: p.description,
      stock:       p.stock,
      images:      parseImages(p.image),
      is_active:   p.is_active,
      price_250g:  p.price_250g || "",
      price_500g:  p.price_500g || "",
      price_1kg:   p.price_1kg  || "",
    });
    setEditId(p.id);
    setModal("edit");
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setUploading(true);
    const uploaded = [];
    for (const file of files) {
      const formData = new FormData();
      formData.append("image", file);
      try {
        const res  = await authFetch(`${API_URL}/api/admin/products/upload-image`, { method: "POST", body: formData });
        const data = await res.json();
        if (data.image_url) uploaded.push(data.image_url);
        else alert("One image failed: " + (data.error || "Unknown error"));
      } catch { alert("Upload failed for one image. Please retry."); }
    }
    setForm(prev => ({ ...prev, images: [...prev.images, ...uploaded] }));
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeImage = (idx) => setForm(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== idx) }));

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    const url    = modal === "add" ? `${API_URL}/api/admin/products` : `${API_URL}/api/admin/products/${editId}`;
    const method = modal === "add" ? "POST" : "PUT";
    await authFetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        image:      form.images.join(","),
        stock:      Number(form.stock),
        price_250g: Number(form.price_250g) || 0,
        price_500g: Number(form.price_500g) || 0,
        price_1kg:  Number(form.price_1kg)  || 0,
      }),
    });
    setSaving(false);
    setModal(null);
    load();
  };

  const remove = async (id) => {
    if (!window.confirm("Delete this product?")) return;
    await authFetch(`${API_URL}/api/admin/products/${id}`, { method: "DELETE" });
    load();
  };

  if (loading) return <div className="page-loader"><div className="spinner"></div><p>Loading products…</p></div>;

  return (
    <div className="admin-page">
      <div className="admin-header">
        <div><h1>Products</h1><p>{products.length} items in store</p></div>
        <button className="btn-add-product" onClick={openAdd}>+ Add Product</button>
      </div>

      <div className="admin-card">
        <div className="table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th><th>Image</th><th>Name</th>
                <th>250g</th><th>500g</th><th>1kg</th>
                <th>Stock</th><th>Status</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map(p => (
                <tr key={p.id}>
                  <td>#{p.id}</td>
                  <td><ThumbCarousel images={parseImages(p.image)} /></td>
                  <td className="td-name">{p.name}</td>
                  <td className="td-price">{p.price_250g ? `₹${p.price_250g}` : "—"}</td>
                  <td className="td-price">{p.price_500g ? `₹${p.price_500g}` : "—"}</td>
                  <td className="td-price">{p.price_1kg  ? `₹${p.price_1kg}`  : "—"}</td>
                  <td>{p.stock}</td>
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
                <tr><td colSpan="9" style={{ textAlign: "center", padding: "40px", color: "#888" }}>No products yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modal && (
        <div className="modal-backdrop" onClick={() => setModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>{modal === "add" ? "Add Product" : "Edit Product"}</h2>
            <form onSubmit={save} className="modal-form">

              {/* ── Images ── */}
              <div className="form-group">
                <label>Product Images <span className="optional">— upload multiple, they will auto-slide</span></label>
                {form.images.length > 0 && (
                  <div className="multi-image-preview-wrap">
                    {form.images.map((img, i) => (
                      <div key={i} className="multi-image-item">
                        <img
                          src={getImageSrc(img)}
                          alt={`img-${i}`}
                          className="multi-image-thumb"
                          onError={(e) => { e.target.style.display = "none"; }}
                        />
                        <button type="button" className="btn-remove-image" onClick={() => removeImage(i)}>✕</button>
                        {i === 0 && <span className="img-badge-main">Main</span>}
                      </div>
                    ))}
                  </div>
                )}
                <div className="image-upload-box" onClick={() => !uploading && fileInputRef.current?.click()}>
                  {uploading
                    ? <><div className="spinner small"></div><span>Uploading…</span></>
                    : <><span className="upload-icon">📷</span><span>{form.images.length > 0 ? "Add More Images" : "Click to Upload Images"}</span><small>PNG, JPG, JPEG, WEBP</small></>
                  }
                </div>
                <input ref={fileInputRef} type="file" accept="image/png,image/jpg,image/jpeg,image/gif,image/webp" multiple onChange={handleImageUpload} style={{ display: "none" }} />
              </div>

              {/* ── Name ── */}
              <div className="form-group">
                <label>Product Name</label>
                <input name="name" value={form.name} onChange={handle} required />
              </div>

              {/* ── 3 Prices ── */}
              <div className="form-group">
                <label>Prices by Weight <span className="optional">(leave 0 to hide that option)</span></label>
                <div className="form-row">
                  <div className="form-group">
                    <label className="sub-label">250g Price (₹)</label>
                    <input name="price_250g" type="number" value={form.price_250g} onChange={handle} placeholder="e.g. 120" />
                  </div>
                  <div className="form-group">
                    <label className="sub-label">500g Price (₹)</label>
                    <input name="price_500g" type="number" value={form.price_500g} onChange={handle} placeholder="e.g. 220" />
                  </div>
                  <div className="form-group">
                    <label className="sub-label">1kg Price (₹)</label>
                    <input name="price_1kg" type="number" value={form.price_1kg} onChange={handle} placeholder="e.g. 400" />
                  </div>
                </div>
              </div>

              {/* ── Stock ── */}
              <div className="form-row">
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

              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setModal(null)}>Cancel</button>
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