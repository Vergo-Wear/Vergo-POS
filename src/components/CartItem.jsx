import React from 'react';

const CartItem = ({ item, onUpdateQuantity, onRemove }) => {
  const atStockLimit = item.stock !== undefined && item.quantity >= item.stock;

  return (
    <div className="cart-item">
      <div className="cart-item-header">
        <h4>{item.name}</h4>
        <button className="btn-remove" onClick={() => onRemove(item.id)}>
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
            onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
            disabled={item.quantity <= 1}
          >
            -
          </button>
          <span className="qty-display">{item.quantity}</span>
          <button
            className="btn-qty"
            onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
            disabled={atStockLimit}
            title={atStockLimit ? `Max stock: ${item.stock}` : ''}
          >
            +
          </button>
        </div>

        <div className="cart-item-total">
          LKR {(item.price * item.quantity).toFixed(2)}
        </div>
      </div>

      {atStockLimit && (
        <p style={{ fontSize: '0.72rem', color: '#ff4757', marginTop: '0.15rem' }}>
          Max available stock reached ({item.stock})
        </p>
      )}
    </div>
  );
};

export default CartItem;
