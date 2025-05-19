import React from 'react';
import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
  useLocation,
} from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Login from './pages/Auth/Login';
import ForgotPassword from './pages/Auth/ForgotPassword';
import OTPVerification from './pages/Auth/OTPVerification';
import ResetPassword from './pages/Auth/ResetPassword';
import apiClient from './api/apiClient';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import UserRoles from './pages/Auth/UserRoles';
import Roles from './pages/Auth/Roles';
import Permissions from './pages/Auth/Permissions';
import AddComplaint from './pages/Main/Complaint/AddComplaint';
import ViewComplaint from './pages/Main/Complaint/ViewComplaint';
import Area from './pages/Main/Area/Area';
import { AlertProvider } from './context/AlertContext';
import Consumer from './pages/Main/Bluebrigade/Consumer';
import General from './pages/Main/Bluebrigade/General';
import Flows from './pages/Main/Flows';
import AddValves from './pages/Main/Valves/AddValves';
import RCconsumer from './pages/Main/Runningcontract/RCconsumer';
import RCgeneral from './pages/Main/Runningcontract/RCgeneral';
import ViewValves from './pages/Main/Valves/ViewValves';
import AddConnection from './pages/Main/Etapp/AddConnection';
import AddConversion from './pages/Main/Etapp/AddConversion';
import ConnectionType from './pages/Main/Etapp/ConnectionType';
import ViewConnection from './pages/Main/Etapp/ViewConnection';
import ViewConversion from './pages/Main/Etapp/ViewConversion';
import { useEffect, useState } from 'react';

const DashboardPage = () => (
  <div className="mt-14">
    <Dashboard />
  </div>
);

const ProfilePage = () => (
  <div className="mt-14">
    <Profile />
  </div>
);

const UserRolesPage = () => (
  <div className="mt-14">
    <UserRoles />
  </div>
);

const RolesPage = () => (
  <div className="mt-14">
    <Roles />
  </div>
);

const PermissionsPage = () => (
  <div className="mt-14">
    <Permissions />
  </div>
);

const PrivateRoute = ({ element, requiredPage, requiredAction = 'view' }) => {
  const location = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [permissions, setPermissions] = useState({});

  useEffect(() => {
    const checkAuth = async () => {
      const token =
        localStorage.getItem('access_token') ||
        sessionStorage.getItem('access_token');

      if (!token) {
        console.log('No token found, redirecting to /login');
        setIsAuthenticated(false);
        return;
      }

      try {
        const response = await apiClient.get('/auth/profile/');
        const user = response.data;
        console.log('User Data:', user);

        setIsAuthenticated(true);

        if (user.is_superuser || user.role?.name === 'Superadmin') {
          console.log('User is superadmin, granting all access');
          setPermissions({ can_view: true, can_add: true, can_edit: true, can_delete: true });
          return;
        }

        const roleId = user.role?.id;
        if (!roleId) {
          console.warn('No role ID found, denying access');
          setPermissions({});
          return;
        }

        try {
          const roleResponse = await apiClient.get(`/auth/roles/${roleId}/`);
          const perms = roleResponse.data.permissions || [];
          console.log(`Permissions for role ${roleId}:`, perms);
          const pagePerm = perms.find((p) => p.page === requiredPage);
          const permObj = pagePerm || { can_view: false, can_add: false, can_edit: false, can_delete: false };
          console.log(`Permission for ${requiredPage}:`, permObj);
          setPermissions(permObj);
        } catch (error) {
          console.error('Role fetch error:', error.response?.status, error.response?.data);
          setPermissions({});
        }
      } catch (error) {
        console.error('Auth check failed:', error.response?.status, error.response?.data);
        setIsAuthenticated(false);
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        sessionStorage.removeItem('access_token');
        sessionStorage.removeItem('refresh_token');
      }
    };

    checkAuth();
  }, [requiredPage, location.pathname]);

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-[#00334d] text-sm">Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    console.log('Not authenticated, redirecting to /login');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!permissions[`can_${requiredAction}`]) {
    console.warn(`Permission denied for page: ${requiredPage}, action: ${requiredAction}, redirecting to /`);
    return <Navigate to="/" replace />;
  }

  return element;
};

