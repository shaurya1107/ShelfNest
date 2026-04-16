import { Star } from 'lucide-react';

export default function StarRating({ rating, onChange, size = 18, interactive = false }) {
  return (
    <div className={`stars ${interactive ? 'interactive' : ''}`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={size}
          fill={star <= rating ? '#f59e0b' : 'transparent'}
          stroke={star <= rating ? '#f59e0b' : '#64748b'}
          onClick={() => interactive && onChange?.(star)}
          style={{ cursor: interactive ? 'pointer' : 'default' }}
        />
      ))}
    </div>
  );
}
