import { useEffect, useState, useRef } from "react"
import { useAuth } from "../../context/AuthContext"
import { getStoreOrders } from "../../services/api"
import { supabase } from "../../services/supabaseClient"
import { RefreshCw, Package, Clock, Calendar, ShoppingBag, Loader2 } from "lucide-react"

export default function StoreOrders() {
  const { user } = useAuth()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const channelRef = useRef(null)

  useEffect(() => {
    loadOrders()
    subscribeToUpdates()
    return () => {
      if (channelRef.current) supabase.removeChannel(channelRef.current)
    }
  }, [])

  async function loadOrders() {
    try {
      setLoading(true)
      const data = await getStoreOrders(user.store_id)
      setOrders(Array.isArray(data) ? data : [])
    } finally {
      setLoading(false)
    }
  }

  function subscribeToUpdates() {
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

  const counts = {
    "Creado": orders.filter(o => o.status === "Creado").length,
    "En entrega": orders.filter(o => o.status === "En entrega").length,
    "Entregado": orders.filter(o => o.status === "Entregado").length,
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Pedidos de la Tienda</h2>
          <p style={{ marginTop: 4 }}>Monitorea y gestiona tus pedidos entrantes</p>
        </div>
        <button
          onClick={loadOrders}
          className="btn-secondary"
          style={{ padding: "8px 16px" }}
        >
          <RefreshCw size={16} /> Actualizar
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 32 }}>
        <div className="card" style={{ borderLeft: "4px solid var(--amber)" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase" }}>Nuevos</div>
          <div style={{ fontSize: 24, fontWeight: 700, marginTop: 4 }}>{counts["Creado"]}</div>
        </div>
        <div className="card" style={{ borderLeft: "4px solid var(--blue)" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase" }}>En Entrega</div>
          <div style={{ fontSize: 24, fontWeight: 700, marginTop: 4 }}>{counts["En entrega"]}</div>
        </div>
        <div className="card" style={{ borderLeft: "4px solid var(--green)" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase" }}>Entregados</div>
          <div style={{ fontSize: 24, fontWeight: 700, marginTop: 4 }}>{counts["Entregado"]}</div>
        </div>
      </div>

      {loading ? (
        <div className="empty">
          <Loader2 className="empty-icon" style={{ animation: "spin 2s linear infinite" }} />
          <p>Cargando pedidos…</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="empty">
          <ShoppingBag className="empty-icon" size={48} />
          <p>Aún no has recibido ningún pedido</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {orders.map(o => (
            <div key={o.id} className="card" style={{ 
              borderLeft: `4px solid ${
                o.status === "Entregado" ? "var(--green)" : 
                o.status === "En entrega" ? "var(--blue)" : "var(--amber)"
              }`
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    Pedido #{o.id.slice(0, 8)}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 6, color: "var(--text-2)", fontSize: 13 }}>
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

              {o.order_items && o.order_items.length > 0 && (
                <div style={{ background: "var(--bg-2)", borderRadius: "var(--radius-sm)", padding: 16 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
                    <Package size={14} /> Artículos del Pedido
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {o.order_items.map(item => (
                      <div key={item.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 14 }}>
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
