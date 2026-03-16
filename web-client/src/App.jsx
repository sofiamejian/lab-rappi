import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { AuthProvider, useAuth } from "./context/AuthContext"
 
import Login from "./pages/Login"
import Register from "./pages/Register"
 
import Stores from "./pages/consumer/Stores"
import Products from "./pages/consumer/Products"
import Cart from "./pages/consumer/Cart"
import Orders from "./pages/consumer/Orders"
 
import StoreDashboard from "./pages/store/StoreDashboard"
import ProductsManager from "./pages/store/ProductsManager"
import StoreOrders from "./pages/store/StoreOrders"
 
import AvailableOrders from "./pages/delivery/AvailableOrders"
import MyOrders from "./pages/delivery/MyOrders"
 
function ProtectedRoute({ allowedRoles, children }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/" />
  if (!allowedRoles.includes(user.role)) return <Navigate to="/" />
  return children
}
 
function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/register" element={<Register />} />
 
          {/* Consumer */}
          <Route path="/stores" element={
            <ProtectedRoute allowedRoles={["consumer"]}><Stores /></ProtectedRoute>
          } />
          <Route path="/products/:id" element={
            <ProtectedRoute allowedRoles={["consumer"]}><Products /></ProtectedRoute>
          } />
          <Route path="/cart" element={
            <ProtectedRoute allowedRoles={["consumer"]}><Cart /></ProtectedRoute>
          } />
          <Route path="/orders" element={
            <ProtectedRoute allowedRoles={["consumer"]}><Orders /></ProtectedRoute>
          } />
 
          {/* Store */}
          <Route path="/store" element={
            <ProtectedRoute allowedRoles={["store"]}><StoreDashboard /></ProtectedRoute>
          } />
          <Route path="/store/products" element={
            <ProtectedRoute allowedRoles={["store"]}><ProductsManager /></ProtectedRoute>
          } />
          <Route path="/store/orders" element={
            <ProtectedRoute allowedRoles={["store"]}><StoreOrders /></ProtectedRoute>
          } />
 
          {/* Delivery */}
          <Route path="/delivery" element={
            <ProtectedRoute allowedRoles={["delivery"]}><AvailableOrders /></ProtectedRoute>
          } />
          <Route path="/delivery/my" element={
            <ProtectedRoute allowedRoles={["delivery"]}><MyOrders /></ProtectedRoute>
          } />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
 
export default App