import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "./AuthContext";
import "./ProductDetail.css";

const API_URL = "https://nature-mart-project.onrender.com";

const parseImages = (image) => {
  if (!image) return [];
  if (Array.isArray(image)) return image.filter(Boolean);
  return image.split(",").map(s => s.trim()).filter(Boolean);
};

const getImageSrc = (image) => {
  if (!image) return null;
  if (image.startsWith("http")) return image;
  if (image.startsWith("/")) return `${API_URL}${image}`;
  return `${API_URL}/images/${image}`;
};

export default function ProductDetail({ onAddToCart, addedIds }) {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mainImg, setMainImg] = useState(0);
  const [selected, setSelected] = useState(null);
  const [added, setAdded] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 0, y: 0 });
  const [zooming, setZooming] = useState(false);

  useEffect(() => {
    fetch(`${API_URL}/api/products`)
      .then(r => r.json())
      .then(data => {
        const found = Array.isArray(data) ? data.find(p => String(p.id) === String(id)) : null;
        setProduct(found || null);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!product) return;
    const opts = [
      { label: "250g", price: product.price_250g },
      { label: "500g", price: product.price_500g },
      { label: "1kg",  price: product.price_1kg  },
    ].filter(o => o.price > 0);
    setSelected(opts[0] || null);
  }, [product]);

  const handleAddToCart = () => {
    if (!selected) return;
    onAddToCart(product.id, selected.label, selected.price);
    setAdded(true);
    setTimeout(() => setAdded(false), 2500);
  };

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomPos({ x, y });
  };

  if (loading) return (
    <div className="pd-loader">
      <div className="pd-spinner"></div>
      <p>Loading product…</p>
    </div>
  );

  if (!product) return (
    <div className="pd-notfound">
      <div className="pd-notfound-icon">🌿</div>
      <h2>Product not found</h2>
      <Link to="/" className="pd-back-btn">← Back to Home</Link>
    </div>
  );

  const images = parseImages(product.image);
  const weightOptions = [
    { label: "250g", price: product.price_250g },
    { label: "500g", price: product.price_500g },
    { label: "1kg",  price: product.price_1kg  },
  ].filter(o => o.price > 0);

  const displayPrice = selected?.price || 0;
  const isAdded = added || addedIds?.includes(product.id);

  // Delivery date (5 days from now)
  const deliveryDate = new Date();
  deliveryDate.setDate(deliveryDate.getDate() + 5);
  const deliveryStr = deliveryDate.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" });

  return (
    <div className="pd-page">
      {/* Breadcrumb */}
      <div className="pd-breadcrumb">
        <Link to="/">Home</Link>
        <span className="pd-bc-sep">›</span>
        <Link to="/">Products</Link>
        <span className="pd-bc-sep">›</span>
        <span>{product.name}</span>
      </div>

      <div className="pd-layout">

        {/* ── LEFT: Image Gallery ── */}
        <div className="pd-gallery">
          {/* Thumbnail strip */}
          <div className="pd-thumbs">
            {images.length > 0 ? images.map((img, i) => (
              <button
                key={i}
                className={`pd-thumb ${i === mainImg ? "pd-thumb-active" : ""}`}
                onClick={() => setMainImg(i)}
              >
                <img src={getImageSrc(img)} alt={`${product.name} ${i + 1}`} />
              </button>
            )) : (
              <div className="pd-thumb pd-thumb-active">
                <span>🌿</span>
              </div>
            )}
          </div>

          {/* Main image with zoom */}
          <div
            className="pd-main-img-wrap"
            onMouseEnter={() => setZooming(true)}
            onMouseLeave={() => setZooming(false)}
            onMouseMove={handleMouseMove}
          >
            {images.length > 0 ? (
              <img
                src={getImageSrc(images[mainImg])}
                alt={product.name}
                className="pd-main-img"
                style={zooming ? {
                  transformOrigin: `${zoomPos.x}% ${zoomPos.y}%`,
                  transform: "scale(2)",
                } : {}}
              />
            ) : (
              <div className="pd-main-img-placeholder">🌿</div>
            )}
            <div className="pd-natural-tag">🌿 100% Natural</div>
            {zooming && <div className="pd-zoom-hint">🔍 Zooming</div>}
          </div>
        </div>

        {/* ── RIGHT: Product Info ── */}
        <div className="pd-info">

          {/* Trust badges */}
          <div className="pd-trust-row">
            <span className="pd-trust-badge">✅ FSSAI Certified</span>
            <span className="pd-trust-badge">🌿 No Preservatives</span>
            {product.stock > 0
              ? <span className="pd-trust-badge pd-instock">✔ In Stock</span>
              : <span className="pd-trust-badge pd-outstock">✖ Out of Stock</span>
            }
          </div>

          {/* Name */}
          <h1 className="pd-name">{product.name}</h1>

          {/* Rating row */}
          <div className="pd-rating-row">
            <div className="pd-stars">
              {"★★★★★".split("").map((s, i) => (
                <span key={i} className={`pd-star ${i < 4 ? "pd-star-filled" : "pd-star-empty"}`}>{s}</span>
              ))}
            </div>
            <span className="pd-rating-val">4.0</span>
            <span className="pd-rating-sep">|</span>
            <span className="pd-rating-count">Farm Verified</span>
          </div>

          <div className="pd-divider"></div>

          {/* Price */}
          <div className="pd-price-section">
            <div className="pd-price">₹{displayPrice}</div>
            {selected && (
              <div className="pd-price-per">
                per {selected.label} pack
              </div>
            )}
            <div className="pd-free-delivery">🚚 Free delivery on all orders</div>
          </div>

          {/* Weight selector */}
          {weightOptions.length > 0 && (
            <div className="pd-weight-section">
              <p className="pd-weight-label">Pack Size:</p>
              <div className="pd-weight-options">
                {weightOptions.map(opt => (
                  <button
                    key={opt.label}
                    className={`pd-weight-btn ${selected?.label === opt.label ? "pd-weight-active" : ""}`}
                    onClick={() => setSelected(opt)}
                  >
                    <span className="pd-weight-size">{opt.label}</span>
                    <span className="pd-weight-price">₹{opt.price}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Delivery info */}
          <div className="pd-delivery-box">
            <div className="pd-delivery-row">
              <span className="pd-delivery-icon">🚚</span>
              <div>
                <span className="pd-delivery-label">Delivery by </span>
                <span className="pd-delivery-date">{deliveryStr}</span>
              </div>
            </div>
            <div className="pd-delivery-row">
              <span className="pd-delivery-icon">📦</span>
              <div>
                <span className="pd-delivery-label">Stock available: </span>
                <span className="pd-delivery-date">{product.stock} units</span>
              </div>
            </div>
            <div className="pd-delivery-row">
              <span className="pd-delivery-icon">↩️</span>
              <div>
                <span className="pd-delivery-label">7-day easy return & replacement</span>
              </div>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="pd-cta-row">
            {user ? (
              <>
                <button
                  className={`pd-btn-cart ${isAdded ? "pd-btn-added" : ""}`}
                  onClick={handleAddToCart}
                  disabled={isAdded || product.stock === 0}
                >
                  {isAdded ? "✓ Added to Cart" : "🛒 Add to Cart"}
                </button>
                <button
                  className="pd-btn-buy"
                  onClick={() => { handleAddToCart(); navigate("/cart"); }}
                  disabled={product.stock === 0}
                >
                  ⚡ Buy Now
                </button>
              </>
            ) : (
              <Link to="/login" className="pd-btn-cart">Login to Buy</Link>
            )}
          </div>

          {/* Offers */}
          <div className="pd-offers-box">
            <p className="pd-offers-title">🏷️ Available Offers</p>
            <ul className="pd-offers-list">
              <li>🎉 <strong>Free Shipping</strong> on all orders across India</li>
              <li>💳 <strong>Pay on Delivery</strong> available on eligible orders</li>
              <li>🌿 <strong>Farm Fresh</strong> — directly sourced, no middlemen</li>
            </ul>
          </div>
        </div>

        {/* ── FAR RIGHT: Seller Info ── */}
        <div className="pd-sidebar">
          <div className="pd-seller-card">
            <p className="pd-seller-title">Sold & fulfilled by</p>
            <p className="pd-seller-name">🌿 Nature Mart Foods</p>
            <p className="pd-seller-loc">📍 Surat, Gujarat</p>
            <div className="pd-seller-divider"></div>
            <div className="pd-seller-stat">
              <span>✅ FSSAI</span>
              <span className="pd-seller-stat-val">20726031002567</span>
            </div>
            <div className="pd-seller-stat">
              <span>🏛️ GST</span>
              <span className="pd-seller-stat-val">24ATQPG4926Q1Z0</span>
            </div>
            <div className="pd-seller-divider"></div>
            <div className="pd-secure-pay">
              🔒 <span>100% Secure Payments</span>
            </div>
          </div>

          <div className="pd-why-card">
            <p className="pd-why-title">Why Nature Mart Foods?</p>
            <ul className="pd-why-list">
              <li>🌱 No additives or preservatives</li>
              <li>🏆 Quality tested & certified</li>
              <li>🚚 Pan India delivery in 2–5 days</li>
              <li>💚 Eco-friendly packaging</li>
            </ul>
          </div>
        </div>
      </div>

      {/* ── Bottom: Product Details ── */}
      <div className="pd-bottom">
        <div className="pd-desc-card">
          <h2 className="pd-section-title">Product Description</h2>
          <p className="pd-desc-text">{product.description || "No description available."}</p>
        </div>

        <div className="pd-specs-card">
          <h2 className="pd-section-title">Product Details</h2>
          <table className="pd-specs-table">
            <tbody>
              <tr><td>Product Name</td><td>{product.name}</td></tr>
              <tr><td>Brand</td><td>Nature Mart Foods</td></tr>
              <tr><td>Type</td><td>Natural / Organic Food</td></tr>
              {product.price_250g > 0 && <tr><td>250g Pack Price</td><td>₹{product.price_250g}</td></tr>}
              {product.price_500g > 0 && <tr><td>500g Pack Price</td><td>₹{product.price_500g}</td></tr>}
              {product.price_1kg  > 0 && <tr><td>1kg Pack Price</td><td>₹{product.price_1kg}</td></tr>}
              <tr><td>Storage</td><td>Store in a cool, dry place</td></tr>
              <tr><td>Shelf Life</td><td>6 months from packaging</td></tr>
              <tr><td>Country of Origin</td><td>India</td></tr>
              <tr><td>FSSAI License</td><td>20726031002567</td></tr>
              <tr><td>Manufacturer</td><td>Nature Mart Foods, Surat, Gujarat</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}