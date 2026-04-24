import { useEffect, useState, useRef, useCallback } from "react"
import { useAuth } from "../../context/AuthContext"
import { getAvailableOrders, acceptOrder, updateDeliveryPosition } from "../../services/api"
import { supabase } from "../../services/supabaseClient"
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet"
import L from "leaflet"

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

const STEP = 0.00005

// Handles both GeoJSON {type,coordinates} and WKT "POINT(lng lat)" formats
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
        // PostGIS Hex EWKB for Point 4326: 
        // [1 byte: endian] [4 bytes: type] [4 bytes: SRID] [8 bytes: lng] [8 bytes: lat]
        // Header is 18 chars. Lng is chars 18-34, Lat is chars 34-50.
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

const API = import.meta.env.VITE_API_URL || "http://localhost:3000/api"

export default function AvailableOrders() {
  const { user } = useAuth()
  const [orders, setOrders] = useState([])
  const [acceptedOrder, setAcceptedOrder] = useState(null)
  const [position, setPosition] = useState(null)
  const [arrived, setArrived] = useState(false)
  const positionRef = useRef(null)
  const channelRef = useRef(null)

  useEffect(() => { 
    loadOrders() 
    checkActiveDelivery()
  }, [])

  async function checkActiveDelivery() {
    try {
      const res = await fetch(`${API}/orders/delivery/${user.id}`)
      const data = await res.json()
      if (Array.isArray(data) && data.length > 0) {
        // Find the most recent active delivery
        const active = data.find(o => o.status === "En entrega" || o.status === "accepted")
        if (active) {
          resumeDelivery(active)
        }
      }
    } catch (err) {
      console.error("Error checking active delivery:", err)
    }
  }

  function resumeDelivery(order) {
    const pos = parseGeoPoint(order.delivery_position) || { lat: 4.711, lng: -74.0721 }
    setPosition(pos)
    positionRef.current = pos
    
    const ch = supabase.channel("order:" + order.id)
    ch.subscribe()
    channelRef.current = ch
    
    setAcceptedOrder(order)
    setArrived(false)
  }

  async function loadOrders() {
    const data = await getAvailableOrders()
    setOrders(Array.isArray(data) ? data : [])
  }

  async function handleAccept(order) {
    try {
      await acceptOrder(order.id, user.id)

      const startPos = { lat: 4.711, lng: -74.0721 }

      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const p = { lat: pos.coords.latitude, lng: pos.coords.longitude }
            setPosition(p)
            positionRef.current = p
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

      // Subscribe to broadcast channel for this order
      const ch = supabase.channel("order:" + order.id)
      ch.subscribe()
      channelRef.current = ch

      // Debug: log what destination field looks like from Supabase
      console.log("[DEBUG] order.destination raw value:", order.destination)
      setAcceptedOrder(order)
      setArrived(false)
      setOrders(prev => prev.filter(o => o.id !== order.id))
    } catch (err) {
      alert("Error al aceptar el pedido")
      console.error(err)
    }
  }

  async function handleDecline(id) {
    try {
      await fetch(API + "/orders/" + id + "/status", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "declined" })
      })
      await loadOrders()
    } catch (err) {
      console.error(err)
    }
  }

  const throttleRef = useRef(null)
  const pendingPosition = useRef(null)

  const handleKeyDown = useCallback(async (e) => {
    if (!acceptedOrder || arrived) return
    const arrowKeys = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"]
    if (!arrowKeys.includes(e.key)) return
    e.preventDefault()

    const cur = positionRef.current
    if (!cur) return

    const newPos = { lat: cur.lat, lng: cur.lng }
    if (e.key === "ArrowUp")    newPos.lat += STEP
    if (e.key === "ArrowDown")  newPos.lat -= STEP
    if (e.key === "ArrowLeft")  newPos.lng -= STEP
    if (e.key === "ArrowRight") newPos.lng += STEP

    // 1. Update UI immediately
    setPosition(newPos)
    positionRef.current = newPos
    pendingPosition.current = newPos

    // 2. Broadcast position immediately for smooth tracking
    if (channelRef.current) {
      channelRef.current.send({
        type: "broadcast",
        event: "position_update",
        payload: { lat: newPos.lat, lng: newPos.lng, arrived: false }
      })
    }

    // 3. Throttle DB update to 1s
    if (throttleRef.current) return

    throttleRef.current = setTimeout(async () => {
      try {
        const posToSend = pendingPosition.current
        const result = await updateDeliveryPosition(acceptedOrder.id, posToSend.lat, posToSend.lng)
        
        if (result?.arrived) {
          setArrived(true)
          // Broadcast final arrival
          if (channelRef.current) {
            channelRef.current.send({
              type: "broadcast",
              event: "position_update",
              payload: { lat: posToSend.lat, lng: posToSend.lng, arrived: true }
            })
          }
        }
      } catch (err) {
        console.error("Error updating position:", err)
      } finally {
        throttleRef.current = null
      }
    }, 1000)
  }, [acceptedOrder, arrived])

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [handleKeyDown])

  useEffect(() => {
    return () => {
      if (channelRef.current) supabase.removeChannel(channelRef.current)
    }
  }, [])

  // ── Active delivery view ──
  if (acceptedOrder) {
    const destPos = parseGeoPoint(acceptedOrder.destination)
    const center = position
      ? [position.lat, position.lng]
      : destPos
        ? [destPos.lat, destPos.lng]
        : [4.711, -74.0721]

    return (
      <div>
        <nav className="nav">
          <span className="nav-brand">
            <span style={{ color: "var(--accent)" }}>Rappi</span>Lab
          </span>
          <div className="nav-links">
            <a className="nav-link" href="/delivery">Disponibles</a>
            <a className="nav-link" href="/delivery/my">Mis entregas</a>
          </div>
        </nav>

        <div className="container--wide">
          <div style={{
            background: arrived ? "var(--green-lo)" : "var(--blue-lo)",
            border: "1px solid " + (arrived ? "rgba(52,211,153,0.3)" : "rgba(96,165,250,0.3)"),
            borderRadius: "var(--radius)", padding: "14px 18px",
            color: arrived ? "var(--green)" : "var(--blue)",
            fontWeight: 600, marginBottom: 16
          }}>
            {arrived
              ? "Pedido entregado exitosamente"
              : "Entregando pedido #" + acceptedOrder.id.slice(0, 8)
            }
          </div>

          {!arrived && (
            <div className="kbd-hints">
              <span>Muevete con el teclado:</span>
              <kbd style={{ fontSize: 16 }}>&#8593;</kbd>
              <kbd style={{ fontSize: 16 }}>&#8595;</kbd>
              <kbd style={{ fontSize: 16 }}>&#8592;</kbd>
              <kbd style={{ fontSize: 16 }}>&#8594;</kbd>
            </div>
          )}

          {destPos === null && (
            <div style={{
              background: "var(--amber-lo)", border: "1px solid rgba(251,191,36,0.3)",
              borderRadius: "var(--radius-sm)", padding: "10px 14px",
              fontSize: 13, color: "var(--amber)", marginBottom: 12
            }}>
              Pedido sin destino en mapa. El consumidor debe seleccionar ubicacion al crear el pedido.
            </div>
          )}

          <div className="map-wrap" style={{ height: 450 }}>
            <MapContainer
              center={center}
              zoom={17}
              style={{ height: "100%", width: "100%" }}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution="OpenStreetMap"
              />
              {position && (
                <Marker position={[position.lat, position.lng]} icon={deliveryIcon}>
                  <Popup>Tu posicion actual</Popup>
                </Marker>
              )}
              {destPos && (
                <Marker position={[destPos.lat, destPos.lng]} icon={destinationIcon}>
                  <Popup>Punto de entrega del consumidor</Popup>
                </Marker>
              )}
            </MapContainer>
          </div>

          {position && (
            <p style={{ fontSize: 12, color: "var(--text-3)", marginTop: 6 }}>
              {position.lat.toFixed(6)}, {position.lng.toFixed(6)}
            </p>
          )}

          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            {arrived ? (
              <button
                style={{ background: "var(--green-lo)", color: "var(--green)", border: "1px solid rgba(52,211,153,0.3)", width: "auto" }}
                onClick={() => { setAcceptedOrder(null); setArrived(false); loadOrders() }}
              >
                Ver otros pedidos
              </button>
            ) : (
              <button
                className="btn-danger"
                onClick={() => {
                  if (channelRef.current) supabase.removeChannel(channelRef.current)
                  setAcceptedOrder(null)
                  loadOrders()
                }}
              >
                Abandonar pedido
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  // ── Order list view ──
  return (
    <div>
      <nav className="nav">
        <span className="nav-brand">
          <span style={{ color: "var(--accent)" }}>Rappi</span>Lab
        </span>
        <div className="nav-links">
          <a className="nav-link active" href="/delivery">Disponibles</a>
          <a className="nav-link" href="/delivery/my">Mis entregas</a>
        </div>
      </nav>

      <div className="container--wide">
        <div className="page-header">
          <h2>Pedidos disponibles</h2>
          <button className="btn-secondary" onClick={loadOrders} style={{ fontSize: 13 }}>
            Actualizar
          </button>
        </div>

        {orders.length === 0 && (
          <div className="empty">
            <p>No hay pedidos disponibles ahora</p>
          </div>
        )}

        {orders.map(o => (
          <div key={o.id} className="card" style={{ marginBottom: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
              <div>
                <p style={{ fontWeight: 600, margin: 0 }}>{"Pedido #" + o.id.slice(0, 8)}</p>
                <p style={{ fontSize: 13, color: "var(--text-3)", margin: "3px 0 0" }}>
                  {new Date(o.created_at).toLocaleString()}
                </p>
              </div>
              <span className="badge badge-creado">Disponible</span>
            </div>

            {o.order_items && o.order_items.map(item => (
              <p key={item.id} style={{ margin: "3px 0", fontSize: 13, color: "var(--text-2)" }}>
                {"- " + (item.products ? item.products.name : "Producto") + " x" + item.quantity + "  $" + item.unit_price}
              </p>
            ))}

            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <button
                style={{ background: "var(--green-lo)", color: "var(--green)", border: "1px solid rgba(52,211,153,0.3)", width: "auto", padding: "8px 16px" }}
                onClick={() => handleAccept(o)}
              >
                Aceptar
              </button>
              <button className="btn-danger" style={{ width: "auto", padding: "8px 16px" }} onClick={() => handleDecline(o.id)}>
                Rechazar
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
