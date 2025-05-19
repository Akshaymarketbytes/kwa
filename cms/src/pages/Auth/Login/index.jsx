import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import apiClient from "../../../api/apiClient";
import { Eye, EyeOff } from "lucide-react";
import authBg from "../../../assets/images/Waterlog.jpg";
 
const Login = () => {
  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
    rememberMe: false,
  });
  const [warnings, setWarnings] = useState({
    email: "",
    password: "",
    general: "",
  });
  const [showPassword, setShowPassword] = useState(false);
 
  const navigate = useNavigate();
 
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setLoginData({
      ...loginData,
      [name]: type === "checkbox" ? checked : value,
    });
    setWarnings({ ...warnings, [name]: "", general: "" });
  };
 
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };
 
  const handleSubmit = async (e) => {
    e.preventDefault();
    let hasError = false;
    const newWarnings = { email: "", password: "", general: "" };
 
    if (!loginData.email) {
      newWarnings.email = "Email is required";
      hasError = true;
    } else if (!validateEmail(loginData.email)) {
      newWarnings.email = "Please enter a valid email address";
      hasError = true;
    }
 
    if (!loginData.password) {
      newWarnings.password = "Password is required";
      hasError = true;
    } else if (loginData.password.length < 6) {
      newWarnings.password = "Password must be at least 6 characters long";
      hasError = true;
    }
 
    if (hasError) {
      setWarnings(newWarnings);
      return;
    }
 
    try {
      const loginResponse = await apiClient.post("/auth/login/", {
        email: loginData.email,
        password: loginData.password,
      });
 
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      localStorage.removeItem("remember_me");
      sessionStorage.removeItem("access_token");
      sessionStorage.removeItem("refresh_token");
 
      if (loginData.rememberMe) {
        localStorage.setItem("access_token", loginResponse.data.access);
        localStorage.setItem("refresh_token", loginResponse.data.refresh);
        localStorage.setItem("remember_me", "true");
      } else {
        sessionStorage.setItem("access_token", loginResponse.data.access);
        sessionStorage.setItem("refresh_token", loginResponse.data.refresh);
      }
 
      const profileResponse = await apiClient.get("/auth/profile/");
      const user = profileResponse.data;
      const roleName = user.role?.name;
      const loginPage = loginResponse.data.login_page;
 
      const pageToPath = {
        dashboard: "/",
        profile: "/profile",
        user_management: "/user-roles",
        role: "/roles",
        permission: "/permissions",
        complaints: "/complaints/view-complaints",
        valves: "/valves/view-valves",
        area: "/area",
        flows: "/flows",
        bluebrigade: "/bluebrigade/consumer",
        runningcontract: "/runningcontract/rcconsumer",
      };
 
      const roleRedirects = {
        Bluebrigade: "/bluebrigade/consumer",
        "Running Contract": "/runningcontract/rcconsumer",
        Fitter: "/valves/view-valves",
        Manager: "/complaints/view-complaints",
        Superadmin: "/",
      };
 
      let redirectPath = "/profile";
      if (loginPage && pageToPath[loginPage]) {
        redirectPath = pageToPath[loginPage];
      } else if (roleName && roleRedirects[roleName]) {
        redirectPath = roleRedirects[roleName];
      }
 
      setWarnings({ email: "", password: "", general: "" });
      navigate(redirectPath);
    } catch (error) {
      console.log("Error response:", error.response);
      let errorMessage = "Invalid email or password.";
      if (error.response && error.response.data) {
        const errors = error.response.data;
        if (errors.non_field_errors && Array.isArray(errors.non_field_errors)) {
          errorMessage = errors.non_field_errors[0];
        } else if (errors.detail) {
          errorMessage = errors.detail;
        }
      }
      setWarnings({
        ...warnings,
        general: errorMessage,
      });
    }
  };
 
  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };
 
  return (
    <div
      className="min-h-screen flex items-center justify-end bg-gray-50"
      style={{
        backgroundImage: `url(${authBg})`,
        objectFit: "fill",
        backgroundRepeat: "no-repeat",
        backgroundSize: "cover",
        backgroundPosition: "center 30%",
      }}
    >
      <div className="w-full max-w-md flex rounded-xl shadow-lg overflow-hidden mr-10">
        <div className="w-full p-8 bg-white">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Login</h1>
          <p className="text-sm text-gray-600 mb-6">
            Enter your credentials to access your account.
          </p>
          {warnings.general && (
            <p className="text-sm text-red-500 mb-4">{warnings.general}</p>
          )}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm text-gray-700 mb-2">
                Email or phone number
              </label>
              <input
                type="text"
                name="email"
                value={loginData.email}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your email or phone number"
              />
              {warnings.email && (
                <p className="text-sm text-red-500 mt-1">{warnings.email}</p>
              )}
            </div>
            <div className="relative">
              <label className="block text-sm text-gray-700 mb-2">
                Password
              </label>
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={loginData.password}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
                placeholder="Enter password"
              />
              <button
                type="button"
                onClick={togglePasswordVisibility}
                className="absolute right-2 top-[48px] transform -translate-y-1/2 text-gray-600 hover:text-gray-800"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
              {warnings.password && (
                <p className="text-sm text-red-500 mt-1">{warnings.password}</p>
              )}
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="rememberMe"
                  checked={loginData.rememberMe}
                  onChange={handleChange}
                  className="h-4 w-4 border-gray-300 rounded"
                />
                <label className="ml-2 text-sm text-gray-700">
                  Remember me
                </label>
              </div>
              <Link
                to="/forgot-password"
                className="text-sm text-blue-600 hover:underline"
              >
                Forgot Password?
              </Link>
            </div>
            <button
              type="submit"
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Continue
            </button>
            <p className="text-xs text-gray-500 text-center">
              By continuing, you agree to our{" "}
              <a href="#" className="text-blue-600 hover:underline">
                privacy policy
              </a>{" "}
              and{" "}
              <a href="#" className="text-blue-600 hover:underline">
                terms of use
              </a>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};
 
export default Login;