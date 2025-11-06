import React, { useState } from 'react';
import './NewsLetter.css';
import axios from 'axios';

const NewsLetter = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  const handleSubscribe = async () => {
    if (!email) return setMessage('Please enter your email');

    try {
      const res = await axios.post('https://e-commerce-h9gr.onrender.com/newsletter/subscribe', { email });
      if (res.data.success) {
        setMessage(res.data.message);
        setEmail('');
      } else {
        setMessage(res.data.message || 'Subscription failed');
      }
    } catch (err) {
      console.error(err);
      setMessage('Server error. Try again later.');
    }
  };

  return (
    <div className="newsletter">
      <h1>Get Exclusive Offers On Your Email</h1>
      <p>Subscribe to our newsletter and stay updated</p>
      <div className="newsletter-input">
        <input
          type="email"
          placeholder="Your Email ID"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <button onClick={handleSubscribe}>Subscribe</button>
      </div>
      {message && <p className="newsletter-message">{message}</p>}
    </div>
  );
};

export default NewsLetter;
