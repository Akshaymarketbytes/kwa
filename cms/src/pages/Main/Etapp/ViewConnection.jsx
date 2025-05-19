import React, { useState, useEffect } from 'react';
import apiClient from '../../../api/apiClient';
import { useAlert } from '../../../context/AlertContext';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const ViewConnection = () => {
  const [connections, setConnections] = useState([]);
  const [filteredConnections, setFilteredConnections] = useState([]);
  const [connectionTypes, setConnectionTypes] = useState([]);
  const [areas, setAreas] = useState([]); 
  const [filters, setFilters] = useState({
    connection_type: '',
    area: '',
    status: '',
    date_from: null,
    date_to: null,
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState('asc');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [useApiFiltering, setUseApiFiltering] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editConnection, setEditConnection] = useState(null);
  const [editFormData, setEditFormData] = useState({
    id: null,
    name: '',
    address: '',
    file_number: '',
    area: '',
    connection_type: '',
    status: '',
  });
  const [editErrors, setEditErrors] = useState({});
  const [permissions, setPermissions] = useState([]);
  const [hasDeletePermission, setHasDeletePermission] = useState(false);
  const [hasEditPermission, setHasEditPermission] = useState(false);
  const { showAlert } = useAlert();

  const statusOptions = [
    { value: 'assistant_engineer', label: 'Assistant Engineer' },
    { value: 'fo', label: 'FO' },
    { value: 'site_inspector', label: 'Site Inspector' },
    { value: 'completed', label: 'Completed' },
  ];

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const queryParams = new URLSearchParams();
        if (useApiFiltering) {
          if (filters.connection_type) queryParams.append('connection_type', filters.connection_type);
          if (filters.area) queryParams.append('area', filters.area);
          if (filters.status) queryParams.append('status', filters.status);
          if (filters.date_from) queryParams.append('date_gte', filters.date_from.toISOString().split('T')[0]);
          if (filters.date_to) queryParams.append('date_lte', filters.date_to.toISOString().split('T')[0]);
          if (searchQuery) queryParams.append('name__icontains', searchQuery);
          queryParams.append('ordering', sortOrder === 'asc' ? 'created_at' : '-created_at');
        }

        const connectionsResponse = await apiClient.get(
          `/connectiontype/connections/${useApiFiltering ? `?${queryParams.toString()}` : ''}`
        );
        setConnections(connectionsResponse.data);
        setFilteredConnections(connectionsResponse.data);

        const typesResponse = await apiClient.get('/connectiontype/connection-types/');
        setConnectionTypes(typesResponse.data);

        // Fetch areas from the /area/add-area/ endpoint
        const areasResponse = await apiClient.get('/area/add-area/');
        const areaOptions = areasResponse.data.map((area) => ({
          id: area.id,
          area_name: area.area_name,
        }));
        setAreas(areaOptions);

        const profileResponse = await apiClient.get('/auth/profile/');
        const user = profileResponse.data;
        const roleId = user.role?.id;
        if (roleId) {
          const roleResponse = await apiClient.get(`/auth/roles/${roleId}/`);
          const rolePermissions = roleResponse.data.permissions || [];
          setPermissions(rolePermissions);
          const eTappPermission = rolePermissions.find(perm => perm.page === 'e-tapp');
          setHasDeletePermission(eTappPermission?.can_delete || false);
          setHasEditPermission(eTappPermission?.can_edit || false);
        } else {
          setHasDeletePermission(false);
          setHasEditPermission(false);
        }

        setError('');
      } catch (err) {
        const errorMsg =
          err.response?.data?.detail ||
          'Failed to load connections, connection types, areas, or permissions. Please try again.';
        setError(errorMsg);
        showAlert(errorMsg, 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [filters, searchQuery, sortOrder, useApiFiltering, showAlert]);

  useEffect(() => {
    if (useApiFiltering) return;

    let filtered = connections;

    if (filters.connection_type) {
      filtered = filtered.filter(conn => conn.connection_type === parseInt(filters.connection_type));
    }
    if (filters.area) {
      filtered = filtered.filter(conn => conn.area === parseInt(filters.area));
    }
    if (filters.status) {
      filtered = filtered.filter(conn => conn.status === filters.status);
    }
    if (filters.date_from) {
      filtered = filtered.filter(conn => new Date(conn.created_at) >= new Date(filters.date_from));
    }
    if (filters.date_to) {
      filtered = filtered.filter(conn => new Date(conn.created_at) <= new Date(filters.date_to));
    }
    if (searchQuery) {
      filtered = filtered.filter(conn =>
        conn.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    let sorted = [...filtered];
    sorted.sort((a, b) => {
      const dateA = new Date(a.created_at);
      const dateB = new Date(b.created_at);
      return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
    });

    setFilteredConnections(sorted);
  }, [filters, searchQuery, sortOrder, connections, useApiFiltering]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const clearSearch = () => {
    setSearchQuery('');
  };

  const handleDateFilterChange = (date, name) => {
    setFilters(prev => ({ ...prev, [name]: date }));
  };

  const toggleDateSort = () => {
    setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
  };

  const clearFiltersAndSort = () => {
    setFilters({
      connection_type: '',
      area: '',
      status: '',
      date_from: null,
      date_to: null,
    });
    setSearchQuery('');
    setSortOrder('asc');
  };

  const handleStatusChange = async (connectionId, newStatus) => {
    if (!hasEditPermission) {
      showAlert('You do not have permission to edit connections.', 'error');
      return;
    }
    try {
      const response = await apiClient.patch(`/connectiontype/connections/${connectionId}/`, { status: newStatus });
      setConnections(prev => prev.map(conn =>
        conn.id === connectionId ? { ...conn, status: newStatus } : conn
      ));
      setFilteredConnections(prev => prev.map(conn =>
        conn.id === connectionId ? { ...conn, status: newStatus } : conn
      ));
      showAlert('Status updated successfully!', 'success');
    } catch (err) {
      const errorMsg =
        err.response?.data?.detail ||
        'Failed to update status.';
      showAlert(errorMsg, 'error');
    }
  };

  const openEditModal = (connection) => {
    setEditConnection(connection);
    setEditFormData({
      id: connection.id,
      name: connection.name,
      address: connection.address,
      file_number: connection.file_number,
      area: connection.area.toString(),
      connection_type: connection.connection_type.toString(),
      status: connection.status,
    });
    setEditErrors({});
    setEditModalOpen(true);
  };

  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({ ...prev, [name]: value }));
    setEditErrors(prev => ({ ...prev, [name]: '' }));
  };

  const validateEditForm = () => {
    const newErrors = {};
    if (!editFormData.name.trim()) newErrors.name = 'Name is required.';
    if (!editFormData.address.trim()) newErrors.address = 'Address is required.';
    if (!editFormData.file_number.trim()) newErrors.file_number = 'File number is required.';
    if (!editFormData.area) newErrors.area = 'Area is required.';
    if (!editFormData.connection_type) newErrors.connection_type = 'Connection type is required.';
    if (!editFormData.status) newErrors.status = 'Status is required.';
    return newErrors;
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();

    const newErrors = validateEditForm();
    if (Object.keys(newErrors).length > 0) {
      setEditErrors(newErrors);
      return;
    }

    try {
      const payload = {
        name: editFormData.name.trim(),
        address: editFormData.address.trim(),
        file_number: editFormData.file_number.trim(),
        area: parseInt(editFormData.area),
        connection_type: parseInt(editFormData.connection_type),
        status: editFormData.status,
      };
      const response = await apiClient.patch(`/connectiontype/connections/${editFormData.id}/`, payload);

      setConnections(prev => prev.map(conn =>
        conn.id === editFormData.id ? { ...conn, ...response.data } : conn
      ));
      setFilteredConnections(prev => prev.map(conn =>
        conn.id === editFormData.id ? { ...conn, ...response.data } : conn
      ));

      setEditModalOpen(false);
      showAlert('Connection updated successfully!', 'success');
    } catch (err) {
      const errorMsg =
        err.response?.data?.detail ||
        Object.values(err.response?.data || {})[0]?.[0] ||
        'Failed to update connection.';
      showAlert(errorMsg, 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!hasDeletePermission) {
      showAlert('You do not have permission to delete connections.', 'error');
      return;
    }

    if (!window.confirm('Are you sure you want to delete this connection?')) return;

    try {
      await apiClient.delete(`/connectiontype/connections/${id}/`);
      setConnections(prev => prev.filter(conn => conn.id !== id));
      setFilteredConnections(prev => prev.filter(conn => conn.id !== id));
      showAlert('Connection deleted successfully!', 'success');
    } catch (err) {
      const errorMsg =
        err.response?.data?.detail ||
        'Failed to delete connection.';
      showAlert(errorMsg, 'error');
    }
  };

  const getAreaName = (areaId) => {
    const area = areas.find(area => area.id === parseInt(areaId));
    return area ? area.area_name : 'N/A';
  };

  return (
    <div className="mt-4 p-4 max-w-6xl mx-auto sm:mt-14 sm:p-6">
      <h1 className="text-xl font-bold text-[#00334d] mb-4 sm:text-2xl">View Connections</h1>

      <div className="mb-4 bg-white p-4 rounded-lg shadow-md sm:p-6">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Search by Name
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                id="name"
                value={searchQuery}
                onChange={handleSearchChange}
                placeholder="Enter name"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#00334d] text-sm"
                disabled={loading}
              />
              <button
                onClick={clearSearch}
                className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 text-sm"
              >
                Clear
              </button>
            </div>
          </div>
          <div>
            <label htmlFor="connection_type" className="block text-sm font-medium text-gray-700 mb-2">
              Connection Type
            </label>
            <select
              id="connection_type"
              name="connection_type"
              value={filters.connection_type}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#00334d] text-sm"
              disabled={loading}
            >
              <option value="">All Connection Types</option>
              {connectionTypes.map(type => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="area" className="block text-sm font-medium text-gray-700 mb-2">
              Area
            </label>
            <select
              id="area"
              name="area"
              value={filters.area}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#00334d] text-sm"
              disabled={loading}
            >
              <option value="">All Areas</option>
              {areas.map(area => (
                <option key={area.id} value={area.id}>
                  {area.area_name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              id="status"
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#00334d] text-sm"
              disabled={loading}
            >
              <option value="">All Statuses</option>
              {statusOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="date_from" className="block text-sm font-medium text-gray-700 mb-2">
              Created From
            </label>
            <DatePicker
              id="date_from"
              selected={filters.date_from}
              onChange={date => handleDateFilterChange(date, 'date_from')}
              dateFormat="yyyy-MM-dd"
              placeholderText="Select start date"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#00334d] text-sm"
              disabled={loading}
            />
          </div>
          <div>
            <label htmlFor="date_to" className="block text-sm font-medium text-gray-700 mb-2">
              Created To
            </label>
            <DatePicker
              id="date_to"
              selected={filters.date_to}
              onChange={date => handleDateFilterChange(date, 'date_to')}
              dateFormat="yyyy-MM-dd"
              placeholderText="Select end date"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#00334d] text-sm"
              disabled={loading}
            />
          </div>
        </div>
        <button
          onClick={clearFiltersAndSort}
          className="mt-4 px-4 py-2 text-sm font-medium text-white bg-[#00334d] rounded-md hover:bg-[#002a3f] focus:outline-none focus:ring-2 focus:ring-[#00334d]"
        >
          Clear Filters & Sort
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md text-sm">
          {error}
        </div>
      )}

      {editModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-md max-w-lg w-full">
            <h2 className="text-xl font-bold text-[#00334d] mb-4">Edit Connection</h2>
            <form onSubmit={handleEditSubmit}>
              <div className="mb-4">
                <label htmlFor="edit_name" className="block text-sm font-medium text-gray-700 mb-2">
                  Name
                </label>
                <input
                  type="text"
                  id="edit_name"
                  name="name"
                  value={editFormData.name}
                  onChange={handleEditInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#00334d] text-sm"
                />
                {editErrors.name && <p className="mt-2 text-sm text-red-600">{editErrors.name}</p>}
              </div>

              <div className="mb-4">
                <label htmlFor="edit_address" className="block text-sm font-medium text-gray-700 mb-2">
                  Address
                </label>
                <input
                  type="text"
                  id="edit_address"
                  name="address"
                  value={editFormData.address}
                  onChange={handleEditInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#00334d] text-sm"
                />
                {editErrors.address && <p className="mt-2 text-sm text-red-600">{editErrors.address}</p>}
              </div>

              <div className="mb-4">
                <label htmlFor="edit_file_number" className="block text-sm font-medium text-gray-700 mb-2">
                  File Number
                </label>
                <input
                  type="text"
                  id="edit_file_number"
                  name="file_number"
                  value={editFormData.file_number}
                  onChange={handleEditInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#00334d] text-sm"
                />
                {editErrors.file_number && <p className="mt-2 text-sm text-red-600">{editErrors.file_number}</p>}
              </div>

              <div className="mb-4">
                <label htmlFor="edit_area" className="block text-sm font-medium text-gray-700 mb-2">
                  Area
                </label>
                <select
                  id="edit_area"
                  name="area"
                  value={editFormData.area}
                  onChange={handleEditInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#00334d] text-sm"
                >
                  <option value="">Select area</option>
                  {areas.map(area => (
                    <option key={area.id} value={area.id}>
                      {area.area_name}
                    </option>
                  ))}
                </select>
                {editErrors.area && <p className="mt-2 text-sm text-red-600">{editErrors.area}</p>}
              </div>

              <div className="mb-4">
                <label htmlFor="edit_connection_type" className="block text-sm font-medium text-gray-700 mb-2">
                  Connection Type
                </label>
                <select
                  id="edit_connection_type"
                  name="connection_type"
                  value={editFormData.connection_type}
                  onChange={handleEditInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#00334d] text-sm"
                >
                  <option value="">Select connection type</option>
                  {connectionTypes.map(type => (
                    <option key={type.id} value={type.id}>
                      {type.name}
                    </option>
                  ))}
                </select>
                {editErrors.connection_type && <p className="mt-2 text-sm text-red-600">{editErrors.connection_type}</p>}
              </div>

              <div className="mb-4">
                <label htmlFor="edit_status" className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  id="edit_status"
                  name="status"
                  value={editFormData.status}
                  onChange={handleEditInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#00334d] text-sm"
                >
                  <option value="">Select status</option>
                  {statusOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {editErrors.status && <p className="mt-2 text-sm text-red-600">{editErrors.status}</p>}
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-[#00334d] rounded-md hover:bg-[#002a3f] focus:outline-none focus:ring-2 focus:ring-[#00334d]"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center text-gray-600">Loading connections...</div>
      ) : (
        <div className="bg-white p-6 rounded-lg shadow-md overflow-x-auto">
          {filteredConnections.length === 0 ? (
            <p className="text-gray-600 text-sm">No connections found.</p>
          ) : (
            <table className="min-w-full table-auto">
              <thead>
                <tr className="bg-[#00334d] text-white text-sm">
                  <th className="px-4 py-2 text-left">Sl No</th>
                  <th
                    className="px-4 py-2 text-left cursor-pointer hover:bg-[#002a3f]"
                    onClick={toggleDateSort}
                  >
                    Created At {sortOrder === 'asc' ? '↑' : '↓'}
                  </th>
                  <th className="px-4 py-2 text-left">File No</th>
                  <th className="px-4 py-2 text-left">Connection Type</th>
                  <th className="px-4 py-2 text-left">Area</th>
                  <th className="px-4 py-2 text-left">Name</th>
                  <th className="px-4 py-2 text-left">Address</th>
                  <th className="px-4 py-2 text-left">Status</th>
                  <th className="px-4 py-2 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredConnections.map((connection, index) => (
                  <tr
                    key={connection.id}
                    className="border-b border-gray-200 hover:bg-gray-50 text-sm"
                  >
                    <td className="px-4 py-2">{index + 1}</td>
                    <td className="px-4 py-2">{new Date(connection.created_at).toLocaleDateString()}</td>
                    <td className="px-4 py-2">{connection.file_number}</td>
                    <td className="px-4 py-2">
                      {connection.connection_type_detail?.name || 'N/A'}
                    </td>
                    <td className="px-4 py-2">{getAreaName(connection.area)}</td>
                    <td className="px-4 py-2">{connection.name}</td>
                    <td className="px-4 py-2">{connection.address}</td>
                    <td className="px-4 py-2">
                      {hasEditPermission ? (
                        <select
                          value={connection.status}
                          onChange={(e) => handleStatusChange(connection.id, e.target.value)}
                          className="px-2 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#00334d]"
                        >
                          {statusOptions.map(option => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span className="px-2 py-1 text-sm text-gray-600">
                          {statusOptions.find(opt => opt.value === connection.status)?.label || connection.status}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2 flex gap-2">
                      {hasEditPermission && (
                        <button
                          onClick={() => openEditModal(connection)}
                          className="px-2 py-1 text-xs font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                        >
                          Edit
                        </button>
                      )}
                      {hasDeletePermission && (
                        <button
                          onClick={() => handleDelete(connection.id)}
                          className="px-2 py-1 text-xs font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
                        >
                          Delete
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
};

export default ViewConnection;