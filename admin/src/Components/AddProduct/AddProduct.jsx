import React, { useState } from "react";
import "./AddProduct.css";
import upload_area from "../../assets/upload_area.svg";

const AddProduct = () => {
  const [image, setImage] = useState(null);
  const [thumbnails, setThumbnails] = useState([]);
  const [stock, setStock] = useState("");

  const [productDetails, setProductDetails] = useState({
    name: "",
    brand: "",
    description: "",
    category: "women",
    tags: "",
    sizes: [],
    new_price: "",
    old_price: "",
    image: "",
  });

  // Handlers
  const imageHandler = (e) => setImage(e.target.files[0]);
  const thumbnailsHandler = (e) => setThumbnails(Array.from(e.target.files));
  const stockHandler = (e) => setStock(e.target.value);

  const changeHandler = (e) => {
    setProductDetails({ ...productDetails, [e.target.name]: e.target.value });
  };

  const handleSizeToggle = (size) => {
    setProductDetails((prev) => {
      const sizes = prev.sizes.includes(size)
        ? prev.sizes.filter((s) => s !== size)
        : [...prev.sizes, size];
      return { ...prev, sizes };
    });
  };

  const Add_Product = async () => {
    try {
      if (!productDetails.name || !productDetails.old_price || !productDetails.new_price) {
        alert("⚠️ Please fill all required fields!");
        return;
      }

      let product = { ...productDetails };

      // Upload main image
      if (image) {
        const formData = new FormData();
        formData.append("product", image);
        let uploadRes = await fetch("http://localhost:2005/upload", { method: "POST", body: formData });
        let uploadData = await uploadRes.json();
        if (uploadData.success) product.image = uploadData.image_url;
        else { alert("❌ Image upload failed!"); return; }
      }

      // Upload optional thumbnails
      let uploadedThumbnails = [];
      if (thumbnails.length > 0) {
        const formData = new FormData();
        thumbnails.forEach((file) => formData.append("product", file));
        const uploadRes = await fetch("http://localhost:2005/upload", { method: "POST", body: formData });
        const uploadData = await uploadRes.json();
        if (uploadData.success) uploadedThumbnails = uploadData.image_url ? [uploadData.image_url] : [];
        else { alert("❌ Thumbnail upload failed!"); return; }
      }

      // Include thumbnails & stock
      product = {
        ...product,
        images: uploadedThumbnails.length ? uploadedThumbnails : undefined,
        stock: stock ? Number(stock) : undefined, // default handled in backend
      };

      // Save product
      const res = await fetch("http://localhost:2005/addproduct", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(product),
      });

      const data = await res.json();
      if (data.success) {
        alert("✅ Product Added Successfully!");
        setProductDetails({ name: "", description: "", category: "women", tags: "", sizes: [], new_price: "", old_price: "", image: "" });
        setImage(null);
        setThumbnails([]);
        setStock("");
      } else alert("❌ Failed to add product!");
    } catch (err) {
      console.error("Error:", err);
      alert("⚠️ Something went wrong while adding product!");
    }
  };

  const submitHandler = (e) => { e.preventDefault(); Add_Product(); };

  return (
    <form className="add-product" onSubmit={submitHandler}>
      {/* Product Name */}
      <div className="addproduct-itemfield">
        <p>Product Name</p>
        <input type="text" name="name" placeholder="Type here" value={productDetails.name} onChange={changeHandler} required />
      </div>
<div className="addproduct-itemfield">
  <p>Brand</p>
  <input
    type="text"
    name="brand"
    placeholder="Enter brand name"
    value={productDetails.brand}
    onChange={changeHandler}
  />
</div>
      {/* Description */}
      <div className="addproduct-itemfield">
        <p>Description</p>
        <textarea name="description" placeholder="Enter product description" value={productDetails.description} onChange={changeHandler} />
      </div>

      {/* Tags */}
      <div className="addproduct-itemfield">
        <p>Tags (comma separated)</p>
        <input type="text" name="tags" placeholder="e.g., Modern, Latest" value={productDetails.tags} onChange={changeHandler} />
      </div>

      {/* Size Selection */}
      <div className="addproduct-itemfield">
        <p>Select Sizes</p>
        <div className="size-options">
          {["S", "M", "L", "XL", "XXL"].map((size) => (
            <label key={size} className="size-label">
              <input type="checkbox" checked={productDetails.sizes.includes(size)} onChange={() => handleSizeToggle(size)} />
              {size}
            </label>
          ))}
        </div>
      </div>

      {/* Prices */}
      <div className="addproduct-itemfield">
        <p>Original Price</p>
        <input type="number" name="old_price" placeholder="Enter original price" value={productDetails.old_price} onChange={changeHandler} required />
      </div>

      <div className="addproduct-itemfield">
        <p>Offer Price</p>
        <input type="number" name="new_price" placeholder="Enter offer price" value={productDetails.new_price} onChange={changeHandler} required />
      </div>

      {/* Category */}
      <div className="addproduct-itemfield">
        <p>Category</p>
        <select name="category" value={productDetails.category} onChange={changeHandler}>
          <option value="women">Women</option>
          <option value="men">Men</option>
          <option value="kids">Kids</option>
        </select>
      </div>

      {/* Main Image */}
      <div className="addproduct-itemfield">
        <label htmlFor="file-input">
          <img className="addproduct-thumbnail-img" src={image ? URL.createObjectURL(image) : upload_area} alt="Upload Preview" />
        </label>
        <input onChange={imageHandler} type="file" id="file-input" hidden accept="image/*" />
      </div>

      {/* Optional Thumbnails */}
      <div className="addproduct-itemfield">
        <p>Optional Thumbnails (multiple)</p>
        <input type="file" multiple accept="image/*" onChange={thumbnailsHandler} />
      </div>

      {/* Optional Stock */}
      <div className="addproduct-itemfield">
        <p>Stock (optional, default 10)</p>
        <input type="number" value={stock} onChange={stockHandler} placeholder="Enter stock quantity" />
      </div>

      <button type="submit" className="addproduct-btn">ADD</button>
    </form>
  );
};

export default AddProduct;
