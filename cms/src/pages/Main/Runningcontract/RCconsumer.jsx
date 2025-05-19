import React, { useEffect, useState } from "react";
import apiClient from "../../../api/apiClient";
import { useAlert } from "../../../context/AlertContext";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const ConsumerRunningContract = () => {
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
          const runningContractPermission = permissions.find(perm => perm.page === 'runningcontract');
          setHasEditPermission(runningContractPermission?.can_edit || user.is_superuser || user.role?.name === 'Superadmin');
          setHasDeletePermission(runningContractPermission?.can_delete || user.is_superuser || user.role?.name === 'Superadmin');
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
        params.append("department", "runningcontract");
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
            (complaint) => complaint.complaint_type === "consumer" && complaint.department === "runningcontract"
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
    <div className="pt-14 px-4 max-w-6xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-center">Running Contract Consumer Complaints</h2>
      <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
        <div className="flex items-center">
          <label className="mr-2 font-semibold w-16">Status:</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border p-2 rounded w-full"
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
        <div className="flex items-center gap-2">
          <div className="flex items-center">
            <label className="mr-2 font-semibold w-16">From:</label>
            <DatePicker
              selected={startDate}
              onChange={(date) => setStartDate(date)}
              selectsStart
              startDate={startDate}
              endDate={endDate}
              placeholderText="Select start date"
              className="border p-2 rounded w-full"
              disabled={loading}
            />
          </div>
          <div className="flex items-center">
            <label className="mr-2 font-semibold w-16">To:</label>
            <DatePicker
              selected={endDate}
              onChange={(date) => setEndDate(date)}
              selectsEnd
              startDate={startDate}
              endDate={endDate}
              minDate={startDate}
              placeholderText="Select end date"
              className="border p-2 rounded w-full"
              disabled={loading}
            />
          </div>
        </div>
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex gap-2">
            <button
              onClick={() => setSortOrder("oldest")}
              className={`px-4 py-2 rounded ${
                sortOrder === "oldest" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700"
              }`}
              disabled={loading}
            >
              Oldest to Newest
            </button>
            <button
              onClick={() => setSortOrder("newest")}
              className={`px-4 py-2 rounded ${
                sortOrder === "newest" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700"
              }`}
              disabled={loading}
            >
              Newest to Oldest
            </button>
          </div>
          <button
            onClick={clearFilters}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
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
          <table className="min-w-full bg-white border border-gray-300 mx-auto">
            <thead>
              <tr>
                <th className="py-2 px-4 border-b text-left">Serial No</th>
                <th className="py-2 px-4 border-b text-left">Ticket Number</th>
                <th className="py-2 px-4 border-b text-left">Name</th>
                <th className="py-2 px-4 border-b text-left">Address</th>
                <th className="py-2 px-4 border-b text-left">Phone Number</th>
                <th className="py-2 px-4 border-b text-left">Created At</th>
                <th className="py-2 px-4 border-b text-left">Status</th>
                <th className="py-2 px-4 border-b text-left">Actions</th>
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

export default ConsumerRunningContract;