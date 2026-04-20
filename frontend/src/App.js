// import { BrowserRouter as Router, Routes, Route, Link, useLocation, Navigate } from "react-router-dom";
// import { useEffect, useState } from "react";
// import { useAuth } from "./AuthContext";
// import Cart from "./Cart";
// import Orders from "./Orders";
// import Login from "./pages/auth/Login";
// import Register from "./pages/auth/Register";
// import Profile from "./pages/Profile";
// import AdminLayout from "./pages/admin/AdminLayout";
// import AdminDashboard from "./pages/admin/AdminDashboard";
// import AdminProducts from "./pages/admin/AdminProducts";
// import AdminOrders from "./pages/admin/AdminOrders";
// import AdminUsers from "./pages/admin/AdminUsers";
// import Checkout from "./pages/Checkout";
// import PrivacyPolicy    from "./pages/PrivacyPolicy";
// import TermsConditions  from "./pages/TermsConditions";
// import RefundPolicy     from "./pages/RefundPolicy";
// import ShippingPolicy   from "./pages/ShippingPolicy";

// import "./App.css";

// const API_URL = "https://nature-mart-project.onrender.com";

// // ── Protected route wrapper ──────────────────────────────────
// function RequireAuth({ children }) {
//   const { user, loading } = useAuth();
//   if (loading) return null;
//   return user ? children : <Navigate to="/login" replace />;
// }

// function RequireAdmin({ children }) {
//   const { user, loading } = useAuth();
//   if (loading) return null;
//   if (!user)                 return <Navigate to="/login" replace />;
//   if (user.role !== "admin") return <Navigate to="/" replace />;
//   return children;
// }

// // ── Navbar ───────────────────────────────────────────────────
// function NavBar({ cartCount }) {
//   const { user, logout } = useAuth();
//   const location = useLocation();
//   const isAdmin  = location.pathname.startsWith("/admin");
//   if (isAdmin) return null;

//   return (
//     <nav className="navbar">
//       <div className="navbar-brand">
//         <span className="brand-leaf">🌿</span>
//         <span className="brand-name">Nature Mart</span>
//       </div>
//       <div className="navbar-links">
//         <Link to="/" className={`nav-link ${location.pathname === "/" ? "active" : ""}`}>
//           <span className="nav-icon">⌂</span> Home
//         </Link>

//         {user ? (
//           <>
//             <Link to="/cart" className={`nav-link ${location.pathname === "/cart" ? "active" : ""}`}>
//               <span className="nav-icon">⊕</span> Cart
//               {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
//             </Link>
//             <Link to="/orders" className={`nav-link ${location.pathname === "/orders" ? "active" : ""}`}>
//               <span className="nav-icon">◈</span> Orders
//             </Link>
//             <Link to="/profile" className={`nav-link ${location.pathname === "/profile" ? "active" : ""}`}>
//               <span className="nav-icon">👤</span> {user.name.split(" ")[0]}
//             </Link>
//             {user.role === "admin" && (
//               <Link to="/admin" className="nav-link nav-admin">
//                 ⚙ Admin
//               </Link>
//             )}
//             <button className="nav-logout" onClick={logout}>Sign out</button>
//           </>
//         ) : (
//           <>
//             <Link to="/login"    className={`nav-link ${location.pathname === "/login"    ? "active" : ""}`}>Login</Link>
//             <Link to="/register" className="nav-link nav-cta">Register</Link>
//           </>
//         )}
//       </div>
//     </nav>
//   );
// }

