import React from 'react';
import './Admin.css';
import Sidebar from '../../Components/Sidebar/Sidebar';
import { Routes, Route } from 'react-router-dom';

// Import your pages/components
import ListProducts from '../../Components/ListProducts/ListProducts';
import AddProduct from '../../Components/AddProduct/AddProduct';
import NewsLetter from '../../Components/NewsLetters/NewsLetter';
import PromoCode from '../../Components/PromoCode/PromoCode';
import Orders from '../../Components/Orders/Orders';
import AdminNotification from '../../Components/AdminNotification/AdminNotification';

const Admin = () => {
  return (
    <div className="admin">
      {/* Sidebar on the left */}
      <Sidebar />

      {/* Main content area */}
      <div className="admin-content">
        <Routes>
          <Route path="/addproduct" element={<AddProduct/>} />
          <Route path="/listproduct" element={<ListProducts />} />
          <Route path="/newsletters" element={<NewsLetter/>} />
          <Route path="/promocode" element={<PromoCode/>} />
          <Route path="/orders" element={<Orders/>}/>
          <Route path="/notification" element={<AdminNotification/>}/>
          {/* Default welcome page */}
          <Route
            path="/"
            element={
              <div className="welcome">
                <h1>Welcome to Admin Panel</h1>
                <p>Here you can manage products.</p>
              </div>
            }
          />
        </Routes>
      </div>
    </div>
  );
};

export default Admin;
