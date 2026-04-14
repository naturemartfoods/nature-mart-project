// import { BrowserRouter as Router, Routes, Route, Link, useLocation } from "react-router-dom";
// import { useEffect, useState } from "react";
// import Cart from "./Cart";
// import Orders from "./Orders";
// import "./App.css";
// import Login from "./Login";
// import Admin from "./Admin";

// function NavBar({ cartCount }) {
//   const location = useLocation();
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
//         <Link to="/cart" className={`nav-link ${location.pathname === "/cart" ? "active" : ""}`}>
//           <span className="nav-icon">⊕</span> Cart
//           {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
//         </Link>
//         <Link to="/orders" className={`nav-link ${location.pathname === "/orders" ? "active" : ""}`}>
//           <span className="nav-icon">◈</span> Orders
//         </Link>
//       </div>
//     </nav>
//   );
// }

// function ProductCard({ product, onAddToCart, added }) {
//   return (
//     <div className={`card ${added ? "card-added" : ""}`}>
//       <div className="card-img-wrap">
//         <img
//           src={`http://localhost:5000${product.image}`}
//           alt={product.name}
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
//           <button
//             className={`btn-add ${added ? "btn-added" : ""}`}
//             onClick={() => onAddToCart(product.id)}
//           >
//             {added ? "✓ Added" : "+ Add to Cart"}
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }

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

// function AppContent() {
//   const [products, setProducts] = useState([]);
//   const [addedIds, setAddedIds] = useState([]);
//   const [cartCount, setCartCount] = useState(0);

//   const fetchCartCount = () => {
//     fetch("http://localhost:5000/api/cart")
//       .then(res => res.json())
//       .then(data => setCartCount(data.items?.length || 0))
//       .catch(() => {});
//   };

//   const addToCart = (id) => {
//     fetch("http://localhost:5000/api/cart", {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({ product_id: id }),
//     })
//       .then(res => res.json())
//       .then(() => {
//         setAddedIds(prev => [...prev, id]);
//         fetchCartCount();
//         setTimeout(() => setAddedIds(prev => prev.filter(i => i !== id)), 2000);
//       });
//   };

//   useEffect(() => {
//     fetch("http://localhost:5000/api/products")
//       .then(res => res.json())
//       .then(data => setProducts(data));
//     fetchCartCount();
//   }, []);

//   return (
//     <div className="app">
//       <NavBar cartCount={cartCount} />
//       <div className="page-content">
//         <Routes>
//           <Route path="/admin" element={<Admin />} />
//           <Route path="/login" element={<Login />} />
//           <Route path="/" element={<Home products={products} onAddToCart={addToCart} addedIds={addedIds} />} />
//           <Route path="/cart" element={<Cart onOrderPlaced={fetchCartCount} />} />
//           <Route path="/orders" element={<Orders />} />
//         </Routes>
//       </div>
//       <footer className="footer">
//         <p>🌿 Nature Mart — Pure & Organic Superfoods</p>
//       </footer>
//     </div>
//   );
// }

// function App() {
//   return (
//     <Router>
//       <AppContent />
//     </Router>
//   );
// }

// export default App;

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
import "./App.css";

const API_URL = "https://your-backend.onrender.com";

// ── Protected route wrapper ──────────────────────────────────
function RequireAuth({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? children : <Navigate to="/login" replace />;
}

function RequireAdmin({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user)              return <Navigate to="/login"  replace />;
  if (user.role !== "admin") return <Navigate to="/" replace />;
  return children;
}

// ── Navbar ───────────────────────────────────────────────────
function NavBar({ cartCount }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const isAdmin  = location.pathname.startsWith("/admin");
  if (isAdmin) return null; // admin has its own sidebar

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <span className="brand-leaf">🌿</span>
        <span className="brand-name">Nature Mart</span>
      </div>
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
              <span className="nav-icon">👤</span> {user.name.split(" ")[0]}
            </Link>
            {user.role === "admin" && (
              <Link to="/admin" className="nav-link nav-admin">
                ⚙ Admin
              </Link>
            )}
            <button className="nav-logout" onClick={logout}>Sign out</button>
          </>
        ) : (
          <>
            <Link to="/login"    className={`nav-link ${location.pathname === "/login"    ? "active" : ""}`}>Login</Link>
            <Link to="/register" className="nav-link nav-cta">Register</Link>
          </>
        )}
      </div>
    </nav>
  );
}

