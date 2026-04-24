import { useEffect, useState } from "react"
import { useAuth } from "../../context/AuthContext"
import { API } from "../../services/api"
import { Package, Trash2, Plus, Search, DollarSign, Loader2 } from "lucide-react"

export default function ProductsManager() {
  const { user } = useAuth()
  const storeId = user.store_id
  const [products, setProducts] = useState([])
  const [name, setName] = useState("")
  const [price, setPrice] = useState("")
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => { if (storeId) loadProducts() }, [storeId])

  async function loadProducts() {
    try {
      const res = await fetch(`${API}/products/store/${storeId}`)
      const data = await res.json()
      setProducts(Array.isArray(data) ? data : [])
    } finally {
      setLoading(false)
    }
  }

  async function createProduct(e) {
    if (e) e.preventDefault()
    if (!name || !price) return
    setCreating(true)
    try {
      await fetch(`${API}/products`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, price: Number(price), store_id: storeId })
      })
      setName(""); setPrice("")
      await loadProducts()
    } finally {
      setCreating(false)
    }
  }

  async function deleteProduct(id) {
    if (!confirm("¿Estás seguro de que deseas eliminar este producto?")) return
    await fetch(`${API}/products/${id}`, { method: "DELETE" })
    await loadProducts()
  }

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div>
      <div className="page-header" style={{ marginBottom: 32 }}>
        <div>
          <h2>Inventario de Productos</h2>
          <p style={{ marginTop: 4 }}>Administra el catálogo de tu tienda</p>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <div style={{ position: "relative" }}>
            <Search size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-3)" }} />
            <input 
              placeholder="Buscar productos..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{ width: 240, paddingLeft: 40, margin: 0 }}
            />
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 32 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {loading ? (
            <div className="empty">
              <Loader2 className="empty-icon" style={{ animation: "spin 2s linear infinite" }} />
              <p>Cargando inventario…</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="empty">
              <Package className="empty-icon" size={48} />
              <p>{searchTerm ? "No se encontraron productos con ese nombre" : "Aún no has agregado productos a tu tienda"}</p>
            </div>
          ) : (
            <div className="card" style={{ padding: 0 }}>
              <div style={{ 
                display: "grid", 
                gridTemplateColumns: "1fr 120px 80px", 
                padding: "12px 24px", 
                borderBottom: "1px solid var(--border)",
                fontSize: 12,
                fontWeight: 700,
                color: "var(--text-3)",
                textTransform: "uppercase",
                letterSpacing: "0.05em"
              }}>
                <div>Producto</div>
                <div>Precio</div>
                <div style={{ textAlign: "right" }}>Acciones</div>
              </div>
              <div style={{ display: "flex", flexDirection: "column" }}>
                {filteredProducts.map(p => (
                  <div key={p.id} style={{ 
                    display: "grid", 
                    gridTemplateColumns: "1fr 120px 80px", 
                    alignItems: "center",
                    padding: "16px 24px", 
                    borderBottom: "1px solid var(--border)" 
                  }}>
                    <div style={{ fontWeight: 600 }}>{p.name}</div>
                    <div style={{ color: "var(--text-2)", fontFamily: "var(--mono)" }}>${p.price.toLocaleString()}</div>
                    <div style={{ textAlign: "right" }}>
                      <button 
                        onClick={() => deleteProduct(p.id)} 
                        className="btn-danger" 
                        style={{ padding: 8, background: "none", border: "none" }}
                        title="Eliminar producto"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div style={{ position: "sticky", top: 96 }}>
          <div className="card">
            <h3 style={{ marginBottom: 20, display: "flex", alignItems: "center", gap: 8 }}>
              <Plus size={20} /> Nuevo Producto
            </h3>
            <form onSubmit={createProduct}>
              <div className="form-group">
                <label>Nombre</label>
                <div style={{ position: "relative" }}>
                  <Package size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-3)" }} />
                  <input placeholder="Ej: Hamburguesa Doble" value={name} onChange={e => setName(e.target.value)} required style={{ paddingLeft: 40 }} />
                </div>
              </div>
              <div className="form-group">
                <label>Precio</label>
                <div style={{ position: "relative" }}>
                  <DollarSign size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-3)" }} />
                  <input type="number" placeholder="0" value={price} onChange={e => setPrice(e.target.value)} required style={{ paddingLeft: 40 }} />
                </div>
              </div>
              <button type="submit" disabled={creating || !name || !price} className="btn-primary btn-block" style={{ marginTop: 12 }}>
                {creating ? "Creando…" : (
                  <>
                    <Plus size={18} /> Agregar Producto
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
