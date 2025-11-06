import React, { useState, useEffect } from "react";
import axios from "axios";
import star_icon from "../Assets/star_icon.png";
import star_dull_icon from "../Assets/star_dull_icon.png";
import "./DescriptionBox.css";

const DescriptionBox = ({ productId }) => {
  const [reviews, setReviews] = useState([]);
  const [newReview, setNewReview] = useState("");
  const [newRating, setNewRating] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("description");
  const [user, setUser] = useState(null);

  // Fetch logged-in user
  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;

      try {
        const res = await axios.get("http://localhost:2005/getuser", {
          headers: { "auth-token": token },
        });
        setUser(res.data);
      } catch (err) {
        console.error("Failed to fetch user:", err);
        setUser(null);
      }
    };

    fetchUser();
  }, []);

  // Fetch product reviews
  useEffect(() => {
    if (!productId) return setLoading(false);

    const fetchReviews = async () => {
      setLoading(true);
      try {
        const res = await axios.get(
          `http://localhost:2005/product/${Number(productId)}/reviews`
        );
        if (res.data.success) {
          setReviews(res.data.reviews || []);
        } else {
          setReviews([]);
        }
      } catch (err) {
        console.error("Failed to fetch reviews:", err);
        setReviews([]);
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, [productId]);

  // Submit new review
  const handleSubmitReview = async () => {
    if (!user) return alert("Please login to submit a review.");
    if (newRating === 0 || newReview.trim() === "")
      return alert("Please provide both rating and review text.");

    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        `http://localhost:2005/product/${Number(productId)}/review`,
        { rating: newRating, comment: newReview },
        { headers: { "auth-token": token } }
      );

      if (res.data.success && res.data.review) {
        setReviews([res.data.review, ...reviews]);
        setNewReview("");
        setNewRating(0);
      } else {
        alert(res.data.message || "Failed to submit review");
      }
    } catch (err) {
      console.error("Error submitting review:", err);
      alert("Server error, try again later.");
    }
  };

  return (
    <div className="descriptionbox">
      {/* Tabs */}
      <div className="descriptionbox-navigator">
        <div
          className={`descriptionbox-nav-box ${
            activeTab === "description" ? "active" : ""
          }`}
          onClick={() => setActiveTab("description")}
        >
          Description
        </div>
        <div
          className={`descriptionbox-nav-box ${
            activeTab === "reviews" ? "active" : ""
          }`}
          onClick={() => setActiveTab("reviews")}
        >
          Reviews ({reviews.length})
        </div>
      </div>

      {/* Description Tab */}
      {activeTab === "description" && (
        <div className="descriptionbox-description">
          <p>Our products are designed to bring you the perfect balance of quality, durability, and style.</p>
          <p>Crafted with care using premium materials, every item is thoroughly tested to ensure it meets the highest standards of performance and comfort.</p>
          <h2>✅ Key Features:</h2>
          <p>- High-quality build for long-lasting use</p>
          <p>- Sleek and modern design that suits every lifestyle</p>
          <p>- Comfortable, reliable, and user-friendly</p>
          <p>- Trusted by thousands of customers worldwide</p>
          <p>- Backed by responsive customer support</p><br></br>
          <p>Whether you are shopping for daily essentials, fashion, home improvement, or gifting needs, this product ensures great value and satisfaction.</p>
        </div>
      )}

      {/* Reviews Tab */}
      {activeTab === "reviews" && (
        <div className="descriptionbox-reviews">
          {loading ? (
            <p>Loading reviews...</p>
          ) : (
            <>
              {reviews.length === 0 && <p>No reviews yet. Be the first to review!</p>}
              {reviews.map((rev) => (
                <div key={rev._id} className="review-item">
                  <p className="review-user">
                    {rev.name} -{" "}
                    {rev.createdAt
                      ? new Date(rev.createdAt).toLocaleDateString()
                      : "Just now"}
                  </p>
                  <div className="review-rating">
                    {[...Array(5)].map((_, i) => (
                      <img
                        key={i}
                        src={i < rev.rating ? star_icon : star_dull_icon}
                        alt="star"
                      />
                    ))}
                  </div>
                  <p className="review-text">{rev.comment}</p>
                </div>
              ))}
            </>
          )}

          {/* Add Review Section */}
          {user && (
            <div className="descriptionbox-add-review">
              <h3>Write a Review</h3>
              <div className="review-rating-input">
                {[...Array(5)].map((_, i) => (
                  <img
                    key={i}
                    src={i < newRating ? star_icon : star_dull_icon}
                    alt="star"
                    onClick={() => setNewRating(i + 1)}
                    style={{ cursor: "pointer" }}
                  />
                ))}
              </div>
              <textarea
                value={newReview}
                onChange={(e) => setNewReview(e.target.value)}
                placeholder="Write your review here..."
              />
              <button onClick={handleSubmitReview}>Submit Review</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DescriptionBox;
