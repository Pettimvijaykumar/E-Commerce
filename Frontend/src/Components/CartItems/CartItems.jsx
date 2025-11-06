import React, { useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./CartItems.css";
import { ShopContext } from "../../Context/ShopContext";
import remove_icon from "../Assets/bin.png";

const CartItems = () => {
  const { getTotalCartAmount, all_products, cartItems, removeFromCart } = useContext(ShopContext);
  const [promoCode, setPromoCode] = useState("");
  const [discount, setDiscount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [promoCodes, setPromoCodes] = useState([]); // Store promo codes from backend
  const navigate = useNavigate();

  // Fetch promo codes from backend
  useEffect(() => {
    const fetchPromos = async () => {
      try {
        const res = await fetch("https://e-commerce-h9gr.onrender.com/get-promos");
        const data = await res.json();
        setPromoCodes(data || []);
      } catch (error) {
        console.error("Failed to load promo codes", error);
      }
    };
    fetchPromos();
  }, []);

  const handleApplyPromo = async () => {
    if (!promoCode.trim()) {
      alert("Please enter a promo code");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("https://e-commerce-h9gr.onrender.com/apply-promo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: promoCode.trim().toUpperCase() }),
      });

      const data = await response.json();
      if (data.valid) {
        setDiscount(data.discount); // discount is money now, not percentage
        alert(`Promo applied! ₹${data.discount} off`);
      } else {
        alert(data.message || "Invalid promo code");
        setDiscount(0);
      }
    } catch (err) {
      console.error(err);
      alert("Error applying promo. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const totalAmount = getTotalCartAmount();
  const discountedTotal = Math.max(totalAmount - discount, 0); // Prevent negative totals

  return (
    <div className="cartitems">
      {/* Header Row */}
      <div className="cartitems-format-main">
        <p>Products</p>
        <p>Title</p>
        <p>Price</p>
        <p>Quantity</p>
        <p>Total</p>
        <p>Remove</p>
      </div>
      <hr />

      {/* Cart Items */}
      {all_products.map((product) => {
        if (cartItems[product.id] > 0) {
          return (
            <div key={product.id}>
              <div className="cartitems-format">
                <img
                  src={product.image}
                  alt={product.name}
                  className="carticon-product-icon"
                />
                <p className="cart-title">{product.name}</p>
                <p>₹{product.new_price.toFixed(2)}</p>
                <button className="cartitems-quantity">{cartItems[product.id]}</button>
                <p>₹{(product.new_price * cartItems[product.id]).toFixed(2)}</p>
                <img
                  src={remove_icon}
                  onClick={() => removeFromCart(product.id)}
                  className="cartitems-remove-icon"
                  alt="remove"
                />
              </div>
              <hr />
            </div>
          );
        }
        return null;
      })}

      {/* Bottom Section */}
      <div className="cartitems-down">
        {/* Cart Totals */}
        <div className="cartitems-total">
          <h1>Cart Totals</h1>
          <div className="cartitems-total-item">
            <p>Subtotal</p>
            <p>₹{totalAmount.toFixed(2)}</p>
          </div>
          <hr />
          <div className="cartitems-total-item">
            <p>Shipping Fee</p>
            <p>Free</p>
          </div>
          <hr />
          {discount > 0 && (
            <div className="cartitems-total-item">
              <p>Discount</p>
              <p>-₹{discount.toFixed(2)}</p>
            </div>
          )}
          <div className="cartitems-total-item">
            <h3>Total</h3>
            <h3>₹{discountedTotal.toFixed(2)}</h3>
          </div>
          <button onClick={() => navigate("/checkout")}>
            PROCEED TO CHECKOUT
          </button>
        </div>

        {/* Promo Code */}
        <div className="cartitems-promocode">
          <p>If you have a promo code, enter it here</p>
          <div className="cartitems-promobox">
            <input
              type="text"
              placeholder="Promo Code"
              value={promoCode}
              onChange={(e) => setPromoCode(e.target.value)}
            />
            <button onClick={handleApplyPromo} disabled={loading}>
              {loading ? "Applying..." : "Submit"}
            </button>
          </div>

          {/* Promo Code Suggestions */}
          <div className="promo-suggestions">
            <p>Available Promo Codes:</p>
            {promoCodes.length > 0 ? (
              promoCodes.slice(0, 3).map((promo) => (
                <div
                  key={promo._id}
                  className="promo-item"
                  onClick={() => setPromoCode(promo.code)}
                >
                  <strong>{promo.code}</strong> - ₹{promo.discount} OFF
                </div>
              ))
            ) : (
              <p>No promo codes available</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartItems;
