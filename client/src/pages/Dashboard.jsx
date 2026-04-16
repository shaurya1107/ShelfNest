import { useState, useEffect } from 'react';
import { getItems } from '../api';
import ItemCard from '../components/ItemCard';
import { Search, Filter, Package } from 'lucide-react';
import toast from 'react-hot-toast';

const CATEGORIES = ['all', 'Tools', 'Kitchen', 'Electronics', 'Outdoor', 'Crafts', 'Sports', 'Books', 'Other'];

export default function Dashboard() {
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
      <div className="page-header">
        <h1>Browse Community Items</h1>
        <p>Discover tools, appliances, and more from your trusted neighbors</p>
      </div>

      <div className="search-bar">
        <div className="search-input-wrapper">
          <Search />
          <input
            type="text"
            className="form-input"
            placeholder="Search items..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            id="search-items"
          />
        </div>
      </div>

      <div className="flex-wrap mb-3">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            className={`category-tag ${category === cat ? 'active' : ''}`}
            onClick={() => setCategory(cat)}
          >
            {cat === 'all' ? '🏠 All' : cat}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="loading-state">
          <div className="spinner spinner-lg" />
          <span>Loading items...</span>
        </div>
      ) : items.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon"><Package size={64} strokeWidth={1} /></div>
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
