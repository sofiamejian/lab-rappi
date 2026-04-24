import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { useAuth } from "../../context/AuthContext"
import { API } from "../../services/api"
import { Store, ShoppingBag, Plus, ArrowRight, CheckCircle, Clock, Package, Loader2 } from "lucide-react"

export default function StoreDashboard() {
  const { user } = useAuth()
  const [store, setStore] = useState(null)
  const [orders, setOrders] = useState([])
  const [name, setName] = useState("")
  const [price, setPrice] = useState("")
  const [creating, setCreating] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadStore() }, [])

  async function loadStore() {
    try {
      const res = await fetch(`${API}/stores/${user.store_id}`)
      const data = await res.json()
      setStore(data)
      await loadOrders(data.id)
    } finally {
      setLoading(false)
    }
  }

  async function loadOrders(storeId) {
    const res = await fetch(`${API}/orders/store/${storeId}`)
    const data = await res.json()
    setOrders(Array.isArray(data) ? data : [])
  }

  async function toggleStore(open) {
    await fetch(`${API}/stores/${store.id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_open: open })
    })
    await loadStore()
  }

  async function createProduct(e) {
    e.preventDefault()
    if (!name || !price) return
    setCreating(true)
    try {
      await fetch(`${API}/products`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, price: Number(price), store_id: store.id })
      })
      setName(""); setPrice("")
      alert("Producto creado exitosamente")
      await loadStore()
    } finally {
      setCreating(false)
    }
  }

  const statusCounts = {
    "Pendientes": orders.filter(o => o.status === "Creado" || o.status === "pending").length,
    "En camino": orders.filter(o => o.status === "En entrega" || o.status === "accepted").length,
    "Entregados": orders.filter(o => o.status === "Entregado").length,
  }

  if (loading) return (
    <div className="empty">
      <Loader2 className="empty-icon" style={{ animation: "spin 2s linear infinite" }} />
      <p>Cargando panel de control…</p>
    </div>
  )

  return (
    <div>
      <div className="page-header" style={{ marginBottom: 24 }}>
        <div>
          <h2>Panel de Tienda</h2>
          <p style={{ marginTop: 4 }}>Gestiona tu negocio en tiempo real</p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 16, marginBottom: 32 }}>
        <div className="card" style={{ textAlign: "center", background: "var(--bg-2)" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase", marginBottom: 8 }}>Total Pedidos</div>
          <div style={{ fontSize: 24, fontWeight: 700 }}>{orders.length}</div>
        </div>
        <div className="card" style={{ textAlign: "center", borderLeft: "4px solid var(--amber)" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase", marginBottom: 8 }}>Pendientes</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: "var(--amber)" }}>{statusCounts["Pendientes"]}</div>
        </div>
        <div className="card" style={{ textAlign: "center", borderLeft: "4px solid var(--blue)" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase", marginBottom: 8 }}>En camino</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: "var(--blue)" }}>{statusCounts["En camino"]}</div>
        </div>
        <div className="card" style={{ textAlign: "center", borderLeft: "4px solid var(--green)" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase", marginBottom: 8 }}>Entregados</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: "var(--green)" }}>{statusCounts["Entregados"]}</div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 32 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
          {/* Status Control */}
          <div className="card" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{ 
                width: 48, height: 48, borderRadius: "var(--radius)", 
                background: store?.is_open ? "var(--green-lo)" : "var(--bg-3)",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: store?.is_open ? "var(--green)" : "var(--text-3)"
              }}>
                <Store size={24} />
              </div>
              <div>
                <h3 style={{ marginBottom: 0 }}>{store?.name || "Cargando tienda..."}</h3>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: store?.is_open ? "var(--green)" : "var(--text-3)" }}></div>
                  <span style={{ fontSize: 13, fontWeight: 500, color: store?.is_open ? "var(--green)" : "var(--text-3)" }}>
                    {store?.is_open ? "Tienda abierta" : "Tienda cerrada"}
                  </span>
                </div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              {store?.is_open ? (
                <button onClick={() => toggleStore(false)} className="btn-danger">
                  Cerrar tienda
                </button>
              ) : (
                <button onClick={() => toggleStore(true)} className="btn-success" style={{ background: "var(--green)", color: "white" }}>
                  Abrir tienda
                </button>
              )}
            </div>
          </div>

          {/* Recent Orders Table */}
          <div className="card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h3 style={{ marginBottom: 0 }}>Pedidos Recientes</h3>
              <Link to="/store/orders" className="btn-secondary" style={{ fontSize: 12, padding: "6px 12px" }}>Ver todos</Link>
            </div>

            {orders.length === 0 ? (
              <div className="empty" style={{ padding: "40px 0" }}>
                <ShoppingBag className="empty-icon" size={32} />
                <p>Aún no has recibido pedidos</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column" }}>
                {orders.slice(0, 5).map(o => (
                  <div key={o.id} style={{ 
                    display: "flex", justifyContent: "space-between", alignItems: "center", 
                    padding: "16px 0", borderBottom: "1px solid var(--border)" 
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{ color: "var(--text-3)" }}><Package size={18} /></div>
                      <div>
                        <div style={{ fontWeight: 600 }}>#{o.id.slice(0, 8)}</div>
                        <div style={{ fontSize: 12, color: "var(--text-3)" }}>{new Date(o.created_at).toLocaleTimeString()}</div>
                      </div>
                    </div>
                    <span className={`badge ${
                      o.status === "Entregado" ? "badge-entregado" : 
                      o.status === "En entrega" || o.status === "accepted" ? "badge-entrega" : "badge-creado"
                    }`}>
                      {o.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
          {/* Quick Add Product */}
          <div className="card" style={{ border: "1px solid var(--border-hi)" }}>
            <h3 style={{ marginBottom: 20, display: "flex", alignItems: "center", gap: 8 }}>
              <Plus size={20} /> Producto rápido
            </h3>
            <form onSubmit={createProduct}>
              <div className="form-group">
                <label>Nombre del producto</label>
                <input placeholder="Ej: Pizza Pepperoni" value={name} onChange={e => setName(e.target.value)} required />
              </div>
              <div className="form-group">
                <label>Precio ($)</label>
                <input type="number" placeholder="0" value={price} onChange={e => setPrice(e.target.value)} required />
              </div>
              <button type="submit" disabled={creating} className="btn-primary btn-block" style={{ marginTop: 12 }}>
                {creating ? "Creando…" : (
                  <>
                    <CheckCircle size={18} /> Crear producto
                  </>
                )}
              </button>
            </form>
            <Link to="/store/products" style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, marginTop: 16, color: "var(--text-2)" }}>
              Gestionar todos los productos <ArrowRight size={14} />
            </Link>
          </div>

          <div className="card" style={{ background: "var(--bg-2)" }}>
            <h3 style={{ marginBottom: 12 }}>Soporte</h3>
            <p style={{ fontSize: 13, color: "var(--text-3)" }}>
              Si tienes problemas con tus pedidos o la plataforma, contacta a soporte técnico.
            </p>
            <button className="btn-secondary btn-block" style={{ marginTop: 16 }}>
              Contactar ayuda
            </button>
          </div>
        </div>
      </div>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
