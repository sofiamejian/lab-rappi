import { useEffect, useState } from "react"
import { getProducts } from "../../services/api"
import { useParams, useNavigate } from "react-router-dom"

export default function Products() {
  const { id: storeId } = useParams()
  const navigate = useNavigate()
  const [products, setProducts] = useState([])
  const [cartCount, setCartCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [added, setAdded] = useState(null)

  useEffect(() => {
    getProducts(storeId).then(data => {
      setProducts(Array.isArray(data) ? data : [])
      setLoading(false)
    })
    updateCartCount()
  }, [storeId])

  function updateCartCount() {
    const cart = JSON.parse(localStorage.getItem("cart"))
    const count = cart?.items ? cart.items.reduce((s, i) => s + i.quantity, 0) : 0
    setCartCount(count)
  }

  function addToCart(product) {
    const existing = JSON.parse(localStorage.getItem("cart")) || { storeId, items: [] }
    const idx = existing.items.findIndex(i => i.id === product.id)
    if (idx >= 0) {
      existing.items[idx].quantity += 1
    } else {
      existing.items.push({ id: product.id, name: product.name, price: product.price, quantity: 1 })
    }
    existing.storeId = storeId
    localStorage.setItem("cart", JSON.stringify(existing))
    setAdded(product.id)
    setTimeout(() => setAdded(null), 1500)
    updateCartCount()
  }

  const cartLabel = cartCount > 0 ? "Carrito (" + cartCount + ")" : "Carrito"

  return (
    <div>
      <nav className="nav">
        <span className="nav-brand">
          <span style={{ color: "var(--accent)" }}>Rappi</span>Lab
        </span>
        <div className="nav-links">
          <a className="nav-link" href="/stores">Volver</a>
          <button
            onClick={() => navigate("/cart")}
            style={{
              background: "var(--accent-lo)", color: "var(--accent)",
              border: "1px solid rgba(255,77,77,0.3)", padding: "6px 14px",
              borderRadius: "var(--radius-sm)", fontSize: 13, width: "auto"
            }}
          >
            {cartLabel}
          </button>
        </div>
      </nav>

      <div className="container--wide">
        <div className="page-header">
          <h2>Productos</h2>
        </div>

        {loading && (
          <div className="empty">
            <p>Cargando productos...</p>
          </div>
        )}

        {!loading && products.length === 0 && (
          <div className="empty">
            <p>Esta tienda no tiene productos aun</p>
          </div>
        )}

        <div className="grid">
          {products.map(p => {
            const isAdded = added === p.id
            const btnLabel = isAdded ? "Agregado" : "Agregar al carrito"
            return (
              <div key={p.id} className="card">
                <div style={{
                  width: "100%", height: 90,
                  background: "var(--bg-2)",
                  borderRadius: "var(--radius-sm)",
                  marginBottom: 14,
                  display: "flex", alignItems: "center", justifyContent: "center"
                }}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none"
                    stroke="var(--text-3)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="9" cy="21" r="1"/>
                    <circle cx="20" cy="21" r="1"/>
                    <path d="M1 1h4l2.68 13.39a2 2 0 001.99 1.61h9.72a2 2 0 001.98-1.61L23 6H6"/>
                  </svg>
                </div>

                <h3 style={{ marginBottom: 4 }}>{p.name}</h3>
                <p style={{
                  fontFamily: "var(--mono)", fontSize: 18, fontWeight: 700,
                  color: "var(--accent)", marginBottom: 16
                }}>
                  {"$" + p.price.toLocaleString()}
                </p>

                <button
                  onClick={() => addToCart(p)}
                  style={{
                    width: "100%", padding: "10px 0",
                    background: isAdded ? "var(--green-lo)" : "var(--accent)",
                    color: isAdded ? "var(--green)" : "white",
                    border: isAdded ? "1px solid rgba(52,211,153,0.3)" : "none",
                    transition: "background 0.2s, color 0.2s"
                  }}
                >
                  {btnLabel}
                </button>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}