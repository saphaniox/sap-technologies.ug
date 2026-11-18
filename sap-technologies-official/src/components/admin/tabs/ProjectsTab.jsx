// Presentational admin view; state and actions are supplied by the dashboard.
export default function ProjectsTab({
  fetchProjects,
  handleProjectDelete,
  handleProjectEdit,
  handleProjectToggleFeatured,
  projects,
  projectsCategoryFilter,
  projectsPagination,
  projectsSearch,
  projectsStatusFilter,
  setProjectsCategoryFilter,
  setProjectsSearch,
  setProjectsStatusFilter,
  setShowProjectForm
}) {
  return <div className="projects-tab">
              <div className="tab-controls">
                <div className="search-filters">
                  <input type="text" placeholder="Search projects..." value={projectsSearch} onChange={e => setProjectsSearch(e.target.value)} className="search-input" />
                  <select value={projectsCategoryFilter} onChange={e => setProjectsCategoryFilter(e.target.value)} className="filter-select">
                    <option value="">All Categories</option>
                    <option value="Web Application">Web Application</option>
                    <option value="Mobile App">Mobile App</option>
                    <option value="IoT Solution">IoT Solution</option>
                    <option value="Software solutions"> Software solutions</option>
                    <option value="Graphics Design">Graphics Design</option>
                    <option value="Electrical System">Electrical System</option>
                  </select>
                  <select value={projectsStatusFilter} onChange={e => setProjectsStatusFilter(e.target.value)} className="filter-select">
                    <option value="">All Status</option>
                    <option value="planning">Planning</option>
                    <option value="in-progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="on-hold">On Hold</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
                <div className="action-buttons">
                  <button onClick={() => setShowProjectForm(true)} className="btn-primary">
                     Add Project
                  </button>
                  <button onClick={() => fetchProjects(1)} className="btn-refresh">
                     Refresh
                  </button>
                </div>
              </div>

              <div className="data-table">
                <table>
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Category</th>
                      <th>Status</th>
                      <th>Featured</th>
                      <th>Client</th>
                      <th>Progress</th>
                      <th>Created</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {projects.map(project => <tr key={project._id}>
                        <td>{project.title}</td>
                        <td>{project.category}</td>
                        <td>
                          <span className={`status-badge ${project.status}`}>
                            {project.status}
                          </span>
                        </td>
                        <td>
                          <button onClick={() => handleProjectToggleFeatured(project._id)} className={`btn-small ${project.featured ? "btn-warning" : "btn-secondary"}`}>
                            {project.featured ? "Yes" : "No"}
                          </button>
                        </td>
                        <td>{project.client?.name || "Internal"}</td>
                        <td>
                          <div className="progress-bar">
                            <div className="progress-fill" style={{
                  width: `${project.progress || 0}%`
                }}></div>
                            <span className="progress-text">{project.progress || 0}%</span>
                          </div>
                        </td>
                        <td>{new Date(project.createdAt).toLocaleDateString()}</td>
                        <td className="actions">
                          <button onClick={() => handleProjectEdit(project)} className="btn-secondary btn-small">
                            Edit
                          </button>
                          <button onClick={() => handleProjectDelete(project._id, project.title)} className="btn-danger btn-small">
                            Delete
                          </button>
                        </td>
                      </tr>)}
                  </tbody>
                </table>
              </div>

              <div className="pagination">
                <button onClick={() => fetchProjects(projectsPagination.currentPage - 1)} disabled={!projectsPagination.hasPrevPage} className="btn-secondary">
                  Previous
                </button>
                <span>
                  Page {projectsPagination.currentPage} of {projectsPagination.totalPages}
                </span>
                <button onClick={() => fetchProjects(projectsPagination.currentPage + 1)} disabled={!projectsPagination.hasNextPage} className="btn-secondary">
                  Next
                </button>
              </div>
            </div>;
}
