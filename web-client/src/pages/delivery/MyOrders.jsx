import { useEffect, useState } from "react"
import { useAuth } from "../../context/AuthContext"
import { getMyDeliveries } from "../../services/api"
import { Package, Calendar, Clock, CheckCircle2, ShoppingBag, Loader2 } from "lucide-react"

export default function MyOrders() {
  const { user } = useAuth()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getMyDeliveries(user.id).then(data => {
      setOrders(Array.isArray(data) ? data : [])
      setLoading(false)
    })
  }, [user.id])

  if (loading) {
    return (
      <div className="empty">
        <Loader2 className="empty-icon" style={{ animation: "spin 2s linear infinite" }} />
        <p>Cargando tu historial de entregas…</p>
      </div>
    )
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Mis Entregas</h2>
          <p style={{ marginTop: 4 }}>Historial de pedidos gestionados por ti</p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 32 }}>
        <div className="card" style={{ borderLeft: "4px solid var(--green)" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase" }}>Total Entregados</div>
          <div style={{ fontSize: 24, fontWeight: 700, marginTop: 4 }}>{orders.filter(o => o.status === "Entregado").length}</div>
        </div>
        <div className="card" style={{ borderLeft: "4px solid var(--blue)" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase" }}>En Proceso</div>
          <div style={{ fontSize: 24, fontWeight: 700, marginTop: 4 }}>{orders.filter(o => o.status === "En entrega").length}</div>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="empty">
          <ShoppingBag className="empty-icon" size={48} />
          <p>Aún no has realizado ninguna entrega.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {orders.map(o => (
            <div key={o.id} className="card" style={{ 
              borderLeft: `4px solid ${o.status === "Entregado" ? "var(--green)" : "var(--blue)"}`
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
                <span className={`badge ${o.status === "Entregado" ? "badge-entregado" : "badge-entrega"}`}>
                  {o.status}
                </span>
              </div>

              {o.order_items && o.order_items.length > 0 && (
                <div style={{ background: "var(--bg-2)", borderRadius: "var(--radius-sm)", padding: 12 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
                    <Package size={14} /> Detalles del Pedido
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    {o.order_items.map(item => (
                      <div key={item.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                        <span>
                          <span style={{ fontWeight: 600 }}>{item.quantity}x</span> {item.products?.name || "Producto"}
                        </span>
                        <span style={{ color: "var(--text-2)", fontFamily: "var(--mono)" }}>${item.unit_price.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
