import { Link, useLocation, useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { LogOut, Store, ShoppingBag, ClipboardList, Package, Truck, Zap } from "lucide-react"

export default function Navbar() {
  const { user, logoutUser } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  if (!user) return null

  function handleLogout() {
    logoutUser()
    navigate("/")
  }

  const role = user.role

  return (
    <nav className="nav">
      <Link to={role === "consumer" ? "/stores" : role === "store" ? "/store" : "/delivery"} className="nav-brand">
        <Zap size={20} fill="currentColor" />
        <span>Rappi</span>Lab
      </Link>

      <div className="nav-links">
        {role === "consumer" && (
          <>
            <Link to="/stores" className={`nav-link ${location.pathname === "/stores" ? "active" : ""}`}>
              <Store size={18} />
              <span>Tiendas</span>
            </Link>
            <Link to="/orders" className={`nav-link ${location.pathname === "/orders" ? "active" : ""}`}>
              <ClipboardList size={18} />
              <span>Pedidos</span>
            </Link>
            <Link to="/cart" className={`nav-link ${location.pathname === "/cart" ? "active" : ""}`}>
              <ShoppingBag size={18} />
              <span>Carrito</span>
            </Link>
          </>
        )}

        {role === "store" && (
          <>
            <Link to="/store" className={`nav-link ${location.pathname === "/store" ? "active" : ""}`}>
              <Package size={18} />
              <span>Dashboard</span>
            </Link>
            <Link to="/store/products" className={`nav-link ${location.pathname === "/store/products" ? "active" : ""}`}>
              <Store size={18} />
              <span>Productos</span>
            </Link>
            <Link to="/store/orders" className={`nav-link ${location.pathname === "/store/orders" ? "active" : ""}`}>
              <ClipboardList size={18} />
              <span>Pedidos</span>
            </Link>
          </>
        )}

        {role === "delivery" && (
          <>
            <Link to="/delivery" className={`nav-link ${location.pathname === "/delivery" ? "active" : ""}`}>
              <Truck size={18} />
              <span>Disponibles</span>
            </Link>
            <Link to="/delivery/my" className={`nav-link ${location.pathname === "/delivery/my" ? "active" : ""}`}>
              <Package size={18} />
              <span>Mis Entregas</span>
            </Link>
          </>
        )}

        <button onClick={handleLogout} className="nav-link" style={{ background: "none", border: "none", cursor: "pointer" }}>
          <LogOut size={18} />
          <span>Salir</span>
        </button>
      </div>
    </nav>
  )
}
