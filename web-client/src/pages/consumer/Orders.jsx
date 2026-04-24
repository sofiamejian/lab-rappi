import { useEffect, useState, useRef } from "react"
import { useAuth } from "../../context/AuthContext"
import { getConsumerOrders } from "../../services/api"
import { supabase } from "../../services/supabaseClient"
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet"
import L from "leaflet"

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

// Pan map to new position
function MapPanner({ center }) {
  const map = useMap()
  useEffect(() => {
    if (center && isFinite(center[0]) && isFinite(center[1])) {
      map.panTo(center)
    }
  }, [center, map])
  return null
}

const STATUS_COLORS = {
  "Creado": "#f39c12",
  "En entrega": "#2980b9",
  "Entregado": "#27ae60"
}

function parseGeoPoint(geo) {
  if (!geo) return null
  
  // 1. Handle GeoJSON object
  if (typeof geo === "object") {
    if (Array.isArray(geo.coordinates)) {
      return { lat: geo.coordinates[1], lng: geo.coordinates[0] }
    }
    return geo // already {lat, lng}
  }

  if (typeof geo === "string") {
    // 2. Handle Hex EWKB (PostGIS default binary output)
    if (/^[0-9A-F]+$/i.test(geo) && geo.length >= 50) {
      try {
        const lonHex = geo.slice(18, 34);
        const latHex = geo.slice(34, 50);
        const hexToDouble = (h) => {
          const bytes = new Uint8Array(h.match(/.{1,2}/g).map(b => parseInt(b, 16)).reverse());
          return new DataView(bytes.buffer).getFloat64(0);
        };
        return { lng: hexToDouble(lonHex), lat: hexToDouble(latHex) };
      } catch (e) {
        console.error("Error decoding Hex point:", e);
      }
    }

    // 3. Handle WKT: POINT(lng lat)
    const wktMatch = geo.match(/POINT\s*\(\s*([-\d.]+)\s+([-\d.]+)\s*\)/i)
    if (wktMatch) {
      return { lat: parseFloat(wktMatch[2]), lng: parseFloat(wktMatch[1]) }
    }
  }
  return null
}

export default function Orders() {
  const { user } = useAuth()
  const [orders, setOrders] = useState([])
  const [trackingOrder, setTrackingOrder] = useState(null)
  const [deliveryPos, setDeliveryPos] = useState(null)
  const [arrived, setArrived] = useState(false)
  const channelRef = useRef(null)

  useEffect(() => {
    loadOrders()
  }, [])

  async function loadOrders() {
    const data = await getConsumerOrders(user.id)
    const list = Array.isArray(data) ? data : []
    setOrders(list)
  }

  function startTracking(order) {
    // Unsubscribe from previous channel
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current)
    }

    setTrackingOrder(order)
    setArrived(false)

    const pos = parseGeoPoint(order.delivery_position)
    setDeliveryPos(pos)

    // Subscribe to broadcast channel for this order
    const channel = supabase.channel(`order:${order.id}`)

    channel
      .on("broadcast", { event: "position_update" }, (payload) => {
        const { lat, lng, arrived: isArrived } = payload.payload
        setDeliveryPos({ lat, lng })

        if (isArrived) {
          setArrived(true)
          setOrders(prev => prev.map(o =>
            o.id === order.id ? { ...o, status: "Entregado" } : o
          ))
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

  const activeOrders = orders.filter(o => o.status === "En entrega")

  return (
    <div style={{ padding: 20, maxWidth: 800, margin: "0 auto" }}>
      <h2>Mis Pedidos</h2>

      {/* Arrived notification */}
      {arrived && (
        <div style={{
          background: "#27ae60", color: "white", padding: "16px 20px",
          borderRadius: 10, marginBottom: 16, fontSize: 16, fontWeight: 600,
          display: "flex", alignItems: "center", gap: 10
        }}>
          🎉 ¡Tu repartidor ha llegado! El pedido ha sido entregado.
          <button onClick={() => setArrived(false)} style={{
            marginLeft: "auto", background: "rgba(255,255,255,0.3)", border: "none",
            color: "white", cursor: "pointer", borderRadius: 6, padding: "4px 10px"
          }}>✕</button>
        </div>
      )}

      {orders.length === 0 && <p>Aún no tienes pedidos.</p>}

      {orders.map(o => {
        const dest = parseGeoPoint(o.destination)
        return (
          <div key={o.id} style={{
            background: "white", borderRadius: 10, padding: 16, marginBottom: 12,
            boxShadow: "0 2px 8px rgba(0,0,0,0.08)", border: `2px solid ${STATUS_COLORS[o.status] || "#ddd"}`
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <p style={{ margin: 0, fontWeight: 600 }}>Pedido #{o.id.slice(0, 8)}…</p>
                <p style={{ margin: "4px 0", fontSize: 13, color: "#666" }}>
                  {new Date(o.created_at).toLocaleString()}
                </p>
              </div>
              <span style={{
                background: STATUS_COLORS[o.status] || "#eee", color: "white",
                padding: "4px 12px", borderRadius: 20, fontSize: 13, fontWeight: 600
              }}>
                {o.status}
              </span>
            </div>

            {o.status === "En entrega" && (
              <button
                onClick={() => trackingOrder?.id === o.id ? stopTracking() : startTracking(o)}
                style={{
                  marginTop: 8, width: "auto", padding: "6px 14px", fontSize: 13,
                  background: trackingOrder?.id === o.id ? "#e74c3c" : "#2980b9"
                }}
              >
                {trackingOrder?.id === o.id ? "🛑 Detener seguimiento" : "🗺️ Ver en mapa"}
              </button>
            )}
          </div>
        )
      })}

      {/* Real-time tracking map */}
      {trackingOrder && (
        <div style={{ marginTop: 20 }}>
          <h3>📍 Seguimiento en tiempo real — Pedido #{trackingOrder.id.slice(0, 8)}…</h3>
          <p style={{ color: "#666", fontSize: 13 }}>
            La posición del repartidor se actualiza automáticamente.
          </p>
          <div style={{ height: 400, borderRadius: 12, overflow: "hidden", boxShadow: "0 4px 16px rgba(0,0,0,0.12)" }}>
            <MapContainer
              center={deliveryPos ? [deliveryPos.lat, deliveryPos.lng] : [4.711, -74.0721]}
              zoom={16}
              style={{ height: "100%", width: "100%" }}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='© <a href="https://www.openstreetmap.org">OpenStreetMap</a>'
              />
              {deliveryPos && (
                <>
                  <MapPanner center={[deliveryPos.lat, deliveryPos.lng]} />
                  <Marker position={[deliveryPos.lat, deliveryPos.lng]} icon={deliveryIcon}>
                    <Popup>🛵 Repartidor aquí</Popup>
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
                  <Popup>📦 Tu dirección de entrega</Popup>
                </Marker>
              )}
            </MapContainer>
          </div>

          {!deliveryPos && (
            <p style={{ color: "#e67e22", fontSize: 13, marginTop: 8 }}>
              ⏳ Esperando que el repartidor comience a moverse…
            </p>
          )}
        </div>
      )}
    </div>
  )
}
