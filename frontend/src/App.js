
import { BrowserRouter as Router, Routes, Route, Link, useLocation, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth } from "./AuthContext";
import Cart from "./Cart";
import Orders from "./Orders";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import Profile from "./pages/Profile";
import AdminLayout from "./pages/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminProducts from "./pages/admin/AdminProducts";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminUsers from "./pages/admin/AdminUsers";
import Checkout from "./pages/Checkout";
import PrivacyPolicy   from "./pages/PrivacyPolicy";
import TermsConditions from "./pages/TermsConditions";
import RefundPolicy    from "./pages/RefundPolicy";
import ShippingPolicy  from "./pages/ShippingPolicy";

import "./App.css";

const API_URL = "https://nature-mart-project.onrender.com";

// ── Image helpers ─────────────────────────────────────────────
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

// ── Protected route wrappers ─────────────────────────────────
function RequireAuth({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? children : <Navigate to="/login" replace />;
}

function RequireAdmin({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user)                 return <Navigate to="/login" replace />;
  if (user.role !== "admin") return <Navigate to="/" replace />;
  return children;
}

// ── Navbar ───────────────────────────────────────────────────
function NavBar({ cartCount }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const isAdmin = location.pathname.startsWith("/admin");
  if (isAdmin) return null;

  const closeMenu = () => setMenuOpen(false);
  const handleLogout = () => { closeMenu(); logout(); };

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand" onClick={closeMenu}>
        <img src={`${API_URL}/images/logo.jpg`} alt="Nature Mart" className="brand-logo-img" />
        <span className="brand-name">Nature Mart Foods</span>
      </Link>

      <div className="navbar-links">
        <Link to="/" className={`nav-link ${location.pathname === "/" ? "active" : ""}`}>
          <span className="nav-icon">⌂</span> Home
        </Link>
        {user ? (
          <>
            <Link to="/cart" className={`nav-link ${location.pathname === "/cart" ? "active" : ""}`}>
              <span className="nav-icon">⊕</span> Cart
              {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
            </Link>
            <Link to="/orders" className={`nav-link ${location.pathname === "/orders" ? "active" : ""}`}>
              <span className="nav-icon">◈</span> Orders
            </Link>
            <Link to="/profile" className={`nav-link ${location.pathname === "/profile" ? "active" : ""}`}>
              <span className="nav-icon">👤</span>
              <span className="nav-username">{user.name.split(" ")[0]}</span>
            </Link>
            {user.role === "admin" && (
              <Link to="/admin" className="nav-link nav-admin">⚙ Admin</Link>
            )}
            <div className="nav-divider"></div>
            <button className="nav-logout" onClick={handleLogout}>
              <svg className="logout-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
              Sign out
            </button>
          </>
        ) : (
          <>
            <Link to="/login"    className={`nav-link ${location.pathname === "/login" ? "active" : ""}`}>Login</Link>
            <Link to="/register" className="nav-link nav-cta">Register</Link>
          </>
        )}
      </div>

      <button className="nav-hamburger" onClick={() => setMenuOpen(o => !o)} aria-label="Toggle menu">
        <span className={`ham-line ${menuOpen ? "open" : ""}`}></span>
        <span className={`ham-line ${menuOpen ? "open" : ""}`}></span>
        <span className={`ham-line ${menuOpen ? "open" : ""}`}></span>
      </button>

      {menuOpen && (
        <div className="mobile-menu">
          <Link to="/" className="mobile-link" onClick={closeMenu}>⌂ Home</Link>
          {user ? (
            <>
              <Link to="/cart" className="mobile-link" onClick={closeMenu}>
                ⊕ Cart {cartCount > 0 && <span className="mobile-cart-badge">{cartCount}</span>}
              </Link>
              <Link to="/orders"  className="mobile-link" onClick={closeMenu}>◈ Orders</Link>
              <Link to="/profile" className="mobile-link" onClick={closeMenu}>👤 {user.name.split(" ")[0]}</Link>
              {user.role === "admin" && (
                <Link to="/admin" className="mobile-link mobile-admin" onClick={closeMenu}>⚙ Admin</Link>
              )}
              <button className="mobile-logout" onClick={handleLogout}>→ Sign out</button>
            </>
          ) : (
            <>
              <Link to="/login"    className="mobile-link" onClick={closeMenu}>Login</Link>
              <Link to="/register" className="mobile-link mobile-cta" onClick={closeMenu}>Register</Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}

// ── Image Carousel ────────────────────────────────────────────
function ImageCarousel({ images, alt }) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (images.length <= 1) return;
    const timer = setInterval(() => {
      setCurrent(prev => (prev + 1) % images.length);
    }, 3000);
    return () => clearInterval(timer);
  }, [images.length]);

  if (!images.length) {
    return (
      <div className="card-img-wrap">
        <div className="card-img-placeholder">🌿</div>
        <div className="card-img-overlay"><span className="tag-natural">🌿 Natural</span></div>
      </div>
    );
  }

  if (images.length === 1) {
    return (
      <div className="card-img-wrap">
        <img src={getImageSrc(images[0])} alt={alt} />
        <div className="card-img-overlay"><span className="tag-natural">🌿 Natural</span></div>
      </div>
    );
  }

  return (
    <div className="card-img-wrap carousel-wrap">
      {images.map((img, i) => (
        <img
          key={i}
          src={getImageSrc(img)}
          alt={`${alt} ${i + 1}`}
          className={`carousel-slide ${i === current ? "carousel-active" : ""}`}
        />
      ))}
      <button className="carousel-btn carousel-prev"
        onClick={(e) => { e.stopPropagation(); setCurrent(prev => (prev - 1 + images.length) % images.length); }}
      >&#8249;</button>
      <button className="carousel-btn carousel-next"
        onClick={(e) => { e.stopPropagation(); setCurrent(prev => (prev + 1) % images.length); }}
      >&#8250;</button>
      <div className="carousel-dots">
        {images.map((_, i) => (
          <span key={i}
            className={`carousel-dot ${i === current ? "carousel-dot-active" : ""}`}
            onClick={(e) => { e.stopPropagation(); setCurrent(i); }}
          />
        ))}
      </div>
      <div className="card-img-overlay"><span className="tag-natural">🌿 Natural</span></div>
    </div>
  );
}

// ── Product card ─────────────────────────────────────────────
function ProductCard({ product, onAddToCart, added }) {
  const { user } = useAuth();
  const images = parseImages(product.image);

  // Build available weight options — only show options where price > 0
  const weightOptions = [
    { label: "250g", price: product.price_250g },
    { label: "500g", price: product.price_500g },
    { label: "1kg",  price: product.price_1kg  },
  ].filter(opt => opt.price > 0);

  // Default to first available option
  const [selected, setSelected] = useState(weightOptions[0] || null);

  // Update selected if product changes
  useEffect(() => {
    const opts = [
      { label: "250g", price: product.price_250g },
      { label: "500g", price: product.price_500g },
      { label: "1kg",  price: product.price_1kg  },
    ].filter(opt => opt.price > 0);
    setSelected(opts[0] || null);
  }, [product.id]);

  const displayPrice = selected ? selected.price : product.price;

  return (
    <div className={`card ${added ? "card-added" : ""}`}>
      <ImageCarousel images={images} alt={product.name} />
      <div className="card-body">
        <h2 className="card-name">{product.name}</h2>
        <p className="card-desc">{product.description}</p>

        {/* ── Weight selector ── */}
        {weightOptions.length > 0 && (
          <div className="weight-selector">
            {weightOptions.map(opt => (
              <button
                key={opt.label}
                className={`weight-btn ${selected?.label === opt.label ? "weight-btn-active" : ""}`}
                onClick={() => setSelected(opt)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}

        <div className="card-footer">
          <span className="card-price">₹{displayPrice}</span>
          {user ? (
            <button
              className={`btn-add ${added ? "btn-added" : ""}`}
              onClick={() => onAddToCart(product.id, selected?.label, displayPrice)}
            >
              {added ? "✓ Added" : "+ Add to Cart"}
            </button>
          ) : (
            <Link to="/login" className="btn-add">Login to Buy</Link>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Home page ────────────────────────────────────────────────
function Home({ products, onAddToCart, addedIds }) {
  return (
    <main>
      <div className="hero">
        <div className="hero-content">
          <p className="hero-sub">Pure · Natural · Healthy</p>
          <h3 className="hero-title">From our farm to your kitchen<br /></h3>
          <p className="hero-desc">Handpicked superfoods delivered straight to your door.</p>
          <div className="hero-badges">
            <span className="hero-badge">✅ FSSAI Certified</span>
            <span className="hero-badge">🌿 No additives. No preservatives.</span>
            <span className="hero-badge">🚚 Bringing farm-fresh goodness to every corner of India.</span>
          </div>
        </div>
        <div className="hero-accent"></div>
        <div className="hero-circle hero-circle-1"></div>
        <div className="hero-circle hero-circle-2"></div>
      </div>

      <section className="products-section">
        <div className="section-header">
          <h2 className="section-title">Our Products</h2>
          <p className="section-sub">Handpicked from nature, delivered to you</p>
        </div>
        <div className="grid">
          {products.length === 0 ? (
            <div className="empty-state">
              <div className="spinner"></div>
              <p>Loading products…</p>
            </div>
          ) : (
            products.map(product => (
              <ProductCard
                key={product.id}
                product={product}
                onAddToCart={onAddToCart}
                added={addedIds.includes(product.id)}
              />
            ))
          )}
        </div>
      </section>

      <section className="why-section">
        <h2 className="section-title" style={{ textAlign: "center", marginBottom: "8px" }}>Why Nature Mart?</h2>
        <p className="section-sub" style={{ textAlign: "center", marginBottom: "40px" }}>We care about what goes into your body</p>
        <div className="why-grid">
          <div className="why-card"><div className="why-icon">🌱</div><h3 className="why-title">Natural</h3><p className="why-desc">Fresh from our farms to your kitchen — naturally processed, carefully selected.</p></div>
          <div className="why-card"><div className="why-icon">🏆</div><h3 className="why-title">FSSAI Certified</h3><p className="why-desc">All products are certified and quality-tested for your safety.</p></div>
          <div className="why-card"><div className="why-icon">🚚</div><h3 className="why-title">Fast Delivery</h3><p className="why-desc">Pan India delivery in 2–5 business days, right to your door.</p></div>
          <div className="why-card"><div className="why-icon">💚</div><h3 className="why-title">Eco Packaging</h3><p className="why-desc">Sustainably packaged to protect both your food and our planet.</p></div>
        </div>
      </section>
    </main>
  );
}

// ── App content ───────────────────────────────────────────────
function AppContent() {
  const { user, authFetch, loading } = useAuth();
  const [products, setProducts]   = useState([]);
  const [addedIds, setAddedIds]   = useState([]);
  const [cartCount, setCartCount] = useState(0);

  const fetchCartCount = async () => {
    if (!user) { setCartCount(0); return; }
    try {
      const res = await authFetch(`${API_URL}/api/cart`);
      if (!res.ok) return;
      const data = await res.json();
      setCartCount(data.items?.length || 0);
    } catch (err) { console.error("Cart count error:", err); }
  };

  // weight and price passed from ProductCard so cart stores correct variant
  const addToCart = async (id, weight, price) => {
    try {
      const res = await authFetch(`${API_URL}/api/cart`, {
        method: "POST",
        body: JSON.stringify({ product_id: id, weight, price }),
      });
      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "Failed to add to cart. Please try again.");
        return;
      }
      setAddedIds(prev => [...prev, id]);
      fetchCartCount();
      setTimeout(() => setAddedIds(prev => prev.filter(i => i !== id)), 2000);
    } catch (err) {
      alert("Network error. Please check your connection.");
    }
  };

  useEffect(() => {
    if (loading) return;
    fetch(`${API_URL}/api/products`)
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then(data => setProducts(Array.isArray(data) ? data : []))
      .catch(() => setProducts([]));
    fetchCartCount();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, loading]);

  return (
    <div className="app">
      <NavBar cartCount={cartCount} />
      <div className="page-content">
        <Routes>
          <Route path="/"         element={<Home products={products} onAddToCart={addToCart} addedIds={addedIds} />} />
          <Route path="/login"    element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/cart"     element={<RequireAuth><Cart updateCartCount={fetchCartCount} onOrderPlaced={fetchCartCount} /></RequireAuth>} />
          <Route path="/orders"   element={<RequireAuth><Orders /></RequireAuth>} />
          <Route path="/profile"  element={<RequireAuth><Profile /></RequireAuth>} />
          <Route path="/checkout" element={<RequireAuth><Checkout onOrderPlaced={fetchCartCount} /></RequireAuth>} />
          <Route path="/admin" element={<RequireAdmin><AdminLayout /></RequireAdmin>}>
            <Route index           element={<AdminDashboard />} />
            <Route path="products" element={<AdminProducts />} />
            <Route path="orders"   element={<AdminOrders />} />
            <Route path="users"    element={<AdminUsers />} />
          </Route>
          <Route path="/privacy"  element={<PrivacyPolicy />} />
          <Route path="/terms"    element={<TermsConditions />} />
          <Route path="/refund"   element={<RefundPolicy />} />
          <Route path="/shipping" element={<ShippingPolicy />} />
        </Routes>
      </div>

      <footer className="footer">
        <div className="footer-main">
          <div className="footer-brand-col">
            <div className="footer-brand">
              <img src={`${API_URL}/images/logo.jpg`} alt="Nature Mart" className="footer-logo-img" />
              <span className="footer-brand-name">Nature Mart Foods</span>
            </div>
            <p className="footer-tagline">Pure · Healthy · Natural superfoods delivered straight to your door.</p>
            <div className="footer-badges">
              <div className="footer-badge">
                <span className="badge-icon">✅</span>
                <div><div className="badge-label">FSSAI Registered</div><div className="badge-value">20726031002567</div></div>
              </div>
              <div className="footer-badge">
                <span className="badge-icon">🏛️</span>
                <div><div className="badge-label">GST Number</div><div className="badge-value">24ATQPG4926Q1Z0</div></div>
              </div>
            </div>
          </div>
          <div className="footer-col">
            <h4 className="footer-col-title">Quick Links</h4>
            <ul className="footer-links">
              <li><Link to="/">🏠 Home</Link></li>
              <li><Link to="/cart">🛒 Cart</Link></li>
              <li><Link to="/orders">📦 My Orders</Link></li>
              <li><Link to="/profile">👤 My Profile</Link></li>
            </ul>
          </div>
          <div className="footer-col">
            <h4 className="footer-col-title">Policies</h4>
            <ul className="footer-links">
              <li><Link to="/privacy">🔒 Privacy Policy</Link></li>
              <li><Link to="/terms">📄 Terms &amp; Conditions</Link></li>
              <li><Link to="/refund">↩️ Refund Policy</Link></li>
              <li><Link to="/shipping">🚚 Shipping Policy</Link></li>
            </ul>
          </div>
          <div className="footer-col">
            <h4 className="footer-col-title">Contact Us</h4>
            <ul className="footer-contact">
              <li><span>📍</span><span>Plot No. 514, Five Square Point,<br /> Opp Anjani Green Party Plot,<br />Jahangirpura, Surat - 395005, Gujarat</span></li>
              <li><span>📧</span><a href="mailto:naturemartfoods@gmail.com">naturemartfoods@gmail.com</a></li>
              <li><span>🕐</span><span>Mon–Sat: 9:00 AM – 6:00 PM</span></li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <p>© {new Date().getFullYear()} Nature Mart Foods. All rights reserved. | Proprietor: Gavli Ashvinkumar Shyamrao</p>
          <div className="footer-trust">
            <span>🔒 Secure Payments</span>
            <span>🌿 No additives. No preservatives.</span>
            <span>🚚 Bringing farm-fresh goodness to every corner of India.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}