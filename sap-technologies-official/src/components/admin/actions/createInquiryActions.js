import { buildApplicantEmailDraft } from "../utils/dashboardFormatters";
import apiService from "../../../services/api";
import { upsertById } from "../../../utils/realtimeCollection";
export default function createInquiryActions({
  setEmailingJobApplication,
  setApplicantEmailForm,
  emailingJobApplication,
  applicantEmailForm,
  setAutoMessage,
  setSendingApplicantEmail,
  setJobApplications,
  setSelectedJobApplication,
  fetchJobApplications,
  jobApplicationsPagination,
  fetchDashboardStats,
  setProductInquiries,
  fetchProductInquiries,
  productInquiriesPagination,
  setServiceQuotes,
  fetchServiceQuotes,
  serviceQuotesPagination
}) {
  const openApplicantEmailComposer = application => {
    setEmailingJobApplication(application);
    setApplicantEmailForm(buildApplicantEmailDraft(application));
  };
  const closeApplicantEmailComposer = () => {
    setEmailingJobApplication(null);
    setApplicantEmailForm({
      subject: "",
      message: ""
    });
  };
  const handleSendApplicantEmail = async event => {
    event.preventDefault();
    if (!emailingJobApplication?._id) return;
    if (!applicantEmailForm.subject.trim() || !applicantEmailForm.message.trim()) {
      setAutoMessage("Please add both a subject and message before sending.", true);
      return;
    }
    try {
      setSendingApplicantEmail(true);
      const response = await apiService.sendJobApplicationEmail(emailingJobApplication._id, applicantEmailForm);
      const updatedApplication = response?.data?.application || response?.application;
      if (updatedApplication?._id) {
        setJobApplications(prev => upsertById(prev, updatedApplication));
        setSelectedJobApplication(current => current?._id === updatedApplication._id ? updatedApplication : current);
      }
      setAutoMessage(`Professional email sent to ${emailingJobApplication.fullName}`);
      closeApplicantEmailComposer();
    } catch (error) {
      setAutoMessage("Couldn't send applicant email: " + error.message, true);
    } finally {
      setSendingApplicantEmail(false);
    }
  };
  const handleJobApplicationStatusUpdate = async (application, status) => {
    const applicationId = application?._id || application;
    try {
      await apiService.updateApplicationStatus(applicationId, status);
      setJobApplications(prev => prev.map(application => application._id === applicationId ? {
        ...application,
        status
      } : application));
      setSelectedJobApplication(current => current?._id === applicationId ? {
        ...current,
        status
      } : current);
      setAutoMessage("Job application status updated and applicant email queued");
      fetchJobApplications(jobApplicationsPagination.currentPage);
      fetchDashboardStats();
    } catch (error) {
      setAutoMessage("Couldn't update job application: " + error.message, true);
    }
  };
  const handleUpdateInquiryStatus = async (inquiryId, newStatus) => {
    try {
      const response = await apiService.updateInquiryStatus(inquiryId, {
        status: newStatus
      });
      if (response && response.data) {
        setProductInquiries(prev => prev.map(inquiry => inquiry._id === inquiryId ? {
          ...inquiry,
          status: newStatus
        } : inquiry));
        setAutoMessage("Product inquiry status updated successfully");
        fetchProductInquiries(productInquiriesPagination.currentPage);
      }
    } catch (error) {
      setAutoMessage("Couldn't update inquiry status: " + error.message, true);
    }
  };
  const handleDeleteInquiry = async (inquiryId, productName) => {
    if (!window.confirm(`Are you sure you want to delete the inquiry for ${productName}?`)) {
      return;
    }
    try {
      const response = await apiService.deleteInquiry(inquiryId);
      if (response) {
        // Instantly remove from UI
        setProductInquiries(prev => prev.filter(inquiry => inquiry._id !== inquiryId));
        setAutoMessage("Product inquiry removed successfully");
        // Clear API cache and refetch to ensure data consistency
        try {
          apiService.clearCache();
        } catch {/* ignore */}
        fetchProductInquiries(productInquiriesPagination.currentPage);
      }
    } catch (error) {
      console.error(" Delete inquiry error:", error);
      setAutoMessage("Couldn't delete inquiry: " + (error.response?.data?.message || error.message), true);
    }
  };
  const handleUpdateQuoteStatus = async (quoteId, newStatus) => {
    try {
      const response = await apiService.updateQuoteStatus(quoteId, {
        status: newStatus
      });
      if (response && response.data) {
        setServiceQuotes(prev => prev.map(quote => quote._id === quoteId ? {
          ...quote,
          status: newStatus
        } : quote));
        setAutoMessage("Service quote status updated successfully");
        fetchServiceQuotes(serviceQuotesPagination.currentPage);
      }
    } catch (error) {
      setAutoMessage("Couldn't update quote status: " + error.message, true);
    }
  };
  const handleDeleteQuote = async (quoteId, serviceName) => {
    if (!window.confirm(`Are you sure you want to delete the quote for ${serviceName}?`)) {
      return;
    }
    try {
      const response = await apiService.deleteQuote(quoteId);
      if (response) {
        // Instantly remove from UI
        setServiceQuotes(prev => prev.filter(quote => quote._id !== quoteId));
        setAutoMessage("Service quote removed successfully");
        // Refetch to ensure data consistency
        fetchServiceQuotes(serviceQuotesPagination.currentPage);
      }
    } catch (error) {
      setAutoMessage("Couldn't delete quote: " + error.message, true);
    }
  };
  return {
    openApplicantEmailComposer,
    closeApplicantEmailComposer,
    handleSendApplicantEmail,
    handleJobApplicationStatusUpdate,
    handleUpdateInquiryStatus,
    handleDeleteInquiry,
    handleUpdateQuoteStatus,
    handleDeleteQuote
  };
}
