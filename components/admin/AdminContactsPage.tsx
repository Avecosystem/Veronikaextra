// components/admin/AdminContactsPage.tsx
import React, { useEffect, useState } from 'react';
import AdminDashboardLayout from './AdminDashboardLayout';
import GlassCard from '../ui/GlassCard';
import Loader from '../ui/Loader';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { useAuth } from '../../hooks/useAuth';
import { backendApi } from '../../services/backendApi';
import { ApiResponse, ContactDetail } from '../../types';

const AdminContactsPage: React.FC = () => {
  const { isAuthenticated, user: authUser, loading: authLoading } = useAuth();
  const [contacts, setContacts] = useState<ContactDetail[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [newContact, setNewContact] = useState<Omit<ContactDetail, 'id'>>({ 
    type: 'email', 
    value: '', 
    label: 'Email', 
    isVisible: true 
  });

  // Fetch contacts on component mount
  useEffect(() => {
    const fetchContacts = async () => {
      if (!isAuthenticated || !authUser?.isAdmin) {
        setLoading(false);
        setError('Unauthorized access.');
        return;
      }

      setLoading(true);
      setError(null);
      
      try {
        const response: ApiResponse<ContactDetail[]> = await backendApi.getContactDetails();
        if (response.success) {
          setContacts(response.data);
        } else {
          setError(response.message || 'Failed to fetch contact details.');
        }
      } catch (err) {
        console.error('Error fetching contacts:', err);
        setError('An unexpected error occurred while fetching contact details.');
      } finally {
        setLoading(false);
      }
    };

    fetchContacts();
  }, [isAuthenticated, authUser]);

  const handleSaveContacts = async () => {
    if (!isAuthenticated || !authUser?.isAdmin) {
      setError('Unauthorized access.');
      return;
    }

    const token = localStorage.getItem('jwt_token');
    if (!token) {
      setError('Authentication token not found.');
      return;
    }

    setSaving(true);
    setError(null);
    
    try {
      const response: ApiResponse<ContactDetail[]> = await backendApi.saveContactDetails(token, contacts);
      if (response.success) {
        setContacts(response.data);
        // Show success message
      } else {
        setError(response.message || 'Failed to save contact details.');
      }
    } catch (err) {
      console.error('Error saving contacts:', err);
      setError('An unexpected error occurred while saving contact details.');
    } finally {
      setSaving(false);
    }
  };

  const handleAddContact = () => {
    if (newContact.value.trim() === '') {
      setError('Please enter a value for the contact detail.');
      return;
    }

    const contact: ContactDetail = {
      ...newContact,
      id: Date.now().toString(), // Simple ID generation
    };

    setContacts([...contacts, contact]);
    setNewContact({ type: 'email', value: '', label: '', isVisible: false });
    setError(null);
  };

  const handleUpdateContact = (id: string, field: keyof ContactDetail, value: any) => {
    setContacts(contacts.map(contact => 
      contact.id === id ? { ...contact, [field]: value } : contact
    ));
  };

  const handleDeleteContact = (id: string) => {
    setContacts(contacts.filter(contact => contact.id !== id));
  };

  const getContactTypeLabel = (type: string) => {
    switch (type) {
      case 'email': return 'Email';
      case 'phone': return 'Phone';
      case 'address': return 'Address';
      case 'social': return 'Social Media';
      default: return type;
    }
  };

  if (authLoading || loading) {
    return (
      <AdminDashboardLayout title="Contact Management">
        <Loader message="Loading contact details..." className="py-10" />
      </AdminDashboardLayout>
    );
  }

  if (error) {
    return (
      <AdminDashboardLayout title="Contact Management">
        <p className="text-red-500 text-center py-10">{error}</p>
      </AdminDashboardLayout>
    );
  }

  return (
    <AdminDashboardLayout title="Edit Contacts">
      <div className="space-y-8">
        {/* Email Address Section */}
        <GlassCard className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-darkText dark:text-lightText">Email Address</h2>
            <button 
              onClick={() => {
                const emailContact = contacts.find(c => c.type === 'email');
                if (emailContact) {
                  handleUpdateContact(emailContact.id, 'isVisible', !emailContact.isVisible);
                }
              }}
              className="text-accent hover:text-accent/80 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
              </svg>
            </button>
          </div>
          <div className="space-y-4">
            {contacts
              .filter(contact => contact.type === 'email')
              .map(contact => (
                <div key={contact.id} className="flex items-center space-x-4">
                  <Input
                    type="text"
                    value={contact.value}
                    onChange={(e) => handleUpdateContact(contact.id, 'value', e.target.value)}
                    placeholder="Enter email address"
                    className="flex-grow"
                  />
                  <label className="inline-flex items-center cursor-pointer">
                    <span className="mr-2 text-sm text-gray-600 dark:text-gray-400">Visible</span>
                    <input
                      type="checkbox"
                      checked={contact.isVisible}
                      onChange={(e) => handleUpdateContact(contact.id, 'isVisible', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="relative w-11 h-6 bg-gray-400 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-accent"></div>
                  </label>
                  <Button 
                    variant="danger" 
                    size="sm"
                    onClick={() => handleDeleteContact(contact.id)}
                  >
                    Remove
                  </Button>
                </div>
              ))
            }
            <div className="flex space-x-2">
              <Input
                type="text"
                value={newContact.type === 'email' ? newContact.value : ''}
                onChange={(e) => setNewContact({ type: 'email', value: e.target.value, label: 'Email', isVisible: true })}
                placeholder="Add new email address"
                className="flex-grow"
              />
              <Button 
                onClick={() => {
                  if (newContact.type === 'email' && newContact.value.trim() !== '') {
                    handleAddContact();
                  }
                }}
                disabled={newContact.type !== 'email' || newContact.value.trim() === ''}
              >
                Add Email
              </Button>
            </div>
          </div>
        </GlassCard>

        {/* Phone Number Section */}
        <GlassCard className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-darkText dark:text-lightText">Phone Number</h2>
            <button 
              onClick={() => {
                const phoneContact = contacts.find(c => c.type === 'phone');
                if (phoneContact) {
                  handleUpdateContact(phoneContact.id, 'isVisible', !phoneContact.isVisible);
                }
              }}
              className="text-accent hover:text-accent/80 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
              </svg>
            </button>
          </div>
          <div className="space-y-4">
            {contacts
              .filter(contact => contact.type === 'phone')
              .map(contact => (
                <div key={contact.id} className="flex items-center space-x-4">
                  <Input
                    type="text"
                    value={contact.value}
                    onChange={(e) => handleUpdateContact(contact.id, 'value', e.target.value)}
                    placeholder="Enter phone number"
                    className="flex-grow"
                  />
                  <label className="inline-flex items-center cursor-pointer">
                    <span className="mr-2 text-sm text-gray-600 dark:text-gray-400">Visible</span>
                    <input
                      type="checkbox"
                      checked={contact.isVisible}
                      onChange={(e) => handleUpdateContact(contact.id, 'isVisible', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="relative w-11 h-6 bg-gray-400 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-accent"></div>
                  </label>
                  <Button 
                    variant="danger" 
                    size="sm"
                    onClick={() => handleDeleteContact(contact.id)}
                  >
                    Remove
                  </Button>
                </div>
              ))
            }
            <div className="flex space-x-2">
              <Input
                type="text"
                value={newContact.type === 'phone' ? newContact.value : ''}
                onChange={(e) => setNewContact({ type: 'phone', value: e.target.value, label: 'Phone', isVisible: true })}
                placeholder="Add new phone number"
                className="flex-grow"
              />
              <Button 
                onClick={() => {
                  if (newContact.type === 'phone' && newContact.value.trim() !== '') {
                    handleAddContact();
                  }
                }}
                disabled={newContact.type !== 'phone' || newContact.value.trim() === ''}
              >
                Add Phone
              </Button>
            </div>
          </div>
        </GlassCard>

        {/* Address Section */}
        <GlassCard className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-darkText dark:text-lightText">Address</h2>
            <button 
              onClick={() => {
                const addressContact = contacts.find(c => c.type === 'address');
                if (addressContact) {
                  handleUpdateContact(addressContact.id, 'isVisible', !addressContact.isVisible);
                }
              }}
              className="text-accent hover:text-accent/80 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
              </svg>
            </button>
          </div>
          <div className="space-y-4">
            {contacts
              .filter(contact => contact.type === 'address')
              .map(contact => (
                <div key={contact.id} className="flex items-center space-x-4">
                  <Input
                    type="text"
                    value={contact.value}
                    onChange={(e) => handleUpdateContact(contact.id, 'value', e.target.value)}
                    placeholder="Enter address"
                    className="flex-grow"
                  />
                  <label className="inline-flex items-center cursor-pointer">
                    <span className="mr-2 text-sm text-gray-600 dark:text-gray-400">Visible</span>
                    <input
                      type="checkbox"
                      checked={contact.isVisible}
                      onChange={(e) => handleUpdateContact(contact.id, 'isVisible', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="relative w-11 h-6 bg-gray-400 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-accent"></div>
                  </label>
                  <Button 
                    variant="danger" 
                    size="sm"
                    onClick={() => handleDeleteContact(contact.id)}
                  >
                    Remove
                  </Button>
                </div>
              ))
            }
            <div className="flex space-x-2">
              <Input
                type="text"
                value={newContact.type === 'address' ? newContact.value : ''}
                onChange={(e) => setNewContact({ type: 'address', value: e.target.value, label: 'Address', isVisible: true })}
                placeholder="Add new address"
                className="flex-grow"
              />
              <Button 
                onClick={() => {
                  if (newContact.type === 'address' && newContact.value.trim() !== '') {
                    handleAddContact();
                  }
                }}
                disabled={newContact.type !== 'address' || newContact.value.trim() === ''}
              >
                Add Address
              </Button>
            </div>
          </div>
        </GlassCard>

        {/* Announcement Section */}
        <GlassCard className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-darkText dark:text-lightText">Announcement</h2>
            <button 
              onClick={() => {
                // For announcement, we'll use a social type with a special label
                const announcementContact = contacts.find(c => c.label === 'Announcement');
                if (announcementContact) {
                  handleUpdateContact(announcementContact.id, 'isVisible', !announcementContact.isVisible);
                }
              }}
              className="text-accent hover:text-accent/80 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
              </svg>
            </button>
          </div>
          <div className="space-y-4">
            {contacts
              .filter(contact => contact.label === 'Announcement')
              .map(contact => (
                <div key={contact.id} className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <Input
                      type="text"
                      value={contact.value}
                      onChange={(e) => handleUpdateContact(contact.id, 'value', e.target.value)}
                      placeholder="Enter announcement text"
                      className="flex-grow"
                    />
                    <label className="inline-flex items-center cursor-pointer">
                      <span className="mr-2 text-sm text-gray-600 dark:text-gray-400">Visible</span>
                      <input
                        type="checkbox"
                        checked={contact.isVisible}
                        onChange={(e) => handleUpdateContact(contact.id, 'isVisible', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="relative w-11 h-6 bg-gray-400 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-accent"></div>
                    </label>
                    <Button 
                      variant="danger" 
                      size="sm"
                      onClick={() => handleDeleteContact(contact.id)}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ))
            }
            <div className="flex space-x-2">
              <Input
                type="text"
                value={newContact.label === 'Announcement' ? newContact.value : ''}
                onChange={(e) => setNewContact({ type: 'social', value: e.target.value, label: 'Announcement', isVisible: true })}
                placeholder="Add announcement text"
                className="flex-grow"
              />
              <Button 
                onClick={() => {
                  if (newContact.label === 'Announcement' && newContact.value.trim() !== '') {
                    handleAddContact();
                  }
                }}
                disabled={newContact.label !== 'Announcement' || newContact.value.trim() === ''}
              >
                Add Announcement
              </Button>
            </div>
          </div>
        </GlassCard>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button 
            onClick={handleSaveContacts}
            loading={saving}
            disabled={contacts.length === 0}
            className="px-6 py-3"
          >
            Save All Changes
          </Button>
        </div>
      </div>

      <div className="mt-8 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
        <h3 className="text-lg font-semibold text-blue-500 mb-2">How it works</h3>
        <p className="text-gray-600 dark:text-gray-300">
          Edit your contact information in each section. Toggle the "Visible" switch to control whether each detail appears on the public contact page. 
          Click the edit icon (✎) next to each section title to quickly toggle visibility. 
          Changes are saved only when you click "Save All Changes".
        </p>
      </div>
    </AdminDashboardLayout>
  );
};

export default AdminContactsPage;