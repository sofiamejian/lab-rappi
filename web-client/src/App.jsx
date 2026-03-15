import { BrowserRouter, Routes, Route } from "react-router-dom"
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

import { AuthProvider } from "./context/AuthContext"

function App() {

  return (

    <AuthProvider>

      <BrowserRouter>

        <Routes>

          <Route path="/" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route path="/stores" element={<Stores />} />
          <Route path="/products/:id" element={<Products />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/orders" element={<Orders />} />

          <Route path="/store" element={<StoreDashboard />} />
          <Route path="/store/products" element={<ProductsManager />} />
          <Route path="/store/orders" element={<StoreOrders />} />

          <Route path="/delivery" element={<AvailableOrders />} />
          <Route path="/delivery/my" element={<MyOrders />} />

        </Routes>

      </BrowserRouter>

    </AuthProvider>

  )

}

export default App