// // ── Product card ─────────────────────────────────────────────
// function ProductCard({ product, onAddToCart, added }) {
//   const { user } = useAuth();
//   return (
//     <div className={`card ${added ? "card-added" : ""}`}>
//       <div className="card-img-wrap">
//         <img
//           src={
//               product.image?.startsWith("http")
//                 ? product.image                          // if full URL → use as-is
//                 : `${API_URL}/images/${product.image}`   // if filename → build URL
//           }
//           alt={product.name}
//           // onError={(e) => (e.target.src = "/placeholder.png")}
//         />
//         <div className="card-img-overlay">
//           <span className="tag-natural">Natural</span>
//         </div>
//       </div>
//       <div className="card-body">
//         <h2 className="card-name">{product.name}</h2>
//         <p className="card-weight">{product.weight}</p>
//         <p className="card-desc">{product.description}</p>
//         <div className="card-footer">
//           <span className="card-price">₹{product.price}</span>
//           {user ? (
//             <button
//               className={`btn-add ${added ? "btn-added" : ""}`}
//               onClick={() => onAddToCart(product.id)}
//             >
//               {added ? "✓ Added" : "+ Add to Cart"}
//             </button>
//           ) : (
//             <Link to="/login" className="btn-add">Login to Buy</Link>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// }

// // ── Home page ────────────────────────────────────────────────
// function Home({ products, onAddToCart, addedIds }) {
//   return (
//     <main>
//       <div className="hero">
//         <div className="hero-text">
//           <p className="hero-sub">Pure · Organic · Natural</p>
//           <h1 className="hero-title">Good things<br />from the earth.</h1>
//           <p className="hero-desc">Handpicked superfoods delivered straight to your door.</p>
//         </div>
//         <div className="hero-accent"></div>
//       </div>
//       <section className="products-section">
//         <h2 className="section-title">Our Products</h2>
//         <div className="grid">
//           {products.length === 0 ? (
//             <div className="empty-state">
//               <div className="spinner"></div>
//               <p>Loading products…</p>
//             </div>
//           ) : (
//             products.map(product => (
//               <ProductCard
//                 key={product.id}
//                 product={product}
//                 onAddToCart={onAddToCart}
//                 added={addedIds.includes(product.id)}
//               />
//             ))
//           )}
//         </div>
//       </section>
//     </main>
//   );
// }

// // ── App content ───────────────────────────────────────────────
// function AppContent() {
//   const { user, authFetch, loading } = useAuth(); // ✅ FIX: destructure `loading`
//   const [products, setProducts]   = useState([]);
//   const [addedIds, setAddedIds]   = useState([]);
//   const [cartCount, setCartCount] = useState(0);

//   const fetchCartCount = async () => {
//     if (!user) { setCartCount(0); return; }
//     try {
//       const res = await authFetch(`${API_URL}/api/cart`);
//       if (!res.ok) { console.error("Cart count fetch failed:", res.status); return; }
//       const data = await res.json();
//       setCartCount(data.items?.length || 0);
//     } catch (err) {
//       console.error("Cart count error:", err);
//     }
//   };

//   const addToCart = async (id) => {
//     try {
//       const res = await authFetch(`${API_URL}/api/cart`, {
//         method: "POST",
//         body: JSON.stringify({ product_id: id }),
//       });

//       if (!res.ok) {
//         const err = await res.json();
//         console.error("Add to cart failed:", res.status, err);
//         alert(err.error || "Failed to add to cart. Please try again.");
//         return;
//       }

//       setAddedIds(prev => [...prev, id]);
//       fetchCartCount();
//       setTimeout(() => setAddedIds(prev => prev.filter(i => i !== id)), 2000);
//     } catch (err) {
//       console.error("Add to cart exception:", err);
//       alert("Network error. Please check your connection.");
//     }
//   };

//   useEffect(() => {
//     // ✅ FIX: Wait until auth is fully resolved before doing anything
//     if (loading) return;

//     fetch(`${API_URL}/api/products`)
//       .then(r => {
//         if (!r.ok) throw new Error(`Server error: ${r.status}`);
//         return r.json();
//       })
//       .then(data => {
//         if (!Array.isArray(data)) {
//           console.error("❌ Products API returned non-array:", data);
//           setProducts([]);
//           return;
//         }
//         console.log("✅ Products loaded:", data.length);
//         setProducts(data);
//       })
//       .catch(err => {
//         console.error("Products fetch error:", err);
//         setProducts([]);
//       });

//     fetchCartCount(); // ✅ Only called after loading is false & user is known

//   // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [user, loading]); // ✅ FIX: added `loading` as dependency

