import React, { useState } from "react";
import axios from "axios";
import "./PromoCode.css"; // import CSS here

const PromoCode = () => {
  const [code, setCode] = useState("");
  const [discount, setDiscount] = useState("");
  const [expiry, setExpiry] = useState("");

  const handleSubmit = async () => {
    try {
      const res = await axios.post("https://e-commerce-h9gr.onrender.com/create-promo", {
        code,
        discount: Number(discount),
        expiry: expiry ? new Date(expiry) : null,
      });
      if (res.data.success) {
        alert("Promo created successfully!");
        setCode("");
        setDiscount("");
        setExpiry("");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to create promo");
    }
  };

  return (
    <div className="promo-container">
      <h2>Create Promo Code</h2>

      <input
        type="text"
        placeholder="Promo Code"
        value={code}
        onChange={(e) => setCode(e.target.value)}
      />

      <input
        type="number"
        placeholder="Discount"
        value={discount}
        onChange={(e) => setDiscount(e.target.value)}
      />

      <input
        type="date"
        placeholder="Expiry Date"
        value={expiry}
        onChange={(e) => setExpiry(e.target.value)}
      />

      <button onClick={handleSubmit}>Create Promo</button>
    </div>
  );
};

export default PromoCode;
