import apiService from "../../../services/api";
export default function createAccountActions({
  setUsers,
  setAutoMessage,
  fetchUsers,
  usersPagination,
  fetchDashboardStats,
  setContacts,
  fetchContacts,
  contactsPagination,
  setNewsletters,
  fetchNewsletters,
  newslettersPagination
}) {
  const handleUserRoleUpdate = async (userId, newRole) => {
    if (!window.confirm(`Are you sure you want to change this user"s role to ${newRole}?`)) {
      return;
    }
    try {
      await apiService.updateUserRole(userId, newRole);
      setUsers(prev => prev.map(user => user._id === userId ? {
        ...user,
        role: newRole
      } : user));
      setAutoMessage(`User role updated to ${newRole} successfully`);
      fetchUsers(usersPagination.currentPage);
      fetchDashboardStats(); // Refresh stats
    } catch (error) {
      setAutoMessage("Couldn't update user role: " + error.message);
    }
  };
  const handleUserDelete = async (userId, userName) => {
    if (!window.confirm(`Are you sure you want to delete user "${userName}"? This action cannot be undone.`)) {
      return;
    }
    try {
      await apiService.deleteUserAdmin(userId);
      // Instantly remove from UI
      setUsers(prev => prev.filter(user => user._id !== userId));
      setAutoMessage(`User "${userName}" removed successfully`);
      // Refetch to ensure data consistency and update stats
      fetchUsers(usersPagination.currentPage);
      fetchDashboardStats();
    } catch (error) {
      setAutoMessage("Couldn't delete user: " + error.message);
    }
  };
  const handleContactStatusUpdate = async (contactId, newStatus) => {
    try {
      await apiService.updateContactStatus(contactId, newStatus);
      setContacts(prev => prev.map(contact => contact._id === contactId ? {
        ...contact,
        status: newStatus
      } : contact));
      setAutoMessage(`Contact status updated to ${newStatus}`);
      fetchContacts(contactsPagination.currentPage);
    } catch (error) {
      setAutoMessage("Couldn't update contact status: " + error.message);
    }
  };
  const handleContactDelete = async (contactId, contactName) => {
    if (!window.confirm(`Are you sure you want to delete contact from "${contactName}"?`)) {
      return;
    }
    try {
      await apiService.deleteContactAdmin(contactId);
      // Instantly remove from UI
      setContacts(prev => prev.filter(contact => contact._id !== contactId));
      setAutoMessage("Contact removed successfully");
      // Refetch to ensure data consistency and update stats
      fetchContacts(contactsPagination.currentPage);
      fetchDashboardStats();
    } catch (error) {
      setAutoMessage("Couldn't delete contact: " + error.message);
    }
  };
  const handleNewsletterDelete = async (subscriberId, email) => {
    if (!window.confirm(`Are you sure you want to unsubscribe "${email}" from the newsletter?`)) {
      return;
    }
    try {
      await apiService.deleteNewsletterSubscriber(subscriberId);
      // Instantly remove from UI
      setNewsletters(prev => prev.filter(subscriber => subscriber._id !== subscriberId));
      setAutoMessage("Subscriber removed successfully");
      // Refetch to ensure data consistency and update stats
      fetchNewsletters(newslettersPagination.currentPage);
      fetchDashboardStats();
    } catch (error) {
      setAutoMessage("Couldn't remove subscriber: " + error.message);
    }
  };
  return {
    handleUserRoleUpdate,
    handleUserDelete,
    handleContactStatusUpdate,
    handleContactDelete,
    handleNewsletterDelete
  };
}
