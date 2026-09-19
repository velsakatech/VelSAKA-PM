import { Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/Login";

import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminProjects from "./pages/admin/AdminProjects";
import AdminTasks from "./pages/admin/AdminTasks";
import AdminChat from "./pages/admin/AdminChat";
import UserManagement from "./pages/admin/UserManagement";

import UserDashboard from "./pages/user/UserDashboard";
import MyProjects from "./pages/user/MyProjects";
import MyTasks from "./pages/user/MyTasks";
import Calendar from "./pages/user/Calendar";
import Notifications from "./pages/user/Notifications";
import MyProfile from "./pages/user/MyProfile";
import UserChat from "./pages/user/UserChat";

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/login" element={<Login />} />

      <Route path="/admin" element={<AdminDashboard />} />
      <Route path="/admin/projects" element={<AdminProjects />} />
      <Route path="/admin/users" element={<UserManagement />} />
      <Route path="/admin/tasks" element={<AdminTasks />} />
      <Route path="/admin/chat/:userId" element={<AdminChat />} />


      <Route path="/user/dashboard" element={<UserDashboard />} />
      <Route path="/user/dashboard/projects" element={<MyProjects />} />
      <Route path="/user/dashboard/tasks" element={<MyTasks />} />
      <Route path="/user/dashboard/calendar" element={<Calendar />} />
      <Route path="/user/dashboard/notifications" element={<Notifications />} />
      <Route path="/user/dashboard/profile" element={<MyProfile />} />
      <Route path="/user/chat/:adminId" element={<UserChat />} />
    </Routes>
  );
};

export default App;
