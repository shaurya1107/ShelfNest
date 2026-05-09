import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getItems } from '../api';
import ItemCard from '../components/ItemCard';
import toast from 'react-hot-toast';

const CATEGORIES = ['all', 'Tools', 'Kitchen', 'Electronics', 'Outdoor', 'Crafts', 'Sports', 'Books', 'Other'];

export default function Dashboard() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');

  const fetchItems = async () => {
    try {
      setLoading(true);
      const params = {};
      if (search) params.search = search;
      if (category !== 'all') params.category = category;
      params.available = 'true';
      const data = await getItems(params);
      setItems(data);
    } catch (err) {
      toast.error('Failed to load items');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(fetchItems, 300);
    return () => clearTimeout(timer);
  }, [search, category]);

  return (
    <div className="page-container fade-in">
      {/* Welcome Section */}
      <section style={{ marginBottom: 'var(--space-xl)' }}>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', fontFamily: 'var(--font-family)' }}>Welcome back,</p>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 'var(--space-md)' }}>
          Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, {user?.name?.split(' ')[0]}
        </h2>

        {/* Search Bar */}
        <div style={{ position: 'relative', width: '100%' }}>
          <span className="material-symbols-outlined" style={{
            position: 'absolute', left: 'var(--space-md)', top: '50%', transform: 'translateY(-50%)',
            color: 'var(--text-tertiary)', fontSize: 20
          }}>search</span>
          <input
            type="text"
            className="form-input"
            placeholder="Search for tools, appliances, kitchenware..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            id="search-items"
            style={{
              paddingLeft: 'var(--space-xl)', background: 'var(--color-surface-container-low)',
              border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)',
            }}
          />
        </div>
      </section>

      {/* Category Chips */}
      <section style={{ overflowX: 'auto', marginBottom: 'var(--space-xl)', display: 'flex', gap: 'var(--space-md)', paddingBottom: 'var(--space-xs)' }}>
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            className={`category-tag ${category === cat ? 'active' : ''}`}
            onClick={() => setCategory(cat)}
            style={{ flexShrink: 0 }}
          >
            {cat === 'all' ? 'All' : cat}
          </button>
        ))}
      </section>

      {/* Items Grid */}
      {loading ? (
        <div className="loading-state">
          <div className="spinner spinner-lg" />
          <span>Loading items...</span>
        </div>
      ) : items.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">
            <span className="material-symbols-outlined" style={{ fontSize: 64, color: 'var(--text-tertiary)' }}>inventory_2</span>
          </div>
          <h3>No items found</h3>
          <p>{search || category !== 'all' ? 'Try adjusting your search or filters' : 'Be the first to list something for your community!'}</p>
        </div>
      ) : (
        <div className="grid-3">
          {items.map(item => (
            <ItemCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
