import React, { useState, useEffect } from 'react';
import apiClient from '../../../api/apiClient';
import { useAlert } from '../../../context/AlertContext';

const ConnectionType = () => {
  const [connectionType, setConnectionType] = useState('');
  const [connectionTypes, setConnectionTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [canAdd, setCanAdd] = useState(false);
  const [canDelete, setCanDelete] = useState(false);
  const [isSuperadmin, setIsSuperadmin] = useState(false);
  const { showAlert } = useAlert();

  useEffect(() => {
    const fetchProfileAndPermissions = async () => {
      try {
        const response = await apiClient.get('/auth/profile/');
        const user = response.data;
        setIsSuperadmin(user.is_superuser || user.role?.name === 'Superadmin');

        const roleId = user.role?.id;
        if (roleId && !isSuperadmin) {
          const roleResponse = await apiClient.get(`/auth/roles/${roleId}/`);
          const permissions = roleResponse.data.permissions || [];
          const perm = permissions.find((p) => p.page === 'e-tapp');
          setCanAdd(perm && perm.can_add);
          setCanDelete(perm && perm.can_delete);
        } else {
          setCanAdd(true);
          setCanDelete(true);
        }
      } catch (err) {
        showAlert('Failed to load user permissions.', 'error');
        setCanAdd(false);
        setCanDelete(false);
      }
    };

    const fetchConnectionTypes = async () => {
      try {
        const response = await apiClient.get('/connectiontype/connection-types/');
        setConnectionTypes(response.data);
      } catch (err) {
        showAlert('Failed to load connection types.', 'error');
      }
    };

    fetchProfileAndPermissions();
    fetchConnectionTypes();
  }, [isSuperadmin, showAlert]);

  const handleInputChange = (e) => {
    setConnectionType(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!canAdd) {
      showAlert('You do not have permission to add connection types.', 'error');
      return;
    }

    if (!connectionType.trim()) {
      showAlert('Connection type cannot be empty.', 'error');
      return;
    }

    setLoading(true);
    try {
      const response = await apiClient.post('/connectiontype/connection-types/', {
        name: connectionType.trim(),
      });
      setConnectionTypes([...connectionTypes, response.data]);
      setConnectionType('');
      showAlert('Connection type added successfully!', 'success');
    } catch (err) {
      const errorMsg = err.response?.data?.name?.[0] || 'Failed to add connection type.';
      showAlert(errorMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!canDelete) {
      showAlert('You do not have permission to delete connection types.', 'error');
      return;
    }

    setLoading(true);
    try {
      await apiClient.delete(`/connectiontype/connection-types/${id}/`);
      setConnectionTypes(connectionTypes.filter((type) => type.id !== id));
      showAlert('Connection type deleted successfully!', 'success');
    } catch (err) {
      if (err.response?.status === 403) {
        showAlert('You do not have permission to delete connection types.', 'error');
      } else {
        showAlert('Failed to delete connection type.', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-4 p-4 max-w-xl mx-auto sm:mt-14 sm:p-6">
      <h1 className="text-xl font-bold text-[#00334d] mb-4 sm:text-2xl">Add Connection Type</h1>

      <form onSubmit={handleSubmit} className="bg-white p-4 rounded-lg shadow-md mb-6 sm:p-6">
        <div className="mb-4">
          <label htmlFor="connectionType" className="block text-sm font-medium text-gray-700 mb-2">
            Connection Type
          </label>
          <input
            type="text"
            id="connectionType"
            value={connectionType}
            onChange={handleInputChange}
            placeholder="e.g., Domestic, Non-Domestic, Special"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#00334d] text-sm"
            disabled={loading || !canAdd}
          />
        </div>
        <button
          type="submit"
          disabled={loading || !canAdd}
          className={`w-full px-4 py-2 text-sm font-medium text-white bg-[#00334d] rounded-md hover:bg-[#002a3f] focus:outline-none focus:ring-2 focus:ring-[#00334d] sm:w-auto ${
            loading || !canAdd ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {loading ? 'Adding...' : 'Add'}
        </button>
      </form>

      <div className="bg-white p-4 rounded-lg shadow-md sm:p-6">
        <h2 className="text-lg font-semibold text-[#00334d] mb-4 sm:text-xl">Existing Connection Types</h2>
        {connectionTypes.length === 0 ? (
          <p className="text-sm text-gray-500">No connection types found.</p>
        ) : (
          <ul className="space-y-2">
            {connectionTypes.map((type) => (
              <li
                key={type.id}
                className="flex justify-between items-center text-sm text-gray-800 border-b border-gray-200 py-2"
              >
                <span>{type.name}</span>
                {canDelete && (
                  <button
                    onClick={() => handleDelete(type.id)}
                    disabled={loading}
                    className={`text-red-600 hover:text-red-800 focus:outline-none ${
                      loading ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                    title="Delete connection type"
                  >
                    🗑️
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default ConnectionType;
