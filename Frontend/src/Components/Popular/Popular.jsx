import React, { useEffect, useState } from 'react';
import './Popular.css';
import Item from '../Item/Item';

const Popular = () => {
  const [women, setWomen] = useState([]);
  const [men, setMen] = useState([]);
  const [kids, setKids] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [resWomen, resMen, resKids] = await Promise.all([
          fetch("http://localhost:2005/popularinwomen"),
          fetch("http://localhost:2005/popularinmen"),
          fetch("http://localhost:2005/popularinkids"),
        ]);

        const womenData = await resWomen.json();
        const menData = await resMen.json();
        const kidsData = await resKids.json();

        setWomen(womenData);
        setMen(menData);
        setKids(kidsData);
      } catch (err) {
        console.error("Error fetching popular products:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return <p>Loading popular products...</p>;
  }

  return (
    <div className="popular">
      {/* Women */}
      <h1>POPULAR IN WOMEN</h1>
      <hr />
      <div className="popular-item">
        {women.map((item, i) => (
          <Item
            key={i}
            id={item.id}
            name={item.name}
            brand={item.brand}
            image={item.image}
            new_price={item.new_price}
            old_price={item.old_price}
          />
        ))}
      </div>

      {/* Men */}
      <h1>POPULAR IN MEN</h1>
      <hr />
      <div className="popular-item">
        {men.map((item, i) => (
          <Item
            key={i}
            id={item.id}
            name={item.name}
            brand={item.brand}
            image={item.image}
            new_price={item.new_price}
            old_price={item.old_price}
          />
        ))}
      </div>

      {/* Kids */}
      <h1>POPULAR IN KIDS</h1>
      <hr />
      <div className="popular-item">
        {kids.map((item, i) => (
          <Item
            key={i}
            id={item.id}
            name={item.name}
            brand={item.brand}
            image={item.image}
            new_price={item.new_price}
            old_price={item.old_price}
          />
        ))}
      </div>
    </div>
  );
};

export default Popular;