//   return (
//     <div className="app">
//       <NavBar cartCount={cartCount} />
//       <div className="page-content">
//         <Routes>
//           {/* Public */}
//           <Route path="/"         element={<Home products={products} onAddToCart={addToCart} addedIds={addedIds} />} />
//           <Route path="/login"    element={<Login />} />
//           <Route path="/register" element={<Register />} />

//           {/* User protected */}
//           <Route
//             path="/cart"
//             element={
//               <RequireAuth>
//                 {/* ✅ FIX: Pass both props */}
//                 <Cart updateCartCount={fetchCartCount} onOrderPlaced={fetchCartCount} />
//               </RequireAuth>
//             }
//           />
//           <Route path="/orders"   element={<RequireAuth><Orders /></RequireAuth>} />
//           <Route path="/profile"  element={<RequireAuth><Profile /></RequireAuth>} />
//           <Route path="/checkout" element={<RequireAuth><Checkout onOrderPlaced={fetchCartCount} /></RequireAuth>} />

//           {/* Admin protected */}
//           <Route path="/admin" element={<RequireAdmin><AdminLayout /></RequireAdmin>}>
//             <Route index           element={<AdminDashboard />} />
//             <Route path="products" element={<AdminProducts />} />
//             <Route path="orders"   element={<AdminOrders />} />
//             <Route path="users"    element={<AdminUsers />} />
//           </Route>
//           {/* Policy pages */}
//           <Route path="/privacy"  element={<PrivacyPolicy />} />
//           <Route path="/terms"    element={<TermsConditions />} />
//           <Route path="/refund"   element={<RefundPolicy />} />
//           <Route path="/shipping" element={<ShippingPolicy />} />
//         </Routes>
//       </div>
//       <footer className="footer">
//         <div className="footer-main">
//           <div className="footer-brand-col">
//             <div className="footer-brand">
//               <span className="footer-leaf">🌿</span>
//               <span className="footer-brand-name">Nature Mart</span>
//             </div>
//             <p className="footer-tagline">Pure · Organic · Natural superfoods delivered straight to your door.</p>
//             <div className="footer-badges">
//               <div className="footer-badge">
//                 <span className="badge-icon">✅</span>
//                 <div>
//                   <div className="badge-label">FSSAI Registered</div>
//                   <div className="badge-value">20726031002567</div>
//                 </div>
//               </div>
//               <div className="footer-badge">
//                 <span className="badge-icon">🏛️</span>
//                 <div>
//                   <div className="badge-label">GST Number</div>
//                   <div className="badge-value">24ATQPG4926Q1Z0</div>
//                 </div>
//               </div>
//             </div>
//           </div>

//           <div className="footer-col">
//             <h4 className="footer-col-title">Quick Links</h4>
//             <ul className="footer-links">
//               <li><Link to="/">🏠 Home</Link></li>
//               <li><Link to="/cart">🛒 Cart</Link></li>
//               <li><Link to="/orders">📦 My Orders</Link></li>
//               <li><Link to="/profile">👤 My Profile</Link></li>
//             </ul>
//           </div>

//           <div className="footer-col">
//             <h4 className="footer-col-title">Policies</h4>
//             <ul className="footer-links">
//               <li><a href="/privacy">🔒 Privacy Policy</a></li>
//               <li><a href="/terms">📄 Terms & Conditions</a></li>
//               <li><a href="/refund">↩️ Refund Policy</a></li>
//               <li><a href="/shipping">🚚 Shipping Policy</a></li>
//             </ul>
//           </div>

//           <div className="footer-col">
//             <h4 className="footer-col-title">Contact Us</h4>
//             <ul className="footer-contact">
//               <li>
//                 <span>📍</span>
//                 <span>Plot No. 45, Nandanvan Society,<br />Behind Kanteshwar Temple,<br />Katargam, Surat - 395004, Gujarat</span>
//               </li>
//               <li>
//                 <span>📧</span>
//                 <a href="mailto:support@naturemart.in">support@naturemart.in</a>
//               </li>
//               <li>
//                 <span>🕐</span>
//                 <span>Mon–Sat: 9:00 AM – 6:00 PM</span>
//               </li>
//             </ul>
//           </div>
//         </div>

