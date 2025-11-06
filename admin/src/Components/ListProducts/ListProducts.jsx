import React, { useEffect, useState } from "react";
import "./ListProducts.css";
import cross_icon from "../../assets/cross_icon.png";

// ✅ Update product API function
const updateProduct = async (id, updatedData) => {
  try {
    let res = await fetch(`http://localhost:2005/updateproduct/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updatedData),
    });

    let data = await res.json();
    if (data.success) {
      return data.product;
    } else {
      alert("❌ Failed to update product!");
    }
  } catch (err) {
    console.error("❌ Error updating product:", err);
    alert("⚠️ Something went wrong while updating!");
  }
};

const ListProducts = () => {
  const [allProducts, setAllProducts] = useState([]);
  const [editProductId, setEditProductId] = useState(null);
  const [editForm, setEditForm] = useState({ name: "", brand: "", category: "", new_price: "" });

  // Fetch all products from backend
  const fetchInfo = async () => {
    try {
      const res = await fetch("http://localhost:2005/allproducts"); 
      const data = await res.json();
      setAllProducts(data);
    } catch (err) {
      console.error("❌ Error fetching products:", err);
    }
  };

  // Delete product handler
  const removeProduct = async (id) => {
    try {
      await fetch(`http://localhost:2005/removeproduct/${id}`, {
        method: "DELETE",
      });
      setAllProducts(allProducts.filter((p) => p._id !== id));
    } catch (err) {
      console.error("❌ Error removing product:", err);
    }
  };

  // Start editing
  const handleEdit = (product) => {
    setEditProductId(product._id);
    setEditForm({
      name: product.name,
      brand: product.brand || "",
      category: product.category,
      new_price: product.new_price,
    });
  };

  // Save updated product
  const handleSave = async (id) => {
    const updatedProduct = await updateProduct(id, editForm);
    if (updatedProduct) {
      setAllProducts((prev) =>
        prev.map((p) => (p._id === id ? updatedProduct : p))
      );
      setEditProductId(null); // Exit edit mode
    }
  };

  useEffect(() => {
    fetchInfo();
  }, []);

  return (
    <div className="list-product">
      <h1>All Products</h1>

      <div className="listproduct-format-main">
        <p>Image</p>
        <p>Name</p>
        <p>Brand</p> {/* ✅ Added brand header */}
        <p>Category</p>
        <p>Old Price</p>
        <p>New Price</p>
        <p>Actions</p>
      </div>

      <hr />

      {allProducts.map((product, index) => (
        <div key={index} className="listproduct-format">
          <img
            src={product.image}
            alt={product.name}
            className="listproduct-product-img"
          />

          {editProductId === product._id ? (
            <>
              {/* Editable fields */}
              <input
                type="text"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              />
              <input
                type="text"
                value={editForm.brand}
                placeholder="Brand"
                onChange={(e) => setEditForm({ ...editForm, brand: e.target.value })}
              />
              <input
                type="text"
                value={editForm.category}
                onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
              />
              <p>${product.old_price}</p>
              <input
                type="number"
                value={editForm.new_price}
                onChange={(e) => setEditForm({ ...editForm, new_price: e.target.value })}
              />

              <div className="listproduct-actions">
                <button className="listproduct-save-btn" onClick={() => handleSave(product._id)}>Save</button>
                <button className="listproduct-cancel-btn" onClick={() => setEditProductId(null)}>Cancel</button>
              </div>
            </>
          ) : (
            <>
              {/* Normal row display */}
              <p>{product.name}</p>
              <p>{product.brand || "-"}</p> {/* ✅ Display brand */}
              <p>{product.category}</p>
              <p className="old-price">${product.old_price}</p>
              <p className="new-price">${product.new_price}</p>

              <div className="listproduct-actions">
                <button className="listproduct-update-btn" onClick={() => handleEdit(product)}>Update</button>
                <img
                  src={cross_icon}
                  alt="Remove"
                  className="listproduct-remove-icon"
                  onClick={() => removeProduct(product._id)}
                />
              </div>
            </>
          )}
        </div>
      ))}
    </div>
  );
};

export default ListProducts;
