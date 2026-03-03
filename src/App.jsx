import { useState, useEffect } from 'react';
import ItemCard from './components/ItemCard';
import CartItem from './components/CartItem';

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

  // Fetch items from API on load
  useEffect(() => {
    const fetchItems = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/items');
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

  // Add an item to the cart
  const handleAddItem = (item) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((cartItem) => cartItem.id === item.id);
      if (existingItem) {
        return prevCart.map((cartItem) =>
          cartItem.id === item.id
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        );
      }
      return [...prevCart, { ...item, quantity: 1 }];
    });
  };

  // Update quantity of a cart item
  const handleUpdateQuantity = (id, newQuantity) => {
    if (newQuantity < 1) return;
    setCart((prevCart) =>
      prevCart.map((item) =>
        item.id === id ? { ...item, quantity: newQuantity } : item
      )
    );
  };

  // Remove item from cart
  const handleRemoveItem = (id) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== id));
  };

  // Calculate cart total
  const cartTotal = cart.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );

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
      billText += `${item.name.toUpperCase()}\n`;
      billText += `Qty: ${item.quantity}  x  LKR ${item.price.toFixed(2)}  =  LKR ${(item.quantity * item.price).toFixed(2)}\n`;
      billText += "---------------------------\n";
    });

    billText += `\n*TOTAL DUE: LKR ${cartTotal.toFixed(2)}*\n`;
    billText += "===========================\n";
    if (customerEmail) billText += `Email: ${customerEmail}\n`;
    billText += "Thank you for shopping with us!\n";

    // Call backend to save sale
    try {
      await fetch('http://localhost:5000/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart,
          totalAmount: cartTotal,
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
      total: cartTotal,
      date: new Date().toLocaleString(),
      orderNumber: orderNum
    };
    setSaleData(finalSale);
    setIsGenerated(true);
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
  };

  return (
    <div className="app-container">
      {/* Header */}
      <header className="app-header">
        <div className="logo-area">
          <img src="/logo.png" alt="Vergo Logo" className="app-logo" />
          <h4>POS</h4>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
          <p className="subtitle">Point of Sale</p>
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
                  onAdd={() => handleAddItem({ id: item._id, ...item })} 
                />
              ))}
            </div>
          )}
        </section>

        {/* Right Column: Cart Summary */}
        <aside className="cart-section">
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

          {/* Cart Footer / Totals */}
          <div className="cart-footer">
            <div className="email-input-container" style={{ gap: '1rem' }}>
              <div className="input-field">
                <label htmlFor="customer-name">Customer Name</label>
                <input 
                  type="text" 
                  id="customer-name" 
                  placeholder="e.g. John Doe"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="email-input"
                  style={{ marginBottom: '1rem' }}
                />
              </div>

              <div className="input-field">
                <label htmlFor="customer-email">Customer Email (Optional)</label>
                <input 
                  type="email" 
                  id="customer-email" 
                  placeholder="customer@example.com"
                  value={customerEmail}
                  onChange={(e) => {
                    setCustomerEmail(e.target.value);
                    setEmailError('');
                  }}
                  className={`email-input ${emailError ? 'error-border' : ''}`}
                  style={emailError ? { borderColor: '#ff4757' } : {}}
                />
                {emailError && <div style={{ color: '#ff4757', fontSize: '0.8rem', marginTop: '0.25rem' }}>{emailError}</div>}
              </div>
            </div>

            <div className="totals-row">
              <span>Total Items:</span>
              <span>{cart.reduce((sum, i) => sum + i.quantity, 0)}</span>
            </div>
            <div className="totals-row grand-total">
              <span>Total Due:</span>
              <span className="total-amount">LKR {cartTotal.toFixed(2)}</span>
            </div>
            <button 
              className={`btn-bill ${cart.length === 0 ? 'disabled' : ''}`}
              onClick={handleProceedToBill}
              disabled={cart.length === 0}
            >
              Proceed to Bill
            </button>
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
                          <td>{item.name}</td>
                          <td>{item.quantity}</td>
                          <td>LKR {(item.price * item.quantity).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <h3 className="summary-total">Total: LKR {cartTotal.toFixed(2)}</h3>
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
                    <img src="/logo-black.png" alt="Vergo Logo" style={{ height: '40px', marginBottom: '0.5rem' }} />
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
                          <td style={{ fontWeight: '600' }}>{item.name.toUpperCase()}</td>
                          <td style={{ textAlign: 'center' }}>{item.quantity}</td>
                          <td style={{ textAlign: 'right', fontWeight: '600' }}>{(item.price * item.quantity).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  
                  <div className="receipt-total-section" style={{ background: '#f9f9f9', padding: '1rem', borderRadius: '4px' }}>
                    <div className="receipt-total-row">
                      <span style={{ color: '#666' }}>SUBTOTAL</span>
                      <span style={{ fontWeight: '600' }}>LKR {saleData.total.toFixed(2)}</span>
                    </div>
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
