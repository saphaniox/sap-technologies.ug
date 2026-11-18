import apiService from "../../../services/api";
import { upsertById } from "../../../utils/realtimeCollection";
import { removeById } from "../../../utils/realtimeCollection";
export default function createContentActions({
  setGalleryItems,
  setShowGalleryForm,
  setEditingGallery,
  fetchGalleryItems,
  fetchDashboardStats,
  setAutoMessage,
  setJobs,
  setShowJobForm,
  setEditingJob,
  fetchJobs
}) {
  const handleGallerySave = async savedItem => {
    if (savedItem?._id) {
      setGalleryItems(prev => {
        const withoutCurrent = prev.filter(item => item._id !== savedItem._id);
        return [savedItem, ...withoutCurrent].sort((first, second) => {
          const firstOrder = Number(first.displayOrder || 0);
          const secondOrder = Number(second.displayOrder || 0);
          if (firstOrder !== secondOrder) return firstOrder - secondOrder;
          return new Date(second.createdAt || 0) - new Date(first.createdAt || 0);
        });
      });
    }
    setShowGalleryForm(false);
    setEditingGallery(null);
    fetchGalleryItems();
    fetchDashboardStats();
  };
  const handleGalleryEdit = item => {
    setEditingGallery(item);
    setShowGalleryForm(true);
  };
  const handleGalleryDelete = async (itemId, title) => {
    if (!window.confirm(`Are you sure you want to delete "${title || "this gallery item"}"?`)) {
      return;
    }
    try {
      await apiService.deleteGalleryItem(itemId);
      setGalleryItems(prev => prev.filter(item => item._id !== itemId));
      setAutoMessage("Gallery item removed successfully");
      await fetchGalleryItems();
      await fetchDashboardStats();
    } catch (error) {
      setAutoMessage("Couldn't delete gallery item: " + error.message, true);
    }
  };
  const handleJobSave = async savedJob => {
    if (savedJob?._id) {
      setJobs(prev => upsertById(prev, savedJob));
    }
    setShowJobForm(false);
    setEditingJob(null);
    fetchJobs();
    fetchDashboardStats();
  };
  const handleJobEdit = job => {
    setEditingJob(job);
    setShowJobForm(true);
  };
  const handleJobDelete = async (jobId, title) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"?`)) {
      return;
    }
    try {
      await apiService.deleteJob(jobId);
      setJobs(prev => removeById(prev, jobId));
      setAutoMessage("Job posting removed successfully");
      fetchJobs();
      fetchDashboardStats();
    } catch (error) {
      setAutoMessage("Couldn't delete job posting: " + error.message, true);
    }
  };
  return {
    handleGallerySave,
    handleGalleryEdit,
    handleGalleryDelete,
    handleJobSave,
    handleJobEdit,
    handleJobDelete
  };
}
