import React, { useContext, useState, useEffect } from "react";
import "./ProductDisplay.css";
import star_icon from "../Assets/star_icon.png";
import star_dull_icon from "../Assets/star_dull_icon.png";
import { ShopContext } from "../../Context/ShopContext";
import axios from "axios";

const ProductDisplay = ({ product }) => {
  const { setCartItems } = useContext(ShopContext);
  const [selectedSize, setSelectedSize] = useState(null);
  const [mainImage, setMainImage] = useState("");
  const [avgRating, setAvgRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
useEffect(() => {
    if (!product?.id) return;
    axios
      .get(`http://localhost:2005/product/${product.id}/average-rating`)
      .then((res) => {
        if (res.data.success) {
          setAvgRating(Number(res.data.average));
          setTotalReviews(res.data.totalReviews || 0);
        }
      })
      .catch((err) => console.error("Failed to fetch average rating:", err));
  }, [product?.id]);
  // Update mainImage whenever product changes
  useEffect(() => {
    if (product?.image) setMainImage(product.image);
  }, [product]);

  if (!product) return null;

  const handleThumbnailClick = (img) => setMainImage(img);

  const thumbnails = [product.image, ...(product.images || [])];
  while (thumbnails.length < 4) thumbnails.push(product.image);

  const handleAddToCart = async () => {
    if (!selectedSize) return alert("Please select a size!");
    const token = localStorage.getItem("token");
    if (!token) return alert("Please login to add items to cart!");

    try {
      const res = await axios.post(
        "http://localhost:2005/cart/add",
        { productId: product.id, size: selectedSize },
        { headers: { "auth-token": token } }
      );

      if (res.data.success) {
        setCartItems(res.data.cart);
        window.location.reload();
      } else {
        alert(res.data.message || "Failed to add to cart");
      }
    } catch (err) {
      console.error("Error adding to cart:", err);
      alert("Server error, try again later");
    }
  };

  return (
    <div className="productdisplay">
      <div className="productdisplay-left">
        <div className="productdisplay-img-list">
          {thumbnails.slice(0, 4).map((img, index) => (
            <img
              key={index}
              src={img}
              alt={`thumb-${index}`}
              className={mainImage === img ? "active-thumb" : ""}
              onClick={() => handleThumbnailClick(img)}
              style={{
                cursor: "pointer",
                border: mainImage === img ? "2px solid #000" : "1px solid #ddd",
              }}
            />
          ))}
        </div>
        <div className="productdisplay-img">
          <img className="productdisplay-main-img" src={mainImage} alt="main" />
        </div>
      </div>

      <div className="productdisplay-right">
        {/* 🔥 Brand Display */}
        

        <h1 className="product-title">{product.name}</h1>

        <div className="productdisplay-right-star">
          {[...Array(5)].map((_, i) => (
            <img
              key={i}
              src={i < Math.round(avgRating) ? star_icon : star_dull_icon}
              alt="star"
            />
          ))}
          <p>({totalReviews})</p>
        </div>
          {product.brand && (
          <p className="product-brand">Brand : {product.brand}</p>
        )}
        <div className="productdisplay-right-prices">
          {product.old_price && (
            <div className="productdisplay-right-price-old">${product.old_price}</div>
          )}
          <div className="productdisplay-right-price-new">${product.new_price}</div>
        </div>

        <p className={`stock ${product.stock > 0 ? "in-stock" : "out-stock"}`}>
          {product.stock > 0 ? `In stock: ${product.stock}` : "Out of Stock"}
        </p>

        {product.description && (
          <div className="productdisplay-right-description">{product.description}</div>
        )}

        {product.sizes?.length > 0 && (
          <div className="productdisplay-right-size">
            <h1>Select Size</h1>
            <div className="productdisplay-right-sizes">
              {product.sizes.map((size) => (
                <div
                  key={size}
                  className={selectedSize === size ? "selected" : ""}
                  onClick={() => setSelectedSize(size)}
                >
                  {size}
                </div>
              ))}
            </div>
          </div>
        )}

        <button
          className="add-to-cart"
          onClick={handleAddToCart}
          disabled={!selectedSize || product.stock <= 0}
        >
          {product.stock > 0 ? "ADD TO CART" : "OUT OF STOCK"}
        </button>

        {product.category && (
          <p className="productdisplay-right-category">
            <span>Category:</span> {product.category}
          </p>
        )}
        {product.tags?.length > 0 && (
          <p className="productdisplay-right-category">
            <span>Tags:</span> {product.tags.join(", ")}
          </p>
        )}
      </div>
    </div>
  );
};

export default ProductDisplay;
