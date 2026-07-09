import { useState, useEffect } from 'react';
import axios from 'axios';
import {
  FiArrowLeft, FiUpload, FiX, FiEdit2, FiTrash2, FiDownload, FiZoomIn,
  FiTag, FiFileText, FiCalendar, FiUser, FiImage, FiPlus, FiMessageSquare,
  FiGrid, FiList, FiClock, FiFilter, FiSearch, FiSend, FiMoreVertical,
  FiCheckCircle, FiAlertCircle, FiActivity
} from 'react-icons/fi';
import { showToast } from './Toast';
import NotificationModal from './NotificationModal';
import './ProjectDetail.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

function ProjectDetail({ projectId, onBack }) {
  const [project, setProject] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [allPhotos, setAllPhotos] = useState([]); // Store all photos for filtering
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [editingPhoto, setEditingPhoto] = useState(null);
  const [filterCategory, setFilterCategory] = useState('all');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [currentView, setCurrentView] = useState('grid'); // 'grid', 'timeline', 'feed'
  const [searchTerm, setSearchTerm] = useState('');

  // Team communication state
  const [showCommentSection, setShowCommentSection] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [comments, setComments] = useState([]);

  // Activity feed state
  const [activities, setActivities] = useState([]);

  // Before/After comparison
  const [showBeforeAfter, setShowBeforeAfter] = useState(false);
  const [selectedBeforePhoto, setSelectedBeforePhoto] = useState(null);
  const [selectedAfterPhoto, setSelectedAfterPhoto] = useState(null);

  // Confirm dialog
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', onConfirm: null });

  // Photo comments
  const [photoCommentText, setPhotoCommentText] = useState('');
  const [addingPhotoComment, setAddingPhotoComment] = useState(false);

  // Upload form state
  const [uploadFiles, setUploadFiles] = useState([]);
  const [uploadPreviews, setUploadPreviews] = useState([]);

  useEffect(() => {
    fetchProjectDetails();
    fetchPhotos();
  }, [projectId]);

  useEffect(() => {
    // Filter photos based on category and search
    let filtered = [...allPhotos];

    if (filterCategory !== 'all') {
      filtered = filtered.filter(p => p.category === filterCategory);
    }

    if (searchTerm) {
      filtered = filtered.filter(p =>
        p.label?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.notes?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    setPhotos(filtered);
  }, [filterCategory, searchTerm, allPhotos]);

  const fetchProjectDetails = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/projects/${projectId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const projectData = response.data.project || response.data;
      setProject(projectData);
      // Set comments from project data
      setComments(projectData.notes || []);
    } catch (error) {
      console.error('Error fetching project:', error);
    }
  };

  const fetchPhotos = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/photos/project/${projectId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAllPhotos(response.data.photos || []);
      setPhotos(response.data.photos || []);
    } catch (error) {
      console.error('Error fetching photos:', error);
      setAllPhotos([]);
      setPhotos([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async () => {
    // Re-fetch project to get updated notes
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/projects/${projectId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const projectData = response.data.project || response.data;
      setComments(projectData.notes || []);
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`${API_URL}/projects/${projectId}`, { status: newStatus }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProject(prev => ({ ...prev, status: newStatus }));
      showToast('Status updated', 'success');
    } catch (error) {
      showToast('Failed to update status', 'error');
    }
  };

  const fetchActivities = async () => {
    // Build activity feed from photos, comments, and project updates
    const photoActivities = allPhotos.map(photo => ({
      type: 'photo_upload',
      timestamp: photo.uploadedAt,
      user: photo.uploadedBy,
      data: photo
    }));

    const commentActivities = (comments || []).map(comment => ({
      type: 'comment',
      timestamp: comment.createdAt,
      user: comment.author,
      data: comment
    }));

    const combined = [...photoActivities, ...commentActivities]
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    setActivities(combined);
  };

  useEffect(() => {
    fetchActivities();
  }, [allPhotos, comments]);

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    setUploadFiles(files);

    // Create previews
    const previews = files.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      label: file.name,
      notes: '',
      category: 'other',
      tags: []
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
    URL.revokeObjectURL(updated[index].preview);
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

      showToast('Photos uploaded successfully!', 'success');
      setShowUploadModal(false);
      setUploadFiles([]);
      setUploadPreviews([]);
      fetchPhotos();
      fetchActivities();
    } catch (error) {
      console.error('Error uploading photos:', error);
      showToast(error.response?.data?.error || 'Failed to upload photos', 'error');
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
      showToast('Photo updated successfully!', 'success');
    } catch (error) {
      console.error('Error updating photo:', error);
      showToast(error.response?.data?.error || 'Failed to update photo', 'error');
    }
  };

  const handleDeletePhoto = async (photoId) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Photo',
      message: 'Are you sure you want to delete this photo? This action cannot be undone.',
      onConfirm: async () => {
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
          showToast('Photo deleted', 'success');
        } catch (error) {
          console.error('Error deleting photo:', error);
          showToast(error.response?.data?.error || 'Failed to delete photo', 'error');
        }
      }
    });
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_URL}/projects/${projectId}/notes`, {
        content: newComment
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setNewComment('');
      fetchComments();
      fetchActivities();
    } catch (error) {
      console.error('Error adding comment:', error);
      showToast(error.response?.data?.error || 'Failed to add comment', 'error');
    }
  };

  const handleDeleteComment = (commentId) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Comment',
      message: 'Are you sure you want to delete this comment?',
      onConfirm: async () => {
        try {
          const token = localStorage.getItem('token');
          await axios.delete(`${API_URL}/projects/${projectId}/notes/${commentId}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          showToast('Comment deleted', 'success');
          fetchComments();
        } catch (error) {
          showToast(error.response?.data?.error || 'Failed to delete comment', 'error');
        }
      }
    });
  };

  const handleAddPhotoComment = async () => {
    if (!photoCommentText.trim() || !selectedPhoto) return;
    setAddingPhotoComment(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(`${API_URL}/photos/${selectedPhoto._id}/comments`, {
        content: photoCommentText.trim()
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPhotoCommentText('');
      // Update the selectedPhoto's comments in state
      setSelectedPhoto(prev => ({
        ...prev,
        comments: [...(prev.comments || []), res.data.comment]
      }));
      // Also refresh photos list
      fetchPhotos();
    } catch (error) {
      showToast(error.response?.data?.error || 'Failed to add comment', 'error');
    } finally {
      setAddingPhotoComment(false);
    }
  };

  const handleDeletePhotoComment = (commentId) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Comment',
      message: 'Are you sure you want to delete this comment?',
      onConfirm: async () => {
        try {
          const token = localStorage.getItem('token');
          await axios.delete(`${API_URL}/photos/${selectedPhoto._id}/comments/${commentId}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          showToast('Comment deleted', 'success');
          setSelectedPhoto(prev => ({
            ...prev,
            comments: prev.comments.filter(c => c._id !== commentId)
          }));
          fetchPhotos();
        } catch (error) {
          showToast(error.response?.data?.error || 'Failed to delete comment', 'error');
        }
      }
    });
  };

  const openLightbox = (photo) => {
    setSelectedPhoto(photo);
    setLightboxOpen(true);
    setPhotoCommentText('');
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
    setSelectedPhoto(null);
    setPhotoCommentText('');
  };

  const getServerUrl = () => {
    return API_URL.replace('/api', '');
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!project) {
    return <div className="loading">Loading project...</div>;
  }

  const categories = [
    { value: 'all', label: 'All Photos', icon: FiImage },
    { value: 'before', label: 'Before', icon: FiAlertCircle },
    { value: 'during', label: 'During', icon: FiActivity },
    { value: 'after', label: 'After', icon: FiCheckCircle },
    { value: 'inspection', label: 'Inspection', icon: FiFileText },
    { value: 'documentation', label: 'Documentation', icon: FiFileText },
    { value: 'other', label: 'Other', icon: FiMoreVertical }
  ];

  const beforePhotos = allPhotos.filter(p => p.category === 'before');
  const afterPhotos = allPhotos.filter(p => p.category === 'after');

  return (
    <div className="project-detail-page">
      {/* Header */}
      <div className="detail-header">
        <div className="detail-header-left">
          <button className="btn-back" onClick={onBack}>
            <FiArrowLeft /> Back to Projects
          </button>
          <span className="header-date">
            <FiCalendar /> {formatDate(project.createdAt || project.projectDate)}
          </span>
        </div>
        <div className="detail-header-right">
          <h1 className="header-title">{project.name || project.title}</h1>
          <div className="header-status-row">
            <span className={`status-badge status-${project.status}`}>{project.status}</span>
            <select
              className="status-select"
              value={project.status}
              onChange={e => handleStatusChange(e.target.value)}
            >
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        </div>
      </div>

      {/* View Tabs */}
      <div className="view-tabs">
        <button
          className={`view-tab ${currentView === 'grid' ? 'active' : ''}`}
          onClick={() => setCurrentView('grid')}
        >
          <FiGrid /> Gallery
        </button>
        <button
          className={`view-tab ${currentView === 'timeline' ? 'active' : ''}`}
          onClick={() => setCurrentView('timeline')}
        >
          <FiClock /> Timeline
        </button>
        <button
          className={`view-tab ${currentView === 'feed' ? 'active' : ''}`}
          onClick={() => setCurrentView('feed')}
        >
          <FiActivity /> Activity Feed
        </button>
        {beforePhotos.length > 0 && afterPhotos.length > 0 && (
          <button
            className={`view-tab ${showBeforeAfter ? 'active' : ''}`}
            onClick={() => setShowBeforeAfter(!showBeforeAfter)}
          >
            <FiCheckCircle /> Before/After
          </button>
        )}
      </div>

      {/* Main Content Area */}
      <div className="detail-content">
        {/* Left Section - Photos */}
        <div className="content-main">
          {showBeforeAfter ? (
            /* Before/After Comparison */
            <div className="before-after-section">
              <h2>Before & After Comparison</h2>
              <div className="before-after-grid">
                <div className="before-column">
                  <h3>Before ({beforePhotos.length})</h3>
                  <div className="comparison-photos">
                    {beforePhotos.map(photo => (
                      <div
                        key={photo._id}
                        className={`comparison-photo ${selectedBeforePhoto?._id === photo._id ? 'selected' : ''}`}
                        onClick={() => setSelectedBeforePhoto(photo)}
                      >
                        <img src={`${getServerUrl()}${photo.url}`} alt={photo.label} />
                        <p>{photo.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="after-column">
                  <h3>After ({afterPhotos.length})</h3>
                  <div className="comparison-photos">
                    {afterPhotos.map(photo => (
                      <div
                        key={photo._id}
                        className={`comparison-photo ${selectedAfterPhoto?._id === photo._id ? 'selected' : ''}`}
                        onClick={() => setSelectedAfterPhoto(photo)}
                      >
                        <img src={`${getServerUrl()}${photo.url}`} alt={photo.label} />
                        <p>{photo.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              {selectedBeforePhoto && selectedAfterPhoto && (
                <div className="comparison-viewer">
                  <div className="comparison-side">
                    <h4>Before</h4>
                    <img src={`${getServerUrl()}${selectedBeforePhoto.url}`} alt="Before" />
                  </div>
                  <div className="comparison-side">
                    <h4>After</h4>
                    <img src={`${getServerUrl()}${selectedAfterPhoto.url}`} alt="After" />
                  </div>
                </div>
              )}
            </div>
          ) : currentView === 'feed' ? (
            /* Activity Feed */
            <div className="activity-feed">
              <h2><FiActivity /> Project Activity</h2>
              <div className="activities-list">
                {activities.map((activity, index) => (
                  <div key={index} className="activity-item">
                    <div className="activity-icon">
                      {activity.type === 'photo_upload' ? <FiImage /> : <FiMessageSquare />}
                    </div>
                    <div className="activity-content">
                      <div className="activity-header">
                        <strong>{activity.user?.name || 'Unknown User'}</strong>
                        <span className="activity-type">
                          {activity.type === 'photo_upload' ? 'uploaded a photo' : 'added a comment'}
                        </span>
                      </div>
                      <div className="activity-body">
                        {activity.type === 'photo_upload' ? (
                          <div className="activity-photo" onClick={() => openLightbox(activity.data)}>
                            <img src={`${getServerUrl()}${activity.data.url}`} alt={activity.data.label} />
                            <p>{activity.data.label}</p>
                          </div>
                        ) : (
                          <p>{activity.data.content}</p>
                        )}
                      </div>
                      <div className="activity-time">
                        <FiClock /> {formatDate(activity.timestamp)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* Photo Gallery/Timeline */
            <>
              <div className="gallery-toolbar">
                <div className="toolbar-left">
                  <h2><FiImage /> Project Photos ({photos.length})</h2>
                  <div className="search-bar">
                    <FiSearch />
                    <input
                      type="text"
                      placeholder="Search photos..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="category-filter">
                {categories.map(cat => {
                  const Icon = cat.icon;
                  const count = cat.value === 'all' ? allPhotos.length : allPhotos.filter(p => p.category === cat.value).length;
                  return (
                    <button
                      key={cat.value}
                      className={`filter-btn ${filterCategory === cat.value ? 'active' : ''}`}
                      onClick={() => setFilterCategory(cat.value)}
                    >
                      <Icon /> {cat.label}
                      <span className="count">({count})</span>
                    </button>
                  );
                })}
              </div>

              {loading ? (
                <div className="loading">Loading photos...</div>
              ) : photos.length === 0 ? (
                <div className="empty-state">
                  <FiImage size={64} />
                  <h3>No photos {searchTerm ? 'found' : 'yet'}</h3>
                  <p>{searchTerm ? 'Try a different search term' : 'Upload photos to document your project progress'}</p>
                  {!searchTerm && (
                    <label className="btn-primary">
                      <FiPlus /> Upload Photo
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleFileSelect}
                        style={{ display: 'none' }}
                      />
                    </label>
                  )}
                </div>
              ) : currentView === 'timeline' ? (
                /* Timeline View */
                <div className="timeline-view">
                  {Object.entries(
                    photos.reduce((acc, photo) => {
                      const date = new Date(photo.uploadedAt).toLocaleDateString();
                      if (!acc[date]) acc[date] = [];
                      acc[date].push(photo);
                      return acc;
                    }, {})
                  ).map(([date, dayPhotos]) => (
                    <div key={date} className="timeline-day">
                      <div className="timeline-date">
                        <FiCalendar />
                        <h3>{date}</h3>
                        <span className="photo-count">{dayPhotos.length} photos</span>
                      </div>
                      <div className="timeline-photos">
                        {dayPhotos.map(photo => (
                          <div key={photo._id} className="timeline-photo-card">
                            <div className="photo-thumbnail" onClick={() => openLightbox(photo)}>
                              <img src={`${getServerUrl()}${photo.url}`} alt={photo.label} />
                            </div>
                            <div className="photo-info">
                              <div className="photo-label">{photo.label}</div>
                              {photo.notes && <div className="photo-notes">{photo.notes}</div>}
                              <div className="photo-meta">
                                <span className={`category-badge category-${photo.category}`}>
                                  {photo.category}
                                </span>
                                <span className="photo-time">
                                  <FiClock /> {new Date(photo.uploadedAt).toLocaleTimeString()}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                /* Grid View */
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
            </>
          )}
        </div>

        {/* Right Sidebar - Team Communication */}
        <div className="content-sidebar">
          <div className="communication-panel">
            <div className="panel-header">
              <h3><FiMessageSquare /> Team Communication</h3>
              <button onClick={() => setShowCommentSection(!showCommentSection)}>
                {showCommentSection ? <FiX /> : <FiPlus />}
              </button>
            </div>

            {showCommentSection && (
              <>
                <div className="add-comment">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a note or comment..."
                    rows={3}
                  />
                  <button
                    className="btn-primary btn-send"
                    onClick={handleAddComment}
                    disabled={!newComment.trim()}
                  >
                    <FiSend /> Send
                  </button>
                </div>

                <div className="comments-list">
                  <h4>Comments ({comments.length})</h4>
                  {comments.map(comment => (
                    <div key={comment._id} className="comment-item">
                      <div className="comment-avatar">
                        <FiUser />
                      </div>
                      <div className="comment-content" style={{ flex: 1 }}>
                        <div className="comment-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div>
                            <strong>{comment.author?.name || 'Unknown'}</strong>
                            <span className="comment-time" style={{ marginLeft: '8px' }}>
                              {formatDate(comment.createdAt)}
                            </span>
                          </div>
                          <button
                            onClick={() => handleDeleteComment(comment._id)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: '2px 4px', borderRadius: '4px', display: 'flex', alignItems: 'center' }}
                            title="Delete comment"
                          >
                            <FiTrash2 size={13} />
                          </button>
                        </div>
                        <p>{comment.content}</p>
                      </div>
                    </div>
                  ))}
                  {comments.length === 0 && (
                    <p className="no-comments">No comments yet. Start the conversation!</p>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
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

      {/* Confirm Modal */}
      <NotificationModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        type="confirm"
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        confirmText="Delete"
        cancelText="Cancel"
      />

      {/* Lightbox */}
      {lightboxOpen && selectedPhoto && (
        <div className="lightbox-overlay" onClick={closeLightbox}>
          <div className="lightbox-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '95vw', maxHeight: '95vh', width: '1100px' }}>
            <button className="lightbox-close" onClick={closeLightbox}>
              <FiX size={24} />
            </button>
            <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
              {/* Image panel */}
              <div style={{ flex: '0 0 65%', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '500px' }}>
                <img src={`${getServerUrl()}${selectedPhoto.url}`} alt={selectedPhoto.label} style={{ maxWidth: '100%', maxHeight: '85vh', objectFit: 'contain' }} />
              </div>
              {/* Info + comments panel */}
              <div style={{ flex: '0 0 35%', display: 'flex', flexDirection: 'column', overflow: 'hidden', borderLeft: '1px solid #e5e7eb' }}>
                <div className="lightbox-info" style={{ flex: '0 0 auto' }}>
                  <h3>{selectedPhoto.label}</h3>
                  {selectedPhoto.notes && <p>{selectedPhoto.notes}</p>}
                  <div className="lightbox-meta">
                    <span className={`category-badge category-${selectedPhoto.category}`}>
                      {selectedPhoto.category}
                    </span>
                    <span><FiCalendar /> {formatDate(selectedPhoto.uploadedAt)}</span>
                    <span><FiUser /> {selectedPhoto.uploadedBy?.name || 'Unknown'}</span>
                  </div>
                  <div className="lightbox-actions">
                    <a href={`${getServerUrl()}${selectedPhoto.url}`} download={selectedPhoto.originalName} className="btn-download">
                      <FiDownload /> Download
                    </a>
                    <button className="btn-edit" onClick={() => { setEditingPhoto(selectedPhoto); closeLightbox(); }}>
                      <FiEdit2 /> Edit
                    </button>
                    <button className="btn-delete" onClick={() => { handleDeletePhoto(selectedPhoto._id); closeLightbox(); }}>
                      <FiTrash2 /> Delete
                    </button>
                  </div>
                </div>

                {/* Photo comments */}
                <div style={{ flex: 1, overflowY: 'auto', borderTop: '1px solid #e5e7eb', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#374151', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <FiMessageSquare size={14} /> Comments ({selectedPhoto.comments?.length || 0})
                  </h4>

                  <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {(selectedPhoto.comments || []).map(c => (
                      <div key={c._id} style={{ background: '#f9fafb', borderRadius: '8px', padding: '10px 12px', fontSize: '13px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                          <span style={{ fontWeight: '600', color: '#374151' }}>{c.author?.name || 'Unknown'}</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ color: '#9ca3af', fontSize: '11px' }}>{new Date(c.createdAt).toLocaleDateString()}</span>
                            <button
                              onClick={() => handleDeletePhotoComment(c._id)}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: '2px', display: 'flex', alignItems: 'center' }}
                              title="Delete"
                            >
                              <FiTrash2 size={11} />
                            </button>
                          </div>
                        </div>
                        <p style={{ margin: 0, color: '#4b5563', lineHeight: '1.5' }}>{c.content}</p>
                      </div>
                    ))}
                    {(!selectedPhoto.comments || selectedPhoto.comments.length === 0) && (
                      <p style={{ color: '#9ca3af', fontSize: '13px', margin: 0 }}>No comments yet.</p>
                    )}
                  </div>

                  <div style={{ marginTop: 'auto', paddingTop: '10px', borderTop: '1px solid #e5e7eb' }}>
                    <textarea
                      value={photoCommentText}
                      onChange={(e) => setPhotoCommentText(e.target.value)}
                      placeholder="Add a comment on this photo..."
                      rows={2}
                      style={{ width: '100%', padding: '8px 10px', border: '1.5px solid #e5e7eb', borderRadius: '8px', fontSize: '13px', resize: 'none', boxSizing: 'border-box', background: '#ffffff', color: '#111827', fontFamily: 'inherit' }}
                    />
                    <button
                      onClick={handleAddPhotoComment}
                      disabled={addingPhotoComment || !photoCommentText.trim()}
                      style={{ marginTop: '6px', width: '100%', padding: '7px 12px', background: '#d4af37', border: 'none', borderRadius: '8px', color: 'white', fontSize: '13px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', opacity: (addingPhotoComment || !photoCommentText.trim()) ? 0.6 : 1 }}
                    >
                      <FiSend size={13} /> {addingPhotoComment ? 'Posting...' : 'Post Comment'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProjectDetail;
