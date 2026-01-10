import { Routes, Route, Navigate } from "react-router-dom";
import MainLayout from "./layout/MainLayout";
import Dashboard from "./pages/Dashboard";
import Orders from "./pages/Orders";
import Inventory from "./pages/Inventory";
import Purchasing from "./pages/Purchasing";
import ActivityLog from "./pages/ActivityLog";
import Accounts from "./pages/Accounts";

function App() {
  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        
        <Route index element={<Navigate to="/dashboard" replace />} />

        <Route path="dashboard" element={<Dashboard />} />
        <Route path="purchasing" element={<Purchasing />} />
        <Route path="orders" element={<Orders />} />
        <Route path="inventory" element={<Inventory />} />
        <Route path="activityLog" element={<ActivityLog />} />
        <Route path="accounts" element={<Accounts />} />
        
      </Route>
    </Routes>
  );
}

export default App;