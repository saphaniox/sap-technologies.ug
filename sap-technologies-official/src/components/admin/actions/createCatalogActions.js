import { upsertById } from "../../../utils/realtimeCollection";
import apiService from "../../../services/api";
import { removeById } from "../../../utils/realtimeCollection";
export default function createCatalogActions({
  setServices,
  setEditingService,
  setShowServiceForm,
  fetchServices,
  servicesPagination,
  fetchDashboardStats,
  setAutoMessage,
  setProjects,
  setEditingProject,
  setShowProjectForm,
  fetchProjects,
  projectsPagination,
  setPartners,
  fetchPartners,
  partnersPagination,
  setEditingPartner,
  setShowPartnerForm,
  partners,
  setPartnershipRequests,
  fetchPartnershipRequests,
  partnershipRequestsPagination
}) {
  const handleServiceSubmit = async savedService => {
    if (savedService?._id) {
      setServices(prev => upsertById(prev, savedService, {
        orderKey: "order"
      }));
    }
    setEditingService(null);
    setShowServiceForm(false);
    fetchServices(servicesPagination.currentPage);
    fetchDashboardStats();
  };
  const handleServiceEdit = service => {
    setEditingService(service);
    setShowServiceForm(true);
  };
  const handleServiceDelete = async (serviceId, serviceName) => {
    if (!window.confirm(`Are you sure you want to delete service "${serviceName}"?`)) {
      return;
    }
    try {
      await apiService.deleteService(serviceId);
      setServices(prev => removeById(prev, serviceId));
      setAutoMessage("Service removed successfully");
      fetchServices(servicesPagination.currentPage);
      fetchDashboardStats();
    } catch (error) {
      setAutoMessage("Couldn't delete service: " + error.message);
    }
  };
  const handleServiceToggleFeatured = async serviceId => {
    try {
      await apiService.toggleServiceFeatured(serviceId);
      setAutoMessage("Service featured status updated");
      fetchServices(servicesPagination.currentPage);
    } catch (error) {
      setAutoMessage("Couldn't update service featured status: " + error.message);
    }
  };

  // Project handlers
  const handleProjectSubmit = async savedProject => {
    if (savedProject?._id) {
      setProjects(prev => upsertById(prev, savedProject, {
        orderKey: "order"
      }));
    }
    setEditingProject(null);
    setShowProjectForm(false);
    fetchProjects(projectsPagination.currentPage);
    fetchDashboardStats();
  };
  const handleProjectEdit = project => {
    setEditingProject(project);
    setShowProjectForm(true);
  };
  const handleProjectDelete = async (projectId, projectName) => {
    if (!window.confirm(`Are you sure you want to delete project "${projectName}"?`)) {
      return;
    }
    try {
      await apiService.deleteProject(projectId);
      setProjects(prev => removeById(prev, projectId));
      setAutoMessage("Project removed successfully");
      fetchProjects(projectsPagination.currentPage);
      fetchDashboardStats();
    } catch (error) {
      setAutoMessage("Couldn't delete project: " + error.message);
    }
  };
  const handleProjectToggleFeatured = async projectId => {
    try {
      await apiService.toggleProjectFeatured(projectId);
      setAutoMessage("Project featured status updated");
      fetchProjects(projectsPagination.currentPage);
    } catch (error) {
      setAutoMessage("Couldn't update project featured status: " + error.message);
    }
  };

  // Partner management functions
  const handlePartnerSave = async savedPartner => {
    try {
      if (savedPartner?._id) {
        setPartners(prev => upsertById(prev, savedPartner, {
          orderKey: "order"
        }));
      }
      setAutoMessage("Partner saved! ");
      fetchPartners(partnersPagination.currentPage);
    } catch (error) {
      setAutoMessage("Couldn't save partner: " + error.message);
    }
  };
  const handlePartnerEdit = partner => {
    setEditingPartner(partner);
    setShowPartnerForm(true);
  };
  const handlePartnerDelete = async (partnerId, partnerName) => {
    if (!window.confirm(`Are you sure you want to delete partner "${partnerName || "Logo-only partner"}"?`)) {
      return;
    }
    try {
      await apiService.request(`/api/partners/${partnerId}`, {
        method: "DELETE"
      });
      setPartners(prev => removeById(prev, partnerId));
      setAutoMessage("Partner removed successfully");
      fetchPartners(partnersPagination.currentPage);
    } catch (error) {
      setAutoMessage("Couldn't delete partner: " + error.message);
    }
  };
  const handlePartnerToggleActive = async partnerId => {
    try {
      const partner = partners.find(p => p._id === partnerId);
      if (!partner) return;
      await apiService.request(`/api/partners/${partnerId}`, {
        method: "PUT",
        body: JSON.stringify({
          isActive: !partner.isActive
        }),
        headers: {
          "Content-Type": "application/json"
        }
      });
      setPartners(prev => prev.map(item => item._id === partnerId ? {
        ...item,
        isActive: !partner.isActive
      } : item));
      setAutoMessage("Partner status updated");
      fetchPartners(partnersPagination.currentPage);
    } catch (error) {
      setAutoMessage("Couldn't update partner status: " + error.message);
    }
  };

  // Partnership Request Handlers
  const handlePartnershipRequestStatusUpdate = async (requestId, newStatus) => {
    try {
      await apiService.request(`/api/partnership-requests/${requestId}/status`, {
        method: "PUT",
        body: JSON.stringify({
          status: newStatus
        }),
        headers: {
          "Content-Type": "application/json"
        }
      });
      setPartnershipRequests(prev => prev.map(request => request._id === requestId ? {
        ...request,
        status: newStatus
      } : request));
      setAutoMessage("Partnership request status updated");
      fetchPartnershipRequests(partnershipRequestsPagination.currentPage);
    } catch (error) {
      setAutoMessage("Couldn't update partnership request status: " + error.message, true);
    }
  };
  const handleViewPartnershipRequest = request => {
    alert(`Partnership Request Details:

Company: ${request.companyName}
Contact Person: ${request.contactPerson}
Email: ${request.contactEmail}
Website: ${request.website || "Not provided"}
Status: ${request.status}
Submitted: ${new Date(request.createdAt).toLocaleString()}

Description:
${request.description}

${request.adminNotes ? `Admin Notes:\n${request.adminNotes}` : ""}`);
  };
  const handleDeletePartnershipRequest = async (requestId, companyName) => {
    if (!window.confirm(`Are you sure you want to delete the partnership request from ${companyName}?`)) {
      return;
    }
    try {
      await apiService.request(`/api/partnership-requests/${requestId}`, {
        method: "DELETE"
      });
      setPartnershipRequests(prev => prev.filter(request => request._id !== requestId));
      setAutoMessage("Partnership request removed successfully");
      fetchPartnershipRequests(partnershipRequestsPagination.currentPage);
    } catch (error) {
      setAutoMessage("Couldn't delete partnership request: " + error.message, true);
    }
  };
  return {
    handleServiceSubmit,
    handleServiceEdit,
    handleServiceDelete,
    handleServiceToggleFeatured,
    handleProjectSubmit,
    handleProjectEdit,
    handleProjectDelete,
    handleProjectToggleFeatured,
    handlePartnerSave,
    handlePartnerEdit,
    handlePartnerDelete,
    handlePartnerToggleActive,
    handlePartnershipRequestStatusUpdate,
    handleViewPartnershipRequest,
    handleDeletePartnershipRequest
  };
}
