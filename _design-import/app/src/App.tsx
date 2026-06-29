import { Routes, Route } from 'react-router'
import { Toaster } from 'react-hot-toast'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import Setup from './pages/Setup'
import Unauthorized from './pages/Unauthorized'

// Student Portal
import StudentDashboard from './pages/student/Dashboard'
import StudentOrders from './pages/student/Orders'
import StudentNewOrder from './pages/student/NewOrder'
import StudentOrderDetail from './pages/student/OrderDetail'
import StudentTracking from './pages/student/Tracking'
import StudentProfile from './pages/student/Profile'

// Representative Portal
import RepresentativeDashboard from './pages/representative/Dashboard'
import RepresentativeBatches from './pages/representative/Batches'
import RepresentativeBatchDetail from './pages/representative/BatchDetail'
import RepresentativeOrders from './pages/representative/Orders'
import RepresentativeTracking from './pages/representative/Tracking'

// Employee Portal
import EmployeeDashboard from './pages/employee/Dashboard'
import EmployeeOrders from './pages/employee/Orders'
import EmployeePrinting from './pages/employee/Printing'

// Admin Portal
import AdminDashboard from './pages/admin/Dashboard'
import AdminOrders from './pages/admin/Orders'
import AdminOrderDetail from './pages/admin/OrderDetail'
import AdminDesign from './pages/admin/Design'
import AdminTemplates from './pages/admin/Templates'
import AdminPrinting from './pages/admin/Printing'
import AdminDelivery from './pages/admin/Delivery'
import AdminPayments from './pages/admin/Payments'
import AdminUsers from './pages/admin/Users'
import AdminBatches from './pages/admin/Batches'
import AdminReports from './pages/admin/Reports'
import AdminSettings from './pages/admin/Settings'

import NotFound from './pages/NotFound'

export default function App() {
  return (
    <>
      <Toaster 
        position="top-center"
        toastOptions={{
          duration: 4000,
          style: {
            fontFamily: 'Tajawal, sans-serif',
            direction: 'rtl',
          },
        }}
      />
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/setup" element={<Setup />} />
        <Route path="/unauthorized" element={<Unauthorized />} />

        {/* Student Portal */}
        <Route path="/student" element={<StudentDashboard />} />
        <Route path="/student/orders" element={<StudentOrders />} />
        <Route path="/student/orders/new" element={<StudentNewOrder />} />
        <Route path="/student/orders/:id" element={<StudentOrderDetail />} />
        <Route path="/student/tracking" element={<StudentTracking />} />
        <Route path="/student/profile" element={<StudentProfile />} />

        {/* Representative Portal */}
        <Route path="/representative" element={<RepresentativeDashboard />} />
        <Route path="/representative/batches" element={<RepresentativeBatches />} />
        <Route path="/representative/batches/:id" element={<RepresentativeBatchDetail />} />
        <Route path="/representative/orders" element={<RepresentativeOrders />} />
        <Route path="/representative/tracking" element={<RepresentativeTracking />} />

        {/* Employee Portal */}
        <Route path="/employee" element={<EmployeeDashboard />} />
        <Route path="/employee/orders" element={<EmployeeOrders />} />
        <Route path="/employee/printing" element={<EmployeePrinting />} />

        {/* Admin Portal */}
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/orders" element={<AdminOrders />} />
        <Route path="/admin/orders/:id" element={<AdminOrderDetail />} />
        <Route path="/admin/design" element={<AdminDesign />} />
        <Route path="/admin/templates" element={<AdminTemplates />} />
        <Route path="/admin/printing" element={<AdminPrinting />} />
        <Route path="/admin/delivery" element={<AdminDelivery />} />
        <Route path="/admin/payments" element={<AdminPayments />} />
        <Route path="/admin/users" element={<AdminUsers />} />
        <Route path="/admin/batches" element={<AdminBatches />} />
        <Route path="/admin/reports" element={<AdminReports />} />
        <Route path="/admin/settings" element={<AdminSettings />} />

        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  )
}
