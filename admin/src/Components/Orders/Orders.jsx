import React, { useEffect, useState } from "react";
import axios from "axios";
import "./Orders.css";

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [status, setStatus] = useState("");

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    const res = await axios.get("https://e-commerce-h9gr.onrender.com/orders/all");
    if (res.data.success) setOrders(res.data.orders);
  };

  const viewDetails = (order) => {
    setSelectedOrder(order);
    setStatus(order.status);
  };

  const updateStatus = async () => {
    await axios.put(`https://e-commerce-h9gr.onrender.com/orders/update-status/${selectedOrder._id}`, { status });
    fetchOrders();
    setSelectedOrder(null);
  };

  return (
    <div className="admin-orders">
      <h2>All Orders</h2>
      <table>
        <thead>
          <tr>
            <th>Order ID</th>
            <th>Date</th>
            <th>Status</th>
            <th>Total</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => (
            <tr key={o._id}>
              <td>{o._id}</td>
              <td>{new Date(o.createdAt).toLocaleDateString()}</td>
              <td>{o.status}</td>
              <td>${o.total}</td>
              <td>
                <button onClick={() => viewDetails(o)}>View Details</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {selectedOrder && (
  <div className="modal-overlay" onClick={() => setSelectedOrder(null)}>
    <div className="order-details-modal" onClick={e => e.stopPropagation()}>
      <h3>Order Details</h3>
      <p><strong>Customer:</strong> {selectedOrder.address.name}</p>
      <p><strong>Phone:</strong> {selectedOrder.address.phone}</p>
      <p><strong>Address:</strong> {selectedOrder.address.street}, {selectedOrder.address.city}, {selectedOrder.address.state} - {selectedOrder.address.pincode}</p>
      <p><strong>Total:</strong> ${selectedOrder.total}</p>
      
      <ul className="item-list">
        {selectedOrder.cartItems.map((item) => (
          <li key={item.id} className="item">
            {item.image && <img src={item.image} alt={item.name} />}
            <div className="item-info">
              <span className="item-name">{item.name}</span>
              <span className="item-qty">${item.price} x {item.quantity}</span>
            </div>
          </li>
        ))}
      </ul>

      <div className="status-update">
        <label>Update Status:</label>
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="Created">Created</option>
          <option value="Paid">Paid</option>
          <option value="Shipped">Shipped</option>
          <option value="Delivered">Delivered</option>
          <option value="Cancelled">Cancelled</option>
        </select>
        <button onClick={updateStatus}>Update</button>
      </div>

      {/* Move Close button to bottom */}
      <div className="close-bottom">
        <button onClick={() => setSelectedOrder(null)}>Close</button>
      </div>
    </div>
  </div>
)}

    </div>
  );
};

export default Orders;
