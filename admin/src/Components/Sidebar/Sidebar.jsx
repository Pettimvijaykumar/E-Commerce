import React from "react";
import "./Sidebar.css";
import { Link } from "react-router-dom";

// Import icons
import add_product_icon from "../../assets/Product_Cart.svg";
import list_product_icon from "../../assets/Product_list_icon.svg";
import newsletter_icon from "../../assets/newsletters.png";
import promocode_icon from "../../assets/promocode.png";
import shopping_icon from "../../assets/shopping-bag.png";
const Sidebar = () => {
  return (
    <div className="sidebar">
      {/* Add Product Link */}
      <Link to="addproduct" style={{ textDecoration:"none" }}>
  <div className="sidebar-item">
    <img src={add_product_icon} alt="Add Product" className="sidebar-icon" />
    <p>Add Product</p>
  </div>
</Link>

<Link to="listproduct" style={{ textDecoration:"none" }}>
  <div className="sidebar-item">
    <img src={list_product_icon} alt="Product List" className="sidebar-icon" />
    <p>Product List</p>
  </div>
</Link>
<Link to="newsletters" style={{textDecoration:"none"}}>
<div className="sidebar-item">
  <img src={newsletter_icon} alt="" className="sidebar-icon" />
  <p>News Letters</p>
</div>
</Link>
<Link to="promocode" style={{textDecoration:"none"}}>
<div className="sidebar-item">
  <img src={promocode_icon} alt="" className="sidebar-icon" />
  <p>Add PromoCode</p>
</div>
</Link>
<Link to="orders" style={{textDecoration:"none"}}>
<div className="sidebar-item">
  <img src={shopping_icon} alt="" className="sidebar-icon" />
  <p>Orders</p>
</div>
</Link>
<Link to="notification" style={{textDecoration:"none"}}>
<div className="sidebar-item">
  <img src={shopping_icon} alt="" className="sidebar-icon" />
  <p>Notification</p>
</div>
</Link>
    </div>
  );
};

export default Sidebar;
