import React, { useState, useEffect } from 'react';
import apiClient from "../../../api/apiClient";

const Roles = () => {
  const [roles, setRoles] = useState([]);
  const [filteredRoles, setFilteredRoles] = useState([]);
  const [formData, setFormData] = useState({
    id: null,
    name: '',
    description: '',
  });
  const [warnings, setWarnings] = useState({
    name: '',
    general: '',
  });
  const [success, setSuccess] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = () => {
    apiClient.get('/auth/roles/')
      .then(response => {
        setRoles(response.data);
        setFilteredRoles(response.data);
      })
      .catch(error => {
        console.error('Failed to fetch roles:', error);
        setWarnings({ ...warnings, general: 'Failed to fetch roles. Please try again.' });
      });
  };

  // Apply search filter
  useEffect(() => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const filtered = roles.filter(role =>
        role.name.toLowerCase().includes(query)
      );
      setFilteredRoles(filtered);
    } else {
      setFilteredRoles(roles);
    }
  }, [roles, searchQuery]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setWarnings({ ...warnings, [name]: '', general: '' });
    setSuccess('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    let hasError = false;
    const newWarnings = { name: '', general: '' };

    if (!formData.name) {
      newWarnings.name = 'Role name is required';
      hasError = true;
    }

    if (hasError) {
      setWarnings(newWarnings);
      return;
    }

    const data = {
      name: formData.name,
      description: formData.description,
    };

    const request = isEditing
      ? apiClient.put(`/auth/roles/${formData.id}/`, data)
      : apiClient.post('/auth/roles/', data);

    request
      .then(response => {
        setSuccess(isEditing ? 'Role updated successfully' : 'Role created successfully');
        setFormData({ id: null, name: '', description: '' });
        setIsEditing(false);
        fetchRoles();
      })
      .catch(error => {
        setWarnings({
          ...warnings,
          general: error.response?.data?.error || `Failed to ${isEditing ? 'update' : 'create'} role. Please try again.`,
        });
      });
  };

  const handleDelete = (roleId) => {
    if (window.confirm('Are you sure you want to delete this role?')) {
      apiClient.delete(`/auth/roles/${roleId}/`)
        .then(() => {
          setSuccess('Role deleted successfully');
          fetchRoles();
          if (isEditing && formData.id === roleId) {
            setIsEditing(false);
            setFormData({ id: null, name: '', description: '' });
          }
        })
        .catch(error => {
          setWarnings({
            ...warnings,
            general: error.response?.data?.error || 'Failed to delete role. Please try again.',
          });
        });
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setFormData({ id: null, name: '', description: '' });
    setWarnings({ name: '', general: '' });
    setSuccess('');
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const clearSearch = () => {
    setSearchQuery('');
  };

  return (
    <div className="flex items-center justify-center">
      <div className="w-full p-8 bg-transparent">
        <h1 className="text-xl font-semibold text-gray-800 mb-6">Roles Management</h1>
        <p className="text-xs text-gray-800 mb-8">
          Create and manage roles for users.
        </p>
        {warnings.general && <p className="text-xs text-red-500 mb-4">{warnings.general}</p>}
        {success && <p className="text-xs text-green-500 mb-4">{success}</p>}

        {/* Role Creation/Update Form */}
        <form onSubmit={handleSubmit} className="space-y-6 mb-12">
          <div>
            <label className="block text-xs text-gray-800 mb-2">Role Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-transparent transition-all duration-200 bg-gray-100 hover:bg-gray-50"
              placeholder="Role name"
            />
            {warnings.name && <p className="text-xs text-red-500 mt-1">{warnings.name}</p>}
          </div>
          <div>
            <label className="block text-xs text-gray-800 mb-2">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-transparent transition-all duration-200 bg-gray-100 hover:bg-gray-50"
              placeholder="Role description"
              rows="4"
            />
          </div>
          <div className="flex justify-end gap-4">
            {isEditing && (
              <button
                type="button"
                onClick={handleCancelEdit}
                className="px-6 py-2 bg-gray-200 text-gray-800 hover:bg-gray-300 text-sm font-medium rounded-sm transition-all duration-300"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              className="px-6 py-2 bg-blue-200 text-blue-800 hover:text-gray-800 hover:bg-gray-200 text-sm font-medium rounded-sm transition-all duration-300"
            >
              {isEditing ? 'Update Role' : 'Create Role'}
            </button>
          </div>
        </form>

        {/* Roles Table */}
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Existing Roles</h2>
        <div className="mb-4 flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Search by role name"
              className="w-full px-4 py-2 border border-gray-200 rounded-lg text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-transparent transition-all duration-200 bg-gray-100 hover:bg-gray-50"
            />
          </div>
          <button
            onClick={clearSearch}
            className="px-6 py-2 bg-gray-200 text-gray-800 hover:bg-gray-300 text-sm font-medium rounded-sm transition-all duration-300"
          >
            Clear Search
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-800">
            <thead className="text-xs text-gray-800 uppercase bg-gray-100">
              <tr>
                <th className="px-6 py-3">Role Name</th>
                <th className="px-6 py-3">Description</th>
                <th className="px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRoles.map(role => (
                <tr key={role.id} className="bg-white border-b">
                  <td className="px-6 py-4">{role.name}</td>
                  <td className="px-6 py-4">{role.description || 'No description'}</td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleDelete(role.id)}
                      className="text-red-500 hover:underline"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Roles;