// ── Product card ─────────────────────────────────────────────
function ProductCard({ product, onAddToCart, added }) {
  const { user } = useAuth();
  return (
    <div className={`card ${added ? "card-added" : ""}`}>
      <div className="card-img-wrap">
        <img src={product.image} alt={product.name} />
        <div className="card-img-overlay">
          <span className="tag-natural">Natural</span>
        </div>
      </div>
      <div className="card-body">
        <h2 className="card-name">{product.name}</h2>
        <p className="card-weight">{product.weight}</p>
        <p className="card-desc">{product.description}</p>
        <div className="card-footer">
          <span className="card-price">₹{product.price}</span>
          {user ? (
            <button className={`btn-add ${added ? "btn-added" : ""}`} onClick={() => onAddToCart(product.id)}>
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
        <div className="hero-text">
          <p className="hero-sub">Pure · Organic · Natural</p>
          <h1 className="hero-title">Good things<br />from the earth.</h1>
          <p className="hero-desc">Handpicked superfoods delivered straight to your door.</p>
        </div>
        <div className="hero-accent"></div>
      </div>
      <section className="products-section">
        <h2 className="section-title">Our Products</h2>
        <div className="grid">
          {products.length === 0 ? (
            <div className="empty-state"><div className="spinner"></div><p>Loading products…</p></div>
          ) : (
            products.map(product => (
              <ProductCard key={product.id} product={product} onAddToCart={onAddToCart} added={addedIds.includes(product.id)} />
            ))
          )}
        </div>
      </section>
    </main>
  );
}

// ── App content (needs Router context) ───────────────────────
function AppContent() {
  const { user, authFetch } = useAuth();
  const [products, setProducts] = useState([]);
  const [addedIds, setAddedIds] = useState([]);
  const [cartCount, setCartCount] = useState(0);
  

  const fetchCartCount = () => {
    if (!user) { setCartCount(0); return; }
    authFetch(`${API_URL}/api/cart`)
      .then(r => r.json())
      .then(d => setCartCount(d.items?.length || 0))
      .catch(() => {});
  };

  const addToCart = (id) => {
    authFetch(`${API_URL}/api/cart`, {
      method: "POST",
      body:   JSON.stringify({ product_id: id }),
    }).then(() => {
      setAddedIds(prev => [...prev, id]);
      fetchCartCount();
      setTimeout(() => setAddedIds(prev => prev.filter(i => i !== id)), 2000);
    });
  };

  useEffect(() => {
    fetch(`${API_URL}/api/products`)
      .then(r => r.json())
      .then(setProducts);
    fetchCartCount();
  }, [user]);

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
          <Route path="/cart"    element={<RequireAuth><Cart onOrderPlaced={fetchCartCount} /></RequireAuth>} />
          <Route path="/orders"  element={<RequireAuth><Orders /></RequireAuth>} />
          <Route path="/profile" element={<RequireAuth><Profile /></RequireAuth>} />

          {/* Admin protected */}
          <Route path="/admin" element={<RequireAdmin><AdminLayout /></RequireAdmin>}>
            <Route index           element={<AdminDashboard />} />
            <Route path="products" element={<AdminProducts />} />
            <Route path="orders"   element={<AdminOrders />} />
            <Route path="users"    element={<AdminUsers />} />
          </Route>
        </Routes>
      </div>
      <footer className="footer">
        <p>🌿 Nature Mart — Pure &amp; Organic Superfoods</p>
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