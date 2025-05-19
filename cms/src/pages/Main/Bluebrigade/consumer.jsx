import React, { useEffect, useState } from "react";
import apiClient from "../../../api/apiClient";
import { useAlert } from "../../../context/AlertContext";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const ConsumerBlueBrigade = () => {
  const [complaints, setComplaints] = useState([]);
  const [filteredComplaints, setFilteredComplaints] = useState([]);
  const [sortOrder, setSortOrder] = useState("newest");
  const [statusFilter, setStatusFilter] = useState("");
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [useApiFiltering, setUseApiFiltering] = useState(false);
  const [hasEditPermission, setHasEditPermission] = useState(false);
  const [hasDeletePermission, setHasDeletePermission] = useState(false);
  const [loading, setLoading] = useState(true);
  const [permissions, setPermissions] = useState([]);
  const [isSuperadmin, setIsSuperadmin] = useState(false);
  const { showAlert } = useAlert();

  const statusOptions = [
    { value: "completed", label: "Completed" },
    { value: "accepted", label: "Accepted" },
    { value: "processing", label: "Processing" },
    { value: "return_for_review", label: "Return for Review" },
  ];

  useEffect(() => {
    const fetchPermissions = async () => {
      try {
        const profileResponse = await apiClient.get('/auth/profile/');
        const user = profileResponse.data;
        setIsSuperadmin(user.is_superuser || user.role?.name === 'Superadmin');
        const roleId = user.role?.id;
        if (roleId) {
          const roleResponse = await apiClient.get(`/auth/roles/${roleId}/`);
          const permissions = roleResponse.data.permissions || [];
          setPermissions(permissions);
          const blueBrigadePermission = permissions.find(perm => perm.page === 'bluebrigade');
          setHasEditPermission(blueBrigadePermission?.can_edit || user.is_superuser || user.role?.name === 'Superadmin');
          setHasDeletePermission(blueBrigadePermission?.can_delete || user.is_superuser || user.role?.name === 'Superadmin');
        } else {
          setHasEditPermission(user.is_superuser || user.role?.name === 'Superadmin');
          setHasDeletePermission(user.is_superuser || user.role?.name === 'Superadmin');
        }
      } catch (error) {
        console.error('Error fetching permissions:', error);
        showAlert('Failed to load permissions.', 'error');
      }
    };

    fetchPermissions();
  }, []);

  useEffect(() => {
    const fetchComplaints = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        params.append("department", "bluebrigade");
        params.append("complaint_type", "consumer");
        if (useApiFiltering) {
          params.append("ordering", sortOrder === "oldest" ? "date" : "-date");
          if (statusFilter) params.append("status", statusFilter);
          if (startDate) params.append("date__gte", startDate.toISOString().split("T")[0]);
          if (endDate) params.append("date__lte", endDate.toISOString().split("T")[0]);
        }

        const response = await apiClient.get(`/complaint/complaints/?${params.toString()}`);
        let filtered = response.data;
        if (!useApiFiltering) {
          filtered = response.data.filter(
            (complaint) => complaint.complaint_type === "consumer" && complaint.department === "bluebrigade"
          );
          if (statusFilter) filtered = filtered.filter((complaint) => complaint.status === statusFilter);
          if (startDate) filtered = filtered.filter((complaint) => new Date(complaint.date) >= new Date(startDate));
          if (endDate) filtered = filtered.filter((complaint) => new Date(complaint.date) <= new Date(endDate));
          filtered.sort((a, b) => {
            const dateA = new Date(a.date);
            const dateB = new Date(b.date);
            return sortOrder === "oldest" ? dateA - dateB : dateB - dateA;
          });
        }

        setComplaints(response.data);
        setFilteredComplaints(filtered);
      } catch (error) {
        console.error("Error fetching complaints:", error);
        showAlert("Failed to fetch complaints.", "error");
      } finally {
        setLoading(false);
      }
    };

    fetchComplaints();
  }, [sortOrder, statusFilter, startDate, endDate, useApiFiltering]);

  const handleStatusChange = (complaintId, newStatus) => {
    if (!hasEditPermission) {
      showAlert("You do not have permission to edit complaint status.", "error");
      return;
    }

    apiClient
      .patch(`/complaint/complaints/${complaintId}/`, { status: newStatus })
      .then((response) => {
        setComplaints(
          complaints.map((complaint) =>
            complaint.id === complaintId ? response.data : complaint
          )
        );
        setFilteredComplaints(
          filteredComplaints.map((complaint) =>
            complaint.id === complaintId ? response.data : complaint
          )
        );
        showAlert("Status updated successfully!", "success");
      })
      .catch((error) => {
        console.error("Error updating complaint status:", error);
        showAlert("Failed to update status.", "error");
      });
  };

  const handleDelete = (complaintId) => {
    if (!hasDeletePermission) {
      showAlert("You do not have permission to delete complaints.", "error");
      return;
    }
    if (window.confirm("Are you sure you want to delete this complaint?")) {
      apiClient
        .delete(`/complaint/complaints/${complaintId}/`)
        .then(() => {
          setComplaints(
            complaints.filter((complaint) => complaint.id !== complaintId)
          );
          setFilteredComplaints(
            filteredComplaints.filter(
              (complaint) => complaint.id !== complaintId
            )
          );
          showAlert("Complaint deleted successfully!", "success");
        })
        .catch((error) => {
          console.error("Error deleting complaint:", error);
          showAlert(
            "Failed to delete complaint: " + (error.response?.data?.error || "Unknown error"),
            "error"
          );
        });
    }
  };

  const clearFilters = () => {
    setSortOrder("newest");
    setStatusFilter("");
    setStartDate(null);
    setEndDate(null);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toISOString().split("T")[0];
  };

  return (
    <div className="pt-4 px-4 max-w-6xl mx-auto sm:pt-14 sm:px-6">
      <h2 className="text-xl font-bold mb-4 text-center sm:text-2xl">Blue Brigade Consumer Complaints</h2>
      <div className="mb-4 flex flex-wrap gap-4">
        <div className="w-full sm:w-auto">
          <label className="mr-2 font-semibold">Status:</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border p-2 rounded w-full sm:w-auto"
            disabled={loading}
          >
            <option value="">All Statuses</option>
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex gap-2 items-center w-full sm:w-auto">
          <div className="w-full sm:w-auto">
            <label className="mr-2 font-semibold">From:</label>
            <DatePicker
              selected={startDate}
              onChange={(date) => setStartDate(date)}
              selectsStart
              startDate={startDate}
              endDate={endDate}
              placeholderText="Select start date"
              className="border p-2 rounded w-full sm:w-auto"
              disabled={loading}
            />
          </div>
          <div className="w-full sm:w-auto">
            <label className="mr-2 font-semibold">To:</label>
            <DatePicker
              selected={endDate}
              onChange={(date) => setEndDate(date)}
              selectsEnd
              startDate={startDate}
              endDate={endDate}
              minDate={startDate}
              placeholderText="Select end date"
              className="border p-2 rounded w-full sm:w-auto"
              disabled={loading}
            />
          </div>
        </div>
        <div className="w-full sm:w-auto">
          <button
            onClick={() => setSortOrder("oldest")}
            className={`mr-2 px-4 py-2 rounded w-full sm:w-auto ${
              sortOrder === "oldest"
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-700"
            }`}
            disabled={loading}
          >
            Sort: Oldest to Newest
          </button>
          <button
            onClick={() => setSortOrder("newest")}
            className={`px-4 py-2 rounded w-full sm:w-auto ${
              sortOrder === "newest"
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-700"
            }`}
            disabled={loading}
          >
            Sort: Newest to Oldest
          </button>
        </div>
        <div className="w-full sm:w-auto">
          <button
            onClick={clearFilters}
            className="px-4 py-2 bg-gray-500 text-white rounded w-full sm:w-auto hover:bg-gray-600"
            disabled={loading}
          >
            Clear Filters
          </button>
        </div>
      </div>
      {loading ? (
        <div className="text-center text-gray-600">Loading complaints...</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-300">
            <thead>
              <tr>
                <th className="py-2 px-4 border-b">Serial No</th>
                <th className="py-2 px-4 border-b">Ticket Number</th>
                <th className="py-2 px-4 border-b">Name</th>
                <th className="py-2 px-4 border-b">Address</th>
                <th className="py-2 px-4 border-b">Phone Number</th>
                <th className="py-2 px-4 border-b">Created At</th>
                <th className="py-2 px-4 border-b">Status</th>
                <th className="py-2 px-4 border-b">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredComplaints.map((complaint) => (
                <tr key={complaint.id}>
                  <td className="py-2 px-4 border-b">{complaint.serial_no}</td>
                  <td className="py-2 px-4 border-b">{complaint.ticket_number}</td>
                  <td className="py-2 px-4 border-b">{complaint.name}</td>
                  <td className="py-2 px-4 border-b">{complaint.address}</td>
                  <td className="py-2 px-4 border-b">{complaint.phone_number}</td>
                  <td className="py-2 px-4 border-b">
                    {formatDate(complaint.date)}
                  </td>
                  <td className="py-2 px-4 border-b">
                    <select
                      value={complaint.status}
                      onChange={(e) => handleStatusChange(complaint.id, e.target.value)}
                      className="border p-2 rounded"
                      disabled={!hasEditPermission}
                    >
                      {statusOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="py-2 px-4 border-b">
                    {hasDeletePermission && (
                      <button
                        onClick={() => handleDelete(complaint.id)}
                        className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
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
      )}
    </div>
  );
};

export default ConsumerBlueBrigade;
