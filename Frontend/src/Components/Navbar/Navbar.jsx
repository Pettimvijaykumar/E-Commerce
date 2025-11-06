import React, { useContext, useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Navbar.css";
import logo from "../Assets/logo.png";
import cart_icon from "../Assets/cart_icon.png";
import { ShopContext } from "../../Context/ShopContext";
import { Menu, X } from "lucide-react";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBell } from "@fortawesome/free-solid-svg-icons";

const API_BASE = "https://e-commerce-h9gr.onrender.com"; // ✅ Update if needed

const Navbar = () => {
  const [menu, setMenu] = useState("shop");
  const [mobileOpen, setMobileOpen] = useState(false);
  const { getTotalCartItems, setCartItems } = useContext(ShopContext);
  const navigate = useNavigate();

  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem("token"));
  const [userName, setUserName] = useState("");

  // ✅ Notification states
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);

  const fetchUserAndCart = useCallback(
    async (token) => {
      try {
        const res = await fetch(`${API_BASE}/getuser`, {
          headers: { "auth-token": token },
        });
        const data = await res.json();
        setUserName(data.name || "");
      } catch (err) {
        console.error(err);
      }

      try {
        const res = await fetch(`${API_BASE}/getcart`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "auth-token": token },
        });
        const data = await res.json();
        setCartItems(data);
      } catch (err) {
        console.error(err);
      }
    },
    [setCartItems]
  );

  const checkLoginStatus = useCallback(() => {
    const token = localStorage.getItem("token");
    if (token) {
      setIsLoggedIn(true);
      fetchUserAndCart(token);
      fetchNotifications();
    } else {
      setIsLoggedIn(false);
      setUserName("");
      setCartItems({});
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [fetchUserAndCart, setCartItems]);

  // ✅ Fetch Notifications
  // ✅ Fetch Notifications for Logged-in User
const fetchNotifications = async () => {
  const token = localStorage.getItem("token");
  if (!token) return;

  try {
    const userRes = await axios.get(`${API_BASE}/getuser`, {
      headers: { "auth-token": token },
    });

    const userId = userRes.data._id; // ✅ Get logged-in user ID

    const notifRes = await axios.get(`${API_BASE}/api/notifications/${userId}`, {
      headers: { "auth-token": token },
    });

    setNotifications(notifRes.data);
    setUnreadCount(notifRes.data.filter((n) => !n.isRead).length);

  } catch (err) {
    console.error("❌ Error fetching notifications:", err);
  }
};

 const handleMarkSingleRead = async (notifId) => {
  const token = localStorage.getItem("token");
  if (!token) return;

  try {
    await axios.put(
      `${API_BASE}/api/notifications/usernotification/${notifId}/read`,
      {},
      { headers: { "auth-token": token } }
    );

    setNotifications((prev) =>
      prev.map((n) => (n.id === notifId ? { ...n, isRead: true } : n))
    );
    setUnreadCount((prev) => prev - 1);

  } catch (err) {
    console.error("❌ Error marking notification read:", err);
  }
};


  useEffect(() => {
    checkLoginStatus();
  }, [checkLoginStatus]);

  useEffect(() => {
    window.addEventListener("loginStatusChanged", checkLoginStatus);
    return () =>
      window.removeEventListener("loginStatusChanged", checkLoginStatus);
  }, [checkLoginStatus]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    setIsLoggedIn(false);
    setUserName("");
    setCartItems({});
    setNotifications([]);
    setUnreadCount(0);
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

        {/* 🔔 Notification Bell */}
        {isLoggedIn && (
          <div className="notification-wrapper">
            <FontAwesomeIcon
              icon={faBell}
              className="bell-icon"
              onClick={() => setShowDropdown(!showDropdown)}
            />

            {unreadCount > 0 && (
              <span className="notif-count">{unreadCount}</span>
            )}

            {showDropdown && (
              <div className="notif-dropdown">
                <strong>Notifications</strong>
                {notifications.length > 0 ? (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`notif-item ${n.isRead ? "read" : ""}`}
                      onClick={() => handleMarkSingleRead(n.id)}
                    >
                      <p>{n.message}</p>
                      <small>{new Date(n.createdAt).toLocaleString()}</small>
                    </div>
                  ))
                ) : (
                  <p className="no-notif">No notifications</p>
                )}
              </div>
            )}
          </div>
        )}

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
