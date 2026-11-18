import apiService from "../../../services/api";
import { mergeEmailConfigForm } from "../utils/dashboardFormatters";
import { showAlert } from "../../../utils/alerts.jsx";
import { Swal } from "../../../utils/alerts.jsx";
export default function createEmailSettingsActions({
  setEmailSettings,
  setEmailConfigForm,
  setAutoMessage,
  setSavingEmailProvider,
  setDashboardStats,
  fetchDashboardStats,
  fetchSystemHealth,
  setSavingEmailSettings,
  emailConfigForm,
  setCurrentSignature,
  setUpdating,
  certificatesSearch,
  certificatesTypeFilter,
  setAllCertificates,
  setCertificatesPagination,
  signatureFile,
  setUploadingSignature,
  setSignatureFile,
  certificatesPagination
}) {
  const fetchEmailSettings = async () => {
    try {
      const response = await apiService.getAdminEmailSettings();
      setEmailSettings(response.data);
      setEmailConfigForm(mergeEmailConfigForm(response.data?.publicConfig, response.data?.emailDelivery));
    } catch (error) {
      console.error("Email settings fetch error:", error);
      setAutoMessage("Couldn't load email settings: " + error.message, true);
    }
  };
  const handleEmailProviderChange = async providerMode => {
    try {
      setSavingEmailProvider(true);
      const response = await apiService.updateAdminEmailProvider(providerMode);
      setEmailSettings(response.data);
      setEmailConfigForm(current => ({
        ...current,
        providerMode
      }));
      setDashboardStats(current => current ? {
        ...current,
        emailDelivery: response.data.emailDelivery
      } : current);
      setAutoMessage(`Email provider changed to ${providerMode}`);
      fetchDashboardStats();
      fetchSystemHealth();
    } catch (error) {
      console.error("Email provider update error:", error);
      setAutoMessage("Couldn't update email provider: " + error.message, true);
    } finally {
      setSavingEmailProvider(false);
    }
  };
  const updateEmailConfigField = (section, field, value) => {
    setEmailConfigForm(current => ({
      ...current,
      [section]: {
        ...(current[section] || {}),
        [field]: value
      }
    }));
  };
  const handleEmailSettingsSave = async event => {
    event.preventDefault();
    try {
      setSavingEmailSettings(true);
      const response = await apiService.updateAdminEmailSettings(emailConfigForm);
      setEmailSettings(response.data);
      setEmailConfigForm(mergeEmailConfigForm(response.data?.publicConfig, response.data?.emailDelivery));
      setDashboardStats(current => current ? {
        ...current,
        emailDelivery: response.data.emailDelivery
      } : current);
      setAutoMessage("Email dashboard settings saved");
      fetchDashboardStats();
      fetchSystemHealth();
    } catch (error) {
      console.error("Email settings update error:", error);
      setAutoMessage("Couldn't save email settings: " + error.message, true);
    } finally {
      setSavingEmailSettings(false);
    }
  };

  // Signature management handlers
  const fetchCurrentSignature = async () => {
    try {
      const response = await apiService.request('/api/certificates/signature/current', {
        method: 'GET',
        useCache: false
      });

      // Handle both response.signature and response.data patterns
      const signatureData = response.signature || response.data?.signature || response.data;

      // Check if signature exists and is not corrupted
      if (signatureData && signatureData.isCorrupted) {
        console.warn(' Signature file is corrupted:', signatureData.actualSize, 'bytes');
        setCurrentSignature(null);
      } else {
        setCurrentSignature(signatureData);
      }
    } catch {
      // No signature configured yet or error loading
      setCurrentSignature(null);
    }
  };

  // Certificates list handler
  const fetchAllCertificates = async (page = 1) => {
    try {
      setUpdating(true);
      const query = new URLSearchParams({
        page: String(page),
        limit: "20",
        search: certificatesSearch,
        type: certificatesTypeFilter
      }).toString();
      const response = await apiService.request(`/api/certificates/all?${query}`, {
        method: 'GET',
        useCache: false
      });
      if (response && response.data) {
        setAllCertificates(response.data.certificates);
        setCertificatesPagination(response.data.pagination);
      }
    } catch (error) {
      console.error("Error fetching certificates:", error);
      setAutoMessage("Couldn't load certificates: " + error.message, true);
    } finally {
      setUpdating(false);
    }
  };
  const handleSignatureUpload = async e => {
    e.preventDefault();
    if (!signatureFile) {
      const message = "Please select a signature image first.";
      setAutoMessage(message, true);
      showAlert.error("No image selected", message);
      return;
    }

    // Validate file size (minimum 1KB, maximum 5MB)
    const minSize = 1024; // 1KB
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (signatureFile.size < minSize) {
      const message = `Signature file seems too small (${signatureFile.size} bytes, min 1KB). It may be corrupted. Please try a different image.`;
      setAutoMessage(message, true);
      showAlert.error("Image too small", message);
      return;
    }
    if (signatureFile.size > maxSize) {
      const message = `That file is too large (${(signatureFile.size / 1024 / 1024).toFixed(2)}MB). Please keep it under 5MB.`;
      setAutoMessage(message, true);
      showAlert.error("Image too large", message);
      return;
    }
    if (!signatureFile.type?.startsWith("image/")) {
      const message = `That file type (${signatureFile.type || "unknown"}) is not an image.`;
      setAutoMessage(message, true);
      showAlert.error("Wrong file type", message);
      return;
    }
    setUploadingSignature(true);
    try {
      const formData = new FormData();
      formData.append('signature', signatureFile);
      const response = await apiService.request('/api/certificates/signature/upload', {
        method: 'POST',
        body: formData,
        isFormData: true
      });
      if (response) {
        const sizeKB = (signatureFile.size / 1024).toFixed(2);
        const message = `Signature uploaded! (${sizeKB}KB). Certificates will now include your signature.`;
        setAutoMessage(message);
        await showAlert.success("Signature uploaded", message);
        setSignatureFile(null);
        fetchCurrentSignature();
      }
    } catch (error) {
      const message = "Couldn't upload signature: " + error.message;
      setAutoMessage(message, true);
      await showAlert.error("Upload failed", error.message || "Please try again.");
    } finally {
      setUploadingSignature(false);
    }
  };
  const handleDeleteSignature = async () => {
    if (!window.confirm("Are you sure you want to delete the current signature? Certificates will use default text signature.")) {
      return;
    }
    try {
      await apiService.request('/api/certificates/signature/current', {
        method: 'DELETE'
      });
      setAutoMessage("Signature removed successfully");
      setCurrentSignature(null);
    } catch (error) {
      setAutoMessage("Couldn't delete signature: " + error.message, true);
    }
  };
  const handleDeleteCertificate = async (nominationId, nomineeName) => {
    const result = await Swal.fire({
      title: 'Delete Certificate?',
      html: `
        <p>Are you sure you want to delete the certificate for <strong>${nomineeName}</strong>?</p>
        <p style="color: #dc2626; margin-top: 1rem;">
           This action cannot be undone. The certificate file will be permanently deleted from storage.
        </p>
      `,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, Delete Certificate',
      cancelButtonText: 'Cancel'
    });
    if (!result.isConfirmed) return;
    try {
      setUpdating(true);
      const response = await apiService.request(`/api/certificates/delete/${nominationId}`, {
        method: 'DELETE'
      });
      if (response) {
        await Swal.fire({
          icon: 'success',
          title: 'Certificate Deleted!',
          html: `
            <p>The certificate for <strong>${nomineeName}</strong> has been successfully deleted.</p>
            <p style="margin-top: 1rem; color: #059669;">
               Certificate file removed from storage<br>
               Database records cleared<br>
               Cloud storage cleaned (if applicable)
            </p>
          `,
          confirmButtonColor: '#667eea'
        });

        // Refresh the certificate list
        await fetchAllCertificates(certificatesPagination.currentPage);
      }
    } catch (error) {
      console.error("Error deleting certificate:", error);
      await Swal.fire({
        icon: 'error',
        title: 'Delete Failed',
        text: error.message || 'Failed to delete certificate. Please try again.',
        confirmButtonColor: '#dc2626'
      });
    } finally {
      setUpdating(false);
    }
  };
  return {
    fetchEmailSettings,
    handleEmailProviderChange,
    updateEmailConfigField,
    handleEmailSettingsSave,
    fetchCurrentSignature,
    fetchAllCertificates,
    handleSignatureUpload,
    handleDeleteSignature,
    handleDeleteCertificate
  };
}
