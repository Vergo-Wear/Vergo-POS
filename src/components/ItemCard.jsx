import React, { useState } from 'react';

const SIZES = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL'];

const ItemCard = ({ item, onAdd }) => {
  const [showSizePicker, setShowSizePicker] = useState(false);

  // Support both legacy flat number stock and new per-size object stock
  const isLegacyStock = typeof item.stock === 'number';
  const stockMap = (!isLegacyStock && item.stock && typeof item.stock === 'object') ? item.stock : {};

  const availableSizes = isLegacyStock
    ? []   // legacy items have no size info; handled separately
    : SIZES.filter(s => (stockMap[s] || 0) > 0);

  const totalStock = isLegacyStock
    ? item.stock
    : availableSizes.reduce((sum, s) => sum + (stockMap[s] || 0), 0);

  // Only mark out-of-stock when ALL sizes (or the flat number) are 0
  const outOfStock = totalStock <= 0;

  const handleSizeSelect = (size) => {
    setShowSizePicker(false);
    onAdd(size);
  };

  return (
    <div
      className={`item-card ${outOfStock ? 'out-of-stock' : ''}`}
      style={outOfStock ? { cursor: 'not-allowed', opacity: 0.5 } : {}}
    >
      <div className="item-info">
        <h3>{item.name}</h3>
        <span className="item-category">{item.category}</span>
      </div>

      {/* Size / stock display */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', marginTop: '0.5rem' }}>
        {outOfStock ? (
          <span style={{ fontSize: '0.72rem', color: '#ff4757', fontWeight: 700 }}>Out of Stock</span>
        ) : isLegacyStock ? (
          <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
            Stock: {item.stock} &nbsp;<span style={{ opacity: 0.5 }}>(set sizes in admin)</span>
          </span>
        ) : (
          availableSizes.map(s => (
            <span key={s} style={{
              fontSize: '0.68rem',
              fontWeight: 700,
              padding: '0.1rem 0.4rem',
              borderRadius: '4px',
              background: (stockMap[s] || 0) <= 3 ? 'rgba(255,71,87,0.15)' : 'rgba(0,255,163,0.1)',
              color: (stockMap[s] || 0) <= 3 ? '#ff4757' : 'var(--accent-green)',
              border: `1px solid ${(stockMap[s] || 0) <= 3 ? 'rgba(255,71,87,0.3)' : 'rgba(0,255,163,0.2)'}`,
            }}>
              {s} ({stockMap[s]})
            </span>
          ))
        )}
      </div>

      <div className="item-action" style={{ marginTop: '0.75rem', position: 'relative' }}>
        <span className="item-price">LKR {item.price.toFixed(2)}</span>

        {!outOfStock && (
          <div style={{ position: 'relative' }}>
            <button
              className="btn-add"
              onClick={(e) => {
                e.stopPropagation();
                if (isLegacyStock) {
                  // Legacy: no size selection, add directly without size
                  onAdd(null);
                } else {
                  setShowSizePicker(p => !p);
                }
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
            </button>

            {/* Size picker dropdown (only for per-size stock items) */}
            {showSizePicker && !isLegacyStock && (
              <div className="size-picker-dropdown" onClick={e => e.stopPropagation()}>
                <p className="size-picker-title">Select Size</p>
                {availableSizes.map(s => (
                  <button key={s} className="size-picker-btn" onClick={() => handleSizeSelect(s)}>
                    <span>{s}</span>
                    <span style={{ fontSize: '0.72rem', opacity: 0.65 }}>({stockMap[s]} left)</span>
                  </button>
                ))}
                <button className="size-picker-close" onClick={() => setShowSizePicker(false)}>Cancel</button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ItemCard;
