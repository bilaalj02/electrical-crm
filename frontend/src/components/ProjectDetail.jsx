import { useState, useEffect } from 'react';
import axios from 'axios';
import { FiArrowLeft, FiUpload, FiX, FiEdit2, FiTrash2, FiDownload, FiZoomIn, FiTag, FiFileText, FiCalendar, FiUser, FiImage, FiPlus } from 'react-icons/fi';
import './ProjectDetail.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

function ProjectDetail({ projectId, onBack }) {
  const [project, setProject] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [editingPhoto, setEditingPhoto] = useState(null);
  const [filterCategory, setFilterCategory] = useState('all');
  const [showUploadModal, setShowUploadModal] = useState(false);

  // Upload form state
  const [uploadFiles, setUploadFiles] = useState([]);
  const [uploadPreviews, setUploadPreviews] = useState([]);

  useEffect(() => {
    fetchProjectDetails();
    fetchPhotos();
  }, [projectId]);

  const fetchProjectDetails = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/projects/${projectId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProject(response.data.project);
    } catch (error) {
      console.error('Error fetching project:', error);
    }
  };

  const fetchPhotos = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const params = filterCategory !== 'all' ? `?category=${filterCategory}` : '';
      const response = await axios.get(`${API_URL}/photos/project/${projectId}${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPhotos(response.data.photos);
    } catch (error) {
      console.error('Error fetching photos:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPhotos();
  }, [filterCategory]);

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    setUploadFiles(files);

    // Create previews
    const previews = files.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      label: file.name,
      notes: '',
      category: 'other'
    }));
    setUploadPreviews(previews);
    setShowUploadModal(true);
  };

  const updatePreview = (index, field, value) => {
    const updated = [...uploadPreviews];
    updated[index][field] = value;
    setUploadPreviews(updated);
  };

  const removePreview = (index) => {
    const updated = [...uploadPreviews];
    updated.splice(index, 1);
    setUploadPreviews(updated);

    const updatedFiles = [...uploadFiles];
    updatedFiles.splice(index, 1);
    setUploadFiles(updatedFiles);
  };

  const handleUpload = async () => {
    if (uploadFiles.length === 0) return;

    setUploading(true);
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();

      uploadFiles.forEach(file => {
        formData.append('photos', file);
      });

      formData.append('labels', JSON.stringify(uploadPreviews.map(p => p.label)));
      formData.append('notes', JSON.stringify(uploadPreviews.map(p => p.notes)));
      formData.append('categories', JSON.stringify(uploadPreviews.map(p => p.category)));

      await axios.post(`${API_URL}/photos/upload/${projectId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`
        }
      });

      alert('Photos uploaded successfully!');
      setShowUploadModal(false);
      setUploadFiles([]);
      setUploadPreviews([]);
      fetchPhotos();
    } catch (error) {
      console.error('Error uploading photos:', error);
      alert('Failed to upload photos');
    } finally {
      setUploading(false);
    }
  };

  const handleUpdatePhoto = async (photoId, updates) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`${API_URL}/photos/${photoId}`, updates, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchPhotos();
      setEditingPhoto(null);
    } catch (error) {
      console.error('Error updating photo:', error);
      alert('Failed to update photo');
    }
  };

  const handleDeletePhoto = async (photoId) => {
    if (!confirm('Are you sure you want to delete this photo?')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/photos/${photoId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchPhotos();
      if (selectedPhoto?._id === photoId) {
        setLightboxOpen(false);
        setSelectedPhoto(null);
      }
    } catch (error) {
      console.error('Error deleting photo:', error);
      alert('Failed to delete photo');
    }
  };

  const openLightbox = (photo) => {
    setSelectedPhoto(photo);
    setLightboxOpen(true);
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
    setSelectedPhoto(null);
  };

  const getServerUrl = () => {
    return API_URL.replace('/api', '');
  };

  if (!project) {
    return <div className="loading">Loading project...</div>;
  }

  const categories = [
    { value: 'all', label: 'All Photos' },
    { value: 'before', label: 'Before' },
    { value: 'during', label: 'During' },
    { value: 'after', label: 'After' },
    { value: 'inspection', label: 'Inspection' },
    { value: 'documentation', label: 'Documentation' },
    { value: 'other', label: 'Other' }
  ];

  return (
    <div className="project-detail-page">
      {/* Header */}
      <div className="detail-header">
        <button className="btn-back" onClick={onBack}>
          <FiArrowLeft /> Back to Projects
        </button>
        <div className="header-content">
          <h1>{project.name}</h1>
          <p className="project-description">{project.description}</p>
          <div className="project-meta">
            <span className="meta-item">
              <FiCalendar /> Created: {new Date(project.createdAt).toLocaleDateString()}
            </span>
            <span className={`status-badge status-${project.status}`}>
              {project.status}
            </span>
          </div>
        </div>
      </div>

      {/* Photo Gallery Section */}
      <div className="gallery-section">
        <div className="gallery-toolbar">
          <div className="toolbar-left">
            <h2><FiImage /> Project Photos ({photos.length})</h2>
            <div className="category-filter">
              {categories.map(cat => (
                <button
                  key={cat.value}
                  className={`filter-btn ${filterCategory === cat.value ? 'active' : ''}`}
                  onClick={() => setFilterCategory(cat.value)}
                >
                  {cat.label}
                  {cat.value !== 'all' && (
                    <span className="count">
                      ({photos.filter(p => p.category === cat.value).length})
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
          <div className="toolbar-right">
            <label className="btn-upload">
              <FiUpload /> Upload Photos
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
              />
            </label>
          </div>
        </div>

        {/* Photo Grid */}
        {loading ? (
          <div className="loading">Loading photos...</div>
        ) : photos.length === 0 ? (
          <div className="empty-state">
            <FiImage size={64} />
            <h3>No photos yet</h3>
            <p>Upload photos to document your project progress</p>
            <label className="btn-primary">
              <FiPlus /> Upload First Photo
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
              />
            </label>
          </div>
        ) : (
          <div className="photo-grid">
            {photos.map(photo => (
              <div key={photo._id} className="photo-card">
                <div className="photo-thumbnail" onClick={() => openLightbox(photo)}>
                  <img src={`${getServerUrl()}${photo.url}`} alt={photo.label} />
                  <div className="photo-overlay">
                    <FiZoomIn size={24} />
                  </div>
                </div>
                <div className="photo-info">
                  <div className="photo-label">{photo.label}</div>
                  {photo.notes && <div className="photo-notes">{photo.notes}</div>}
                  <div className="photo-meta">
                    <span className={`category-badge category-${photo.category}`}>
                      {photo.category}
                    </span>
                    <span className="photo-date">
                      {new Date(photo.uploadedAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="photo-actions">
                    <button
                      className="btn-icon"
                      onClick={() => setEditingPhoto(photo)}
                      title="Edit"
                    >
                      <FiEdit2 />
                    </button>
                    <button
                      className="btn-icon btn-danger"
                      onClick={() => handleDeletePhoto(photo._id)}
                      title="Delete"
                    >
                      <FiTrash2 />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="modal-overlay" onClick={() => setShowUploadModal(false)}>
          <div className="modal-content upload-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2><FiUpload /> Upload Photos</h2>
              <button className="btn-close" onClick={() => setShowUploadModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="upload-previews">
                {uploadPreviews.map((preview, index) => (
                  <div key={index} className="upload-preview-card">
                    <img src={preview.preview} alt={`Preview ${index + 1}`} />
                    <div className="preview-form">
                      <div className="form-group">
                        <label><FiTag /> Label</label>
                        <input
                          type="text"
                          value={preview.label}
                          onChange={(e) => updatePreview(index, 'label', e.target.value)}
                          placeholder="Photo label..."
                        />
                      </div>
                      <div className="form-group">
                        <label><FiFileText /> Notes</label>
                        <textarea
                          value={preview.notes}
                          onChange={(e) => updatePreview(index, 'notes', e.target.value)}
                          placeholder="Add notes..."
                          rows="2"
                        />
                      </div>
                      <div className="form-group">
                        <label>Category</label>
                        <select
                          value={preview.category}
                          onChange={(e) => updatePreview(index, 'category', e.target.value)}
                        >
                          <option value="before">Before</option>
                          <option value="during">During</option>
                          <option value="after">After</option>
                          <option value="inspection">Inspection</option>
                          <option value="documentation">Documentation</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                      <button
                        className="btn-remove"
                        onClick={() => removePreview(index)}
                      >
                        <FiX /> Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowUploadModal(false)}>
                Cancel
              </button>
              <button
                className="btn-primary"
                onClick={handleUpload}
                disabled={uploading || uploadPreviews.length === 0}
              >
                {uploading ? 'Uploading...' : `Upload ${uploadPreviews.length} Photo(s)`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Photo Modal */}
      {editingPhoto && (
        <div className="modal-overlay" onClick={() => setEditingPhoto(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2><FiEdit2 /> Edit Photo</h2>
              <button className="btn-close" onClick={() => setEditingPhoto(null)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Label</label>
                <input
                  type="text"
                  defaultValue={editingPhoto.label}
                  id="edit-label"
                />
              </div>
              <div className="form-group">
                <label>Notes</label>
                <textarea
                  defaultValue={editingPhoto.notes}
                  id="edit-notes"
                  rows="4"
                />
              </div>
              <div className="form-group">
                <label>Category</label>
                <select defaultValue={editingPhoto.category} id="edit-category">
                  <option value="before">Before</option>
                  <option value="during">During</option>
                  <option value="after">After</option>
                  <option value="inspection">Inspection</option>
                  <option value="documentation">Documentation</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setEditingPhoto(null)}>
                Cancel
              </button>
              <button
                className="btn-primary"
                onClick={() => {
                  handleUpdatePhoto(editingPhoto._id, {
                    label: document.getElementById('edit-label').value,
                    notes: document.getElementById('edit-notes').value,
                    category: document.getElementById('edit-category').value
                  });
                }}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox */}
      {lightboxOpen && selectedPhoto && (
        <div className="lightbox-overlay" onClick={closeLightbox}>
          <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
            <button className="lightbox-close" onClick={closeLightbox}>
              <FiX size={24} />
            </button>
            <img src={`${getServerUrl()}${selectedPhoto.url}`} alt={selectedPhoto.label} />
            <div className="lightbox-info">
              <h3>{selectedPhoto.label}</h3>
              {selectedPhoto.notes && <p>{selectedPhoto.notes}</p>}
              <div className="lightbox-meta">
                <span className={`category-badge category-${selectedPhoto.category}`}>
                  {selectedPhoto.category}
                </span>
                <span>
                  <FiCalendar /> {new Date(selectedPhoto.uploadedAt).toLocaleString()}
                </span>
                <span>
                  <FiUser /> {selectedPhoto.uploadedBy?.name || 'Unknown'}
                </span>
              </div>
              <div className="lightbox-actions">
                <a
                  href={`${getServerUrl()}${selectedPhoto.url}`}
                  download={selectedPhoto.originalName}
                  className="btn-download"
                >
                  <FiDownload /> Download
                </a>
                <button className="btn-edit" onClick={() => {
                  setEditingPhoto(selectedPhoto);
                  closeLightbox();
                }}>
                  <FiEdit2 /> Edit
                </button>
                <button
                  className="btn-delete"
                  onClick={() => {
                    handleDeletePhoto(selectedPhoto._id);
                    closeLightbox();
                  }}
                >
                  <FiTrash2 /> Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProjectDetail;
