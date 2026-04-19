import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../../context/AuthContext"
import { createOrder } from "../../services/api"
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet"
import L from "leaflet"
import "leaflet/dist/leaflet.css"

// Fix default leaflet icon paths broken by bundlers
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png"
})

const destinationIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
})

// Component that listens for map clicks
function ClickHandler({ onMapClick }) {
  useMapEvents({
    click(e) {
      onMapClick({ lat: e.latlng.lat, lng: e.latlng.lng })
    }
  })
  return null
}

// Default center: Bogotá, Colombia
const DEFAULT_CENTER = [4.711, -74.0721]

export default function Cart() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [cart, setCart] = useState(null)
  const [destination, setDestination] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("cart"))
    setCart(stored)
  }, [])

  function removeItem(id) {
    const updated = { ...cart, items: cart.items.filter(i => i.id !== id) }
    setCart(updated)
    localStorage.setItem("cart", JSON.stringify(updated))
  }

  async function handleCreateOrder() {
    if (!cart || cart.items.length === 0) return
    if (!destination) {
      alert("Por favor selecciona un punto de entrega en el mapa")
      return
    }

    setLoading(true)
    try {
      await createOrder(
        user.id,
        cart.storeId,
        cart.items.map(i => ({ product_id: i.id, quantity: i.quantity, unit_price: i.price })),
        destination
      )
      localStorage.removeItem("cart")
      navigate("/orders")
    } catch (err) {
      alert("Error al crear el pedido")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="container">
        <h2>Tu carrito</h2>
        <p>Tu carrito está vacío.</p>
      </div>
    )
  }

  const total = cart.items.reduce((sum, i) => sum + i.price * i.quantity, 0)

  return (
    <div className="container" style={{ maxWidth: 700 }}>
      <h2>Tu carrito</h2>

      {cart.items.map(item => (
        <div key={item.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid #eee" }}>
          <span>{item.name} x{item.quantity} — ${item.price * item.quantity}</span>
          <button onClick={() => removeItem(item.id)} style={{ width: "auto", background: "#ff3d3d" }}>Eliminar</button>
        </div>
      ))}

      <p><strong>Total: ${total}</strong></p>

      <hr />
      <h3>📍 Selecciona el punto de entrega</h3>
      <p style={{ color: "#666", fontSize: 14 }}>Haz clic en el mapa para indicar dónde quieres recibir tu pedido.</p>

      {destination ? (
        <p style={{ color: "green" }}>
          Destino seleccionado: {destination.lat.toFixed(5)}, {destination.lng.toFixed(5)}
        </p>
      ) : (
        <p style={{ color: "#e67e22" }}>Aún no has seleccionado un punto de entrega</p>
      )}

      <div style={{ height: 350, borderRadius: 10, overflow: "hidden", margin: "12px 0" }}>
        <MapContainer
          center={DEFAULT_CENTER}
          zoom={13}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='© <a href="https://www.openstreetmap.org">OpenStreetMap</a>'
          />
          <ClickHandler onMapClick={setDestination} />
          {destination && (
            <Marker
              position={[destination.lat, destination.lng]}
              icon={destinationIcon}
            />
          )}
        </MapContainer>
      </div>

      <button
        onClick={handleCreateOrder}
        disabled={loading || !destination}
        style={{ background: destination ? "#ff3d3d" : "#ccc" }}
      >
        {loading ? "Creando pedido..." : "Crear pedido"}
      </button>
    </div>
  )
}