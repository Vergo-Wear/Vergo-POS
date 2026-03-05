import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ItemCard from './components/ItemCard';
import CartItem from './components/CartItem';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function App() {
  const [cart, setCart] = useState([]);
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [emailError, setEmailError] = useState('');
  const [items, setItems] = useState([]);
  const [loadingItems, setLoadingItems] = useState(true);
  const [showSummary, setShowSummary] = useState(false);
  const [isGenerated, setIsGenerated] = useState(false);
  const [saleData, setSaleData] = useState(null);
  const [discount, setDiscount] = useState('');
  const [discountType, setDiscountType] = useState('amount'); // 'amount' or 'percent'

  const navigate = useNavigate();

  // Check for authentication
  useEffect(() => {
    const token = localStorage.getItem('sellerToken');
    if (!token) {
      navigate('/seller-login');
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('sellerToken');
    navigate('/seller-login');
  };

  // Fetch items from API on load
  useEffect(() => {
    const fetchItems = async () => {
      try {
        const res = await fetch(`${API_URL}/api/items`);
        const data = await res.json();
        setItems(data);
      } catch (err) {
        console.error('Failed to fetch items:', err);
      } finally {
        setLoadingItems(false);
      }
    };
    fetchItems();
  }, []);

  // Add an item to the cart — handles both legacy (null size) and per-size stock
  const handleAddItem = (item, size) => {
    const isLegacy = size === null || size === undefined;
    const cartKey = isLegacy ? `${item._id}-nosize` : `${item._id}-${size}`;

    // Stock limit for this cart entry
    const sizeStock = isLegacy
      ? (typeof item.stock === 'number' ? item.stock : 0)
      : ((item.stock && item.stock[size]) || 0);

    setCart((prevCart) => {
      const existingItem = prevCart.find((ci) => ci.cartKey === cartKey);
      if (existingItem) {
        if (existingItem.quantity >= sizeStock) return prevCart;
        return prevCart.map((ci) =>
          ci.cartKey === cartKey ? { ...ci, quantity: ci.quantity + 1 } : ci
        );
      }
      if (sizeStock <= 0) return prevCart;
      return [...prevCart, { ...item, id: item._id, cartKey, size: size || null, sizeStock, quantity: 1 }];
    });
  };

  // Update quantity (uses cartKey)
  const handleUpdateQuantity = (cartKey, newQuantity) => {
    if (newQuantity < 1) return;
    setCart((prevCart) =>
      prevCart.map((item) => {
        if (item.cartKey !== cartKey) return item;
        const clamped = item.sizeStock !== undefined ? Math.min(newQuantity, item.sizeStock) : newQuantity;
        return { ...item, quantity: clamped };
      })
    );
  };

  // Remove item (uses cartKey)
  const handleRemoveItem = (cartKey) => {
    setCart((prevCart) => prevCart.filter((item) => item.cartKey !== cartKey));
  };

  // Calculate cart total
  const cartTotal = cart.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );

  // Calculate discount
  const discountValue = parseFloat(discount) || 0;
  const discountAmount = discountType === 'percent'
    ? Math.min((cartTotal * discountValue) / 100, cartTotal)
    : Math.min(discountValue, cartTotal);
  const finalTotal = Math.max(cartTotal - discountAmount, 0);

  // Proceed to Summary
  const handleProceedToBill = () => {
    setEmailError('');
    if (cart.length === 0) {
      setEmailError("Cart is empty. Please add items.");
      return;
    }
    if (customerEmail && !customerEmail.includes('@')) {
      setEmailError("Please enter a valid email address or leave it empty.");
      return;
    }
    if (discountValue < 0) {
      setEmailError("Discount cannot be negative.");
      return;
    }
    setIsGenerated(false);
    setSaleData(null);
    setShowSummary(true);
  };

  // Generate Bill (Email + Save to DB)
  const handleGenerateBill = async () => {
    // Generate a unique order number for identification
    const orderNum = `VRG-${Math.floor(1000 + Math.random() * 9000)}-${Date.now().toString().slice(-4)}`;
    
    let billText = "VERGO WEAR OFFICIAL - STORE RECEIPT\n";
    billText += "===========================\n";
    billText += `ORDER NUMBER: ${orderNum}\n`;
    billText += `CUSTOMER: ${customerName || 'Guest'}\n`;
    billText += "===========================\n\n";
    
    cart.forEach(item => {
      const sizePart = item.size ? ` [${item.size}]` : '';
      billText += `${item.name.toUpperCase()}${sizePart}\n`;
      billText += `Qty: ${item.quantity}  x  LKR ${item.price.toFixed(2)}  =  LKR ${(item.quantity * item.price).toFixed(2)}\n`;
      billText += "---------------------------\n";
    });

    billText += `\nSUBTOTAL:  LKR ${cartTotal.toFixed(2)}\n`;
    if (discountAmount > 0) {
      billText += discountType === 'percent'
        ? `DISCOUNT:  -LKR ${discountAmount.toFixed(2)} (${discountValue}%)\n`
        : `DISCOUNT:  -LKR ${discountAmount.toFixed(2)}\n`;
    }
    billText += `*TOTAL DUE: LKR ${finalTotal.toFixed(2)}*\n`;
    billText += "===========================\n";
    if (customerEmail) billText += `Email: ${customerEmail}\n`;
    billText += "Thank you for shopping with us!\n";

    // Call backend to save sale
    try {
      await fetch(`${API_URL}/api/sales`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart,
          subtotalAmount: cartTotal,
          discountAmount: discountAmount,
          totalAmount: finalTotal,
          customerEmail: customerEmail || 'N/A',
          customerName: customerName || 'Guest',
          orderNumber: orderNum
        })
      });
    } catch (err) {
      console.error('Failed to log sale:', err);
    }

    // Only open mail client if email is provided
    if (customerEmail) {
      const subject = encodeURIComponent(`Invoice: ${orderNum} - Vergo Wear Official`);
      const body = encodeURIComponent(billText);
      const mailtoUrl = `mailto:${customerEmail}?subject=${subject}&body=${body}`;
      window.location.href = mailtoUrl;
    }
    
    // Final data for the receipt
    const finalSale = {
      customerEmail: customerEmail || 'N/A',
      customerName: customerName || 'Guest',
      items: [...cart],
      subtotal: cartTotal,
      discountAmount: discountAmount,
      discountType: discountType,
      discountValue: discountValue,
      total: finalTotal,
      date: new Date().toLocaleString(),
      orderNumber: orderNum
    };
    setSaleData(finalSale);
    setIsGenerated(true);

    // Refresh item list so stock counts update on the product grid
    try {
      const res = await fetch(`${API_URL}/api/items`);
      if (res.ok) setItems(await res.json());
    } catch (_) {}
  };

  const handlePrint = () => {
    window.print();
  };

  const resetAll = () => {
    setShowSummary(false);
    setIsGenerated(false);
    setSaleData(null);
    setCart([]);
    setCustomerEmail('');
    setCustomerName('');
    setEmailError('');
    setDiscount('');
    setDiscountType('amount');
  };

  return (
    <div className="app-container">
      {/* Header */}
      <header className="app-header">
        <div className="logo-area">
          <img src="/logo white.png" alt="Vergo Logo" className="app-logo" />
          <h4>POS</h4>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
          <p className="subtitle">Point of Sale</p>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <a 
              href="/login" 
              style={{ 
                color: 'var(--accent-green)', 
                textDecoration: 'none', 
                fontSize: '0.9rem', 
                fontWeight: '500',
                border: '1px solid var(--accent-green)',
                padding: '0.4rem 0.8rem',
                borderRadius: '4px'
              }}
            >
              Admin Panel
            </a>
            <button 
              onClick={handleLogout}
              style={{ 
                background: 'transparent',
                color: '#ff4757', 
                border: '1px solid #ff4757',
                padding: '0.4rem 0.8rem',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '0.9rem',
                fontWeight: '500'
              }}
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="main-content">
        
        {/* Left Column: Products Grid */}
        <section className="products-section">
          <h2>Available Items</h2>
          {loadingItems ? (
            <p style={{ color: 'var(--text-secondary)' }}>Loading inventory...</p>
          ) : items.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)' }}>No items found in the database.</p>
          ) : (
            <div className="products-grid">
              {items.map((item) => (
                <ItemCard
                  key={item._id}
                  item={item}
                  onAdd={(size) => handleAddItem({ id: item._id, _id: item._id, ...item }, size)}
                />
              ))}
            </div>
          )}
        </section>

        {/* Right: Cart — two columns side by side */}
        <aside className="cart-section">

          {/* LEFT: Cart Items */}
          <div className="cart-left">
            <h2>Current Order</h2>
            <div className="cart-items-container">
              {cart.length === 0 ? (
                <div className="empty-cart-state">
                  <p>No items selected.</p>
                  <p>Tap items to add them to the bill.</p>
                </div>
              ) : (
                cart.map((item) => (
                  <CartItem
                    key={item.id}
                    item={item}
                    onUpdateQuantity={handleUpdateQuantity}
                    onRemove={handleRemoveItem}
                  />
                ))
              )}
            </div>
          </div>

          {/* RIGHT: Customer Details + Billing */}
          <div className="cart-right">
            <h2>Customer Details</h2>
            <div className="cart-right-body">

              {/* Customer Name */}
              <div className="input-field">
                <label htmlFor="customer-name" className="cart-label">Customer Name</label>
                <input
                  type="text"
                  id="customer-name"
                  placeholder="e.g. John Doe"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="email-input"
                />
              </div>

              {/* Customer Email */}
              <div className="input-field">
                <label htmlFor="customer-email" className="cart-label">Customer Email <span style={{ fontWeight: 400, opacity: 0.6 }}>(Optional)</span></label>
                <input
                  type="email"
                  id="customer-email"
                  placeholder="customer@example.com"
                  value={customerEmail}
                  onChange={(e) => { setCustomerEmail(e.target.value); setEmailError(''); }}
                  className={`email-input ${emailError ? 'error-border' : ''}`}
                  style={emailError ? { borderColor: '#ff4757' } : {}}
                />
                {emailError && <div style={{ color: '#ff4757', fontSize: '0.75rem', marginTop: '0.25rem' }}>{emailError}</div>}
              </div>

              {/* Discount */}
              <div className="discount-block">
                <label className="cart-label">Discount <span style={{ fontWeight: 400, opacity: 0.6 }}>(Optional)</span></label>
                <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                  <input
                    type="number"
                    id="discount-input"
                    min="0"
                    step="1"
                    placeholder={discountType === 'percent' ? '10' : '500'}
                    value={discount}
                    onChange={(e) => setDiscount(e.target.value)}
                    style={{ flex: 1, padding: '0.4rem 0.5rem', background: 'var(--bg-color)', color: '#fff', border: '1px solid var(--border-color)', borderRadius: '6px', fontSize: '0.85rem', fontFamily: 'inherit' }}
                  />
                  <div style={{ display: 'flex', border: '1px solid var(--border-color)', borderRadius: '6px', overflow: 'hidden' }}>
                    <button onClick={() => setDiscountType('amount')} style={{ padding: '0.4rem 0.55rem', background: discountType === 'amount' ? 'var(--accent-green)' : 'transparent', color: discountType === 'amount' ? '#000' : 'var(--text-secondary)', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.78rem' }}>LKR</button>
                    <button onClick={() => setDiscountType('percent')} style={{ padding: '0.4rem 0.55rem', background: discountType === 'percent' ? 'var(--accent-green)' : 'transparent', color: discountType === 'percent' ? '#000' : 'var(--text-secondary)', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.78rem' }}>%</button>
                  </div>
                </div>
                {discountAmount > 0 && <p style={{ fontSize: '0.72rem', color: 'var(--accent-green)', marginTop: '0.25rem' }}>Saving: LKR {discountAmount.toFixed(2)}</p>}
              </div>

              {/* Totals */}
              <div className="cart-totals">
                <div className="totals-row">
                  <span>Total Items:</span>
                  <span>{cart.reduce((sum, i) => sum + i.quantity, 0)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="totals-row" style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>
                    <span>Subtotal:</span><span>LKR {cartTotal.toFixed(2)}</span>
                  </div>
                )}
                {discountAmount > 0 && (
                  <div className="totals-row" style={{ color: '#ff6b81', fontSize: '0.82rem' }}>
                    <span>Discount{discountType === 'percent' ? ` (${discountValue}%)` : ''}:</span>
                    <span>- LKR {discountAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="totals-row grand-total">
                  <span>Total Due:</span>
                  <span className="total-amount">LKR {finalTotal.toFixed(2)}</span>
                </div>
              </div>

              <button
                className={`btn-bill ${cart.length === 0 ? 'disabled' : ''}`}
                onClick={handleProceedToBill}
                disabled={cart.length === 0}
              >
                Proceed to Bill
              </button>
            </div>
          </div>

        </aside>


      </main>

      {/* Bill Summary Modal */}
      {showSummary && (
        <div className="modal-overlay">
          <div className="summary-modal" style={{ maxWidth: isGenerated ? '450px' : '500px' }}>
            {!isGenerated ? (
              <>
                <h2>Order Summary</h2>
                <div className="summary-details">
                  <p><strong>Customer Name:</strong> {customerName || 'Guest'}</p>
                  <p><strong>Customer Email:</strong> {customerEmail || 'N/A'}</p>
                  <table className="summary-table">
                    <thead>
                      <tr>
                        <th>Item</th>
                        <th>Qty</th>
                        <th>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cart.map((item, idx) => (
                        <tr key={idx}>
                          <td>
                            {item.name}
                            {item.size && <span style={{ marginLeft: '0.4rem', fontSize: '0.7rem', fontWeight: 700, padding: '0.1rem 0.35rem', borderRadius: '3px', background: 'rgba(0,255,163,0.12)', color: 'var(--accent-green)', border: '1px solid rgba(0,255,163,0.25)' }}>{item.size}</span>}
                          </td>
                          <td>{item.quantity}</td>
                          <td>LKR {(item.price * item.quantity).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div style={{ marginTop: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem' }}>
                    {discountAmount > 0 && (
                      <>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>
                          <span>Subtotal</span><span>LKR {cartTotal.toFixed(2)}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: '#ff6b81', marginBottom: '0.3rem' }}>
                          <span>Discount{discountType === 'percent' ? ` (${discountValue}%)` : ''}</span>
                          <span>- LKR {discountAmount.toFixed(2)}</span>
                        </div>
                      </>
                    )}
                    <h3 className="summary-total">Total: LKR {finalTotal.toFixed(2)}</h3>
                  </div>
                </div>
                <div className="modal-actions">
                  <button className="btn-secondary" onClick={() => setShowSummary(false)}>Back to Cart</button>
                  <button className="btn-bill" onClick={handleGenerateBill}>Bill</button>
                </div>
              </>
            ) : (
              <div className="receipt-view">
                <div className="success-icon">✓</div>
                <h3 style={{ textAlign: 'center', marginBottom: '1.5rem', color: 'var(--accent-green)' }}>Sale Recorded Successfully</h3>
                
                <div className="receipt-container">
                  <div className="receipt-header">
                    <img src="/logo black.png" alt="Vergo Logo" style={{ height: '40px', marginBottom: '0.5rem' }} />
                    <h2 style={{ fontWeight: '800', letterSpacing: '1px' }}>VERGO OFFICIAL</h2>
                    <p style={{ fontSize: '0.8rem', opacity: 0.8 }}>PREMIUM CLOTHING STORE</p>
                  </div>

                    <div className="receipt-info" style={{ borderBottom: '1px solid #eee', paddingBottom: '0.5rem' }}>
                    <span style={{ fontWeight: '600' }}>Order: {saleData.orderNumber}</span>
                    <span>{saleData.date}</span>
                  </div>

                  <div style={{ marginTop: '1rem', marginBottom: '1.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <p style={{ fontSize: '0.8rem', opacity: 0.6 }}>CUSTOMER NAME</p>
                      <p style={{ fontSize: '0.95rem', fontWeight: '700' }}>{saleData.customerName.toUpperCase()}</p>
                    </div>
                    <div>
                      <p style={{ fontSize: '0.8rem', opacity: 0.6 }}>CUSTOMER EMAIL</p>
                      <p style={{ fontSize: '0.95rem', fontWeight: '700' }}>{saleData.customerEmail}</p>
                    </div>
                  </div>
                  
                  <table className="receipt-table">
                    <thead>
                      <tr>
                        <th style={{ fontWeight: '700', color: '#000' }}>ITEM</th>
                        <th style={{ fontWeight: '700', color: '#000', textAlign: 'center' }}>QTY</th>
                        <th style={{ fontWeight: '700', color: '#000', textAlign: 'right' }}>PRICE</th>
                      </tr>
                    </thead>
                    <tbody>
                      {saleData.items.map((item, idx) => (
                        <tr key={idx}>
                          <td style={{ fontWeight: '600' }}>
                            {item.name.toUpperCase()}
                            {item.size && <span style={{ marginLeft: '0.4rem', fontSize: '0.68rem', fontWeight: 700, padding: '0.1rem 0.35rem', borderRadius: '3px', background: '#eee', color: '#333' }}>{item.size}</span>}
                          </td>
                          <td style={{ textAlign: 'center' }}>{item.quantity}</td>
                          <td style={{ textAlign: 'right', fontWeight: '600' }}>{(item.price * item.quantity).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  
                  <div className="receipt-total-section" style={{ background: '#f9f9f9', padding: '1rem', borderRadius: '4px' }}>
                    <div className="receipt-total-row">
                      <span style={{ color: '#666' }}>SUBTOTAL</span>
                      <span style={{ fontWeight: '600' }}>LKR {saleData.subtotal.toFixed(2)}</span>
                    </div>
                    {saleData.discountAmount > 0 && (
                      <div className="receipt-total-row" style={{ color: '#e84393' }}>
                        <span>DISCOUNT{saleData.discountType === 'percent' ? ` (${saleData.discountValue}%)` : ''}</span>
                        <span style={{ fontWeight: '600' }}>- LKR {saleData.discountAmount.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="receipt-total-row receipt-grand-total" style={{ borderTop: '2px solid #000', paddingTop: '0.5rem' }}>
                      <span style={{ fontWeight: '800' }}>TOTAL AMOUNT</span>
                      <span style={{ fontWeight: '800', fontSize: '1.6rem' }}>LKR {saleData.total.toFixed(2)}</span>
                    </div>
                  </div>
                  
                  <div className="receipt-footer" style={{ borderTop: '1px dashed #ddd', paddingTop: '1rem' }}>
                    <p style={{ fontWeight: '700', color: '#000' }}>THANK YOU FOR YOUR PURCHASE!</p>
                    <p style={{ marginTop: '0.25rem' }}>Please keep this receipt for your records.</p>
                  </div>
                </div>

                <div className="modal-actions" style={{ marginTop: '2rem' }}>
                  <button className="btn-secondary" onClick={handlePrint}>🖨️ Print Receipt</button>
                  <button className="btn-bill" onClick={resetAll}>Done / New Order</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
