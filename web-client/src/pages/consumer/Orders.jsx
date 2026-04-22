import { useEffect, useState, useRef } from "react"
import { useAuth } from "../../context/AuthContext"
import { getConsumerOrders } from "../../services/api"
import { supabase } from "../../services/supabaseClient"
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import { Package, Map as MapIcon, Calendar, Clock, CheckCircle2, Truck, X, Loader2 } from "lucide-react"

// Fix default icons
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png"
})

const deliveryIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
})

const destinationIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
})

function MapPanner({ center }) {
  const map = useMap()
  useEffect(() => {
    if (center) map.panTo(center)
  }, [center, map])
  return null
}

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

export default function Orders() {
  const { user } = useAuth()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [trackingOrder, setTrackingOrder] = useState(null)
  const [deliveryPos, setDeliveryPos] = useState(null)
  const [arrived, setArrived] = useState(false)
  const channelRef = useRef(null)

  useEffect(() => {
    loadOrders()
  }, [])

  async function loadOrders() {
    try {
      const data = await getConsumerOrders(user.id)
      setOrders(Array.isArray(data) ? data : [])
    } finally {
      setLoading(false)
    }
  }

  function startTracking(order) {
    if (channelRef.current) supabase.removeChannel(channelRef.current)

    setTrackingOrder(order)
    setArrived(false)

    const pos = parseGeoPoint(order.delivery_position)
    setDeliveryPos(pos)

    const channel = supabase.channel(`order:${order.id}`)
    channel
      .on("broadcast", { event: "position_update" }, (payload) => {
        const { lat, lng, arrived: isArrived } = payload.payload
        setDeliveryPos({ lat, lng })
        if (isArrived) {
          setArrived(true)
          setOrders(prev => prev.map(o => o.id === order.id ? { ...o, status: "Entregado" } : o))
          setTrackingOrder(prev => prev ? { ...prev, status: "Entregado" } : prev)
        }
      })
      .subscribe()
    channelRef.current = channel
  }

  function stopTracking() {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current)
      channelRef.current = null
    }
    setTrackingOrder(null)
    setDeliveryPos(null)
    setArrived(false)
  }

  useEffect(() => {
    return () => {
      if (channelRef.current) supabase.removeChannel(channelRef.current)
    }
  }, [])

  if (loading) {
    return (
      <div className="empty">
        <Loader2 className="empty-icon" style={{ animation: "spin 2s linear infinite" }} />
        <p>Cargando tu historial de pedidos…</p>
      </div>
    )
  }

  return (
    <div>
      <div className="page-header">
        <h2>Mis Pedidos</h2>
      </div>

      {arrived && (
        <div style={{
          background: "var(--green-lo)", color: "var(--green)", padding: "16px",
          borderRadius: "var(--radius)", marginBottom: 24, border: "1px solid rgba(16, 185, 129, 0.2)",
          display: "flex", alignItems: "center", gap: 12
        }}>
          <CheckCircle2 size={20} />
          <div style={{ fontWeight: 600 }}>🎉 ¡Tu repartidor ha llegado!</div>
          <button onClick={() => setArrived(false)} className="nav-link" style={{ marginLeft: "auto", padding: 4 }}>
            <X size={18} />
          </button>
        </div>
      )}

      {orders.length === 0 && (
        <div className="empty">
          <Package className="empty-icon" size={48} />
          <p>Aún no has realizado ningún pedido.</p>
          <button onClick={() => navigate("/stores")} className="btn-primary" style={{ marginTop: 24 }}>
            Hacer mi primer pedido
          </button>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: trackingOrder ? "1fr 1fr" : "1fr", gap: 32 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {orders.map(o => (
            <div key={o.id} className="card" style={{ 
              borderLeft: `4px solid ${
                o.status === "Entregado" ? "var(--green)" : 
                o.status === "En entrega" ? "var(--blue)" : "var(--amber)"
              }`
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    Pedido #{o.id.slice(0, 8)}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4, color: "var(--text-2)", fontSize: 13 }}>
                    <Calendar size={14} /> {new Date(o.created_at).toLocaleDateString()}
                    <Clock size={14} style={{ marginLeft: 8 }} /> {new Date(o.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
                <span className={`badge ${
                  o.status === "Entregado" ? "badge-entregado" : 
                  o.status === "En entrega" ? "badge-entrega" : "badge-creado"
                }`}>
                  {o.status}
                </span>
              </div>

              {o.status === "En entrega" && (
                <button
                  onClick={() => trackingOrder?.id === o.id ? stopTracking() : startTracking(o)}
                  className={trackingOrder?.id === o.id ? "btn-danger btn-block" : "btn-primary btn-block"}
                >
                  {trackingOrder?.id === o.id ? (
                    <>🛑 Detener seguimiento</>
                  ) : (
                    <>
                      <MapIcon size={18} /> Ver seguimiento en vivo
                    </>
                  )}
                </button>
              )}
            </div>
          ))}
        </div>

        {trackingOrder && (
          <div style={{ position: "sticky", top: 96, height: "calc(100vh - 128px)" }}>
            <div className="card" style={{ height: "100%", display: "flex", flexDirection: "column", padding: 0, overflow: "hidden" }}>
              <div style={{ padding: "16px 24px", borderBottom: "1px solid var(--border)" }}>
                <h3 style={{ marginBottom: 4, display: "flex", alignItems: "center", gap: 8 }}>
                  <Truck size={20} className="animate-pulse" /> Seguimiento en vivo
                </h3>
                <p style={{ fontSize: 12, color: "var(--text-3)" }}>Pedido #{trackingOrder.id.slice(0, 8)}</p>
              </div>
              
              <div style={{ flex: 1 }}>
                <MapContainer
                  center={deliveryPos ? [deliveryPos.lat, deliveryPos.lng] : [4.711, -74.0721]}
                  zoom={15}
                  style={{ height: "100%", width: "100%" }}
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  />
                  {deliveryPos && (
                    <>
                      <MapPanner center={[deliveryPos.lat, deliveryPos.lng]} />
                      <Marker position={[deliveryPos.lat, deliveryPos.lng]} icon={deliveryIcon}>
                        <Popup>🛵 Tu repartidor está aquí</Popup>
                      </Marker>
                    </>
                  )}
                  {parseGeoPoint(trackingOrder.destination) && (
                    <Marker
                      position={[
                        parseGeoPoint(trackingOrder.destination).lat,
                        parseGeoPoint(trackingOrder.destination).lng
                      ]}
                      icon={destinationIcon}
                    >
                      <Popup>🏠 Punto de entrega</Popup>
                    </Marker>
                  )}
                </MapContainer>
              </div>

              {!deliveryPos && (
                <div style={{ padding: 16, textAlign: "center", color: "var(--amber)", fontSize: 13, background: "var(--amber-lo)" }}>
                  ⏳ Esperando actualización de posición del repartidor…
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .animate-pulse { animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: .5; } }
      `}</style>
    </div>
  )
}