//         <div className="footer-bottom">
//           <p>© {new Date().getFullYear()} Nature Mart. All rights reserved. | Proprietor: Gavli Ashvinkumar Shyamrao</p>
//           <div className="footer-trust">
//             <span>🔒 Secure Payments</span>
//             <span>🌿 100% Organic</span>
//             <span>🚚 Pan India Delivery</span>
//           </div>
//         </div>
//       </footer>
//     </div>
//   );
// }



// export default function App() {
//   return (
//     <Router>
//       <AppContent />
//     </Router>
//   );
// }


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

  const handleLogout = () => {
    closeMenu();
    logout();
  };

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand" onClick={closeMenu}>
        <span className="brand-leaf">🌿</span>
        <span className="brand-name">Nature Mart</span>
      </Link>

      {/* Desktop links */}
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
              <Link to="/admin" className="nav-link nav-admin">
                ⚙ Admin
              </Link>
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

      {/* Mobile hamburger */}
      <button className="nav-hamburger" onClick={() => setMenuOpen(o => !o)} aria-label="Toggle menu">
        <span className={`ham-line ${menuOpen ? "open" : ""}`}></span>
        <span className={`ham-line ${menuOpen ? "open" : ""}`}></span>
        <span className={`ham-line ${menuOpen ? "open" : ""}`}></span>
      </button>

      {/* Mobile drawer */}
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