const router = createBrowserRouter([
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/forgot-password',
    element: <ForgotPassword />,
  },
  {
    path: '/otp-verification',
    element: <OTPVerification />,
  },
  {
    path: '/reset-password',
    element: <ResetPassword />,
  },
  {
    path: '/',
    element: <Layout />,
    children: [
      {
        path: '/',
        element: <PrivateRoute element={<DashboardPage />} requiredPage="dashboard" />,
      },
      {
        path: '/complaints/add-complaints',
        element: (
          <PrivateRoute element={<AddComplaint />} requiredPage="complaints" requiredAction="add" />
        ),
      },
      {
        path: '/complaints/view-complaints',
        element: (
          <PrivateRoute
            element={<ViewComplaint />}
            requiredPage="complaints"
            requiredAction="view"
          />
        ),
      },
      {
        path: '/valves/view-valves',
        element: (
          <PrivateRoute element={<ViewValves />} requiredPage="valves" requiredAction="view" />
        ),
      },
      {
        path: '/valves/add-valves',
        element: <PrivateRoute element={<AddValves />} requiredPage="valves" requiredAction="add" />,
      },
      {
        path: 'profile',
        element: <PrivateRoute element={<ProfilePage />} requiredPage="profile" />,
      },
      {
        path: 'area',
        element: <PrivateRoute element={<Area />} requiredPage="area" />,
      },
      {
        path: 'flows',
        element: <PrivateRoute element={<Flows />} requiredPage="flows" />,
      },
      {
        path: '/bluebrigade/consumer',
        element: <PrivateRoute element={<Consumer />} requiredPage="bluebrigade" />,
      },
      {
        path: '/bluebrigade/general',
        element: <PrivateRoute element={<General />} requiredPage="bluebrigade" />,
      },
      {
        path: '/runningcontract/rcconsumer',
        element: <PrivateRoute element={<RCconsumer />} requiredPage="runningcontract" />,
      },
      {
        path: '/runningcontract/rcgeneral',
        element: <PrivateRoute element={<RCgeneral />} requiredPage="runningcontract" />,
      },
      {
        path: '/user-roles',
        element: <PrivateRoute element={<UserRolesPage />} requiredPage="user_management" />,
      },
      {
        path: '/roles',
        element: <PrivateRoute element={<RolesPage />} requiredPage="role" />,
      },
      {
        path: '/permissions',
        element: <PrivateRoute element={<PermissionsPage />} requiredPage="permission" />,
      },
      {
        path: '/e-tapp/connection/type',
        element: <PrivateRoute element={<ConnectionType />} requiredPage="e-tapp" requiredAction="view" />,
      },
      {
        path: '/e-tapp/connection/add',
        element: <PrivateRoute element={<AddConnection />} requiredPage="e-tapp" requiredAction="add" />,
      },
      {
        path: '/e-tapp/connection/view',
        element: <PrivateRoute element={<ViewConnection />} requiredPage="e-tapp" requiredAction="view" />,
      },
      {
        path: '/e-tapp/conversion/add',
        element: <PrivateRoute element={<AddConversion />} requiredPage="e-tapp" requiredAction="add" />,
      },
      {
        path: '/e-tapp/conversion/view',
        element: <PrivateRoute element={<ViewConversion />} requiredPage="e-tapp" requiredAction="view" />,
      },
      {
        path: '*',
        element: <Navigate to="/" replace />,
      },
    ],
  },
]);

const App = () => {
  return (
    <AlertProvider>
      <RouterProvider router={router} />
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
    </AlertProvider>
  );
};

export default App;