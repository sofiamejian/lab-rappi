import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../../context/AuthContext"
import { createOrder } from "../../services/api"
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import { Trash2, MapPin, ShoppingBag, CreditCard, AlertCircle, CheckCircle2, Loader2 } from "lucide-react"

// Fix default leaflet icon paths
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

function ClickHandler({ onMapClick }) {
  useMapEvents({
    click(e) {
      onMapClick({ lat: e.latlng.lat, lng: e.latlng.lng })
    }
  })
  return null
}

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
    if (!destination) return

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
      <div className="empty">
        <ShoppingBag className="empty-icon" size={48} />
        <h3>Tu carrito está vacío</h3>
        <p style={{ marginTop: 8 }}>Agrega algunos productos para comenzar tu pedido.</p>
        <button onClick={() => navigate("/stores")} className="btn-primary" style={{ marginTop: 24 }}>
          Ver tiendas
        </button>
      </div>
    )
  }

  const total = cart.items.reduce((sum, i) => sum + i.price * i.quantity, 0)

  return (
    <div>
      <div className="page-header">
        <h2>Tu Carrito</h2>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 32, alignItems: "start" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {/* Items Section */}
          <div className="card">
            <h3 style={{ marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
              <ShoppingBag size={20} /> Productos
            </h3>
            <div style={{ display: "flex", flexDirection: "column" }}>
              {cart.items.map(item => (
                <div key={item.id} style={{ 
                  display: "flex", 
                  justifyContent: "space-between", 
                  alignItems: "center", 
                  padding: "16px 0", 
                  borderBottom: "1px solid var(--border)" 
                }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>{item.name}</div>
                    <div style={{ fontSize: 13, color: "var(--text-3)" }}>
                      {item.quantity} x ${item.price.toLocaleString()}
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    <div style={{ fontWeight: 600 }}>${(item.price * item.quantity).toLocaleString()}</div>
                    <button 
                      onClick={() => removeItem(item.id)} 
                      className="btn-danger" 
                      style={{ padding: 8 }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Map Section */}
          <div className="card">
            <h3 style={{ marginBottom: 4, display: "flex", alignItems: "center", gap: 8 }}>
              <MapPin size={20} /> Punto de entrega
            </h3>
            <p style={{ fontSize: 13, color: "var(--text-3)", marginBottom: 16 }}>
              Haz clic en el mapa para indicar dónde quieres recibir tu pedido.
            </p>

            <div style={{ height: 300, borderRadius: "var(--radius)", overflow: "hidden", border: "1px solid var(--border)" }}>
              <MapContainer
                center={DEFAULT_CENTER}
                zoom={13}
                style={{ height: "100%", width: "100%" }}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
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
            
            {destination ? (
              <div style={{ 
                display: "flex", alignItems: "center", gap: 8, 
                marginTop: 16, color: "var(--green)", fontSize: 14, fontWeight: 500 
              }}>
                <CheckCircle2 size={16} /> Ubicación seleccionada correctamente
              </div>
            ) : (
              <div style={{ 
                display: "flex", alignItems: "center", gap: 8, 
                marginTop: 16, color: "var(--amber)", fontSize: 14, fontWeight: 500 
              }}>
                <AlertCircle size={16} /> Selecciona una ubicación en el mapa
              </div>
            )}
          </div>
        </div>

        {/* Summary Sticky Section */}
        <div style={{ position: "sticky", top: 96 }}>
          <div className="card">
            <h3 style={{ marginBottom: 20 }}>Resumen</h3>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
              <span style={{ color: "var(--text-2)" }}>Subtotal</span>
              <span>${total.toLocaleString()}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
              <span style={{ color: "var(--text-2)" }}>Envío</span>
              <span style={{ color: "var(--green)" }}>Gratis</span>
            </div>
            <hr style={{ margin: "16px 0", borderTop: "1px solid var(--border)" }} />
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 24, fontSize: 18, fontWeight: 700 }}>
              <span>Total</span>
              <span>${total.toLocaleString()}</span>
            </div>

            <button
              onClick={handleCreateOrder}
              disabled={loading || !destination}
              className="btn-primary btn-block"
              style={{ height: 48 }}
            >
              {loading ? (
                <Loader2 size={18} style={{ animation: "spin 2s linear infinite" }} />
              ) : (
                <>
                  <CreditCard size={18} /> Confirmar pedido
                </>
              )}
            </button>
            <p style={{ fontSize: 11, color: "var(--text-3)", textAlign: "center", marginTop: 16 }}>
              Al confirmar, tu pedido será enviado a la tienda para su preparación.
            </p>
          </div>
        </div>
      </div>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
