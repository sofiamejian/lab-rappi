import { useEffect, useState, useRef } from "react"
import { useAuth } from "../../context/AuthContext"
import { getStoreOrders } from "../../services/api"
import { supabase } from "../../services/supabaseClient"

const STATUS_CONFIG = {
  "Creado":     { color: "#f39c12", bg: "#fef9e7", label: "Creado",     emoji: "🟡" },
  "En entrega": { color: "#2980b9", bg: "#eaf4fb", label: "En entrega", emoji: "🔵" },
  "Entregado":  { color: "#27ae60", bg: "#eafaf1", label: "Entregado",  emoji: "🟢" },
  // Legacy statuses from old implementation
  "pending":    { color: "#f39c12", bg: "#fef9e7", label: "Pendiente",  emoji: "🟡" },
  "accepted":   { color: "#2980b9", bg: "#eaf4fb", label: "En entrega", emoji: "🔵" },
  "declined":   { color: "#e74c3c", bg: "#fdedec", label: "Rechazado",  emoji: "🔴" },
}

export default function StoreOrders() {
  const { user } = useAuth()
  const [orders, setOrders] = useState([])
  const channelRef = useRef(null)

  useEffect(() => {
    loadOrders()
    subscribeToUpdates()
    return () => {
      if (channelRef.current) supabase.removeChannel(channelRef.current)
    }
  }, [])

  async function loadOrders() {
    const data = await getStoreOrders(user.store_id)
    setOrders(Array.isArray(data) ? data : [])
  }

  function subscribeToUpdates() {
    // Subscribe to database changes on orders table for this store
    const channel = supabase
      .channel(`store-orders:${user.store_id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "orders",
          filter: `store_id=eq.${user.store_id}`
        },
        (payload) => {
          const updated = payload.new
          setOrders(prev =>
            prev.map(o => o.id === updated.id ? { ...o, ...updated } : o)
          )
        }
      )
      .subscribe()

    channelRef.current = channel
  }

  return (
    <div style={{ padding: 20, maxWidth: 800, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <h2 style={{ margin: 0 }}>Pedidos entrantes</h2>
        <button
          onClick={loadOrders}
          style={{ width: "auto", padding: "6px 14px", background: "#555", fontSize: 13 }}
        >
          🔄 Actualizar
        </button>
      </div>

      {/* Summary badges */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        {["Creado", "En entrega", "Entregado"].map(status => {
          const count = orders.filter(o => o.status === status).length
          const cfg = STATUS_CONFIG[status]
          return (
            <div key={status} style={{
              background: cfg.bg, border: `2px solid ${cfg.color}`, borderRadius: 10,
              padding: "8px 16px", fontSize: 14, fontWeight: 600, color: cfg.color
            }}>
              {cfg.emoji} {cfg.label}: {count}
            </div>
          )
        })}
      </div>

      {orders.length === 0 && <p style={{ color: "#666" }}>Aún no hay pedidos.</p>}

      {orders.map(o => {
        const cfg = STATUS_CONFIG[o.status] || { color: "#999", bg: "#f5f5f5", label: o.status, emoji: "⚪" }
        return (
          <div key={o.id} style={{
            background: "white", borderRadius: 10, padding: 16, marginBottom: 12,
            boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
            borderLeft: `4px solid ${cfg.color}`,
            transition: "border-color 0.3s"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <p style={{ margin: 0, fontWeight: 600, fontSize: 15 }}>
                  Pedido #{o.id.slice(0, 8)}…
                </p>
                <p style={{ margin: "4px 0 0", fontSize: 13, color: "#888" }}>
                  {new Date(o.created_at).toLocaleString()}
                </p>
              </div>
              <span style={{
                background: cfg.bg, border: `1px solid ${cfg.color}`, color: cfg.color,
                padding: "5px 12px", borderRadius: 20, fontSize: 13, fontWeight: 700,
                whiteSpace: "nowrap"
              }}>
                {cfg.emoji} {cfg.label}
              </span>
            </div>

            {o.order_items && o.order_items.length > 0 && (
              <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid #f0f0f0" }}>
                {o.order_items.map(item => (
                  <p key={item.id} style={{ margin: "2px 0", fontSize: 13, color: "#555" }}>
                    • {item.products?.name || "Producto"} × {item.quantity} — ${item.unit_price}
                  </p>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}