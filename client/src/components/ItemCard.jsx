import { useNavigate } from 'react-router-dom';

export default function ItemCard({ item }) {
  const navigate = useNavigate();

  return (
    <div className="item-card" onClick={() => navigate(`/items/${item.id}`)} id={`item-card-${item.id}`}>
      <div className="item-card-image">
        {item.image_url ? (
          <img src={item.image_url} alt={item.title} loading="lazy" />
        ) : (
          <div className="item-card-placeholder">
            <span className="material-symbols-outlined" style={{ fontSize: 48 }}>inventory_2</span>
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
          {item.avg_rating && (
            <div className="item-card-rating">
              <span className="material-symbols-outlined" style={{ fontSize: 14, fontVariationSettings: "'FILL' 1" }}>star</span>
              <span>{Math.round(item.avg_rating * 10) / 10}</span>
            </div>
          )}
        </div>
        <h3 className="item-card-title">{item.title}</h3>
        <p className="item-card-desc">{item.description}</p>

        <div className="item-card-meta">
          <div className="owner-info">
            <div className="owner-avatar">
              {item.owner_avatar ? (
                <img src={item.owner_avatar} alt={item.owner_name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
              ) : (
                item.owner_name?.charAt(0)
              )}
            </div>
            <span>{item.owner_name}</span>
          </div>

          {item.deposit_amount > 0 && (
            <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--color-primary)' }}>
              ₹{item.deposit_amount}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
