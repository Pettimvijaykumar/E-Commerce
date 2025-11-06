import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import "./Ordered.css";

const Ordered = () => {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const res = await fetch(`http://localhost:2005/order/${orderId}`, {
          headers: { "auth-token": localStorage.getItem("token") || "" },
        });
        const data = await res.json();
        if (data.success) setOrder(data.order);
      } catch (err) {
        console.error("Failed to fetch order:", err);
      }
    };
    fetchOrder();
  }, [orderId]);

  if (!order) return <p className="loading-text">Loading order details...</p>;

  return (
    <div className="ordered-container">
      <h1>🎉 Order Confirmed!</h1>
      <p className="thankyou-text">Thank you for your purchase. Your order has been placed successfully.</p>

      <div className="order-details">
        <h2>Order #{order._id}</h2>
        <p><strong>Status:</strong> {order.status || "Processing"}</p>

        <h3>Shipping Address</h3>
        <p>{order.address.name}, {order.address.street}, {order.address.city}, {order.address.state} - {order.address.pincode}</p>
        <p>Phone: {order.address.phone}</p>

        <h3>Items</h3>
        <ul className="order-items-list">
          {order.cartItems.map((item, idx) => (
            <li key={idx} className="order-item">
              {item.image && <img src={item.image} alt={item.name} className="order-item-img" />}
              <div className="order-item-info">
                <span className="item-name">{item.name}</span>
                <span className="item-qty">x {item.quantity}</span>
                <span className="item-price">₹{item.price * item.quantity}</span>
              </div>
            </li>
          ))}
        </ul>

        <h3>Total Paid: ₹{order.total}</h3>
      </div>

      <Link to="/" className="btn-home">Continue Shopping</Link>
    </div>
  );
};

export default Ordered;
