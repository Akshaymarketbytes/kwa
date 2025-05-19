import React, { useState, useEffect } from 'react';
import apiClient from '../../../api/apiClient';

const Permissions = () => {
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRoleId, setSelectedRoleId] = useState(null);
  const [modalPermissions, setModalPermissions] = useState([]);
  const [warnings, setWarnings] = useState({ general: '' });
  const [success, setSuccess] = useState('');

  const pages = [
    'dashboard',
    'profile',
    'user_management',
    'role',
    'permission',
    'complaints',
    'valves',
    'area',
    'flows',
    'bluebrigade', // Corrected typo
    'runningcontract',
    'e-tapp',
  ];

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const rolesResponse = await apiClient.get('/auth/roles/');
        setRoles(rolesResponse.data);

        const permissionsResponse = await apiClient.get('/auth/permissions/list/');
        console.log('Fetched permissions:', permissionsResponse.data);
        setPermissions(permissionsResponse.data);
      } catch (error) {
        console.error('Failed to fetch data:', error);
        setWarnings({
          ...warnings,
          general: 'Failed to fetch data. Please try again.',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const openPermissionModal = (roleId) => {
    setSelectedRoleId(roleId);
    const rolePermissions = permissions.filter((p) => p.role === roleId);
    console.log(`Permissions for role ${roleId}:`, rolePermissions);
    const initialPermissions = pages.map((page) => {
      const existing = rolePermissions.find((p) => p.page === page);
      return {
        page,
        can_view: existing ? existing.can_view : false,
        can_add: existing ? existing.can_add : false,
        can_edit: existing ? existing.can_edit : false,
        can_delete: existing ? existing.can_delete : false,
        id: existing ? existing.id : null,
      };
    });
    setModalPermissions(initialPermissions);
    setIsModalOpen(true);
  };

  const handleModalPermissionChange = (page, field) => {
    setModalPermissions((prev) =>
      prev.map((perm) =>
        perm.page === page
          ? { ...perm, [field]: !perm[field] }
          : perm
      )
    );
  };

  const saveModalPermissions = async () => {
    try {
      for (const perm of modalPermissions) {
        const data = {
          role: selectedRoleId,
          page: perm.page,
          can_view: perm.can_view,
          can_add: perm.can_add,
          can_edit: perm.can_edit,
          can_delete: perm.can_delete,
          is_login_page: false,
        };
        console.log(`Saving permission for ${perm.page}:`, data);

        if (perm.id) {
          await apiClient.put(`/auth/permissions/${perm.id}/`, data);
        } else {
          await apiClient.post('/auth/permissions/', data);
        }
      }
      setSuccess('Permissions saved successfully');
      setIsModalOpen(false);
      setSelectedRoleId(null);
      setModalPermissions([]);
      const permissionsResponse = await apiClient.get('/auth/permissions/list/');
      console.log('Updated permissions:', permissionsResponse.data);
      setPermissions(permissionsResponse.data);
    } catch (error) {
      setWarnings({
        ...warnings,
        general: error.response?.data?.error || 'Failed to save permissions. Please try again.',
      });
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedRoleId(null);
    setModalPermissions([]);
  };

  return (
    <div className="flex items-center justify-center">
      <div className="w-full p-8 bg-transparent">
        <h1 className="text-xl font-semibold text-gray-800 mb-6">Roles Management</h1>
        <p className="text-xs text-gray-800 mb-8">View existing roles and manage their permissions.</p>
        {warnings.general && <p className="text-xs text-red-500 mb-4">{warnings.general}</p>}
        {success && <p className="text-xs text-green-500 mb-4">{success}</p>}
        {isLoading && <p className="text-xs text-gray-500 mb-4">Loading...</p>}

        <h2 className="text-lg font-semibold text-gray-800 mb-4">Existing Roles</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-800">
            <thead className="text-xs text-gray-800 uppercase bg-gray-100">
              <tr>
                <th className="px-6 py-3">Role</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan="2" className="px-6 py-4 text-center text-gray-500">
                    Loading roles...
                  </td>
                </tr>
              ) : roles.length === 0 ? (
                <tr>
                  <td colSpan="2" className="px-6 py-4 text-center text-gray-500">
                    No roles found.
                  </td>
                </tr>
              ) : (
                roles.map((role) => (
                  <tr key={role.id} className="bg-white border-b">
                    <td className="px-6 py-4">{role.name}</td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => openPermissionModal(role.id)}
                        className="px-4 py-2 bg-blue-200 text-blue-800 hover:bg-gray-200 text-sm font-medium rounded-sm transition-all duration-300"
                        disabled={isLoading}
                      >
                        Permissions
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {isModalOpen && (
          <div className="fixed inset-0 backdrop-brightness-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg w-full max-w-4xl max-h-[80vh] overflow-y-auto">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                Permissions for {roles.find((r) => r.id === selectedRoleId)?.name}
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-800">
                  <thead className="text-xs text-gray-800 uppercase bg-gray-100">
                    <tr>
                      <th className="px-6 py-3">Page</th>
                      <th className="px-6 py-3">View</th>
                      <th className="px-6 py-3">Add</th>
                      <th className="px-6 py-3">Edit</th>
                      <th className="px-6 py-3">Delete</th>
                    </tr>
                  </thead>
                  <tbody>
                    {modalPermissions.map((perm) => (
                      <tr key={perm.page} className="bg-white border-b">
                        <td className="px-6 py-4">{perm.page}</td>
                        <td className="px-6 py-4">
                          <input
                            type="checkbox"
                            checked={perm.can_view}
                            onChange={() => handleModalPermissionChange(perm.page, 'can_view')}
                            className="h-4 w-4 border-gray-300 rounded"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <input
                            type="checkbox"
                            checked={perm.can_add}
                            onChange={() => handleModalPermissionChange(perm.page, 'can_add')}
                            className="h-4 w-4 border-gray-300 rounded"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <input
                            type="checkbox"
                            checked={perm.can_edit}
                            onChange={() => handleModalPermissionChange(perm.page, 'can_edit')}
                            className="h-4 w-4 border-gray-300 rounded"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <input
                            type="checkbox"
                            checked={perm.can_delete}
                            onChange={() => handleModalPermissionChange(perm.page, 'can_delete')}
                            className="h-4 w-4 border-gray-300 rounded"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex justify-end gap-4 mt-6">
                <button
                  onClick={closeModal}
                  className="px-6 py-2 bg-gray-200 text-gray-800 hover:bg-gray-300 text-sm font-medium rounded-sm transition-all duration-300"
                >
                  Cancel
                </button>
                <button
                  onClick={saveModalPermissions}
                  className="px-6 py-2 bg-blue-200 text-blue-800 hover:bg-gray-200 text-sm font-medium rounded-sm transition-all duration-300"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Permissions;