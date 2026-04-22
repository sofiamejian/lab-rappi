import { useEffect, useState, useRef, useCallback } from "react"
import { useAuth } from "../../context/AuthContext"
import { getAvailableOrders, acceptOrder, updateDeliveryPosition } from "../../services/api"
import { supabase } from "../../services/supabaseClient"
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import { Truck, MapPin, Navigation, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, CheckCircle2, XCircle, Package, Loader2 } from "lucide-react"

// Fix default icons
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png"
})

const deliveryIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
})

const destinationIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
})

const STEP = 0.00005 // ~5 meters per key press

function parseGeoPoint(geo) {
  if (!geo) return null
  if (typeof geo === "object" && geo.coordinates) {
    return { lat: geo.coordinates[1], lng: geo.coordinates[0] }
  }
  if (typeof geo === "string") {
    const match = geo.match(/POINT\(([^ ]+) ([^ )]+)\)/)
    if (match) return { lat: parseFloat(match[2]), lng: parseFloat(match[1]) }
  }
  return null
}

export default function AvailableOrders() {
  const { user } = useAuth()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [acceptedOrder, setAcceptedOrder] = useState(null)
  const [position, setPosition] = useState(null)
  const [arrived, setArrived] = useState(false)
  const mapRef = useRef(null)
  const positionRef = useRef(null)

  useEffect(() => {
    loadOrders()
  }, [])

  async function loadOrders() {
    try {
      setLoading(true)
      const data = await getAvailableOrders()
      setOrders(Array.isArray(data) ? data : [])
    } finally {
      setLoading(false)
    }
  }

  async function handleAccept(order) {
    try {
      await acceptOrder(order.id, user.id)
      const startPos = { lat: 4.711, lng: -74.0721 }

      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const geoPos = { lat: pos.coords.latitude, lng: pos.coords.longitude }
            setPosition(geoPos)
            positionRef.current = geoPos
          },
          () => {
            setPosition(startPos)
            positionRef.current = startPos
          }
        )
      } else {
        setPosition(startPos)
        positionRef.current = startPos
      }

      setAcceptedOrder(order)
      setArrived(false)
      setOrders(prev => prev.filter(o => o.id !== order.id))
    } catch (err) {
      alert("Error al aceptar el pedido")
    }
  }

  const handleKeyDown = useCallback(async (e) => {
    if (!acceptedOrder || arrived) return
    const arrowKeys = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"]
    if (!arrowKeys.includes(e.key)) return
    e.preventDefault()

    const cur = positionRef.current
    if (!cur) return

    let newPos = { ...cur }
    if (e.key === "ArrowUp")    newPos.lat += STEP
    if (e.key === "ArrowDown")  newPos.lat -= STEP
    if (e.key === "ArrowLeft")  newPos.lng -= STEP
    if (e.key === "ArrowRight") newPos.lng += STEP

    setPosition(newPos)
    positionRef.current = newPos

    try {
      const result = await updateDeliveryPosition(acceptedOrder.id, newPos.lat, newPos.lng)
      await supabase.channel(`order:${acceptedOrder.id}`).send({
        type: "broadcast",
        event: "position_update",
        payload: {
          lat: newPos.lat,
          lng: newPos.lng,
          arrived: result?.arrived || false
        }
      })

      if (result?.arrived) {
        setArrived(true)
      }
    } catch (err) {
      console.error("Error updating position:", err)
    }
  }, [acceptedOrder, arrived])

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [handleKeyDown])

  const destPos = acceptedOrder ? parseGeoPoint(acceptedOrder.destination) : null

  if (loading && !acceptedOrder) {
    return (
      <div className="empty">
        <Loader2 className="empty-icon" style={{ animation: "spin 2s linear infinite" }} />
        <p>Buscando pedidos disponibles…</p>
      </div>
    )
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>{acceptedOrder ? "Entrega en Curso" : "Pedidos Disponibles"}</h2>
          <p style={{ marginTop: 4 }}>
            {acceptedOrder ? `Lleva el pedido #${acceptedOrder.id.slice(0, 8)} a su destino` : "Acepta un pedido para comenzar a ganar"}
          </p>
        </div>
      </div>

      {acceptedOrder ? (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 32 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <div className={`card ${arrived ? "card--accent" : ""}`} style={{ 
              background: arrived ? "var(--green-lo)" : "var(--blue-lo)",
              borderColor: arrived ? "var(--green)" : "var(--blue)",
              display: "flex", alignItems: "center", gap: 16
            }}>
              <div style={{ 
                width: 40, height: 40, borderRadius: "50%", 
                background: "white", display: "flex", alignItems: "center", justifyContent: "center",
                color: arrived ? "var(--green)" : "var(--blue)"
              }}>
                {arrived ? <CheckCircle2 size={24} /> : <Navigation size={24} className="animate-pulse" />}
              </div>
              <div>
                <h3 style={{ marginBottom: 0, color: arrived ? "var(--green)" : "var(--blue)" }}>
                  {arrived ? "¡Pedido Entregado!" : "En camino al destino"}
                </h3>
                <p style={{ fontSize: 13, color: "var(--text-2)", marginTop: 2 }}>
                  {arrived ? "Has completado la entrega con éxito." : "Usa las flechas del teclado para moverte."}
                </p>
              </div>
            </div>

            <div style={{ height: 500, borderRadius: "var(--radius)", overflow: "hidden", border: "1px solid var(--border)", boxShadow: "var(--shadow-lg)" }}>
              <MapContainer
                center={position ? [position.lat, position.lng] : [4.711, -74.0721]}
                zoom={17}
                style={{ height: "100%", width: "100%" }}
                ref={mapRef}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                />
                {position && (
                  <Marker position={[position.lat, position.lng]} icon={deliveryIcon}>
                    <Popup>🛵 Tú</Popup>
                  </Marker>
                )}
                {destPos && (
                  <Marker position={[destPos.lat, destPos.lng]} icon={destinationIcon}>
                    <Popup>🏠 Destino</Popup>
                  </Marker>
                )}
              </MapContainer>
            </div>
          </div>

          <div style={{ position: "sticky", top: 96 }}>
            <div className="card">
              <h3 style={{ marginBottom: 20 }}>Simulador de Movimiento</h3>
              <div className="kbd-hints" style={{ marginBottom: 24 }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, width: "fit-content", margin: "0 auto" }}>
                  <div /> <kbd><ChevronUp size={16} /></kbd> <div />
                  <kbd><ChevronLeft size={16} /></kbd> <kbd><ChevronDown size={16} /></kbd> <kbd><ChevronRight size={16} /></kbd>
                </div>
              </div>
              
              <div style={{ fontSize: 12, color: "var(--text-3)", marginBottom: 24, textAlign: "center" }}>
                Usa las flechas para simular el desplazamiento del repartidor en el mapa.
              </div>

              {arrived ? (
                <button
                  onClick={() => { setAcceptedOrder(null); setArrived(false); loadOrders() }}
                  className="btn-primary btn-block"
                  style={{ background: "var(--green)", color: "white" }}
                >
                  <CheckCircle2 size={18} /> Finalizar y ver más
                </button>
              ) : (
                <button
                  onClick={() => { setAcceptedOrder(null); loadOrders() }}
                  className="btn-danger btn-block"
                >
                  <XCircle size={18} /> Abandonar pedido
                </button>
              )}
            </div>

            <div className="card" style={{ marginTop: 24, background: "var(--bg-2)" }}>
              <h3 style={{ marginBottom: 12 }}>Detalles del Cliente</h3>
              <div style={{ fontSize: 14, color: "var(--text-2)" }}>
                <p><strong>Pedido:</strong> #{acceptedOrder.id.slice(0, 8)}</p>
                <div style={{ marginTop: 12 }}>
                  {acceptedOrder.order_items?.map(item => (
                    <div key={item.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginTop: 4 }}>
                      <span>{item.quantity}x {item.products?.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid">
          {orders.length === 0 ? (
            <div className="empty" style={{ gridColumn: "1/-1" }}>
              <Truck className="empty-icon" size={48} />
              <p>No hay pedidos disponibles en este momento.</p>
            </div>
          ) : (
            orders.map(o => (
              <div key={o.id} className="card" style={{ display: "flex", flexDirection: "column" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase" }}>Pedido #{o.id.slice(0, 8)}</div>
                    <div style={{ fontSize: 13, color: "var(--text-2)", marginTop: 4 }}>{new Date(o.created_at).toLocaleTimeString()}</div>
                  </div>
                  <div style={{ width: 40, height: 40, borderRadius: "var(--radius)", background: "var(--bg-2)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--accent)" }}>
                    <Package size={20} />
                  </div>
                </div>

                <div style={{ flex: 1, marginBottom: 20 }}>
                  {o.order_items?.map(item => (
                    <div key={item.id} style={{ fontSize: 14, marginBottom: 4 }}>
                      <span style={{ fontWeight: 600 }}>{item.quantity}x</span> {item.products?.name}
                    </div>
                  ))}
                </div>

                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => handleAccept(o)} className="btn-primary btn-block">
                    Aceptar
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .animate-pulse { animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: .5; } }
      `}</style>
    </div>
  )
}
