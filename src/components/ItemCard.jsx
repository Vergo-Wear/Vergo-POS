import React from 'react';

const ItemCard = ({ item, onAdd }) => {
  return (
    <div className="item-card" onClick={onAdd}>
      <div className="item-info">
        <h3>{item.name}</h3>
        <span className="item-category">{item.category}</span>
      </div>
      <div className="item-action">
        <span className="item-price">LKR {item.price.toFixed(2)}</span>
        <button className="btn-add">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
        </button>
      </div>
    </div>
  );
};

export default ItemCard;
