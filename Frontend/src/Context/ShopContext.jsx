import React, { createContext, useState, useEffect } from "react";
import axios from "axios";

export const ShopContext = createContext(null);

const ShopContextProvider = (props) => {
  const [all_products, setAll_Products] = useState([]);
  const [cartItems, setCartItems] = useState({});

  // Fetch products
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await axios.get("http://localhost:2005/allproducts");
        setAll_Products(res.data);
      } catch (err) {
        console.error("Error fetching products:", err);
      }
    };
    fetchProducts();
  }, []);

  // Fetch cart
  useEffect(() => {
    const fetchCart = async () => {
      const token = localStorage.getItem("token");
      if (token) {
        try {
          const res = await axios.post(
            "http://localhost:2005/getcart",
            {},
            { headers: { "auth-token": token } }
          );
          setCartItems(res.data);
        } catch (err) {
          console.error("Error fetching cart:", err);
        }
      }
    };

    fetchCart();
    window.addEventListener("storage", fetchCart);
    return () => window.removeEventListener("storage", fetchCart);
  }, []);

  // Add item to cart
  const addToCart = async (itemId) => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Please login to add items to cart!");
      return;
    }

    try {
      const res = await axios.post(
        "http://localhost:2005/cart/add",
        { productId: itemId },
        { headers: { "auth-token": token } }
      );

      if (res.data.success) {
        setCartItems(res.data.cart);
        setAll_Products((prev) =>
          prev.map((p) =>
            (p.id === itemId || p._id === itemId) ? { ...p, stock: res.data.stock } : p
          )
        );
      } else {
        alert(res.data.message || "Failed to add to cart");
      }
    } catch (err) {
      console.error("Error adding to cart:", err);
      alert("Server error, try again later");
    }
  };

  // Remove item from cart
  const removeFromCart = async (itemId) => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Please login first!");
      return;
    }

    try {
      const res = await axios.post(
        "http://localhost:2005/cart/remove",
        { productId: itemId },
        { headers: { "auth-token": token } }
      );

      if (res.data.success) {
        setCartItems(res.data.cart);
        setAll_Products((prev) =>
          prev.map((p) =>
            (p.id === itemId || p._id === itemId) ? { ...p, stock: res.data.stock } : p
          )
        );
      } else {
        alert(res.data.message || "Failed to remove from cart");
      }
    } catch (err) {
      console.error("Error removing from cart:", err);
      alert("Server error, try again later");
    }
  };

  // Clear cart
  const clearCart = () => {
    setCartItems({});
    localStorage.removeItem("cart"); // optional, if you persist cart
  };

  // Total amount
  const getTotalCartAmount = () => {
    let totalAmount = 0;
    for (const item in cartItems) {
      if (cartItems[item] > 0) {
        let itemInfo = all_products.find(
          (product) =>
            product.id === item || product._id === item || product.id === Number(item)
        );
        if (itemInfo) totalAmount += itemInfo.new_price * cartItems[item];
      }
    }
    return totalAmount;
  };

  // Total items
  const getTotalCartItems = () => {
    return Object.values(cartItems).reduce((sum, qty) => sum + qty, 0);
  };

  return (
    <ShopContext.Provider
      value={{
        getTotalCartItems,
        getTotalCartAmount,
        all_products,
        cartItems,
        addToCart,
        removeFromCart,
        setCartItems,
        clearCart, // ✅ added
      }}
    >
      {props.children}
    </ShopContext.Provider>
  );
};

export default ShopContextProvider;
