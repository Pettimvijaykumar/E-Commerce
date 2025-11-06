import React, { useState, useContext } from "react";
import { ShopContext } from "../../Context/ShopContext";

const OrderSummary = ({ subtotal, total, promoDiscount, setPromoDiscount }) => {
  const [promoCode, setPromoCode] = useState("");
  const [loading, setLoading] = useState(false);
  const { cartItems } = useContext(ShopContext);

  // ✅ Calculate total items in cart
  const totalItems = Object.values(cartItems).reduce(
    (sum, qty) => sum + qty,
    0
  );

  const tax = 0; // placeholder tax
  const shippingFee = 0; // free shipping

  const applyPromo = async () => {
    if (!promoCode.trim()) {
      alert("Please enter a promo code");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("http://localhost:2005/apply-promo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: promoCode }),
      });

      const data = await res.json();
      if (data.valid) {
        setPromoDiscount(data.discount); // discount in rupees
        alert(`Promo applied! ₹${data.discount} off`);
      } else {
        alert("Invalid promo code");
        setPromoDiscount(0);
      }
    } catch (err) {
      console.error(err);
      alert("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="order-summary">
      <div className="summary-header">
        <h3>Bill Details</h3>
      </div>

      {/* Top Line Items */}
      <p>
        Total Items: <strong>{totalItems}</strong>
      </p>
      <p>
        Subtotal: <span>₹{subtotal.toFixed(2)}</span>
      </p>
      <p>
        Tax: <span>₹{tax.toFixed(2)}</span>
      </p>
      <p>
        Shipping Fee: <span>₹{shippingFee.toFixed(2)}</span>
      </p>

      {/* Promo Code Section */}
      <div className="promo-code">
        <input
          type="text"
          placeholder="Promo Code"
          value={promoCode}
          onChange={(e) => setPromoCode(e.target.value)}
        />
        <button onClick={applyPromo} disabled={!promoCode.trim() || loading}>
          {loading ? "Applying..." : "Apply"}
        </button>
      </div>

      {/* Show discount if applied */}
      {promoDiscount > 0 && (
        <p className="discount">
          Discount: <span>-₹{promoDiscount.toFixed(2)}</span>
        </p>
      )}

      <hr />

      {/* Final Total */}
      <h3>
        To Pay: <span>₹{total.toFixed(2)}</span>
      </h3>
    </div>
  );
};

export default OrderSummary;
