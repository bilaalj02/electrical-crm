import { useState, useEffect } from 'react';
import axios from 'axios';
import { FiPlus, FiUpload, FiImage, FiCalendar, FiFolder, FiTrash2, FiEdit2, FiX, FiFileText, FiFilter, FiSearch } from 'react-icons/fi';
import NotificationModal from './NotificationModal';
import './Projects.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadProject, setUploadProject] = useState(null);

  // Notification modal
  const [notification, setNotification] = useState({
    isOpen: false,
    type: 'info',
    title: '',
    message: '',
    onConfirm: null
  });

  // Filters
  const [filterJob, setFilterJob] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [sortBy, setSortBy] = useState('date-desc'); // 'date-desc', 'date-asc', 'name'

  // Form states
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    jobId: '',
    jobSearch: '',
    projectDate: new Date().toISOString().split('T')[0]
  });

  // Filtered jobs for searchable dropdown
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [showJobDropdown, setShowJobDropdown] = useState(false);

  const [uploadFiles, setUploadFiles] = useState([]);
  const [uploadCaption, setUploadCaption] = useState('');
  const [uploadTags, setUploadTags] = useState('');
  const [isBeforePhoto, setIsBeforePhoto] = useState(false);
  const [isAfterPhoto, setIsAfterPhoto] = useState(false);

  const [noteContent, setNoteContent] = useState('');
  const [selectedPhotos, setSelectedPhotos] = useState([]);

  useEffect(() => {
    fetchProjects();
    fetchJobs();
  }, [filterJob, filterStatus, filterDate, searchQuery]);

  // Filter jobs based on search
  useEffect(() => {
    if (formData.jobSearch) {
      const filtered = jobs.filter(job =>
        job.jobNumber?.toLowerCase().includes(formData.jobSearch.toLowerCase()) ||
        job.title?.toLowerCase().includes(formData.jobSearch.toLowerCase()) ||
        job.client?.name?.toLowerCase().includes(formData.jobSearch.toLowerCase())
      );
      setFilteredJobs(filtered);
    } else {
      setFilteredJobs(jobs);
    }
  }, [formData.jobSearch, jobs]);

  const fetchProjects = async () => {
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();

      if (filterJob) params.append('jobId', filterJob);
      if (filterStatus) params.append('status', filterStatus);
      if (filterDate) params.append('startDate', filterDate);
      if (searchQuery) params.append('search', searchQuery);

      const response = await axios.get(`${API_URL}/projects?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      let projectsData = response.data.projects || [];

      // Sort projects
      switch (sortBy) {
        case 'date-desc':
          projectsData.sort((a, b) => new Date(b.projectDate) - new Date(a.projectDate));
          break;
        case 'date-asc':
          projectsData.sort((a, b) => new Date(a.projectDate) - new Date(b.projectDate));
          break;
        case 'name':
          projectsData.sort((a, b) => a.title.localeCompare(b.title));
          break;
        default:
          break;
      }

      setProjects(projectsData);
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchJobs = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/jobs`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setJobs(response.data.jobs || []);
    } catch (error) {
      console.error('Error fetching jobs:', error);
    }
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();

    if (!formData.jobId) {
      setNotification({
        isOpen: true,
        type: 'error',
        title: 'Missing Job',
        message: 'Please select a job from the list'
      });
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_URL}/projects`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setProjects([response.data.project, ...projects]);
      setShowCreateModal(false);
      setFormData({
        title: '',
        description: '',
        jobId: '',
        jobSearch: '',
        projectDate: new Date().toISOString().split('T')[0]
      });

      setNotification({
        isOpen: true,
        type: 'success',
        title: 'Success',
        message: 'Project created successfully!'
      });
    } catch (error) {
      console.error('Error creating project:', error);
      setNotification({
        isOpen: true,
        type: 'error',
        title: 'Error',
        message: error.response?.data?.error || 'Failed to create project'
      });
    }
  };

  const handleUploadPhotos = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();

      uploadFiles.forEach(file => {
        formData.append('photos', file);
      });

      formData.append('caption', uploadCaption);
      formData.append('tags', uploadTags);
      formData.append('isBeforePhoto', isBeforePhoto);
      formData.append('isAfterPhoto', isAfterPhoto);

      await axios.post(`${API_URL}/projects/${uploadProject._id}/photos`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      // Refresh projects
      fetchProjects();

      // Reset and close
      setShowUploadModal(false);
      setUploadFiles([]);
      setUploadCaption('');
      setUploadTags('');
      setIsBeforePhoto(false);
      setIsAfterPhoto(false);

      setNotification({
        isOpen: true,
        type: 'success',
        title: 'Success',
        message: 'Photos uploaded successfully!'
      });
    } catch (error) {
      console.error('Error uploading photos:', error);
      setNotification({
        isOpen: true,
        type: 'error',
        title: 'Upload Failed',
        message: error.response?.data?.error || 'Failed to upload photos'
      });
    }
  };

  const handleAddNote = async (projectId) => {
    if (!noteContent.trim()) return;

    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_URL}/projects/${projectId}/notes`, {
        content: noteContent,
        attachedPhotos: selectedPhotos
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      fetchProjects();
      setNoteContent('');
      setSelectedPhotos([]);

      setNotification({
        isOpen: true,
        type: 'success',
        title: 'Success',
        message: 'Note added successfully!'
      });
    } catch (error) {
      console.error('Error adding note:', error);
      setNotification({
        isOpen: true,
        type: 'error',
        title: 'Error',
        message: error.response?.data?.error || 'Failed to add note'
      });
    }
  };

  const handleDeletePhoto = async (projectId, photoId) => {
    setNotification({
      isOpen: true,
      type: 'confirm',
      title: 'Delete Photo',
      message: 'Are you sure you want to delete this photo? This action cannot be undone.',
      onConfirm: async () => {
        try {
          const token = localStorage.getItem('token');
          await axios.delete(`${API_URL}/projects/${projectId}/photos/${photoId}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          fetchProjects();
          setNotification({
            isOpen: true,
            type: 'success',
            title: 'Deleted',
            message: 'Photo deleted successfully!'
          });
        } catch (error) {
          console.error('Error deleting photo:', error);
          setNotification({
            isOpen: true,
            type: 'error',
            title: 'Error',
            message: error.response?.data?.error || 'Failed to delete photo'
          });
        }
      }
    });
  };

  const handleDeleteProject = (projectId, e) => {
    if (e) {
      e.stopPropagation(); // Prevent opening the project modal
    }

    setNotification({
      isOpen: true,
      type: 'confirm',
      title: 'Delete Project',
      message: 'Are you sure you want to delete this project? This will delete all photos and notes. This action cannot be undone.',
      onConfirm: async () => {
        try {
          const token = localStorage.getItem('token');
          await axios.delete(`${API_URL}/projects/${projectId}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          fetchProjects();
          setShowProjectModal(false);
          setNotification({
            isOpen: true,
            type: 'success',
            title: 'Deleted',
            message: 'Project deleted successfully!'
          });
        } catch (error) {
          console.error('Error deleting project:', error);
          setNotification({
            isOpen: true,
            type: 'error',
            title: 'Error',
            message: error.response?.data?.error || 'Failed to delete project'
          });
        }
      }
    });
  };

  const openProjectModal = async (project) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/projects/${project._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSelectedProject(response.data);
      setShowProjectModal(true);
    } catch (error) {
      console.error('Error fetching project details:', error);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return <div className="loading">Loading projects...</div>;
  }

  return (
    <div className="projects-container">
      <div className="projects-header">
        <h1><FiFolder /> Projects</h1>
        <button className="btn-primary" onClick={() => setShowCreateModal(true)}>
          <FiPlus /> New Project
        </button>
      </div>

      {/* Filters and Search */}
      <div style={{
        background: 'linear-gradient(135deg, #fef9e7 0%, #fef5d4 100%)',
        padding: '24px',
        borderRadius: '16px',
        marginBottom: '24px',
        boxShadow: '0 4px 12px rgba(212, 175, 55, 0.15)',
        border: '2px solid rgba(212, 175, 55, 0.3)'
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          marginBottom: '16px'
        }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#78350f', fontSize: '13px' }}>
              Search
            </label>
            <div style={{ position: 'relative' }}>
              <FiSearch style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#999' }} />
              <input
                type="text"
                placeholder="Search projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px 10px 40px',
                  border: '2px solid rgba(212, 175, 55, 0.3)',
                  borderRadius: '8px',
                  fontSize: '14px',
                  background: 'white'
                }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#78350f', fontSize: '13px' }}>
              Job
            </label>
            <select
              value={filterJob}
              onChange={(e) => setFilterJob(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '2px solid rgba(212, 175, 55, 0.3)',
                borderRadius: '8px',
                fontSize: '14px',
                background: 'white'
              }}
            >
              <option value="">All Jobs</option>
              {jobs.map(job => (
                <option key={job._id} value={job._id}>
                  {job.jobNumber} - {job.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#78350f', fontSize: '13px' }}>
              Status
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '2px solid rgba(212, 175, 55, 0.3)',
                borderRadius: '8px',
                fontSize: '14px',
                background: 'white'
              }}
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#78350f', fontSize: '13px' }}>
              Sort By
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '2px solid rgba(212, 175, 55, 0.3)',
                borderRadius: '8px',
                fontSize: '14px',
                background: 'white'
              }}
            >
              <option value="date-desc">Newest First</option>
              <option value="date-asc">Oldest First</option>
              <option value="name">Name (A-Z)</option>
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <button
            onClick={() => setViewMode('grid')}
            style={{
              padding: '8px 16px',
              border: `2px solid ${viewMode === 'grid' ? '#d4af37' : 'rgba(212, 175, 55, 0.3)'}`,
              borderRadius: '8px',
              background: viewMode === 'grid' ? '#d4af37' : 'white',
              color: viewMode === 'grid' ? 'white' : '#78350f',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              transition: 'all 0.3s'
            }}
            title="Grid View"
          >
            Grid View
          </button>
          <button
            onClick={() => setViewMode('list')}
            style={{
              padding: '8px 16px',
              border: `2px solid ${viewMode === 'list' ? '#d4af37' : 'rgba(212, 175, 55, 0.3)'}`,
              borderRadius: '8px',
              background: viewMode === 'list' ? '#d4af37' : 'white',
              color: viewMode === 'list' ? 'white' : '#78350f',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              transition: 'all 0.3s'
            }}
            title="List View"
          >
            List View
          </button>
        </div>
      </div>

      {/* Projects Grid/List */}
      <div className={`projects-${viewMode}`}>
        {projects.length === 0 ? (
          <div className="empty-state">
            <FiFolder size={48} />
            <h3>No projects yet</h3>
            <p>Create your first project to get started</p>
          </div>
        ) : (
          projects.map(project => (
            <div
              key={project._id}
              className="project-card"
              onClick={() => openProjectModal(project)}
            >
              <div className="project-card-header">
                {project.photos && project.photos.length > 0 ? (
                  <div className="project-thumbnail">
                    <img
                      src={`${API_URL.replace('/api', '')}${project.photos[0].url}`}
                      alt={project.title}
                    />
                    {project.photos.length > 1 && (
                      <span className="photo-count">
                        <FiImage /> {project.photos.length}
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="project-thumbnail-placeholder">
                    <FiImage size={32} />
                  </div>
                )}
              </div>

              <div className="project-card-body">
                <h3>{project.title}</h3>
                <p className="project-job">
                  {project.job?.jobNumber} - {project.job?.client?.name}
                </p>
                <p className="project-date">
                  <FiCalendar /> {formatDate(project.projectDate)}
                </p>
                {project.description && (
                  <p className="project-description">{project.description}</p>
                )}
                <div className="project-meta">
                  <span className={`status-badge status-${project.status}`}>
                    {project.status}
                  </span>
                  <span className="notes-count">
                    <FiFileText /> {project.notes?.length || 0} notes
                  </span>
                </div>
              </div>

              <div className="project-card-footer">
                <button
                  className="btn-secondary"
                  onClick={(e) => {
                    e.stopPropagation();
                    setUploadProject(project);
                    setShowUploadModal(true);
                  }}
                >
                  <FiUpload /> Upload Photos
                </button>
                <button
                  className="btn-delete"
                  onClick={(e) => handleDeleteProject(project._id, e)}
                  title="Delete project"
                >
                  <FiTrash2 />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Project Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2><FiPlus /> New Project</h2>
              <button className="btn-close" onClick={() => setShowCreateModal(false)}>
                <FiX />
              </button>
            </div>
            <form onSubmit={handleCreateProject}>
              <div className="form-group">
                <label>Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>
              <div className="form-group" style={{ position: 'relative' }}>
                <label>Job *</label>
                <input
                  type="text"
                  placeholder="Search or type job..."
                  value={formData.jobSearch}
                  onChange={(e) => {
                    setFormData({ ...formData, jobSearch: e.target.value, jobId: '' });
                    setShowJobDropdown(true);
                  }}
                  onFocus={() => setShowJobDropdown(true)}
                  required={!formData.jobId}
                />
                {showJobDropdown && filteredJobs.length > 0 && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    background: 'white',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    maxHeight: '200px',
                    overflowY: 'auto',
                    zIndex: 1000,
                    marginTop: '4px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                  }}>
                    {filteredJobs.map(job => (
                      <div
                        key={job._id}
                        onClick={() => {
                          setFormData({
                            ...formData,
                            jobId: job._id,
                            jobSearch: `${job.jobNumber} - ${job.title}`
                          });
                          setShowJobDropdown(false);
                        }}
                        style={{
                          padding: '12px',
                          cursor: 'pointer',
                          borderBottom: '1px solid #f0f0f0',
                          transition: 'background 0.2s'
                        }}
                        onMouseEnter={(e) => e.target.style.background = '#f9f9f9'}
                        onMouseLeave={(e) => e.target.style.background = 'white'}
                      >
                        <div style={{ fontWeight: '500' }}>{job.jobNumber}</div>
                        <div style={{ fontSize: '12px', color: '#666' }}>{job.title}</div>
                        {job.client && (
                          <div style={{ fontSize: '11px', color: '#999' }}>{job.client.name}</div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="form-group">
                <label>Project Date</label>
                <input
                  type="date"
                  value={formData.projectDate}
                  onChange={(e) => setFormData({ ...formData, projectDate: e.target.value })}
                />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Create Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Upload Photos Modal */}
      {showUploadModal && uploadProject && (
        <div className="modal-overlay" onClick={() => setShowUploadModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2><FiUpload /> Upload Photos to {uploadProject.title}</h2>
              <button className="btn-close" onClick={() => setShowUploadModal(false)}>
                <FiX />
              </button>
            </div>
            <form onSubmit={handleUploadPhotos}>
              <div className="form-group">
                <label>Select Photos *</label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => setUploadFiles(Array.from(e.target.files))}
                  required
                />
                {uploadFiles.length > 0 && (
                  <p className="file-info">{uploadFiles.length} file(s) selected</p>
                )}
              </div>
              <div className="form-group">
                <label>Caption</label>
                <input
                  type="text"
                  value={uploadCaption}
                  onChange={(e) => setUploadCaption(e.target.value)}
                  placeholder="Add a caption for these photos..."
                />
              </div>
              <div className="form-group">
                <label>Tags (comma-separated)</label>
                <input
                  type="text"
                  value={uploadTags}
                  onChange={(e) => setUploadTags(e.target.value)}
                  placeholder="e.g., wiring, panel, installation"
                />
              </div>
              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={isBeforePhoto}
                    onChange={(e) => setIsBeforePhoto(e.target.checked)}
                  />
                  Mark as "Before" photo
                </label>
              </div>
              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={isAfterPhoto}
                    onChange={(e) => setIsAfterPhoto(e.target.checked)}
                  />
                  Mark as "After" photo
                </label>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setShowUploadModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  <FiUpload /> Upload Photos
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Project Detail Modal */}
      {showProjectModal && selectedProject && (
        <div className="modal-overlay" onClick={() => setShowProjectModal(false)}>
          <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2>{selectedProject.title}</h2>
                <p className="modal-subtitle">
                  {selectedProject.job?.jobNumber} - {selectedProject.job?.client?.name}
                </p>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  className="btn-delete"
                  onClick={() => handleDeleteProject(selectedProject._id)}
                  title="Delete project"
                >
                  <FiTrash2 /> Delete
                </button>
                <button className="btn-close" onClick={() => setShowProjectModal(false)}>
                  <FiX />
                </button>
              </div>
            </div>

            <div className="project-detail-content">
              {/* Project Info */}
              <div className="project-info-section">
                <p><strong>Date:</strong> {formatDate(selectedProject.projectDate)}</p>
                <p><strong>Status:</strong> <span className={`status-badge status-${selectedProject.status}`}>{selectedProject.status}</span></p>
                {selectedProject.description && (
                  <p><strong>Description:</strong> {selectedProject.description}</p>
                )}
              </div>

              {/* Photos */}
              <div className="project-photos-section">
                <h3><FiImage /> Photos ({selectedProject.photos?.length || 0})</h3>
                <div className="photos-grid">
                  {selectedProject.photos?.map((photo) => (
                    <div key={photo._id} className="photo-item">
                      <img
                        src={`${API_URL.replace('/api', '')}${photo.url}`}
                        alt={photo.caption || selectedProject.title}
                      />
                      {photo.caption && <p className="photo-caption">{photo.caption}</p>}
                      {(photo.isBeforePhoto || photo.isAfterPhoto) && (
                        <div className="photo-badges">
                          {photo.isBeforePhoto && <span className="badge badge-before">Before</span>}
                          {photo.isAfterPhoto && <span className="badge badge-after">After</span>}
                        </div>
                      )}
                      <button
                        className="btn-delete-photo"
                        onClick={() => handleDeletePhoto(selectedProject._id, photo._id)}
                        title="Delete photo"
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div className="project-notes-section">
                <h3><FiFileText /> Notes ({selectedProject.notes?.length || 0})</h3>

                {/* Add Note */}
                <div className="add-note-form">
                  <textarea
                    value={noteContent}
                    onChange={(e) => setNoteContent(e.target.value)}
                    placeholder="Add a note..."
                    rows={3}
                  />
                  <button
                    className="btn-primary"
                    onClick={() => handleAddNote(selectedProject._id)}
                    disabled={!noteContent.trim()}
                  >
                    <FiPlus /> Add Note
                  </button>
                </div>

                {/* Notes List */}
                <div className="notes-list">
                  {selectedProject.notes?.map((note) => (
                    <div key={note._id} className="note-item">
                      <div className="note-header">
                        <strong>{note.author?.name}</strong>
                        <span className="note-date">{formatDate(note.createdAt)}</span>
                      </div>
                      <p className="note-content">{note.content}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Notification Modal */}
      <NotificationModal
        isOpen={notification.isOpen}
        onClose={() => setNotification({ ...notification, isOpen: false })}
        type={notification.type}
        title={notification.title}
        message={notification.message}
        onConfirm={notification.onConfirm}
      />
    </div>
  );
}
