import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getMyItems, deleteItem, updateItem } from '../api';
import toast from 'react-hot-toast';
import { PlusCircle, Package, Edit, Trash2, Eye, EyeOff, Bell, Star } from 'lucide-react';

export default function MyItems() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const data = await getMyItems();
      setItems(data);
    } catch (err) {
      toast.error('Failed to load items');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchItems(); }, []);

  const handleToggleAvailability = async (item) => {
    try {
      await updateItem(item.id, { is_available: !item.is_available });
      toast.success(item.is_available ? 'Item marked unavailable' : 'Item marked available');
      fetchItems();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleDelete = async (item) => {
    if (!window.confirm(`Delete "${item.title}"? This cannot be undone.`)) return;
    try {
      await deleteItem(item.id);
      toast.success('Item deleted');
      fetchItems();
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div className="page-container fade-in">
      <div className="flex-between mb-3">
        <div className="page-header" style={{ marginBottom: 0 }}>
          <h1>My Items</h1>
          <p>Manage the items you've listed for your community</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/items/new')} id="list-new-item">
          <PlusCircle size={18} /> List New Item
        </button>
      </div>

      {loading ? (
        <div className="loading-state">
          <div className="spinner spinner-lg" />
          <span>Loading...</span>
        </div>
      ) : items.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon"><Package size={64} strokeWidth={1} /></div>
          <h3>No items listed yet</h3>
          <p>Share your tools, appliances, and other items with your community.</p>
          <button className="btn btn-primary" onClick={() => navigate('/items/new')}>
            <PlusCircle size={18} /> List Your First Item
          </button>
        </div>
      ) : (
        <div className="grid-2">
          {items.map(item => (
            <div key={item.id} className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ display: 'flex', gap: '1rem', padding: '1.25rem' }}>
                <div style={{
                  width: '80px', height: '80px', borderRadius: 'var(--radius-md)', overflow: 'hidden',
                  background: 'var(--color-bg-secondary)', flexShrink: 0, cursor: 'pointer'
                }} onClick={() => navigate(`/items/${item.id}`)}>
                  {item.image_url ? (
                    <img src={item.image_url} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div className="flex-center" style={{ height: '100%' }}>
                      <Package size={28} strokeWidth={1} style={{ color: 'var(--text-tertiary)' }} />
                    </div>
                  )}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="flex-between">
                    <h3 style={{ fontSize: '1rem', fontWeight: 600, cursor: 'pointer' }} onClick={() => navigate(`/items/${item.id}`)}>
                      {item.title}
                    </h3>
                    <span className={`badge ${item.is_available ? 'badge-success' : 'badge-neutral'}`}>
                      {item.is_available ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  <div className="flex-gap mt-1" style={{ flexWrap: 'wrap' }}>
                    <span className="badge badge-secondary">{item.category}</span>
                    {item.avg_rating && (
                      <span className="flex-gap text-xs" style={{ color: 'var(--color-accent)' }}>
                        <Star size={12} fill="currentColor" /> {Math.round(item.avg_rating * 10) / 10}
                      </span>
                    )}
                    {item.pending_requests > 0 && (
                      <span className="badge badge-warning">
                        <Bell size={10} /> {item.pending_requests} pending
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div style={{
                display: 'flex', gap: '0.5rem', padding: '0.75rem 1.25rem',
                borderTop: '1px solid var(--color-border)', background: 'var(--color-bg-secondary)'
              }}>
                <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/items/edit/${item.id}`)}>
                  <Edit size={14} /> Edit
                </button>
                <button className="btn btn-ghost btn-sm" onClick={() => handleToggleAvailability(item)}>
                  {item.is_available ? <><EyeOff size={14} /> Deactivate</> : <><Eye size={14} /> Activate</>}
                </button>
                <button className="btn btn-ghost btn-sm" style={{ color: 'var(--color-danger)' }} onClick={() => handleDelete(item)}>
                  <Trash2 size={14} /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
