import React, { useContext, useState, useEffect, useCallback } from "react"; // ✅ added useCallback
import { Link, useNavigate } from "react-router-dom";
import "./Navbar.css";
import logo from "../Assets/logo.png";
import cart_icon from "../Assets/cart_icon.png";
import { ShopContext } from "../../Context/ShopContext";
import { Menu, X } from "lucide-react";

const Navbar = () => {
  const [menu, setMenu] = useState("shop");
  const [mobileOpen, setMobileOpen] = useState(false);
  const { getTotalCartItems, setCartItems } = useContext(ShopContext);
  const navigate = useNavigate();

  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem("token"));
  const [userName, setUserName] = useState("");

  const fetchUserAndCart = useCallback(async (token) => { // ✅ wrap in useCallback
    try {
      const res = await fetch("http://localhost:2005/getuser", {
        headers: { "auth-token": token },
      });
      const data = await res.json();
      setUserName(data.name || "");
    } catch (err) {
      console.error(err);
    }

    try {
      const res = await fetch("http://localhost:2005/getcart", {
        method: "POST",
        headers: { "Content-Type": "application/json", "auth-token": token },
      });
      const data = await res.json();
      setCartItems(data);
    } catch (err) {
      console.error(err);
    }
  }, [setCartItems]); // ✅ add dependency

  const checkLoginStatus = useCallback(() => {
    const token = localStorage.getItem("token");
    if (token) {
      setIsLoggedIn(true);
      fetchUserAndCart(token);
    } else {
      setIsLoggedIn(false);
      setUserName("");
      setCartItems({});
    }
  }, [fetchUserAndCart, setCartItems]); // ✅ add dependencies

  // First load
  useEffect(() => {
    checkLoginStatus();
  }, [checkLoginStatus]);

  // Listen for login/logout events
  useEffect(() => {
    window.addEventListener("loginStatusChanged", checkLoginStatus);
    return () => window.removeEventListener("loginStatusChanged", checkLoginStatus);
  }, [checkLoginStatus]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    setIsLoggedIn(false);
    setUserName("");
    setCartItems({});
    window.dispatchEvent(new Event("loginStatusChanged"));
    navigate("/login");
  };

  const handleMenuClick = (selected) => {
    setMenu(selected);
    setMobileOpen(false);
  };

  return (
    <div className="navbar">
      <div className="nav-logo">
        <img src={logo} alt="logo" />
        <p>SnapCart</p>
      </div>

      <ul className="nav-menu desktop-only">
        <li onClick={() => setMenu("shop")}>
          <Link to="/">Shop</Link>
          {menu === "shop" && <hr />}
        </li>
        <li onClick={() => setMenu("all_products")}>
          <Link to="/all-products">All Products</Link>
          {menu === "all_products" && <hr />}
        </li>
        <li onClick={() => setMenu("mens")}>
          <Link to="/mens">Men</Link>
          {menu === "mens" && <hr />}
        </li>
        <li onClick={() => setMenu("womens")}>
          <Link to="/womens">Women</Link>
          {menu === "womens" && <hr />}
        </li>
        <li onClick={() => setMenu("kids")}>
          <Link to="/kids">Kids</Link>
          {menu === "kids" && <hr />}
        </li>
        <li onClick={() => setMenu("search")}>
          <Link to="/search">Search</Link>
          {menu === "search" && <hr />}
        </li>
      </ul>

      <div className="nav-right">
        {isLoggedIn ? (
          <>
            <Link to="/profile">
              <div className="avatar-circle">
                {userName ? userName.charAt(0).toUpperCase() : "U"}
              </div>
            </Link>
            <button onClick={handleLogout} className="login-btn logout-btn">
              Logout
            </button>
          </>
        ) : (
          <Link to="/login">
            <button className="login-btn">Login</button>
          </Link>
        )}

        <Link to="/cart" className="cart-container">
          <img src={cart_icon} alt="Cart" />
          <span className="cart-badge">{getTotalCartItems()}</span>
        </Link>

        <div
          className="hamburger mobile-only"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X size={28} /> : <Menu size={28} />}
        </div>

        {mobileOpen && (
          <ul className="nav-menu mobile-dropdown">
            <li onClick={() => handleMenuClick("shop")}>
              <Link to="/">Shop</Link>
            </li>
            <li onClick={() => handleMenuClick("all_products")}>
              <Link to="/all-products">All Products</Link>
            </li>
            <li onClick={() => handleMenuClick("mens")}>
              <Link to="/mens">Men</Link>
            </li>
            <li onClick={() => handleMenuClick("womens")}>
              <Link to="/womens">Women</Link>
            </li>
            <li onClick={() => handleMenuClick("kids")}>
              <Link to="/kids">Kids</Link>
            </li>
            <li onClick={() => handleMenuClick("search")}>
              <Link to="/search">Search</Link>
            </li>
          </ul>
        )}
      </div>
    </div>
  );
};

export default Navbar;
