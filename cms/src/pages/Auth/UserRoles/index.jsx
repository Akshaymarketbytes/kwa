import React, { useState, useEffect, useCallback } from 'react';
import apiClient from '../../../api/apiClient';

const UserRoles = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [hasDeletePermission, setHasDeletePermission] = useState(true);
  const [roleId, setRoleId] = useState(null);
  const [isSuperuser, setIsSuperuser] = useState(false);
  const [formData, setFormData] = useState({
    id: null,
    email: '',
    username: '',
    first_name: '',
    last_name: '',
    role_id: '',
  });
  const [warnings, setWarnings] = useState({
    email: '',
    username: '',
    first_name: '',
    last_name: '',
    role_id: '',
    general: '',
  });
  const [success, setSuccess] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRoleId, setSelectedRoleId] = useState('');

  // Fetch roles
  const fetchRoles = useCallback(async () => {
    try {
      const response = await apiClient.get('/auth/roles/');
      setRoles(response.data || []);
    } catch (error) {
      if (error.response?.status === 403) {
        console.warn('User lacks permission to fetch roles');
        setRoles([]);
      } else {
        console.error('Failed to fetch roles:', error);
        setWarnings({
          ...warnings,
          general: 'Failed to fetch roles. Please try again.',
        });
      }
    }
  }, [warnings]);

  // Fetch users
  const fetchUsers = useCallback(async () => {
    try {
      const response = await apiClient.get('/auth/users/');
      setUsers(response.data || []);
      setFilteredUsers(response.data || []);
    } catch (error) {
      if (error.response?.status === 403) {
        console.warn('User lacks permission to fetch users');
        setUsers([]);
        setFilteredUsers([]);
      } else {
        console.error('Failed to fetch users:', error);
        setWarnings({
          ...warnings,
          general: 'Failed to fetch users. Please try again.',
        });
      }
    }
  }, [warnings]);

  // Fetch logged-in user's profile to get role_id and superuser status
  const fetchProfile = useCallback(async () => {
    try {
      const response = await apiClient.get('/auth/profile/');
      setRoleId(response.data.role?.id || null);
      setIsSuperuser(response.data.is_superuser || false);
    } catch (error) {
      console.error('Failed to fetch profile:', error);
      setWarnings({
        ...warnings,
        general: 'Failed to load profile. Please try again.',
      });
    }
  }, [warnings]);

  // Fetch permissions
  const fetchPermissions = useCallback(async () => {
    try {
      const response = await apiClient.get('/auth/permissions/list/');
      setPermissions(response.data || []);
    } catch (error) {
      console.error('Failed to fetch permissions:', error);
      setWarnings({
        ...warnings,
        general: 'Failed to load permissions. Please try again.',
      });
    }
  }, [warnings]);

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      if (isMounted) {
        await Promise.all([fetchRoles(), fetchUsers(), fetchProfile(), fetchPermissions()]);
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [fetchRoles, fetchUsers, fetchProfile, fetchPermissions]);

  // Check if user has can_delete permission for user_management page
  useEffect(() => {
    if (roleId && permissions.length > 0) {
      const rolePermissions = permissions.find(
        (perm) => perm.role === roleId && perm.page === 'user_management'
      );
      setHasDeletePermission(rolePermissions?.can_delete || false);
    }
  }, [roleId, permissions]);

  // Apply search and role filters
  useEffect(() => {
    let filtered = users;

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(user =>
        (user.first_name?.toLowerCase() || '').includes(query) ||
        (user.last_name?.toLowerCase() || '').includes(query) ||
        (user.username?.toLowerCase() || '').includes(query)
      );
    }

    // Apply role filter
    if (selectedRoleId) {
      filtered = filtered.filter(user => user.role?.id === parseInt(selectedRoleId));
    }

    setFilteredUsers(filtered);
  }, [users, searchQuery, selectedRoleId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setWarnings({ ...warnings, [name]: '', general: '' });
    setSuccess('');
  };

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    let hasError = false;
    const newWarnings = {
      email: '',
      username: '',
      first_name: '',
      last_name: '',
      role_id: '',
      general: '',
    };

    if (!formData.email) {
      newWarnings.email = 'Email is required';
      hasError = true;
    } else if (!validateEmail(formData.email)) {
      newWarnings.email = 'Please enter a valid email address';
      hasError = true;
    }

    if (!formData.username) {
      newWarnings.username = 'Username is required';
      hasError = true;
    }

    if (!formData.first_name) {
      newWarnings.first_name = 'First name is required';
      hasError = true;
    }

    if (!formData.last_name) {
      newWarnings.last_name = 'Last name is required';
      hasError = true;
    }

    if (!formData.role_id) {
      newWarnings.role_id = 'Role is required';
      hasError = true;
    }
    if (!formData.role_id || !roles.some(role => role.id === parseInt(formData.role_id))) {
      newWarnings.role_id = 'Please select a valid role';
      hasError = true;
    }

    if (hasError) {
      setWarnings(newWarnings);
      return;
    }

    const data = {
      email: formData.email,
      username: formData.username,
      first_name: formData.first_name,
      last_name: formData.last_name,
      role_id: formData.role_id,
    };

    const request = isEditing
      ? apiClient.put(`/auth/users/${formData.id}/`, data)
      : apiClient.post('/auth/users/', data);

    request
      .then(response => {
        setSuccess(isEditing ? 'User updated successfully' : 'User created successfully. Credentials sent to email.');
        setFormData({
          id: null,
          email: '',
          username: '',
          first_name: '',
          last_name: '',
          role_id: '',
        });
        setIsEditing(false);
        if (isEditing) {
          setUsers(users.map(user => (user.id === response.data.id ? response.data : user)));
        } else {
          setUsers([...users, response.data]);
          // NEW: Show alert when user is created (email sent)
          window.alert('Email and credentials sent successfully');
        }
      })
      .catch(error => {
        console.log('Error response:', error.response?.data);
        const backendErrors = error.response?.data || {};
        setWarnings({
          email: backendErrors.email?.[0] || '',
          username: backendErrors.username?.[0] || '',
          first_name: backendErrors.first_name?.[0] || '',
          last_name: backendErrors.last_name?.[0] || '',
          role_id: backendErrors.role_id?.[0] || backendErrors.role?.[0] || '',
          general: backendErrors.error || backendErrors.non_field_errors?.[0] || `Failed to ${isEditing ? 'update' : 'create'} user. Please try again.`,
        });
      });
  };

  const handleEdit = (user) => {
    setFormData({
      id: user.id,
      email: user.email,
      username: user.username,
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      role_id: user.role?.id || '',
    });
    setIsEditing(true);
    setWarnings({
      email: '',
      username: '',
      first_name: '',
      last_name: '',
      role_id: '',
      general: '',
    });
    setSuccess('');
  };

  const handleDelete = (userId) => {
    if (!hasDeletePermission) {
      setWarnings({
        ...warnings,
        general: 'You do not have permission to delete users.',
      });
      return;
    }

    if (window.confirm('Are you sure you want to delete this user?')) {
      apiClient.delete(`/auth/users/${userId}/`)
        .then(() => {
          setUsers(users.filter(user => user.id !== userId));
          setSuccess('User deleted successfully');
          if (isEditing && formData.id === userId) {
            setIsEditing(false);
            setFormData({
              id: null,
              email: '',
              username: '',
              first_name: '',
              last_name: '',
              role_id: '',
            });
          }
        })
        .catch(error => {
          setWarnings({
            ...warnings,
            general: error.response?.data?.error || 'Failed to delete user. Please try again.',
          });
        });
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setFormData({
      id: null,
      email: '',
      username: '',
      first_name: '',
      last_name: '',
      role_id: '',
    });
    setWarnings({
      email: '',
      username: '',
      first_name: '',
      last_name: '',
      role_id: '',
      general: '',
    });
    setSuccess('');
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleRoleFilterChange = (e) => {
    setSelectedRoleId(e.target.value);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedRoleId('');
  };

  return (
    <div className="flex items-center justify-center">
      <div className="w-full p-8 bg-transparent">
        <h1 className="text-xl font-semibold text-gray-800 mb-6">User Roles Management</h1>
        <p className="text-xs text-gray-800 mb-8">
          Create and manage users and their roles.
        </p>
        {warnings.general && <p className="text-xs text-red-500 mb-4">{warnings.general}</p>}
        {/* REMOVED: Success message display */}
        {/* {success && <p className="text-xs text-green-500 mb-4">{success}</p>} */}
        {!hasDeletePermission && (
          <p className="text-xs text-red-500 mb-4">
            You do not have permission to delete users. Contact an administrator.
          </p>
        )}
        {/* REMOVED: Superuser warning */}
        {/* {!isSuperuser && (
          <p className="text-xs text-red-500 mb-4">
            Only superadmins can create users. Contact an administrator.
          </p>
        )} */}

        {/* User Creation/Update Form */}
        <form onSubmit={handleSubmit} className="space-y-6 mb-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-800 mb-2">Email address</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-transparent transition-all duration-200 bg-gray-100 hover:bg-gray-50"
                placeholder="Email address"
              />
              {warnings.email && <p className="text-xs text-red-500 mt-1">{warnings.email}</p>}
            </div>
            <div>
              <label className="block text-xs text-gray-800 mb-2">Username</label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-transparent transition-all duration-200 bg-gray-100 hover:bg-gray-50"
                placeholder="Username"
              />
              {warnings.username && <p className="text-xs text-red-500 mt-1">{warnings.username}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-800 mb-2">First Name</label>
              <input
                type="text"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-transparent transition-all duration-200 bg-gray-100 hover:bg-gray-50"
                placeholder="First name"
              />
              {warnings.first_name && <p className="text-xs text-red-500 mt-1">{warnings.first_name}</p>}
            </div>
            <div>
              <label className="block text-xs text-gray-800 mb-2">Last Name</label>
              <input
                type="text"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-transparent transition-all duration-200 bg-gray-100 hover:bg-gray-50"
                placeholder="Last name"
              />
              {warnings.last_name && <p className="text-xs text-red-500 mt-1">{warnings.last_name}</p>}
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-800 mb-2">User Role</label>
            <select
              name="role_id"
              value={formData.role_id}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-transparent transition-all duration-200 bg-gray-100 hover:bg-gray-50"
            >
              <option value="">Select Role</option>
              {roles.map(role => (
                <option key={role.id} value={role.id}>{role.name}</option>
              ))}
            </select>
            {warnings.role_id && <p className="text-xs text-red-500 mt-1">{warnings.role_id}</p>}
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
              {isEditing ? 'Update User' : 'Create User'}
            </button>
          </div>
        </form>

        {/* Users Table */}
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Existing Users</h2>
        <div className="mb-4 flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Search by name or username"
              className="w-full px-4 py-2 border border-gray-200 rounded-lg text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-transparent transition-all duration-200 bg-gray-100 hover:bg-gray-50"
            />
          </div>
          <div className="flex-1">
            <select
              value={selectedRoleId}
              onChange={handleRoleFilterChange}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-transparent transition-all duration-200 bg-gray-100 hover:bg-gray-50"
            >
              <option value="">All Roles</option>
              {roles.map(role => (
                <option key={role.id} value={role.id}>{role.name}</option>
              ))}
            </select>
          </div>
          <button
            onClick={clearFilters}
            className="px-6 py-2 bg-gray-200 text-gray-800 hover:bg-gray-300 text-sm font-medium rounded-sm transition-all duration-300"
          >
            Clear Filters
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-800">
            <thead className="text-xs text-gray-800 uppercase bg-gray-100">
              <tr>
                <th className="px-6 py-3">Email</th>
                <th className="px-6 py-3">Username</th>
                <th className="px-6 py-3">First Name</th>
                <th className="px-6 py-3">Last Name</th>
                <th className="px-6 py-3">Role</th>
                <th className="px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map(user => (
                <tr key={user.id} className="bg-white border-b">
                  <td className="px-6 py-4">{user.email}</td>
                  <td className="px-6 py-4">{user.username}</td>
                  <td className="px-6 py-4">{user.first_name || 'N/A'}</td>
                  <td className="px-6 py-4">{user.last_name || 'N/A'}</td>
                  <td className="px-6 py-4">{user.role?.name || 'No Role'}</td>
                  <td className="px-6 py-4 flex gap-4">
                    <button
                      onClick={() => handleEdit(user)}
                      className="text-blue-500 hover:underline"
                    >
                      Edit
                    </button>
                    {hasDeletePermission && (
                      <button
                        onClick={() => handleDelete(user.id)}
                        className="text-red-500 hover:underline"
                      >
                        Delete
                      </button>
                    )}
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

export default UserRoles;