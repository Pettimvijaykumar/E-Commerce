import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";  // ✅ for redirect
import "./CSS/LoginSignup.css";

const LoginSignup = () => {
  const [isSignup, setIsSignup] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
  });
  const [message, setMessage] = useState("");
  const navigate = useNavigate(); // ✅ hook for navigation

  // handle input change
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // handle form submit
  const handleSubmit = async () => {
    try {
      if (isSignup) {
        // 🔹 Signup API
        const res = await axios.post("http://localhost:2005/signup", {
          username: formData.username,
          email: formData.email,
          password: formData.password,
        });
        setMessage("Signup Successful ✅");
        localStorage.setItem("token", res.data.token);
        localStorage.setItem("isLoggedIn", true);
        window.dispatchEvent(new Event("loginStatusChanged"));
        // ✅ Redirect to homepage after signup
        navigate("/");
      } else {
        // 🔹 Login API
        const res = await axios.post("http://localhost:2005/login", {
          email: formData.email,
          password: formData.password,
        });
        setMessage("Login Successful ✅");
        localStorage.setItem("token", res.data.token);
        window.dispatchEvent(new Event("loginStatusChanged")); 
        // ✅ Redirect to homepage after login
        navigate("/");
      }
    } catch (err) {
      const errorMsg =
        err.response?.data?.errors ||
        err.response?.data?.message ||
        "Something went wrong";

      setMessage(errorMsg);

      // 🔹 Smart Switch
      if (isSignup && errorMsg.toLowerCase().includes("exist")) {
        setIsSignup(false); // switch to Login
      } else if (!isSignup && errorMsg.toLowerCase().includes("email")) {
        setIsSignup(true); // switch to Signup
      }
    }
  };

  return (
    <div className="loginsignup">
      <div className="loginsignup-container">
        <h1>{isSignup ? "Sign Up" : "Login"}</h1>

        <div className="loginsignup-fields">
          {isSignup && (
            <input
              type="text"
              name="username"
              placeholder="Your Name"
              value={formData.username}
              onChange={handleChange}
            />
          )}
          <input
            type="email"
            name="email"
            placeholder="Email Address"
            value={formData.email}
            onChange={handleChange}
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
          />
        </div>

        <button onClick={handleSubmit}>
          {isSignup ? "Continue" : "Login"}
        </button>

        <p className="loginsignup-toggle">
          {isSignup ? "Already have an account? " : "Don't have an account? "}
          <span onClick={() => setIsSignup(!isSignup)}>
            {isSignup ? "Login" : "Sign Up"}
          </span>
        </p>

        {isSignup && (
          <div className="loginsignup-terms">
            <input type="checkbox" id="terms" />
            <label htmlFor="terms">
              By continuing, I agree to the <span>Terms of Use</span> &{" "}
              <span>Privacy Policy</span>
            </label>
          </div>
        )}

        {message && <p className="loginsignup-message">{message}</p>}
      </div>
    </div>
  );
};

export default LoginSignup;
