import React, { useEffect, useState } from "react";
import apiClient from "../../../api/apiClient";
import * as XLSX from "xlsx"; // For Excel download
import jsPDF from "jspdf"; // For PDF download

const ViewValves = () => {
  const [valves, setValves] = useState([]);
  const [filteredValves, setFilteredValves] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [areaSearchQuery, setAreaSearchQuery] = useState("");
  const [selectedValve, setSelectedValve] = useState(null);
  const [editingValve, setEditingValve] = useState(null);
  const [logs, setLogs] = useState([]);
  const [showLogs, setShowLogs] = useState(false);
  const [showAllLogs, setShowAllLogs] = useState(false);
  const [validationError, setValidationError] = useState("");
  const [useApiFiltering, setUseApiFiltering] = useState(false);
  const [userPermissions, setUserPermissions] = useState({});
  const [isSuperadmin, setIsSuperadmin] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  useEffect(() => {
    const fetchValves = async () => {
      try {
        let query = "";
        if (useApiFiltering) {
          const params = new URLSearchParams();
          if (searchQuery) params.append("name", encodeURIComponent(searchQuery));
          if (areaSearchQuery) params.append("area", encodeURIComponent(areaSearchQuery));
          query = params.toString() ? `?${params.toString()}` : "";
        }
        const response = await apiClient.get(`/valve/valves/${query}`);
        setValves(response.data);
        setFilteredValves(response.data);
      } catch (error) {
        console.error("Error fetching valve data:", error);
        alert("Failed to fetch valves.");
      }
    };

    fetchValves();
  }, [searchQuery, areaSearchQuery, useApiFiltering]);

  useEffect(() => {
    if (useApiFiltering) return;

    let filtered = valves;
    if (searchQuery) {
      filtered = filtered.filter(valve =>
        valve.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    if (areaSearchQuery) {
      filtered = filtered.filter(valve =>
        valve.area?.name?.toLowerCase().includes(areaSearchQuery.toLowerCase())
      );
    }
    setFilteredValves(filtered);
  }, [valves, searchQuery, areaSearchQuery, useApiFiltering]);

  useEffect(() => {
    const fetchUserPermissions = async () => {
      try {
        const profileResponse = await apiClient.get('/auth/profile/');
        const user = profileResponse.data;
        setIsSuperadmin(user.is_superuser || user.role?.name === 'Superadmin');
        const roleId = user.role?.id;
        if (roleId) {
          const roleResponse = await apiClient.get(`/auth/roles/${roleId}/`);
          const permissions = roleResponse.data.permissions.find(perm => perm.page === 'valves');
          setUserPermissions(permissions || {});
        }
      } catch (error) {
        console.error('Error fetching user permissions:', error);
      }
    };

    fetchUserPermissions();
  }, []);

  const calculatePercentage = (valve) => {
    const e = Math.E;
    const n = parseFloat(valve.current_condition) || 0;
    const N = parseFloat(valve.full_open_condition) || 100;
    const k = parseFloat(valve.steepness) || 12.5;
    const x0 = parseFloat(valve.mid_point) || 0.5;
    const ratio = n / N - x0;
    const exponent = -k * ratio;
    const denominator = 1 + Math.pow(e, exponent);
    const percentage = denominator !== 0 ? (100 / denominator) : 0;
    return Math.min(Math.max(percentage, 0), 100).toFixed(1);
  };

  const handleViewDetails = (valve) => {
    setSelectedValve(valve);
    setShowLogs(false);
    setShowAllLogs(false);
    setValidationError("");
  };

  const handleClosePopup = () => {
    setSelectedValve(null);
    setEditingValve(null);
    setShowLogs(false);
    setShowAllLogs(false);
    setValidationError("");
  };

  const handleUpdate = (valveId) => {
    const fullOpen = parseFloat(editingValve.full_open_condition);
    const current = parseFloat(editingValve.current_condition);

    if (isNaN(current)) {
      setValidationError("Current condition must be a valid number.");
      return;
    }

    if (current > fullOpen) {
      setValidationError("Current condition must be less than or equal to full open condition.");
      return;
    }

    const updatedValve = {
      name: editingValve.name,
      size: editingValve.size,
      full_open_condition: editingValve.full_open_condition,
      current_condition: current || 0,
      mid_point: editingValve.mid_point,
      steepness: editingValve.steepness,
      remarks: editingValve.remarks,
      latitude: editingValve.latitude,
      longitude: editingValve.longitude,
      area_id: editingValve.area?.id || null,
    };

    apiClient
      .put(`/valve/valves/${valveId}/`, updatedValve)
      .then((response) => {
        setValves(valves.map((valve) =>
          valve.id === valveId ? response.data : valve
        ));
        setFilteredValves(filteredValves.map((valve) =>
          valve.id === valveId ? response.data : valve
        ));
        setEditingValve(null);
        setSelectedValve(response.data);
        setValidationError("");
        handleViewLog(valveId);
      })
      .catch((error) => {
        console.error("Error updating valve:", error);
        setValidationError(error.response?.data?.area_id?.[0] || "Failed to update valve.");
      });
  };

  const handleDelete = (valveId) => {
    if (!userPermissions.can_delete && !isSuperadmin) {
      alert("You do not have permission to delete valves.");
      return;
    }

    if (window.confirm("Are you sure you want to delete this valve?")) {
      apiClient
        .delete(`/valve/valves/${valveId}/`)
        .then(() => {
          setValves(valves.filter((valve) => valve.id !== valveId));
          setFilteredValves(filteredValves.filter((valve) => valve.id !== valveId));
          handleClosePopup();
          alert("Valve deleted successfully!");
        })
        .catch((error) => {
          console.error("Error deleting valve:", error);
          alert("Failed to delete valve.");
        });
    }
  };

  const handleViewLog = (valveId) => {
    apiClient
      .get(`/valve/logs/?valve_id=${valveId}`)
      .then((response) => {
        // Reverse logs for FIFO (oldest first)
        setLogs(response.data.reverse());
        setShowLogs(true);
        setSelectedValve(null);
        setShowAllLogs(false);
      })
      .catch((error) => {
        console.error("Error fetching logs:", error);
        alert("Failed to fetch logs.");
      });
  };

  const handleViewMap = (valve) => {
    const { latitude, longitude } = valve;
    if (latitude !== null && longitude !== null) {
      const url = `https://www.google.com/maps?q=${latitude},${longitude}`;
      window.open(url, "_blank");
    } else {
      alert("No location data available for this valve.");
    }
  };

  const toggleShowAllLogs = () => {
    setShowAllLogs(!showAllLogs);
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleAreaSearchChange = (e) => {
    setAreaSearchQuery(e.target.value);
  };

  const clearSearch = () => {
    setSearchQuery("");
    setAreaSearchQuery("");
  };

  const handleImageClick = (imageUrl) => {
    setSelectedImage(imageUrl);
    setShowImageModal(true);
  };

  const handleCloseImageModal = () => {
    setShowImageModal(false);
    setSelectedImage(null);
  };

  // Function to download logs as Excel
  const downloadExcel = () => {
    const logData = logs.map((log) => ({
      "Changed Field": log.changed_field,
      "Old Value": log.old_value,
      "New Value": log.new_value,
      Timestamp: new Date(log.timestamp).toLocaleString(),
    }));

    const worksheet = XLSX.utils.json_to_sheet(logData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Logs");
    XLSX.writeFile(workbook, "valve_logs.xlsx");
  };

  // Function to download logs as PDF
  const downloadPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Valve Update Logs", 10, 10);

    let y = 20;
    logs.forEach((log) => {
      doc.setFontSize(12);
      doc.text(
        `${log.changed_field} updated from "${log.old_value}" to "${log.new_value}" on ${new Date(
          log.timestamp
        ).toLocaleString()}`,
        10,
        y
      );
      y += 10;
      if (y > 270) {
        doc.addPage();
        y = 10;
      }
    });

    doc.save("valve_logs.pdf");
  };

  return (
    <div className="pt-14 px-4 sm:px-6 lg:px-8 mx-auto bg-gray-50">
      <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6">Valve List</h2>

      {/* Search Inputs */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <input
          type="text"
          value={searchQuery}
          onChange={handleSearchChange}
          placeholder="Search by valve name"
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm w-full sm:max-w-md transition-all duration-200"
        />
        <input
          type="text"
          value={areaSearchQuery}
          onChange={handleAreaSearchChange}
          placeholder="Search by area name"
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm w-full sm:max-w-md transition-all duration-200"
        />
        <button
          onClick={clearSearch}
          className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-sm font-medium transition-all duration-200"
        >
          Clear Search
        </button>
      </div>

      {/* Valve Table */}
      <div className="shadow-md rounded-lg max-h-[70vh]">
        <table className="bg-white border border-gray-200 overflow-x-auto">
          <thead className="bg-gray-100 sticky top-0 z-10">
            <tr>
              <th className="py-3 px-4 border-b border-gray-200 text-left text-xs sm:text-sm font-semibold text-gray-700 whitespace-nowrap">Name</th>
              <th className="py-3 px-4 border-b border-gray-200 text-left text-xs sm:text-sm font-semibold text-gray-700 whitespace-nowrap">Size</th>
              <th className="py-3 px-4 border-b border-gray-200 text-left text-xs sm:text-sm font-semibold text-gray-700 whitespace-nowrap">Full Open Condition</th>
              <th className="py-3 px-4 border-b border-gray-200 text-left text-xs sm:text-sm font-semibold text-gray-700 whitespace-nowrap">Current Condition</th>
              <th className="py-3 px-4 border-b border-gray-200 text-left text-xs sm:text-sm font-semibold text-gray-700 whitespace-nowrap">Mid-point</th>
              <th className="py-3 px-4 border-b border-gray-200 text-left text-xs sm:text-sm font-semibold text-gray-700 whitespace-nowrap">Steepness</th>
              <th className="py-3 px-4 border-b border-gray-200 text-left text-xs sm:text-sm font-semibold text-gray-700 whitespace-nowrap">Remarks</th>
              <th className="py-3 px-4 border-b border-gray-200 text-left text-xs sm:text-sm font-semibold text-gray-700 whitespace-nowrap">Previous Position</th>
              <th className="py-3 px-4 border-b border-gray-200 text-left text-xs sm:text-sm font-semibold text-gray-700 whitespace-nowrap">Area</th>
              <th className="py-3 px-4 border-b border-gray-200 text-left text-xs sm:text-sm font-semibold text-gray-700 whitespace-nowrap">Opening %</th>
              <th className="py-3 px-4 border-b border-gray-200 text-left text-xs sm:text-sm font-semibold text-gray-700 whitespace-nowrap">Location</th>
              <th className="py-3 px-4 border-b border-gray-200 text-left text-xs sm:text-sm font-semibold text-gray-700 whitespace-nowrap">Area Image</th>
              <th className="py-3 px-4 border-b border-gray-200 text-left text-xs sm:text-sm font-semibold text-gray-700 whitespace-nowrap">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredValves.map((valve) => (
              <tr key={valve.id} className="hover:bg-gray-50 transition-all duration-150">
                <td className="py-3 px-4 border-b border-gray-200 text-xs sm:text-sm text-gray-800 whitespace-nowrap">{valve.name}</td>
                <td className="py-3 px-4 border-b border-gray-200 text-xs sm:text-sm text-gray-800 whitespace-nowrap">{valve.size}</td>
                <td className="py-3 px-4 border-b border-gray-200 text-xs sm:text-sm text-gray-800 whitespace-nowrap">{valve.full_open_condition}</td>
                <td className="py-3 px-4 border-b border-gray-200 text-xs sm:text-sm text-gray-800 whitespace-nowrap">{valve.current_condition}</td>
                <td className="py-3 px-4 border-b border-gray-200 text-xs sm:text-sm text-gray-800 whitespace-nowrap">{valve.mid_point}</td>
                <td className="py-3 px-4 border-b border-gray-200 text-xs sm:text-sm text-gray-800 whitespace-nowrap">{valve.steepness}</td>
                <td className="py-3 px-4 border-b border-gray-200 text-xs sm:text-sm text-gray-800">{valve.remarks}</td>
                <td className="py-3 px-4 border-b border-gray-200 text-xs sm:text-sm text-gray-800 whitespace-nowrap">{valve.previous_position || 'No Previous Position'}</td>
                <td className="py-3 px-4 border-b border-gray-200 text-xs sm:text-sm text-gray-800 whitespace-nowrap">{valve.area?.name || 'No Area'}</td>
                <td className="py-3 px-4 border-b border-gray-200 text-xs sm:text-sm text-gray-800 whitespace-nowrap">
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                      className="bg-blue-500 h-2.5 rounded-full transition-all duration-300"
                      style={{ width: `${calculatePercentage(valve)}%` }}
                    ></div>
                  </div>
                  <span className="text-xs sm:text-sm font-medium">{calculatePercentage(valve)}%</span>
                </td>
                <td className="py-3 px-4 border-b border-gray-200 text-xs sm:text-sm">
                  <button
                    onClick={() => handleViewMap(valve)}
                    className="text-blue-600 hover:text-blue-800 font-medium"
                  >
                    View Map
                  </button>
                </td>
                <td className="py-3 px-4 border-b border-gray-200 text-xs sm:text-sm">
                  {valve.area_image ? (
                    <img
                      src={valve.area_image}
                      alt={valve.name}
                      className="w-12 h-12 sm:w-16 sm:h-16 object-cover rounded cursor-pointer"
                      onClick={() => handleImageClick(valve.area_image)}
                      onError={(e) => (e.target.src = "/placeholder-image.jpg")}
                      loading="lazy"
                    />
                  ) : (
                    <span className="text-gray-500">No Image</span>
                  )}
                </td>
                <td className="py-3 px-4 border-b border-gray-200 text-xs sm:text-sm flex flex-wrap gap-2">
                  <button
                    onClick={() => handleViewDetails(valve)}
                    className="px-3 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-xs sm:text-sm font-medium transition-all duration-200"
                  >
                    View Details
                  </button>
                  {(userPermissions.can_delete || isSuperadmin) && (
                    <button
                      onClick={() => handleDelete(valve.id)}
                      className="px-3 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600 text-xs sm:text-sm font-medium transition-all duration-200"
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

      {/* View Details Card */}
      {selectedValve && !showLogs && (
        <div className="fixed inset-0 flex items-center justify-center p-4 bg-black/50 z-50">
          <div className="bg-white rounded-xl shadow-xl p-4 sm:p-6 w-full max-w-full sm:max-w-lg border border-gray-200 transform transition-all duration-300 scale-100">
            <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4">Valve Details</h3>
            {validationError && (
              <div className="text-red-500 text-xs sm:text-sm mb-4 bg-red-50 p-2 rounded">{validationError}</div>
            )}
            <div className="space-y-3 text-gray-700 text-xs sm:text-sm">
              <p><strong>Name:</strong> {selectedValve.name}</p>
              <p><strong>Size:</strong> {selectedValve.size}</p>
              <p><strong>Full Open Condition:</strong> {selectedValve.full_open_condition}</p>
              <p>
                <strong>Current Condition:</strong>{" "}
                {editingValve?.id === selectedValve.id ? (
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max={selectedValve.full_open_condition}
                    value={editingValve.current_condition}
                    onChange={(e) => {
                      const value = e.target.value;
                      setEditingValve({ ...editingValve, current_condition: value });
                      if (value && parseFloat(value) > parseFloat(selectedValve.full_open_condition)) {
                        setValidationError("Current condition must be less than or equal to full open condition.");
                      } else {
                        setValidationError("");
                      }
                    }}
                    className="border border-gray-300 rounded-lg px-3 py-1 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                  />
                ) : (
                  selectedValve.current_condition
                )}
              </p>
              <p>
                <strong>Remarks:</strong>{" "}
                {editingValve?.id === selectedValve.id ? (
                  <input
                    type="text"
                    value={editingValve.remarks}
                    onChange={(e) =>
                      setEditingValve({ ...editingValve, remarks: e.target.value })
                    }
                    className="border border-gray-300 rounded-lg px-3 py-1 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                  />
                ) : (
                  selectedValve.remarks
                )}
              </p>
              <p><strong>Previous Position:</strong> {selectedValve.previous_position || 'No Previous Position'}</p>
              <p><strong>Area:</strong> {selectedValve.area?.name || 'No Area'}</p>
              <p>
                <strong>Area Image:</strong>{" "}
                {selectedValve.area_image ? (
                  <img
                    src={selectedValve.area_image}
                    alt={selectedValve.name}
                    className="w-12 h-12 sm:w-16 sm:h-16 object-cover rounded mt-2 cursor-pointer"
                    onClick={() => handleImageClick(selectedValve.area_image)}
                    onError={(e) => (e.target.src = "/placeholder-image.jpg")}
                    loading="lazy"
                  />
                ) : (
                  <span className="text-gray-500">No Image</span>
                )}
              </p>
            </div>

            <div className="mt-6 flex flex-wrap justify-end gap-3">
              {editingValve?.id === selectedValve.id ? (
                <>
                  <button
                    onClick={() => handleUpdate(selectedValve.id)}
                    className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 text-xs sm:text-sm font-medium transition-all duration-200"
                    disabled={!!validationError}
                  >
                    Update
                  </button>
                  <button
                    onClick={() => setEditingValve(null)}
                    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 text-xs sm:text-sm font-medium transition-all duration-200"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setEditingValve(selectedValve)}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-xs sm:text-sm font-medium transition-all duration-200"
                >
                  Edit
                </button>
              )}
              <button
                onClick={() => handleViewLog(selectedValve.id)}
                className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 text-xs sm:text-sm font-medium transition-all duration-200"
              >
                View Log
              </button>
              <button
                onClick={handleClosePopup}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-xs sm:text-sm font-medium transition-all duration-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Modal */}
      {showImageModal && selectedImage && (
        <div className="fixed inset-0 flex items-center justify-center backdrop-brightness-50 z-50">
          <div className="relative bg-white rounded-xl p-4 w-full max-w-full sm:max-w-3xl mx-4">
            <button
              onClick={handleCloseImageModal}
              className="absolute top-2 right-2 text-gray-600 hover:text-gray-800 text-xl sm:text-2xl font-bold"
            >
              ×
            </button>
            <img
              src={selectedImage}
              alt="Valve Image"
              className="w-full h-auto max-h-[60vh] object-contain rounded"
              onError={(e) => (e.target.src = "/placeholder-image.jpg")}
            />
          </div>
        </div>
      )}

      {/* View Logs Card */}
      {showLogs && (
        <div className="fixed inset-0 flex items-center justify-center p-4 bg-black/50 z-50">
          <div className="bg-white rounded-xl shadow-xl p-4 sm:p-6 w-full max-w-full sm:max-w-md border border-gray-200 transform transition-all duration-300 scale-100">
            <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4">Update Logs</h3>
            <ul className="list-disc pl-5 mb-4 text-gray-700 max-h-[50vh] overflow-y-auto">
              {(showAllLogs ? logs : logs.slice(0, 5)).map((log) => (
                <li key={log.id} className="mb-2 text-xs sm:text-sm">
.Concurrent: {`${log.changed_field} updated from "${log.old_value}" to "${log.new_value}" on ${new Date(log.timestamp).toLocaleString()}`}
                </li>
              ))}
            </ul>
            <div className="flex flex-col gap-3 mb-4">
              {logs.length > 5 && (
                <button
                  onClick={toggleShowAllLogs}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-xs sm:text-sm font-medium transition-all duration-200"
                >
                  {showAllLogs ? "Show Less" : "Read More"}
                </button>
              )}
              <div className="flex gap-3">
                <button
                  onClick={downloadExcel}
                  className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 text-xs sm:text-sm font-medium transition-all duration-200"
                >
                  Download as Excel
                </button>
                <button
                  onClick={downloadPDF}
                  className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 text-xs sm:text-sm font-medium transition-all duration-200"
                >
                  Download as PDF
                </button>
              </div>
            </div>
            <div className="flex justify-end">
              <button
                onClick={handleClosePopup}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-xs sm:text-sm font-medium transition-all duration-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ViewValves;