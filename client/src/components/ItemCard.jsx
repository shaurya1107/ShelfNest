import { useNavigate } from 'react-router-dom';
import { Star, Package } from 'lucide-react';

export default function ItemCard({ item }) {
  const navigate = useNavigate();

  const getInitials = (name) => name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div className="item-card" onClick={() => navigate(`/items/${item.id}`)} id={`item-card-${item.id}`}>
      <div className="item-card-image">
        {item.image_url ? (
          <img src={item.image_url} alt={item.title} loading="lazy" />
        ) : (
          <div className="item-card-placeholder">
            <Package size={48} strokeWidth={1} />
          </div>
        )}
        <div className="item-card-availability">
          <span className={`badge ${item.is_available ? 'badge-success' : 'badge-neutral'}`}>
            {item.is_available ? 'Available' : 'Unavailable'}
          </span>
        </div>
      </div>

      <div className="item-card-body">
        <div className="flex-between mb-1">
          <span className="badge badge-secondary">{item.category}</span>
          <span className="badge badge-neutral">{item.item_condition}</span>
        </div>
        <h3 className="item-card-title">{item.title}</h3>
        <p className="item-card-desc">{item.description}</p>

        <div className="item-card-meta">
          <div className="owner-info">
            <div className="owner-avatar">
              {item.owner_avatar ? (
                <img src={item.owner_avatar} alt={item.owner_name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
              ) : (
                getInitials(item.owner_name)
              )}
            </div>
            <span>{item.owner_name}</span>
          </div>

          {item.avg_rating && (
            <div className="item-card-rating">
              <Star size={14} fill="currentColor" />
              <span>{Math.round(item.avg_rating * 10) / 10}</span>
              <span className="text-muted text-xs">({item.review_count})</span>
            </div>
          )}
        </div>

        {item.deposit_amount > 0 && (
          <div className="text-xs text-muted mt-1">
            Deposit: ₹{item.deposit_amount}
          </div>
        )}
      </div>
    </div>
  );
}
