import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { createItem, updateItem, getItem, uploadImage } from '../api';
import toast from 'react-hot-toast';


const CATEGORIES = ['Tools', 'Kitchen', 'Electronics', 'Outdoor', 'Crafts', 'Sports', 'Books', 'Other'];
const CONDITIONS = ['Like New', 'Excellent', 'Good', 'Fair'];

export default function CreateItem() {
  const navigate = useNavigate();
  const { id } = useParams(); // present if editing
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    title: '', description: '', category: 'Tools', item_condition: 'Good',
    image_url: '', deposit_amount: 0,
  });

  useEffect(() => {
    if (id) {
      getItem(id).then(data => {
        setForm({
          title: data.title, description: data.description || '',
          category: data.category, item_condition: data.item_condition,
          image_url: data.image_url || '', deposit_amount: data.deposit_amount || 0,
        });
      }).catch(() => { toast.error('Item not found'); navigate('/my-items'); });
    }
  }, [id]);

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const { url } = await uploadImage(file);
      setForm({ ...form, image_url: url });
      toast.success('Image uploaded');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.category) {
      toast.error('Title and category are required');
      return;
    }
    setLoading(true);
    try {
      if (id) {
        await updateItem(id, form);
        toast.success('Item updated!');
      } else {
        await createItem(form);
        toast.success('Item listed! 🎉');
      }
      navigate('/my-items');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container fade-in">
      <button className="btn btn-ghost mb-2" onClick={() => navigate(-1)}>
        <span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_back</span> Back
      </button>

      <div style={{ maxWidth: '640px', margin: '0 auto' }}>
        <div className="page-header">
          <h1>{id ? 'Edit Item' : 'List a New Item'}</h1>
          <p>{id ? 'Update your item details' : 'Share something with your community'}</p>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit}>
            {/* Image Upload */}
            <div className="form-group">
              <label>Item Photo</label>
              <label htmlFor="item-image-upload" className={`image-upload ${form.image_url ? 'has-image' : ''}`}>
                {form.image_url ? (
                  <img src={form.image_url} alt="Item" />
                ) : (
                  <div className="image-upload-content">
                    {uploading ? (
                      <div className="spinner" style={{ margin: '0 auto' }} />
                    ) : (
                      <>
                        <span className="material-symbols-outlined" style={{ fontSize: 32 }}>cloud_upload</span>
                        <p className="text-sm mt-1">Click to upload an image</p>
                        <p className="text-xs text-muted">JPG, PNG, WebP up to 5MB</p>
                      </>
                    )}
                  </div>
                )}
              </label>
              <input
                id="item-image-upload"
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                style={{ display: 'none' }}
              />
              {form.image_url && (
                <button
                  type="button"
                  className="btn btn-ghost btn-sm mt-1"
                  onClick={() => setForm({ ...form, image_url: '' })}
                >
                  Remove image
                </button>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="item-title">Title *</label>
              <input
                id="item-title"
                type="text"
                className="form-input"
                placeholder="e.g. Bosch Power Drill"
                value={form.title}
                onChange={update('title')}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="item-description">Description</label>
              <textarea
                id="item-description"
                className="form-input"
                placeholder="Describe your item, its features, and any instructions..."
                value={form.description}
                onChange={update('description')}
                rows={4}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label htmlFor="item-category">Category *</label>
                <select
                  id="item-category"
                  className="form-input"
                  value={form.category}
                  onChange={update('category')}
                >
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="item-condition">Condition</label>
                <select
                  id="item-condition"
                  className="form-input"
                  value={form.item_condition}
                  onChange={update('item_condition')}
                >
                  {CONDITIONS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="item-deposit">Security Deposit (₹)</label>
              <input
                id="item-deposit"
                type="number"
                className="form-input"
                placeholder="0"
                value={form.deposit_amount}
                onChange={(e) => setForm({ ...form, deposit_amount: parseFloat(e.target.value) || 0 })}
                min="0"
              />
            </div>

            <button type="submit" className="btn btn-primary btn-lg btn-full mt-2" disabled={loading} id="submit-item">
              {loading ? <div className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }} /> : <>
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>save</span> {id ? 'Update Item' : 'List Item'}
              </>}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
