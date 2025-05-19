import React, { useState, useEffect } from "react";
import { Eye, EyeOff } from "lucide-react";
import apiClient from "../../api/apiClient";

const MEDIA_URL = "http://127.0.0.1:8000";

const Profile = () => {
  const [profileData, setProfileData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    username: "",
    avatar: null,
    avatarPreview: null,
    role: null, // Added role to state
  });
  const [passwordData, setPasswordData] = useState({
    current_password: "",
    new_password: "",
    confirm_new_password: "",
  });
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    current_password: false,
    new_password: false,
    confirm_new_password: false,
  });

  // Fetch profile data on mount
  useEffect(() => {
    const fetchProfile = async () => {
      setIsLoading(true);
      try {
        const response = await apiClient.get("/auth/profile/");
        setProfileData({
          first_name: response.data.first_name || "",
          last_name: response.data.last_name || "",
          email: response.data.email || "",
          username: response.data.username || "",
          avatar: response.data.avatar
            ? `${MEDIA_URL}${response.data.avatar}`
            : null,
          avatarPreview: null,
          role: response.data.role || null, // Set role data
        });
      } catch (error) {
        setErrors({ general: "Failed to load profile. Please try again." });
        console.error("Fetch profile error:", error.response?.data);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, []);

  // Handle input changes for profile data
  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "", general: "" }));
    setSuccess("");
  };

  // Handle input changes for password data
  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "", general: "" }));
    setSuccess("");
  };

  // Handle avatar file selection
  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 1 * 1024 * 1024) {
      setErrors((prev) => ({ ...prev, avatar: "File size exceeds 1MB limit" }));
      return;
    }
    if (!["image/jpeg", "image/png", "image/gif"].includes(file.type)) {
      setErrors((prev) => ({
        ...prev,
        avatar: "Only JPG, PNG, or GIF files are allowed",
      }));
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setProfileData((prev) => ({
      ...prev,
      avatar: file,
      avatarPreview: previewUrl,
    }));
    setErrors((prev) => ({ ...prev, avatar: "" }));
  };

  // Validate profile form
  const validateProfile = () => {
    const newErrors = {};
    if (!profileData.first_name)
      newErrors.first_name = "First name is required";
    if (!profileData.last_name) newErrors.last_name = "Last name is required";
    if (!profileData.email) newErrors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profileData.email)) {
      newErrors.email = "Please enter a valid email address";
    }
    if (!profileData.username) newErrors.username = "Username is required";
    return newErrors;
  };

  // Validate password form
  const validatePassword = () => {
    const newErrors = {};
    if (!passwordData.current_password)
      newErrors.current_password = "Current password is required";
    if (!passwordData.new_password)
      newErrors.new_password = "New password is required";
    else if (passwordData.new_password.length < 6) {
      newErrors.new_password =
        "New password must be at least 6 characters long";
    }
    if (!passwordData.confirm_new_password) {
      newErrors.confirm_new_password = "Please confirm your new password";
    } else if (
      passwordData.new_password !== passwordData.confirm_new_password
    ) {
      newErrors.confirm_new_password = "Passwords do not match";
    }
    return newErrors;
  };

  // Handle profile form submission
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});
    setSuccess("");

    const validationErrors = validateProfile();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setIsLoading(false);
      return;
    }

    const formData = new FormData();
    formData.append("first_name", profileData.first_name);
    formData.append("last_name", profileData.last_name);
    formData.append("email", profileData.email);
    formData.append("username", profileData.username);
    if (profileData.avatar && typeof profileData.avatar !== "string") {
      formData.append("avatar", profileData.avatar);
    }

    try {
      const response = await apiClient.put("/auth/profile/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setSuccess("Profile updated successfully");
      setProfileData((prev) => ({
        ...prev,
        avatar: response.data.data.avatar
          ? `${MEDIA_URL}${response.data.data.avatar}`
          : null,
        avatarPreview: null,
        role: response.data.data.role || null, // Update role if changed
      }));
    } catch (error) {
      console.error("Profile update error:", error.response?.data);
      const errorData = error.response?.data || {};
      setErrors({
        first_name: errorData.first_name?.[0] || "",
        last_name: errorData.last_name?.[0] || "",
        email: errorData.email?.[0] || "",
        username: errorData.username?.[0] || "",
        avatar: errorData.avatar?.[0] || "",
        general:
          errorData.error ||
          errorData.non_field_errors?.[0] ||
          "Failed to update profile.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle password form submission
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});
    setSuccess("");

    const validationErrors = validatePassword();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setIsLoading(false);
      return;
    }

    try {
      const response = await apiClient.post(
        "/auth/change-password/",
        passwordData
      );
      setSuccess(response.data.message || "Password changed successfully");
      setPasswordData({
        current_password: "",
        new_password: "",
        confirm_new_password: "",
      });
    } catch (error) {
      console.error("Password change error:", error.response?.data);
      const errorData = error.response?.data || {};
      setErrors({
        current_password: errorData.current_password?.[0] || "",
        new_password: errorData.new_password?.[0] || "",
        confirm_new_password: errorData.confirm_new_password?.[0] || "",
        general:
          errorData.error ||
          errorData.non_field_errors?.[0] || 
          "Failed to change password.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle password visibility
  const togglePasswordVisibility = (field) => {
    setShowPasswords((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-6">
      <div className="w-full bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">
          Profile Settings
        </h1>
        {errors.general && (
          <p className="text-red-500 text-sm mb-4">{errors.general}</p>
        )}
        {success && <p className="text-green-500 text-sm mb-4">{success}</p>}
        {isLoading && <p className="text-gray-500 text-sm mb-4">Loading...</p>}

        <form className="space-y-6">
          {/* Avatar Section */}
          <div className="flex items-center space-x-4">
            <img
              src={
                profileData.avatarPreview ||
                (typeof profileData.avatar === "string" &&
                  profileData.avatar) ||
                "https://placehold.co/80x80"
              }
              alt="Avatar"
              className="w-20 h-20 rounded-full object-cover"
              onError={(e) => (e.target.src = "https://placehold.co/80x80")}
            />
            <div>
              <label className="block">
                <span className="sr-only">Change avatar</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/gif"
                  onChange={handleAvatarChange}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  disabled={isLoading}
                />
              </label>
              <p className="text-xs text-gray-500 mt-1">
                JPG, PNG, or GIF. 1MB max.
              </p>
              {errors.avatar && (
                <p className="text-red-500 text-xs mt-1">{errors.avatar}</p>
              )}
            </div>
          </div>

          {/* Profile Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="first_name"
                className="block text-sm font-medium text-gray-700"
              >
                First Name
              </label>
              <input
                type="text"
                id="first_name"
                name="first_name"
                value={profileData.first_name}
                onChange={handleProfileChange}
                className="mt-1 block w-full px-4 py-2 border border-gray-200 rounded-lg text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-transparent transition-all duration-200 bg-gray-100 hover:bg-gray-50"
                placeholder="First name"
                disabled={isLoading}
              />
              {errors.first_name && (
                <p className="text-red-500 text-xs mt-1">{errors.first_name}</p>
              )}
            </div>
            <div>
              <label
                htmlFor="last_name"
                className="block text-sm font-medium text-gray-700"
              >
                Last Name
              </label>
              <input
                type="text"
                id="last_name"
                name="last_name"
                value={profileData.last_name}
                onChange={handleProfileChange}
                className="mt-1 block w-full px-4 py-2 border border-gray-200 rounded-lg text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-transparent transition-all duration-200 bg-gray-100 hover:bg-gray-50"
                placeholder="Last name"
                disabled={isLoading}
              />
              {errors.last_name && (
                <p className="text-red-500 text-xs mt-1">{errors.last_name}</p>
              )}
            </div>
          </div>

          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700"
            >
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={profileData.email}
              onChange={handleProfileChange}
              className="mt-1 block w-full px-4 py-2 border border-gray-200 rounded-lg text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-transparent transition-all duration-200 bg-gray-100 hover:bg-gray-50"
              placeholder="Email address"
              disabled={isLoading}
            />
            {errors.email && (
              <p className="text-red-500 text-xs mt-1">{errors.email}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="username"
              className="block text-sm font-medium text-gray-700"
            >
              Username
            </label>
            <input
              type="text"
              id="username"
              name="username"
              value={profileData.username}
              onChange={handleProfileChange}
              className="mt-1 block w-full px-4 py-2 border border-gray-200 rounded-lg text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-transparent transition-all duration-200 bg-gray-100 hover:bg-gray-50"
              placeholder="Username"
              disabled={isLoading}
            />
            {errors.username && (
              <p className="text-red-500 text-xs mt-1">{errors.username}</p>
            )}
          </div>

          {/* Role Field (Non-Editable) */}
          <div>
            <label
              htmlFor="role"
              className="block text-sm font-medium text-gray-700"
            >
              Role
            </label>
            <input
              type="text"
              id="role"
              name="role"
              value={profileData.role ? profileData.role.name : "No role assigned"}
              className="mt-1 block w-full px-4 py-2 border border-gray-200 rounded-lg text-gray-800 text-sm bg-gray-100 cursor-not-allowed"
              disabled
            />
          </div>

          <div className="grid grid-cols-2 gap-x-4 mt-8">
            <button
              type="button"
              onClick={handleProfileSubmit}
              className="w-full px-6 py-2 bg-blue-200 text-blue-800 hover:text-gray-800 hover:bg-gray-200 text-sm font-medium rounded-sm transition-all duration-300 disabled:opacity-50"
              disabled={isLoading}
            >
              {isLoading ? "Saving..." : "Save Profile"}
            </button>
          </div>

          {/* Password Fields */}
          <div className="border-t border-gray-200 pt-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              Change Password
            </h2>
            <div className="space-y-4">
              <div className="relative">
                <label
                  htmlFor="current_password"
                  className="block text-sm font-medium text-gray-700"
                >
                  Current Password
                </label>
                <input
                  type={showPasswords.current_password ? "text" : "password"}
                  id="current_password"
                  name="current_password"
                  value={passwordData.current_password}
                  onChange={handlePasswordChange}
                  className="mt-1 block w-full px-4 py-2 border border-gray-200 rounded-lg text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-transparent transition-all duration-200 bg-gray-100 hover:bg-gray-50 pr-10"
                  placeholder="Current password"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility("current_password")}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 mt-6"
                  disabled={isLoading}
                >
                  {showPasswords.current_password ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
                {errors.current_password && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.current_password}
                  </p>
                )}
              </div>

              <div className="relative">
                <label
                  htmlFor="new_password"
                  className="block text-sm font-medium text-gray-700"
                >
                  New Password
                </label>
                <input
                  type={showPasswords.new_password ? "text" : "password"}
                  id="new_password"
                  name="new_password"
                  value={passwordData.new_password}
                  onChange={handlePasswordChange}
                  className="mt-1 block w-full px-4 py-2 border border-gray-200 rounded-lg text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-transparent transition-all duration-200 bg-gray-100 hover:bg-gray-50 pr-10"
                  placeholder="New password"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility("new_password")}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 mt-6"
                  disabled={isLoading}
                >
                  {showPasswords.new_password ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
                {errors.new_password && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.new_password}
                  </p>
                )}
              </div>

              <div className="relative">
                <label
                  htmlFor="confirm_new_password"
                  className="block text-sm font-medium text-gray-700"
                >
                  Confirm New Password
                </label>
                <input
                  type={
                    showPasswords.confirm_new_password ? "text" : "password"
                  }
                  id="confirm_new_password"
                  name="confirm_new_password"
                  value={passwordData.confirm_new_password}
                  onChange={handlePasswordChange}
                  className="mt-1 block w-full px-4 py-2 border border-gray-200 rounded-lg text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-transparent transition-all duration-200 bg-gray-100 hover:bg-gray-50 pr-10"
                  placeholder="Confirm new password"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() =>
                    togglePasswordVisibility("confirm_new_password")
                  }
                  className="absolute inset-y-0 right-0 flex items-center pr-3 mt-6"
                  disabled={isLoading}
                >
                  {showPasswords.confirm_new_password ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
                {errors.confirm_new_password && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.confirm_new_password}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-x-4">
            <button
              type="button"
              onClick={handlePasswordSubmit}
              className="w-full px-6 py-2 bg-blue-200 text-blue-800 hover:text-gray-800 hover:bg-gray-200 text-sm font-medium rounded-sm transition-all duration-300 disabled:opacity-50"
              disabled={isLoading}
            >
              {isLoading ? "Saving..." : "Change Password"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Profile;