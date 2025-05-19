import React, { useState, useEffect } from "react";
import apiClient from "../../../api/apiClient";
import { toast } from "react-toastify";

const AddNewApplication = () => {
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    file_number: "",
    area: "",
    from_connection_type: "",
    to_connection_type: "",
  });
  const [connectionTypes, setConnectionTypes] = useState([]);
  const [areas, setAreas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [errors, setErrors] = useState({});
  const [generalError, setGeneralError] = useState("");

  useEffect(() => {
    const fetchConnectionTypes = async () => {
      try {
        const response = await apiClient.get("/connectiontype/connection-types/");
        setConnectionTypes(response.data);
      } catch (err) {
        setGeneralError("Failed to load connection types. Please try again.");
        toast.error("Failed to load connection types.");
      }
    };

    const fetchAreas = async () => {
      try {
        const response = await apiClient.get("/area/add-area/");
        const areaOptions = response.data.map((area) => ({
          value: area.id,
          label: area.area_name,
        }));
        setAreas(areaOptions);
      } catch (err) {
        setGeneralError("Failed to load areas. Please try again.");
        toast.error("Failed to load areas.");
      }
    };

    Promise.all([fetchConnectionTypes(), fetchAreas()]).finally(() => {
      setFetchLoading(false);
    });
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
    setGeneralError("");
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = "Name is required.";
    if (!formData.address.trim()) newErrors.address = "Address is required.";
    if (!formData.file_number.trim())
      newErrors.file_number = "File number is required.";
    if (!formData.area) newErrors.area = "Area is required.";
    if (!formData.from_connection_type)
      newErrors.from_connection_type = "From connection type is required.";
    if (!formData.to_connection_type)
      newErrors.to_connection_type = "To connection type is required.";
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const newErrors = validateForm();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    setGeneralError("");
    try {
      const payload = {
        name: formData.name.trim(),
        address: formData.address.trim(),
        file_number: formData.file_number.trim(),
        area: parseInt(formData.area),
        from_connection_type: parseInt(formData.from_connection_type),
        to_connection_type: parseInt(formData.to_connection_type),
      };
      await apiClient.post("/conversion/conversions/", payload);
      setFormData({
        name: "",
        address: "",
        file_number: "",
        area: "",
        from_connection_type: "",
        to_connection_type: "",
      });
      toast.success("Conversion added successfully!");
    } catch (err) {
      const errorMsg =
        err.response?.data?.detail ||
        Object.values(err.response?.data || {})[0]?.[0] ||
        "Failed to add conversion.";
      setGeneralError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const selectedFromConnectionType = connectionTypes.find(
    (type) => type.id === parseInt(formData.from_connection_type)
  );
  const selectedToConnectionType = connectionTypes.find(
    (type) => type.id === parseInt(formData.to_connection_type)
  );
  const selectedArea = areas.find(
    (area) => area.value === parseInt(formData.area)
  );

  return (
    <div className="mt-4 p-4 max-w-xl mx-auto sm:mt-14 sm:p-6">
      <h1 className="text-xl font-bold text-[#00334d] mb-4 sm:text-2xl">
        Add New Conversion Application
      </h1>

      <form onSubmit={handleSubmit} className="bg-white p-4 rounded-lg shadow-md sm:p-6">
        {generalError && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md text-sm">
            {generalError}
          </div>
        )}

        <div className="mb-4">
          <label htmlFor="from_connection_type" className="block text-sm font-medium text-gray-700 mb-2">
            From Connection Type
          </label>
          <select
            id="from_connection_type"
            name="from_connection_type"
            value={formData.from_connection_type}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#00334d] text-sm"
            disabled={loading || fetchLoading}
          >
            <option value="">Select from connection type</option>
            {connectionTypes.map((type) => (
              <option key={type.id} value={type.id}>
                {type.name}
              </option>
            ))}
          </select>
          {errors.from_connection_type && (
            <p className="mt-2 text-sm text-red-600">
              {errors.from_connection_type}
            </p>
          )}
          {fetchLoading && (
            <p className="mt-2 text-sm text-gray-500">
              Loading connection types...
            </p>
          )}
          {selectedFromConnectionType && (
            <p className="mt-2 text-sm text-gray-600">
              Selected: {selectedFromConnectionType.name}
            </p>
          )}
        </div>

        <div className="mb-4">
          <label htmlFor="to_connection_type" className="block text-sm font-medium text-gray-700 mb-2">
            To Connection Type
          </label>
          <select
            id="to_connection_type"
            name="to_connection_type"
            value={formData.to_connection_type}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#00334d] text-sm"
            disabled={loading || fetchLoading}
          >
            <option value="">Select to connection type</option>
            {connectionTypes.map((type) => (
              <option key={type.id} value={type.id}>
                {type.name}
              </option>
            ))}
          </select>
          {errors.to_connection_type && (
            <p className="mt-2 text-sm text-red-600">
              {errors.to_connection_type}
            </p>
          )}
          {fetchLoading && (
            <p className="mt-2 text-sm text-gray-500">
              Loading connection types...
            </p>
          )}
          {selectedToConnectionType && (
            <p className="mt-2 text-sm text-gray-600">
              Selected: {selectedToConnectionType.name}
            </p>
          )}
        </div>

        <div className="mb-4">
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
            Name
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            placeholder="Enter name"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#00334d] text-sm"
            disabled={loading}
          />
          {errors.name && (
            <p className="mt-2 text-sm text-red-600">{errors.name}</p>
          )}
        </div>

        <div className="mb-4">
          <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
            Address
          </label>
          <input
            type="text"
            id="address"
            name="address"
            value={formData.address}
            onChange={handleInputChange}
            placeholder="Enter address"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#00334d] text-sm"
            disabled={loading}
          />
          {errors.address && (
            <p className="mt-2 text-sm text-red-600">{errors.address}</p>
          )}
        </div>

        <div className="mb-4">
          <label htmlFor="file_number" className="block text-sm font-medium text-gray-700 mb-2">
            File Number
          </label>
          <input
            type="text"
            id="file_number"
            name="file_number"
            value={formData.file_number}
            onChange={handleInputChange}
            placeholder="Enter file number"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#00334d] text-sm"
            disabled={loading}
          />
          {errors.file_number && (
            <p className="mt-2 text-sm text-red-600">{errors.file_number}</p>
          )}
        </div>

        <div className="mb-4">
          <label htmlFor="area" className="block text-sm font-medium text-gray-700 mb-2">
            Area
          </label>
          <select
            id="area"
            name="area"
            value={formData.area}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#00334d] text-sm"
            disabled={loading || fetchLoading}
          >
            <option value="">Select area</option>
            {areas.map((area) => (
              <option key={area.value} value={area.value}>
                {area.label}
              </option>
            ))}
          </select>
          {errors.area && (
            <p className="mt-2 text-sm text-red-600">{errors.area}</p>
          )}
          {fetchLoading && (
            <p className="mt-2 text-sm text-gray-500">Loading areas...</p>
          )}
          {selectedArea && (
            <p className="mt-2 text-sm text-gray-600">
              Selected: {selectedArea.label}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading || fetchLoading}
          className={`w-full px-4 py-2 text-sm font-medium text-white bg-[#00334d] rounded-md hover:bg-[#002a3f] focus:outline-none focus:ring-2 focus:ring-[#00334d] sm:w-auto ${
            loading || fetchLoading ? "opacity-50 cursor-not-allowed" : ""
          }`}
        >
          {loading ? "Adding..." : "Create New Application"}
        </button>
      </form>
    </div>
  );
};

export default AddNewApplication;
