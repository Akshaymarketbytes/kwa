import React, { useState, useEffect } from 'react';
import apiClient from '../../../api/apiClient';

const Area = () => {
  const [areaName, setAreaName] = useState('');
  const [areas, setAreas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [canAdd, setCanAdd] = useState(false);
  const [canDelete, setCanDelete] = useState(false);

  useEffect(() => {
    const fetchPermissionsAndAreas = async () => {
      try {
        const profileResponse = await apiClient.get('/auth/profile/');
        const user = profileResponse.data;
        const isSuperadmin = user.is_superuser || user.role?.name === 'Superadmin';
        const roleId = user.role?.id;

        if (isSuperadmin) {
          setCanAdd(true);
          setCanDelete(true);
        } else if (roleId) {
          const roleResponse = await apiClient.get(`/auth/roles/${roleId}/`);
          const permissions = roleResponse.data.permissions || [];
          const perm = permissions.find((p) => p.page === 'area');
          setCanAdd(!!(perm && perm.can_add));
          setCanDelete(!!(perm && perm.can_delete));
          console.log('Area permissions:', { can_add: !!(perm && perm.can_add), can_delete: !!(perm && perm.can_delete) });
        }

        const areasResponse = await apiClient.get('/area/add-area/');
        setAreas(areasResponse.data);
      } catch (err) {
        console.error('Failed to fetch permissions or areas:', err);
        setError('Failed to load data.');
      }
    };

    fetchPermissionsAndAreas();
  }, []);

  const handleInputChange = (e) => {
    const value = e.target.value;
    const capitalLettersRegex = /^[A-Z]*$/;

    if (value && !capitalLettersRegex.test(value)) {
      setError('Only capital letters are allowed (e.g., PLD, VAZ).');
    } else {
      setError(null);
      setSuccess(null);
      setAreaName(value);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!canAdd) {
      setError('You do not have permission to add areas.');
      return;
    }

    if (!areaName.trim()) {
      setError('Area name cannot be empty.');
      return;
    }

    const capitalLettersRegex = /^[A-Z]+$/;
    if (!capitalLettersRegex.test(areaName.trim())) {
      setError('Area name must contain only capital letters (e.g., PLD, VAZ).');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await apiClient.post('/area/add-area/', {
        area_name: areaName.trim(),
      });
      setAreas([...areas, response.data]);
      setAreaName('');
      setSuccess('Area added successfully!');
    } catch (err) {
      console.error('Failed to add area:', err);
      const errorMsg = err.response?.data?.area_name?.[0] || 'Failed to add area.';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (areaId) => {
    if (!canDelete) {
      setError('You do not have permission to delete areas.');
      return;
    }

    if (window.confirm('Are you sure you want to delete this area?')) {
      try {
        await apiClient.delete(`/area/add-area/${areaId}/`);
        setAreas(areas.filter((area) => area.id !== areaId));
        setSuccess('Area deleted successfully!');
        setError(null);
      } catch (err) {
        console.error('Error deleting area:', err);
        const errorMsg = err.response?.data?.detail || 'Failed to delete area.';
        setError(errorMsg);
        setSuccess(null);
      }
    }
  };

  return (
    <div className="mt-4 p-4 max-w-xl mx-auto bg-gray-50 min-h-screen sm:mt-14 sm:p-6 sm:max-w-4xl">
      <h1 className="text-xl font-bold text-[#00334d] mb-4 sm:text-2xl">Add Area</h1>

      <form
        onSubmit={handleSubmit}
        className="bg-white p-4 rounded-lg shadow-md mb-6 sm:p-6"
      >
        <div className="mb-4">
          <label
            htmlFor="areaName"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Area Name
          </label>
          <input
            type="text"
            id="areaName"
            value={areaName}
            onChange={handleInputChange}
            placeholder="e.g., PLD, VAZ"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#00334d] text-sm"
            disabled={loading || !canAdd}
          />
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
          {success && <p className="mt-2 text-sm text-green-600">{success}</p>}
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
        <h2 className="text-lg font-semibold text-[#00334d] mb-4 sm:text-xl">
          Existing Areas
        </h2>
        {areas.length === 0 ? (
          <p className="text-sm text-gray-500">No areas found.</p>
        ) : (
          <ul className="space-y-2">
            {areas.map((area) => (
              <li
                key={area.id}
                className="flex justify-between items-center text-sm text-gray-800 border-b border-gray-200 py-2"
              >
                <span>{area.area_name}</span>
                {canDelete && (
                  <button
                    onClick={() => handleDelete(area.id)}
                    className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                    disabled={loading}
                  >
                    Delete
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

export default Area;
