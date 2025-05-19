import React, { useEffect, useState } from "react";
import apiClient from "../../../api/apiClient";
import { useAlert } from "../../../context/AlertContext";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const ViewComplaints = () => {
  const [complaints, setComplaints] = useState([]);
  const [filteredComplaints, setFilteredComplaints] = useState([]);
  const [sortOrder, setSortOrder] = useState("newest");
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [departments, setDepartments] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [isSuperadmin, setIsSuperadmin] = useState(false);
  const { showAlert } = useAlert();
  const [useApiFiltering, setUseApiFiltering] = useState(false);

  const statusOptions = [
    { value: "completed", label: "Completed" },
    { value: "accepted", label: "Accepted" },
    { value: "processing", label: "Processing" },
    { value: "return_for_review", label: "Return for Review" },
  ];

  useEffect(() => {
    apiClient
      .get('/auth/profile/')
      .then((response) => {
        const user = response.data;
        setIsSuperadmin(user.is_superuser || user.role?.name === 'Superadmin');
        const roleId = user.role?.id;
        if (roleId) {
          apiClient
            .get(`/auth/roles/${roleId}/`)
            .then((res) => {
              setPermissions(res.data.permissions || []);
              console.log('Permissions:', res.data.permissions);
            })
            .catch((error) => {
              console.error('Permissions fetch error:', error.response?.status, error.response?.data);
            });
        }
      })
      .catch((error) => {
        console.error('Profile fetch error:', error.response?.status, error.response?.data);
      });
  }, []);

  const hasDeletePermission = isSuperadmin || permissions.find((p) => p.page === 'complaints')?.can_delete;

  useEffect(() => {
    const fetchComplaints = async () => {
      try {
        const params = new URLSearchParams();
        if (useApiFiltering) {
          params.append("ordering", sortOrder === "oldest" ? "date" : "-date");
          if (startDate) {
            params.append("date__gte", startDate.toISOString().split("T")[0]);
          }
          if (endDate) {
            params.append("date__lte", endDate.toISOString().split("T")[0]);
          }
          if (searchQuery) {
            params.append("name", searchQuery);
          }
          if (departmentFilter) {
            params.append("department", departmentFilter);
          }
          if (statusFilter) {
            params.append("status", statusFilter);
          }
        }

        const response = await apiClient.get(
          `/complaint/complaints/?${params.toString()}`
        );
        console.log("Fetched complaints:", response.data);
        setComplaints(response.data);
        setFilteredComplaints(response.data);

        const uniqueDepartments = [
          ...new Set(response.data.map((complaint) => complaint.department)),
        ];
        setDepartments(uniqueDepartments);
      } catch (error) {
        console.error("Error fetching complaints:", error);
        showAlert("Failed to fetch complaints.", "error");
      }
    };

    fetchComplaints();
  }, [
    sortOrder,
    startDate,
    endDate,
    searchQuery,
    departmentFilter,
    statusFilter,
    useApiFiltering,
  ]);

  useEffect(() => {
    if (useApiFiltering) return;

    let filtered = complaints;

    if (searchQuery) {
      filtered = filtered.filter((complaint) =>
        complaint.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    if (departmentFilter) {
      filtered = filtered.filter(
        (complaint) => complaint.department === departmentFilter
      );
    }
    if (statusFilter) {
      filtered = filtered.filter(
        (complaint) => complaint.status === statusFilter
      );
    }
    if (startDate) {
      filtered = filtered.filter(
        (complaint) => new Date(complaint.date) >= new Date(startDate)
      );
    }
    if (endDate) {
      filtered = filtered.filter(
        (complaint) => new Date(complaint.date) <= new Date(endDate)
      );
    }

    filtered.sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return sortOrder === "oldest" ? dateA - dateB : dateB - dateA;
    });

    setFilteredComplaints(filtered);
  }, [
    complaints,
    searchQuery,
    departmentFilter,
    statusFilter,
    startDate,
    endDate,
    sortOrder,
    useApiFiltering,
  ]);

  const handleStatusChange = (complaintId, newStatus) => {
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
    setSearchQuery("");
    setDepartmentFilter("");
    setStatusFilter("");
    setStartDate(null);
    setEndDate(null);
    setSortOrder("newest");
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toISOString().split("T")[0];
  };

  return (
    <div className="pt-14 px-4 sm:px-6 lg:px-8">
      <h2 className="text-xl sm:text-2xl font-bold mb-6 text-gray-800">View Complaints</h2>

      {/* Filters */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          <label className="text-sm font-semibold text-gray-700">Search by Name:</label>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Enter name"
            className="w-full sm:w-48 p-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300"
          />
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          <label className="text-sm font-semibold text-gray-700">Department:</label>
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="w-full sm:w-48 p-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300"
          >
            <option value="">All Departments</option>
            {departments.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          <label className="text-sm font-semibold text-gray-700">Status:</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full sm:w-48 p-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300"
          >
            <option value="">All Statuses</option>
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col sm:flex-row sm:gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <label className="text-sm font-semibold text-gray-700">From:</label>
            <DatePicker
              selected={startDate}
              onChange={(date) => setStartDate(date)}
              selectsStart
              startDate={startDate}
              endDate={endDate}
              placeholderText="Select start date"
              className="w-full sm:w-48 p-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <label className="text-sm font-semibold text-gray-700">To:</label>
            <DatePicker
              selected={endDate}
              onChange={(date) => setEndDate(date)}
              selectsEnd
              startDate={startDate}
              endDate={endDate}
              minDate={startDate}
              placeholderText="Select end date"
              className="w-full sm:w-48 p-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <button
            onClick={() => setSortOrder("oldest")}
            className={`w-full sm:w-auto px-4 py-2 text-sm rounded-lg ${
              sortOrder === "oldest"
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            } transition-colors`}
          >
            Oldest to Newest
          </button>
          <button
            onClick={() => setSortOrder("newest")}
            className={`w-full sm:w-auto px-4 py-2 text-sm rounded-lg ${
              sortOrder === "newest"
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            } transition-colors`}
          >
            Newest to Oldest
          </button>
        </div>
        <div className="flex">
          <button
            onClick={clearFilters}
            className="w-full sm:w-auto px-4 py-2 text-sm bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Table for Desktop */}
      <div className="hidden md:block overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-300 rounded-lg shadow-md">
          <thead className="bg-gray-100">
            <tr>
              <th className="py-3 px-4 border-b text-left text-sm font-semibold text-gray-700">Serial No</th>
              <th className="py-3 px-4 border-b text-left text-sm font-semibold text-gray-700">Ticket Number</th>
              <th className="py-3 px-4 border-b text-left text-sm font-semibold text-gray-700">Name</th>
              <th className="py-3 px-4 border-b text-left text-sm font-semibold text-gray-700">Address</th>
              <th className="py-3 px-4 border-b text-left text-sm font-semibold text-gray-700">Phone Number</th>
              <th className="py-3 px-4 border-b text-left text-sm font-semibold text-gray-700">Department</th>
              <th className="py-3 px-4 border-b text-left text-sm font-semibold text-gray-700">Created At</th>
              <th className="py-3 px-4 border-b text-left text-sm font-semibold text-gray-700">Status</th>
              <th className="py-3 px-4 border-b text-left text-sm font-semibold text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredComplaints.map((complaint) => (
              <tr key={complaint.id} className="hover:bg-gray-50">
                <td className="py-3 px-4 border-b text-sm text-gray-600">{complaint.serial_no}</td>
                <td className="py-3 px-4 border-b text-sm text-gray-600">{complaint.ticket_number}</td>
                <td className="py-3 px-4 border-b text-sm text-gray-600">{complaint.name}</td>
                <td className="py-3 px-4 border-b text-sm text-gray-600">{complaint.address}</td>
                <td className="py-3 px-4 border-b text-sm text-gray-600">{complaint.phone_number}</td>
                <td className="py-3 px-4 border-b text-sm text-gray-600">{complaint.department}</td>
                <td className="py-3 px-4 border-b text-sm text-gray-600">{formatDate(complaint.date)}</td>
                <td className="py-3 px-4 border-b text-sm">
                  <select
                    value={complaint.status}
                    onChange={(e) => handleStatusChange(complaint.id, e.target.value)}
                    className="w-full p-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300"
                  >
                    <option value="completed">Completed</option>
                    <option value="accepted">Accepted</option>
                    <option value="processing">Processing</option>
                    <option value="return_for_review">Return for Review</option>
                  </select>
                </td>
                <td className="py-3 px-4 border-b text-sm">
                  {hasDeletePermission && (
                    <button
                      onClick={() => handleDelete(complaint.id)}
                      className="px-3 py-1 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
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

      {/* Card Layout for Mobile */}
      <div className="md:hidden space-y-4">
        {filteredComplaints.map((complaint) => (
          <div key={complaint.id} className="bg-white p-4 rounded-lg shadow-md border border-gray-200">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm font-semibold text-gray-700">Serial No:</span>
                <span className="text-sm text-gray-600">{complaint.serial_no}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-semibold text-gray-700">Ticket Number:</span>
                <span className="text-sm text-gray-600">{complaint.ticket_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-semibold text-gray-700">Name:</span>
                <span className="text-sm text-gray-600">{complaint.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-semibold text-gray-700">Address:</span>
                <span className="text-sm text-gray-600">{complaint.address}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-semibold text-gray-700">Phone Number:</span>
                <span className="text-sm text-gray-600">{complaint.phone_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-semibold text-gray-700">Department:</span>
                <span className="text-sm text-gray-600">{complaint.department}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-semibold text-gray-700">Created At:</span>
                <span className="text-sm text-gray-600">{formatDate(complaint.date)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-semibold text-gray-700">Status:</span>
                <select
                  value={complaint.status}
                  onChange={(e) => handleStatusChange(complaint.id, e.target.value)}
                  className="w-32 p-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300"
                >
                  <option value="completed">Completed</option>
                  <option value="accepted">Accepted</option>
                  <option value="processing">Processing</option>
                  <option value="return_for_review">Return for Review</option>
                </select>
              </div>
              {hasDeletePermission && (
                <div className="flex justify-end">
                  <button
                    onClick={() => handleDelete(complaint.id)}
                    className="px-3 py-1 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ViewComplaints;