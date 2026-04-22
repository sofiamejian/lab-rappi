import { useEffect, useState } from "react"
import { getProducts } from "../../services/api"
import { useParams, useNavigate } from "react-router-dom"
import { ShoppingCart, Plus, Check, Package, ArrowLeft, Loader2 } from "lucide-react"

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
    if (cart?.items) {
      setCartCount(cart.items.reduce((s, i) => s + i.quantity, 0))
    }
  }

  function addToCart(product) {
    const existing = JSON.parse(localStorage.getItem("cart")) || { storeId, items: [] }
    
    // Check if cart belongs to another store
    if (existing.storeId && existing.storeId !== storeId && existing.items.length > 0) {
      if (confirm("Ya tienes productos de otra tienda. ¿Deseas vaciar el carrito para agregar este producto?")) {
        existing.items = []
        existing.storeId = storeId
      } else {
        return
      }
    }

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

  return (
    <div>
      <div className="page-header" style={{ alignItems: "flex-end" }}>
        <div>
          <button 
            onClick={() => navigate("/stores")}
            className="btn-secondary"
            style={{ marginBottom: 12, padding: "6px 12px", fontSize: 12 }}
          >
            <ArrowLeft size={14} /> Volver a tiendas
          </button>
          <h2>Productos</h2>
        </div>
        
        <button
          onClick={() => navigate("/cart")}
          className="btn-primary"
          style={{ position: "relative" }}
        >
          <ShoppingCart size={18} />
          Carrito
          {cartCount > 0 && (
            <span style={{
              position: "absolute", top: -8, right: -8,
              background: "var(--accent)", color: "white",
              fontSize: 10, padding: "2px 6px", borderRadius: 10,
              fontWeight: 700, border: "2px solid var(--bg)"
            }}>
              {cartCount}
            </span>
          )}
        </button>
      </div>

      {loading && (
        <div className="empty">
          <Loader2 className="empty-icon" style={{ animation: "spin 2s linear infinite" }} />
          <p>Cargando menú…</p>
        </div>
      )}

      {!loading && products.length === 0 && (
        <div className="empty">
          <Package className="empty-icon" size={48} />
          <p>Esta tienda no tiene productos disponibles</p>
        </div>
      )}

      <div className="grid">
        {products.map(p => (
          <div key={p.id} className="card" style={{ display: "flex", flexDirection: "column" }}>
            <div style={{
              width: "100%", height: 140, background: "var(--bg-2)",
              borderRadius: "var(--radius)", marginBottom: 16,
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "var(--text-3)"
            }}>
              <Package size={48} strokeWidth={1} />
            </div>
            
            <h3 style={{ marginBottom: 4 }}>{p.name}</h3>
            <p style={{
              fontSize: 20, fontWeight: 700,
              color: "var(--text)", marginBottom: 20
            }}>
              ${p.price.toLocaleString()}
            </p>
            
            <button
              onClick={() => addToCart(p)}
              className={added === p.id ? "btn-success btn-block" : "btn-primary btn-block"}
              style={{ marginTop: "auto" }}
            >
              {added === p.id ? (
                <>
                  <Check size={18} /> Agregado
                </>
              ) : (
                <>
                  <Plus size={18} /> Agregar
                </>
              )}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
