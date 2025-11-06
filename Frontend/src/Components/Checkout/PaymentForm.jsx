import React, { useContext, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ShopContext } from "../../Context/ShopContext";
import "./Checkout.css";

const PaymentForm = ({ address, total }) => {
  const navigate = useNavigate();
  const { cartItems = {}, all_products = [], clearCart } = useContext(ShopContext);
  const [isProcessing, setIsProcessing] = useState(false);

  const totalINR = Number(total) || 0;

  const cartDetails = useMemo(() => {
    if (!Array.isArray(all_products) || !cartItems) return [];
    return all_products
      .filter((p) => Number(cartItems[p.id]) > 0)
      .map((p) => ({
        id: p.id,
        name: p.name,
        price: Number(p.new_price) || 0,
        quantity: Number(cartItems[p.id]) || 0,
        image: p.image || "",
      }));
  }, [all_products, cartItems]);

  const startPayment = async () => {
    if (totalINR <= 0 || cartDetails.length === 0) {
      alert("Cart is empty!");
      return;
    }

    setIsProcessing(true);

    try {
      if (typeof window.Razorpay === "undefined") {
        alert("Razorpay SDK not loaded. Add the script tag to index.html.");
        setIsProcessing(false);
        return;
      }

      // 1️⃣ Create order on backend
      const createRes = await fetch("http://localhost:2005/payment/create-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "auth-token": localStorage.getItem("token") || "",
        },
        body: JSON.stringify({ amount: totalINR }),
      });
      const createData = await createRes.json();
      if (!createData?.success || !createData?.order?.id) {
        throw new Error(createData?.message || "Order not created");
      }

      const { order, key } = createData;

      // 2️⃣ Razorpay checkout options
      const options = {
        key,
        amount: order.amount,
        currency: order.currency,
        name: "MyShop",
        description: "Order Payment",
        order_id: order.id,
        prefill: {
          name: address?.name || "",
          email: "customer@example.com",
          contact: address?.phone || "",
        },
        theme: { color: "#3399cc" },
        handler: async (resp) => {
          try {
            // 3️⃣ Verify and save order in backend
            const verifyRes = await fetch("http://localhost:2005/payment/verify-and-save", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "auth-token": localStorage.getItem("token") || "",
              },
              body: JSON.stringify({
                razorpay_order_id: resp.razorpay_order_id,
                razorpay_payment_id: resp.razorpay_payment_id,
                razorpay_signature: resp.razorpay_signature,
                address,
                cartItems: cartDetails,
                total: totalINR,
              }),
            });

            const verifyData = await verifyRes.json();

            if (!verifyData?.success || !verifyData?.order?._id) {
              alert(verifyData?.message || "Failed to save order. Contact support.");
              return;
            }

            // ✅ Only clear cart after backend confirms order
            clearCart();
            navigate(`/order-success/${verifyData.order._id}`);
          } catch (err) {
            console.error("Error saving order:", err);
            alert("Something went wrong while saving your order. Contact support.");
          }
        },
        modal: {
          ondismiss: () => {
            setIsProcessing(false);
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", (err) => {
        console.error("Razorpay payment failed:", err);
        alert(err?.error?.description || "Payment failed. Please try again.");
        setIsProcessing(false);
      });

      rzp.open();
    } catch (err) {
      console.error("Payment error:", err);
      alert(err?.message || "Something went wrong while starting payment.");
      setIsProcessing(false);
    }
  };

  return (
    <div className="payment-container">
      <h3>Confirm Payment</h3>

      <div className="payment-address">
        <p>
          <strong>Deliver to:</strong> {address?.name}, {address?.street}, {address?.city},{" "}
          {address?.state} - {address?.pincode}
        </p>
        <p><strong>Phone:</strong> {address?.phone}</p>
      </div>

      <div className="payment-cart-summary">
        <h4>Items in your order</h4>
        <div className="payment-cart-list">
          {cartDetails.map((it) => (
            <div key={it.id} className="cart-item-line">
              <span className="ci-left">
                {it.image && (
                  <img
                    src={it.image}
                    alt={it.name}
                    style={{ width: 44, height: 44, objectFit: "cover", marginRight: 8, borderRadius: 6 }}
                  />
                )}
                {it.name} × {it.quantity}
              </span>
              <span className="ci-right">₹{(it.price * it.quantity).toFixed(2)}</span>
            </div>
          ))}
        </div>
        <hr />
        <p><strong>Total (INR):</strong> ₹{totalINR.toFixed(2)}</p>
      </div>

      <button
        className="pay-btn"
        onClick={startPayment}
        disabled={isProcessing}
      >
        {isProcessing ? "Processing..." : "Pay with Razorpay"}
      </button>
    </div>
  );
};

export default PaymentForm;
