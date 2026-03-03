import React from 'react';

const ItemCard = ({ item, onAdd }) => {
  const outOfStock = item.stock <= 0;

  return (
    <div
      className={`item-card ${outOfStock ? 'out-of-stock' : ''}`}
      onClick={!outOfStock ? onAdd : undefined}
      style={outOfStock ? { cursor: 'not-allowed', opacity: 0.5 } : {}}
    >
      <div className="item-info">
        <h3>{item.name}</h3>
        <span className="item-category">{item.category}</span>
      </div>
      <div className="item-action">
        <span className="item-price">LKR {item.price.toFixed(2)}</span>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.25rem' }}>
          <span style={{
            fontSize: '0.72rem',
            fontWeight: '600',
            color: item.stock <= 5 ? '#ff4757' : 'var(--text-secondary)',
            letterSpacing: '0.03em'
          }}>
            {outOfStock ? 'Out of Stock' : `Stock: ${item.stock}`}
          </span>
          <button className="btn-add" disabled={outOfStock} onClick={(e) => { e.stopPropagation(); if (!outOfStock) onAdd(); }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ItemCard;
