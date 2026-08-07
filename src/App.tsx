import { Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import RequireUser from "./components/RequireUser";
import Home from "./pages/Home";
import Search from "./pages/Search";
import FacilityDetail from "./pages/FacilityDetail";
import Chat from "./pages/Chat";
import Assessment from "./pages/Assessment";
import Onboarding from "./pages/Onboarding";
import Auth from "./pages/Auth";
import AuthCallback from "./pages/AuthCallback";
import Knowledge from "./pages/Knowledge";
import ResourceDetail from "./pages/ResourceDetail";
import DashboardLayout from "./pages/dashboard/DashboardLayout";
import DashboardOverview from "./pages/dashboard/DashboardOverview";
import DashboardSaved from "./pages/dashboard/DashboardSaved";
import DashboardInquiries from "./pages/dashboard/DashboardInquiries";
import DashboardProfile from "./pages/dashboard/DashboardProfile";
import AdminDashboard from "./pages/admin/AdminDashboard";
import NotFound from "./pages/NotFound";

export default function App() {
  return (
    <Routes>
      {/* Internal leads console. Deliberately outside <Layout> -- no public
          navbar/footer and nothing links to it; it is reached by typing the URL.
          There is no admin auth yet, so this is unguarded for now. */}
      <Route path="admin-dashboard" element={<AdminDashboard />} />
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="search" element={<Search />} />
        <Route path="facilities/:id" element={<FacilityDetail />} />
        <Route path="chat" element={<Chat />} />
        <Route path="assessment" element={<Assessment />} />
        <Route path="onboarding" element={<Onboarding />} />
        <Route path="resources" element={<Knowledge />} />
        <Route path="resources/:id" element={<ResourceDetail />} />
        <Route path="auth" element={<Auth />} />
        <Route path="auth/callback" element={<AuthCallback />} />
        <Route
          path="dashboard"
          element={
            <RequireUser>
              <DashboardLayout />
            </RequireUser>
          }
        >
          <Route index element={<DashboardOverview />} />
          <Route path="saved" element={<DashboardSaved />} />
          <Route path="inquiries" element={<DashboardInquiries />} />
          <Route path="profile" element={<DashboardProfile />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
