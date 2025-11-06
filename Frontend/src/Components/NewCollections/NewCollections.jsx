import React, { useEffect, useState } from "react";
import "./NewCollections.css";
import Item from "../Item/Item";

const NewCollections = () => {
  const [newCollection, setNewCollection] = useState([]);

  // fetch data from backend
  useEffect(() => {
    fetch("http://localhost:2005/newcollections")
      .then((res) => res.json())
      .then((data) => setNewCollection(data))
      .catch((err) => console.error("Error fetching new collections:", err));
  }, []);

  return (
    <div id="new-collections" className="new-collections">
      <h1>NEW COLLECTIONS</h1>
      <hr />
      <div className="collections">
        {newCollection.length > 0 ? (
          newCollection.map((item, i) => (
            <Item
              key={i}
              id={item.id}
              name={item.name}
              brand={item.brand}
              image={item.image}
              new_price={item.new_price}
              old_price={item.old_price}
            />
          ))
        ) : (
          <p className="loading-text">Loading new collections...</p>
        )}
      </div>
    </div>
  );
};

export default NewCollections;
