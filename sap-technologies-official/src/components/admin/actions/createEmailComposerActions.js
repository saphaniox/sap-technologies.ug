import apiService from "../../../services/api";
export default function createEmailComposerActions({
  customEmailForm,
  setAutoMessage,
  setSendingCustomEmail,
  setSavedEmailMessages,
  setCustomEmailForm,
  setSettingsSubTab
}) {
  const handleCustomEmailSend = async event => {
    event.preventDefault();
    const recipientEmail = customEmailForm.recipientEmail.trim();
    const subject = customEmailForm.subject.trim();
    const message = customEmailForm.message.trim();
    if (!recipientEmail || !subject || !message) {
      setAutoMessage("Please complete the recipient, subject, and message fields.", true);
      return;
    }
    try {
      setSendingCustomEmail(true);
      await apiService.sendCustomAdminEmail({
        ...customEmailForm,
        recipientEmail,
        subject,
        message
      });
      try {
        const savedResponse = await apiService.saveEmailMessage({
          ...customEmailForm,
          recipientEmail,
          subject,
          message
        });
        if (savedResponse?.data) setSavedEmailMessages(current => [savedResponse.data, ...current].slice(0, 100));
      } catch (saveError) {
        console.warn("Custom email sent but could not be saved:", saveError);
      }
      setCustomEmailForm({
        recipientEmail: "",
        recipientName: "",
        subject: "",
        message: ""
      });
      setAutoMessage(`Custom email sent to ${recipientEmail}`);
    } catch (error) {
      setAutoMessage("Couldn't send custom email: " + error.message, true);
    } finally {
      setSendingCustomEmail(false);
    }
  };
  const fetchSavedEmailMessages = async () => {
    try {
      const response = await apiService.getSavedEmailMessages();
      setSavedEmailMessages(Array.isArray(response?.data) ? response.data : []);
    } catch (error) {
      setAutoMessage("Couldn't load saved emails: " + error.message, true);
    }
  };
  const reuseSavedEmailMessage = savedMessage => {
    setCustomEmailForm({
      recipientEmail: savedMessage.recipientEmail || "",
      recipientName: savedMessage.recipientName || "",
      subject: savedMessage.subject || "",
      message: savedMessage.message || ""
    });
    setSettingsSubTab("email");
  };
  const deleteSavedEmailMessage = async messageId => {
    try {
      await apiService.deleteSavedEmailMessage(messageId);
      setSavedEmailMessages(current => current.filter(message => message.id !== messageId));
    } catch (error) {
      setAutoMessage("Couldn't delete saved email: " + error.message, true);
    }
  };
  return {
    handleCustomEmailSend,
    fetchSavedEmailMessages,
    reuseSavedEmailMessage,
    deleteSavedEmailMessage
  };
}
