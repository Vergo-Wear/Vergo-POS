import React, { useState, useEffect } from 'react';
import AdminLayout from '../components/AdminLayout';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const SIZES = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL'];

const emptyStock = () => {
  const s = {};
  SIZES.forEach(sz => s[sz] = 0);
  return s;
};

const AdminDashboard = () => {
  const [items, setItems] = useState([]);
  const [sales, setSales] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // New Item Form State
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('');
  const [stock, setStock] = useState(emptyStock());
  const [message, setMessage] = useState('');

  // Edit State
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editStock, setEditStock] = useState(emptyStock());

  // Report Modal State
  const [showReports, setShowReports] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  
  // Custom Confirm State
  const [isResetConfirming, setIsResetConfirming] = useState(false);

  // Total inventory value: sum price × total stock across all sizes
  const getTotalStock = (item) => {
    if (!item.stock || typeof item.stock !== 'object') return 0;
    return Object.values(item.stock).reduce((s, v) => s + (v || 0), 0);
  };
  const totalValue = items.reduce((sum, item) => sum + (item.price * getTotalStock(item)), 0);
  const totalSales = sales.reduce((sum, sale) => sum + sale.totalAmount, 0);

  // Fetch Items & Sales
  const fetchItemsAndSales = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const [itemsRes, salesRes, reportsRes] = await Promise.all([
        fetch(`${API_URL}/api/items`),
        fetch(`${API_URL}/api/sales`, {
          headers: { 'x-auth-token': token }
        }),
        fetch(`${API_URL}/api/sales/reports`, {
          headers: { 'x-auth-token': token }
        })
      ]);
      
      const itemsData = await itemsRes.json();
      setItems(itemsData);

      if (salesRes.ok) {
        const salesData = await salesRes.json();
        setSales(salesData);
      }

      if (reportsRes.ok) {
        const reportsData = await reportsRes.json();
        setReports(reportsData);
      }
    } catch (err) {
      console.error('Failed to fetch data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItemsAndSales();
  }, []);

  // Handle Add Item
  const handleAddItem = async (e) => {
    e.preventDefault();
    setMessage('');
    
    const token = localStorage.getItem('adminToken');
    if (!token) {
      setMessage('Not authenticated. Please login again.');
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/items`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token
        },
        body: JSON.stringify({
          name,
          price: Number(price),
          category,
          stock  // per-size object { XS: 5, S: 3, ... }
        })
      });

      if (res.ok) {
        setMessage('Item added successfully!');
        setName('');
        setPrice('');
        setCategory('');
        setStock(emptyStock());
        fetchItemsAndSales(); // Refresh the list
      } else {
        const data = await res.json();
        setMessage(`Error: ${data.message}`);
      }
    } catch (err) {
      setMessage('Server error while adding item.');
    }
  };

  const startEdit = (item) => {
    setEditingId(item._id);
    setEditName(item.name);
    setEditPrice(item.price);
    setEditCategory(item.category);
    // Normalize stock from Map (Mongoose returns it as a plain object or Map)
    const s = emptyStock();
    if (item.stock && typeof item.stock === 'object') {
      SIZES.forEach(sz => { s[sz] = item.stock[sz] || 0; });
    }
    setEditStock(s);
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const saveEdit = async (id) => {
    const token = localStorage.getItem('adminToken');
    try {
      const res = await fetch(`${API_URL}/api/items/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token
        },
        body: JSON.stringify({
          name: editName,
          price: Number(editPrice),
          category: editCategory,
          stock: editStock   // object { XS: 0, S: 5, ... }
        })
      });

      if (res.ok) {
        setEditingId(null);
        fetchItemsAndSales();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;
    const token = localStorage.getItem('adminToken');
    try {
      const res = await fetch(`${API_URL}/api/items/${id}`, {
        method: 'DELETE',
        headers: {
          'x-auth-token': token
        }
      });
      if (res.ok) {
        fetchItemsAndSales();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleArchiveAndReset = async () => {
    console.log("Confirm button clicked. Starting Archive & Reset process...");
    
    setIsResetConfirming(false); // Close confirmation state

    const token = localStorage.getItem('adminToken');
    if (!token) {
      alert("Authentication error. Please login again.");
      return;
    }

    try {
      console.log("Sending DELETE request to /api/sales/reset...");
      const res = await fetch(`${API_URL}/api/sales/reset`, { 
        method: 'DELETE', 
        headers: { 
          'Content-Type': 'application/json',
          'x-auth-token': token 
        } 
      });

      console.log("Response status:", res.status);
      const data = await res.json();

      if (res.ok) {
        console.log("Success:", data.message);
        alert("Sales archived and reset successfully!");
        fetchItemsAndSales();
      } else {
        console.error("Server error:", data.message);
        alert(`Error: ${data.message || 'Server rejected the request'}`);
      }
    } catch (err) {
      console.error("Network error:", err);
      alert("Network error: Could not reach the server. Please check your connection.");
    }
  };

  return (
    <AdminLayout>
      <div className="dashboard-content">
        <header className="dashboard-header">
          <h2>Inventory Management</h2>
          <p>Add new products and manage your stock.</p>
        </header>

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-title">Total Products</div>
            <div className="stat-value">{items.length}</div>
            <div className="stat-trend neutral">In Database</div>
          </div>
          <div className="stat-card">
            <div className="stat-title">Gross Sales Volume</div>
            <div className="stat-value" style={{ color: 'var(--accent-green)' }}>
              LKR {totalSales.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
            <div className="stat-trend positive">{sales.length} Total Orders</div>
          </div>
          <div className="stat-card">
            <div className="stat-title">Total Inventory Value</div>
            <div className="stat-value">LKR {totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            <div className="stat-trend neutral">Approximate Net Worth</div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>
          
          {/* Add Item Form */}
          <section className="dashboard-section">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <h3>Sales History</h3>
                <button 
                  onClick={() => setShowReports(true)}
                  style={{ padding: '0.4rem 0.8rem', background: 'var(--surface-hover)', color: 'var(--accent-green)', border: '1px solid var(--accent-green)', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 'bold' }}>
                  Archived Reports ({reports.length})
                </button>
              </div>
              {!isResetConfirming ? (
                <button 
                  onClick={() => {
                    if (sales.length === 0) {
                      alert("No active sales to reset.");
                      return;
                    }
                    setIsResetConfirming(true);
                  }}
                  className="btn-reset-sales"
                  style={{ padding: '0.5rem 1rem', background: 'transparent', color: '#ff4757', border: '1px solid #ff4757', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem' }}>
                  Reset & Archive Daily Sales
                </button>
              ) : (
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.8rem', color: '#ff4757', fontWeight: 'bold' }}>Sure? Archiving {sales.length} orders.</span>
                  <button 
                    onClick={handleArchiveAndReset}
                    className="btn-reset-sales"
                    style={{ padding: '0.4rem 0.8rem', background: '#ff4757', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}>
                    Yes, Reset
                  </button>
                  <button 
                    onClick={() => setIsResetConfirming(false)}
                    style={{ padding: '0.4rem 0.8rem', background: 'transparent', color: 'var(--text-secondary)', border: '1px solid var(--border-color)', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}>
                    Cancel
                  </button>
                </div>
              )}
            </div>
            <div className="inventory-list-card" style={{ marginBottom: '2rem' }}>
              {sales.length === 0 ? (
                <p style={{ padding: '2rem', color: 'var(--text-secondary)', textAlign: 'center' }}>No sales have been recorded yet.</p>
              ) : (
                <table className="inventory-table">
                  <thead>
                    <tr>
                      <th>Order #</th>
                      <th>Date</th>
                      <th>Customer Name</th>
                      <th>Customer Email</th>
                      <th>Items Sold</th>
                      <th>Discount</th>
                      <th>Amount (LKR)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sales.map(s => (
                        <tr key={s._id}>
                          <td style={{ fontWeight: 'bold', fontSize: '0.85rem' }}>{s.orderNumber || 'N/A'}</td>
                          <td>{new Date(s.date).toLocaleDateString()} {new Date(s.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</td>
                          <td style={{ fontWeight: '600' }}>{s.customerName || 'Guest'}</td>
                          <td style={{ color: 'var(--accent-green)' }}>{s.customerEmail}</td>
                          <td>{s.items.reduce((sum, i) => sum + i.quantity, 0)} items</td>
                          <td style={{ color: s.discountAmount > 0 ? '#ff6b81' : 'var(--text-secondary)', fontSize: '0.85rem' }}>
                            {s.discountAmount > 0 ? `- LKR ${s.discountAmount.toFixed(2)}` : '—'}
                          </td>
                          <td style={{ fontWeight: 'bold' }}>{s.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                        </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <h3>Add New Item</h3>
            <div className="admin-form-card">
              {message && (
                <div style={{ padding: '1rem', marginBottom: '1rem', background: 'rgba(0, 255, 163, 0.1)', color: 'var(--accent-green)', borderRadius: '8px', border: '1px solid var(--accent-green-transparent)' }}>
                  {message}
                </div>
              )}
              <form onSubmit={handleAddItem} className="login-form">
                <div className="input-group">
                  <label>Product Name</label>
                  <input type="text" value={name} onChange={e => setName(e.target.value)} required placeholder="e.g. Graphic Print Tee" />
                </div>
                <div className="input-group">
                  <label>Price (LKR)</label>
                  <input type="number" step="0.01" value={price} onChange={e => setPrice(e.target.value)} required placeholder="e.g. 2500" />
                </div>
                <div className="input-group">
                  <label>Category</label>
                  <input type="text" value={category} onChange={e => setCategory(e.target.value)} required placeholder="e.g. Tops, Bottoms" />
                </div>
                <div className="input-group">
                  <label>Stock Per Size</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
                    {SIZES.map(sz => (
                      <div key={sz} style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 700, textAlign: 'center' }}>{sz}</span>
                        <input
                          type="number" min="0" placeholder="0"
                          value={stock[sz] || ''}
                          onChange={e => setStock(prev => ({ ...prev, [sz]: Number(e.target.value) || 0 }))}
                          style={{ padding: '0.35rem', background: 'var(--bg-color)', color: '#fff', border: '1px solid var(--border-color)', borderRadius: '4px', textAlign: 'center', width: '100%' }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
                <button type="submit" className="btn-login" style={{ marginTop: '0.5rem' }}>Add to Inventory</button>
              </form>
            </div>
          </section>

          {/* Items List */}
          <section className="dashboard-section">
            <h3>Current Inventory</h3>
            <div className="inventory-list-card">
              {loading ? (
                <p style={{ padding: '2rem', color: 'var(--text-secondary)' }}>Loading items...</p>
              ) : items.length === 0 ? (
                <div className="empty-state-box" style={{ padding: '2rem' }}>
                  <p>No items found. Add your first item!</p>
                </div>
              ) : (
                <table className="inventory-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Category</th>
                      <th>Price (LKR)</th>
                      <th>Stock</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map(item => (
                      <tr key={item._id}>
                        {editingId === item._id ? (
                          <>
                            <td><input type="text" value={editName} onChange={e => setEditName(e.target.value)} style={{ width: '100%', padding: '0.4rem', background: 'var(--bg-color)', color: '#fff', border: '1px solid var(--border-color)', borderRadius: '4px' }}/></td>
                            <td><input type="text" value={editCategory} onChange={e => setEditCategory(e.target.value)} style={{ width: '80px', padding: '0.4rem', background: 'var(--bg-color)', color: '#fff', border: '1px solid var(--border-color)', borderRadius: '4px' }}/></td>
                            <td><input type="number" step="0.01" value={editPrice} onChange={e => setEditPrice(e.target.value)} style={{ width: '80px', padding: '0.4rem', background: 'var(--bg-color)', color: '#fff', border: '1px solid var(--border-color)', borderRadius: '4px' }}/></td>
                            <td>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                                {SIZES.map(sz => (
                                  <div key={sz} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.1rem' }}>
                                    <span style={{ fontSize: '0.62rem', color: 'var(--text-secondary)', fontWeight: 700 }}>{sz}</span>
                                    <input
                                      type="number" min="0"
                                      value={editStock[sz] !== undefined ? editStock[sz] : ''}
                                      onChange={e => setEditStock(prev => ({ ...prev, [sz]: Number(e.target.value) || 0 }))}
                                      style={{ width: '42px', padding: '0.3rem', background: 'var(--bg-color)', color: '#fff', border: '1px solid var(--border-color)', borderRadius: '4px', textAlign: 'center', fontSize: '0.8rem' }}
                                    />
                                  </div>
                                ))}
                              </div>
                            </td>
                            <td>
                              <button onClick={() => saveEdit(item._id)} style={{ padding: '0.4rem 0.6rem', background: 'var(--accent-green)', color: '#000', border: 'none', borderRadius: '4px', cursor: 'pointer', marginRight: '0.5rem', fontSize: '0.75rem', fontWeight: 'bold' }}>Save</button>
                              <button onClick={cancelEdit} style={{ padding: '0.4rem 0.6rem', background: 'transparent', color: 'var(--text-secondary)', border: '1px solid var(--border-color)', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem' }}>Cancel</button>
                            </td>
                          </>
                        ) : (
                          <>
                            <td>{item.name}</td>
                            <td><span className="badge">{item.category}</span></td>
                            <td>LKR {item.price.toFixed(2)}</td>
                            <td style={{ fontWeight: 'bold', fontSize: '0.85rem' }}>Total: {getTotalStock(item)}</td>
                            <td>
                              <button onClick={() => startEdit(item)} style={{ padding: '0.3rem 0.6rem', background: 'transparent', color: 'var(--accent-green)', border: '1px solid var(--accent-green)', borderRadius: '4px', cursor: 'pointer', marginRight: '0.5rem', fontSize: '0.75rem' }}>Edit</button>
                              <button onClick={() => handleDelete(item._id)} style={{ padding: '0.3rem 0.6rem', background: 'transparent', color: '#ff4757', border: '1px solid #ff4757', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem' }}>Del</button>
                            </td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </section>

        </div>
      </div>

      {/* Reports Modal */}
      {showReports && (
        <div className="modal-overlay">
          <div className="summary-modal" style={{ maxWidth: '800px', width: '90%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
              <h2 style={{ margin: 0, border: 'none' }}>Archived Daily Reports</h2>
              <button onClick={() => { setShowReports(false); setSelectedReport(null); }} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', fontSize: '1.5rem', cursor: 'pointer' }}>&times;</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: selectedReport ? '1fr 1fr' : '1fr', gap: '2rem' }}>
              {/* Reports List */}
              <div className="inventory-list-card" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                <table className="inventory-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Revenue</th>
                      <th>Orders</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reports.length === 0 ? (
                      <tr><td colSpan="4" style={{ textAlign: 'center', padding: '2rem' }}>No archived reports yet.</td></tr>
                    ) : (
                      reports.map(r => (
                        <tr key={r._id} style={{ background: selectedReport?._id === r._id ? 'rgba(0, 255, 163, 0.05)' : 'transparent' }}>
                          <td>{new Date(r.reportDate).toLocaleDateString()}</td>
                          <td style={{ color: 'var(--accent-green)', fontWeight: 'bold' }}>LKR {r.totalRevenue.toFixed(2)}</td>
                          <td>{r.totalOrders}</td>
                          <td>
                            <button 
                              onClick={() => setSelectedReport(r)}
                              style={{ padding: '0.3rem 0.6rem', background: 'var(--accent-green)', color: '#000', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold' }}>
                              Details
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Selected Report Detail */}
              {selectedReport && (
                <div style={{ borderLeft: '1px solid var(--border-color)', paddingLeft: '2rem', maxHeight: '60vh', overflowY: 'auto' }}>
                  <h4 style={{ marginBottom: '1rem', color: 'var(--accent-green)' }}>Report Details: {new Date(selectedReport.reportDate).toLocaleDateString()}</h4>
                  <div style={{ marginBottom: '1.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                    <div style={{ background: 'var(--bg-color)', padding: '1rem', borderRadius: '8px' }}>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>TOTAL REVENUE</p>
                      <p style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>LKR {selectedReport.totalRevenue.toFixed(2)}</p>
                    </div>
                    <div style={{ background: 'var(--bg-color)', padding: '1rem', borderRadius: '8px' }}>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>TOTAL ORDERS</p>
                      <p style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>{selectedReport.totalOrders}</p>
                    </div>
                    <div style={{ background: 'var(--bg-color)', padding: '1rem', borderRadius: '8px' }}>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>TOTAL DISCOUNTS</p>
                      <p style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#ff6b81' }}>{selectedReport.totalDiscounts > 0 ? `- LKR ${selectedReport.totalDiscounts.toFixed(2)}` : '—'}</p>
                    </div>
                  </div>

                  <table className="inventory-table" style={{ fontSize: '0.85rem' }}>
                    <thead>
                      <tr>
                        <th>Order #</th>
                        <th>Discount</th>
                        <th>Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedReport.sales.map((s, idx) => (
                        <tr key={idx}>
                          <td>{s.orderNumber}</td>
                          <td style={{ color: s.discountAmount > 0 ? '#ff6b81' : 'var(--text-secondary)' }}>
                            {s.discountAmount > 0 ? `- LKR ${s.discountAmount.toFixed(2)}` : '—'}
                          </td>
                          <td>LKR {s.totalAmount.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminDashboard;
