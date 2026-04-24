import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { getStores } from "../../services/api"

export default function Stores() {
  const [stores, setStores] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    getStores().then(data => {
      setStores(Array.isArray(data) ? data : [])
      setLoading(false)
    })
  }, [])

  const openCount = stores.filter(s => s.is_open).length
  const subtitle = openCount === 1 ? "1 tienda abierta ahora" : `${openCount} tiendas abiertas ahora`

  return (
    <div>
      <nav className="nav">
        <span className="nav-brand">
          <span style={{ color: "var(--accent)" }}>Rappi</span>Lab
        </span>
        <div className="nav-links">
          <a className="nav-link active" href="/stores">Tiendas</a>
          <a className="nav-link" href="/orders">Mis pedidos</a>
          <a className="nav-link" href="/cart">Carrito</a>
        </div>
      </nav>

      <div className="container--wide">
        <div className="page-header">
          <div>
            <h2>Tiendas</h2>
            <p style={{ fontSize: 14, marginTop: 2 }}>{subtitle}</p>
          </div>
        </div>

        {loading && (
          <div className="empty">
            <p>Cargando tiendas...</p>
          </div>
        )}

        {!loading && stores.length === 0 && (
          <div className="empty">
            <p>No hay tiendas disponibles</p>
          </div>
        )}

        <div className="grid">
          {stores.map(store => (
            <div
              key={store.id}
              className={"card" + (store.is_open ? " card--accent" : "")}
              style={{ opacity: store.is_open ? 1 : 0.55 }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: "var(--radius-sm)",
                  background: store.is_open ? "var(--accent-lo)" : "var(--bg-3)",
                  display: "flex", alignItems: "center", justifyContent: "center"
                }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                    stroke={store.is_open ? "var(--accent)" : "var(--text-3)"}
                    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
                    <polyline points="9 22 9 12 15 12 15 22"/>
                  </svg>
                </div>
                <span className={"badge " + (store.is_open ? "badge-open" : "badge-closed")}>
                  {store.is_open ? "Abierta" : "Cerrada"}
                </span>
              </div>

              <h3 style={{ marginBottom: 4 }}>{store.name}</h3>
              <p style={{ fontSize: 13, marginBottom: 16 }}>
                {store.is_open ? "Aceptando pedidos ahora" : "No disponible en este momento"}
              </p>

              <button
                onClick={() => navigate("/products/" + store.id)}
                disabled={!store.is_open}
                className={store.is_open ? "" : "btn-secondary"}
                style={{ width: "100%", padding: "10px 0" }}
              >
                {store.is_open ? "Ver productos" : "Cerrada"}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