// ── Product card ─────────────────────────────────────────────
function ProductCard({ product, onAddToCart, added }) {
  const { user } = useAuth();
  return (
    <div className={`card ${added ? "card-added" : ""}`}>
      <div className="card-img-wrap">
        <img
          src={
            product.image?.startsWith("http")
              ? product.image
              : `${API_URL}/images/${product.image}`
          }
          alt={product.name}
        />
        <div className="card-img-overlay">
          <span className="tag-natural">🌿 Natural</span>
        </div>
      </div>
      <div className="card-body">
        <h2 className="card-name">{product.name}</h2>
        <p className="card-weight">{product.weight}</p>
        <p className="card-desc">{product.description}</p>
        <div className="card-footer">
          <span className="card-price">₹{product.price}</span>
          {user ? (
            <button
              className={`btn-add ${added ? "btn-added" : ""}`}
              onClick={() => onAddToCart(product.id)}
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
      {/* Hero */}
      <div className="hero">
        <div className="hero-content">
          <p className="hero-sub">Pure · Organic · Natural</p>
          <h1 className="hero-title">Good things<br />from the earth.</h1>
          <p className="hero-desc">Handpicked superfoods delivered straight to your door.</p>
          <div className="hero-badges">
            <span className="hero-badge">✅ FSSAI Certified</span>
            <span className="hero-badge">🚚 Pan India Delivery</span>
            <span className="hero-badge">🌿 100% Organic</span>
          </div>
        </div>
        <div className="hero-accent"></div>
        <div className="hero-circle hero-circle-1"></div>
        <div className="hero-circle hero-circle-2"></div>
      </div>

      {/* Stats bar */}
      {/* <div className="stats-bar">
        <div className="stat-item">
          <span className="stat-num">500+</span>
          <span className="stat-label">Happy Customers</span>
        </div>
        <div className="stat-divider"></div>
        <div className="stat-item">
          <span className="stat-num">100%</span>
          <span className="stat-label">Organic Certified</span>
        </div>
        <div className="stat-divider"></div>
        <div className="stat-item">
          <span className="stat-num">2-5</span>
          <span className="stat-label">Days Delivery</span>
        </div>
        <div className="stat-divider"></div>
        <div className="stat-item">
          <span className="stat-num">20+</span>
          <span className="stat-label">Products</span>
        </div>
      </div> */}

      {/* Products */}
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

      {/* Why us section */}
      <section className="why-section">
        <h2 className="section-title" style={{ textAlign: "center", marginBottom: "8px" }}>Why Nature Mart?</h2>
        <p className="section-sub" style={{ textAlign: "center", marginBottom: "40px" }}>We care about what goes into your body</p>
        <div className="why-grid">
          <div className="why-card">
            <div className="why-icon">🌱</div>
            <h3 className="why-title">100% Natural</h3>
            <p className="why-desc">No additives, preservatives, or artificial colors. Just pure nature.</p>
          </div>
          <div className="why-card">
            <div className="why-icon">🏆</div>
            <h3 className="why-title">FSSAI Certified</h3>
            <p className="why-desc">All products are certified and quality-tested for your safety.</p>
          </div>
          <div className="why-card">
            <div className="why-icon">🚚</div>
            <h3 className="why-title">Fast Delivery</h3>
            <p className="why-desc">Pan India delivery in 2–5 business days, right to your door.</p>
          </div>
          <div className="why-card">
            <div className="why-icon">💚</div>
            <h3 className="why-title">Eco Packaging</h3>
            <p className="why-desc">Sustainably packaged to protect both your food and our planet.</p>
          </div>
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
    } catch (err) {
      console.error("Cart count error:", err);
    }
  };

  const addToCart = async (id) => {
    try {
      const res = await authFetch(`${API_URL}/api/cart`, {
        method: "POST",
        body: JSON.stringify({ product_id: id }),
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
          {/* Public */}
          <Route path="/"         element={<Home products={products} onAddToCart={addToCart} addedIds={addedIds} />} />
          <Route path="/login"    element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* User protected */}
          <Route path="/cart"     element={<RequireAuth><Cart updateCartCount={fetchCartCount} onOrderPlaced={fetchCartCount} /></RequireAuth>} />
          <Route path="/orders"   element={<RequireAuth><Orders /></RequireAuth>} />
          <Route path="/profile"  element={<RequireAuth><Profile /></RequireAuth>} />
          <Route path="/checkout" element={<RequireAuth><Checkout onOrderPlaced={fetchCartCount} /></RequireAuth>} />

          {/* Admin protected */}
          <Route path="/admin" element={<RequireAdmin><AdminLayout /></RequireAdmin>}>
            <Route index           element={<AdminDashboard />} />
            <Route path="products" element={<AdminProducts />} />
            <Route path="orders"   element={<AdminOrders />} />
            <Route path="users"    element={<AdminUsers />} />
          </Route>

          {/* Policy pages */}
          <Route path="/privacy"  element={<PrivacyPolicy />} />
          <Route path="/terms"    element={<TermsConditions />} />
          <Route path="/refund"   element={<RefundPolicy />} />
          <Route path="/shipping" element={<ShippingPolicy />} />
        </Routes>
      </div>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-main">
          <div className="footer-brand-col">
            <div className="footer-brand">
              <span className="footer-leaf">🌿</span>
              <span className="footer-brand-name">Nature Mart</span>
            </div>
            <p className="footer-tagline">Pure · Organic · Natural superfoods delivered straight to your door.</p>
            <div className="footer-badges">
              <div className="footer-badge">
                <span className="badge-icon">✅</span>
                <div>
                  <div className="badge-label">FSSAI Registered</div>
                  <div className="badge-value">20726031002567</div>
                </div>
              </div>
              <div className="footer-badge">
                <span className="badge-icon">🏛️</span>
                <div>
                  <div className="badge-label">GST Number</div>
                  <div className="badge-value">24ATQPG4926Q1Z0</div>
                </div>
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
              <li>
                <span>📍</span>
                <span>Plot No. 45, Nandanvan Society,<br />Behind Kanteshwar Temple,<br />Katargam, Surat - 395004, Gujarat</span>
              </li>
              <li>
                <span>📧</span>
                <a href="mailto:support@naturemart.in">support@naturemart.in</a>
              </li>
              <li>
                <span>🕐</span>
                <span>Mon–Sat: 9:00 AM – 6:00 PM</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <p>© {new Date().getFullYear()} Nature Mart. All rights reserved. | Proprietor: Gavli Ashvinkumar Shyamrao</p>
          <div className="footer-trust">
            <span>🔒 Secure Payments</span>
            <span>🌿 100% Organic</span>
            <span>🚚 Pan India Delivery</span>
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