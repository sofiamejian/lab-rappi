import { useEffect, useState, useRef, useCallback } from "react"
import { useAuth } from "../../context/AuthContext"
import { getAvailableOrders, acceptOrder, updateDeliveryPosition } from "../../services/api"
import { supabase } from "../../services/supabaseClient"
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet"
import L from "leaflet"
import "leaflet/dist/leaflet.css"

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
  const [acceptedOrder, setAcceptedOrder] = useState(null)
  const [position, setPosition] = useState(null)
  const [arrived, setArrived] = useState(false)
  const [hint, setHint] = useState("")
  const mapRef = useRef(null)
  const positionRef = useRef(null) // keep latest position for keyboard handler

  useEffect(() => {
    loadOrders()
  }, [])

  async function loadOrders() {
    const data = await getAvailableOrders()
    setOrders(Array.isArray(data) ? data : [])
  }

  async function handleAccept(order) {
    try {
      await acceptOrder(order.id, user.id)

      // Start at a default position near Bogotá (or use browser geolocation)
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
      setHint("Usa las teclas ← → ↑ ↓ para moverte en el mapa")

      // Remove from list
      setOrders(prev => prev.filter(o => o.id !== order.id))
    } catch (err) {
      alert("Error al aceptar el pedido")
      console.error(err)
    }
  }

  async function handleDecline(id) {
    try {
      await fetch(`https://lab-rappi-f8xt.vercel.app/api/orders/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "Creado" })
      })
      await loadOrders()
    } catch (err) {
      console.error(err)
    }
  }

  // Keyboard handler for movement
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
      // Update position on backend; backend checks ST_DWithin
      const result = await updateDeliveryPosition(acceptedOrder.id, newPos.lat, newPos.lng)

      // Broadcast to consumer via Supabase Realtime
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
        setHint("🎉 ¡Llegaste al destino! El pedido ha sido marcado como Entregado.")
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

  return (
    <div style={{ padding: 20, maxWidth: 900, margin: "0 auto" }}>
      <h2>Pedidos disponibles</h2>

      {/* If delivery person has accepted an order, show the map */}
      {acceptedOrder ? (
        <div>
          <div style={{
            background: arrived ? "#27ae60" : "#2980b9", color: "white",
            padding: "12px 16px", borderRadius: 10, marginBottom: 16
          }}>
            {arrived
              ? "🎉 ¡Pedido entregado!"
              : `🛵 Entregando pedido #${acceptedOrder.id.slice(0, 8)}…`
            }
          </div>

          {hint && (
            <div style={{
              background: "#f8f9fa", border: "1px solid #dee2e6",
              borderRadius: 8, padding: "10px 14px", marginBottom: 12,
              fontSize: 14, color: "#555"
            }}>
              ⌨️ {hint}
            </div>
          )}

          {/* Keyboard controls legend */}
          {!arrived && (
            <div style={{
              display: "grid", gridTemplateColumns: "repeat(3, 40px)", gap: 4,
              marginBottom: 16, justifyContent: "start"
            }}>
              {["", "↑", "", "←", "↓", "→"].map((k, i) => (
                <div key={i} style={{
                  width: 36, height: 36, background: k ? "#fff" : "transparent",
                  border: k ? "1px solid #ccc" : "none", borderRadius: 6,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 18, boxShadow: k ? "0 2px 4px rgba(0,0,0,0.1)" : "none"
                }}>{k}</div>
              ))}
            </div>
          )}

          <div style={{ height: 450, borderRadius: 12, overflow: "hidden", boxShadow: "0 4px 16px rgba(0,0,0,0.12)" }}>
            <MapContainer
              center={position ? [position.lat, position.lng] : [4.711, -74.0721]}
              zoom={17}
              style={{ height: "100%", width: "100%" }}
              ref={mapRef}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='© <a href="https://www.openstreetmap.org">OpenStreetMap</a>'
              />

              {/* Delivery person marker */}
              {position && (
                <Marker position={[position.lat, position.lng]} icon={deliveryIcon}>
                  <Popup>🛵 Tú estás aquí</Popup>
                </Marker>
              )}

              {/* Destination marker */}
              {destPos && (
                <Marker position={[destPos.lat, destPos.lng]} icon={destinationIcon}>
                  <Popup>📦 Punto de entrega</Popup>
                </Marker>
              )}
            </MapContainer>
          </div>

          {position && (
            <p style={{ fontSize: 12, color: "#999", marginTop: 6 }}>
              Posición actual: {position.lat.toFixed(6)}, {position.lng.toFixed(6)}
            </p>
          )}

          {!arrived && (
            <button
              onClick={() => { setAcceptedOrder(null); loadOrders() }}
              style={{ background: "#e74c3c", width: "auto", marginTop: 10 }}
            >
              Abandonar pedido
            </button>
          )}
          {arrived && (
            <button
              onClick={() => { setAcceptedOrder(null); setArrived(false); loadOrders() }}
              style={{ background: "#27ae60", width: "auto", marginTop: 10 }}
            >
              Ver otros pedidos
            </button>
          )}
        </div>
      ) : (
        <>
          {orders.length === 0 && (
            <p style={{ color: "#666" }}>No hay pedidos disponibles en este momento.</p>
          )}

          {orders.map(o => (
            <div key={o.id} style={{
              background: "white", borderRadius: 10, padding: 16, marginBottom: 12,
              boxShadow: "0 2px 8px rgba(0,0,0,0.08)"
            }}>
              <p style={{ margin: 0, fontWeight: 600 }}>Pedido #{o.id.slice(0, 8)}…</p>
              <p style={{ margin: "4px 0", fontSize: 13, color: "#666" }}>
                {new Date(o.created_at).toLocaleString()}
              </p>

              {o.order_items?.map(item => (
                <p key={item.id} style={{ margin: "2px 0", fontSize: 13 }}>
                  {item.products?.name} x{item.quantity} — ${item.unit_price}
                </p>
              ))}

              <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                <button
                  onClick={() => handleAccept(o)}
                  style={{ width: "auto", background: "#27ae60", padding: "8px 16px" }}
                >
                  ✅ Aceptar
                </button>
                <button
                  onClick={() => handleDecline(o.id)}
                  style={{ width: "auto", background: "#e74c3c", padding: "8px 16px" }}
                >
                  ❌ Rechazar
                </button>
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  )
}
