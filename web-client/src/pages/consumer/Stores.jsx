import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { getStores } from "../../services/api"
import { Store, ArrowRight, Loader2 } from "lucide-react"

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

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Explorar Tiendas</h2>
          <p style={{ marginTop: 4 }}>
            {openCount} tienda{openCount !== 1 ? "s" : ""} abierta{openCount !== 1 ? "s" : ""} ahora
          </p>
        </div>
      </div>

      {loading && (
        <div className="empty">
          <Loader2 className="empty-icon" style={{ animation: "spin 2s linear infinite" }} />
          <p>Buscando las mejores tiendas para ti…</p>
          <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      {!loading && stores.length === 0 && (
        <div className="empty">
          <Store className="empty-icon" size={48} />
          <p>No hay tiendas disponibles en este momento</p>
        </div>
      )}

      <div className="grid">
        {stores.map(store => (
          <div
            key={store.id}
            className={`card ${store.is_open ? "card--accent" : ""}`}
            style={{ 
              opacity: store.is_open ? 1 : 0.6,
              display: "flex",
              flexDirection: "column",
              gap: 16
            }}
          >
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
              <div
                style={{
                  width: 48, height: 48, borderRadius: "var(--radius)",
                  background: store.is_open ? "var(--accent-lo)" : "var(--bg-2)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: store.is_open ? "var(--accent)" : "var(--text-3)"
                }}
              >
                <Store size={24} />
              </div>
              <span className={`badge ${store.is_open ? "badge-open" : "badge-closed"}`}>
                {store.is_open ? "Abierta" : "Cerrada"}
              </span>
            </div>

            <div>
              <h3 style={{ marginBottom: 4 }}>{store.name}</h3>
              <p style={{ fontSize: 13 }}>
                {store.is_open ? "Aceptando pedidos ahora" : "Cerrado temporalmente"}
              </p>
            </div>

            <button
              onClick={() => navigate(`/products/${store.id}`)}
              disabled={!store.is_open}
              className={store.is_open ? "btn-block" : "btn-secondary btn-block"}
              style={{ marginTop: "auto" }}
            >
              {store.is_open ? (
                <>
                  Ver productos <ArrowRight size={16} />
                </>
              ) : "Cerrada"}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
