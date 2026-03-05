import React from 'react';

const CartItem = ({ item, onUpdateQuantity, onRemove }) => {
  const atStockLimit = item.sizeStock !== undefined && item.quantity >= item.sizeStock;

  return (
    <div className="cart-item">
      <div className="cart-item-header">
        <div>
          <h4>{item.name}</h4>
          {item.size && (
            <span style={{
              display: 'inline-block',
              marginTop: '0.15rem',
              fontSize: '0.7rem',
              fontWeight: 700,
              padding: '0.1rem 0.45rem',
              borderRadius: '4px',
              background: 'rgba(0,255,163,0.12)',
              color: 'var(--accent-green)',
              border: '1px solid rgba(0,255,163,0.25)',
              letterSpacing: '0.05em'
            }}>
              {item.size}
            </span>
          )}
        </div>
        <button className="btn-remove" onClick={() => onRemove(item.cartKey)}>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>

      <div className="cart-item-controls">
        <span className="cart-item-price">LKR {item.price.toFixed(2)}</span>

        <div className="quantity-controls">
          <button
            className="btn-qty"
            onClick={() => onUpdateQuantity(item.cartKey, item.quantity - 1)}
            disabled={item.quantity <= 1}
          >-</button>
          <span className="qty-display">{item.quantity}</span>
          <button
            className="btn-qty"
            onClick={() => onUpdateQuantity(item.cartKey, item.quantity + 1)}
            disabled={atStockLimit}
            title={atStockLimit ? `Max stock: ${item.sizeStock}` : ''}
          >+</button>
        </div>

        <div className="cart-item-total">
          LKR {(item.price * item.quantity).toFixed(2)}
        </div>
      </div>

      {atStockLimit && (
        <p style={{ fontSize: '0.7rem', color: '#ff4757', marginTop: '0.15rem' }}>
          Max stock reached for size {item.size} ({item.sizeStock})
        </p>
      )}
    </div>
  );
};

export default CartItem;
