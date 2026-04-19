import { useEffect, useState } from "react"
import { useAuth } from "../../context/AuthContext"
import { getMyDeliveries } from "../../services/api"

export default function MyOrders() {
  const { user } = useAuth()
  const [orders, setOrders] = useState([])

  useEffect(() => {
    getMyDeliveries(user.id).then(data => {
      setOrders(Array.isArray(data) ? data : [])
    })
  }, [])

  return (
    <div style={{ padding: 20, maxWidth: 800, margin: "0 auto" }}>
      <h2>Mis entregas</h2>

      {orders.length === 0 && (
        <p style={{ color: "#666" }}>No tienes entregas aceptadas aún.</p>
      )}

      {orders.map(o => (
        <div key={o.id} style={{
          background: "white", borderRadius: 10, padding: 16, marginBottom: 12,
          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
          borderLeft: "4px solid #2980b9"
        }}>
          <p style={{ margin: 0, fontWeight: 600 }}>Pedido #{o.id.slice(0, 8)}…</p>
          <p style={{ margin: "4px 0", fontSize: 13, color: "#666" }}>
            Estado: <strong style={{ color: "#2980b9" }}>{o.status}</strong>
          </p>
          <p style={{ margin: "4px 0", fontSize: 13, color: "#666" }}>
            {new Date(o.created_at).toLocaleString()}
          </p>

          {o.order_items?.map(item => (
            <p key={item.id} style={{ margin: "2px 0", fontSize: 13, color: "#555" }}>
              • {item.products?.name} × {item.quantity} — ${item.unit_price}
            </p>
          ))}
        </div>
      ))}
    </div>
  )
}