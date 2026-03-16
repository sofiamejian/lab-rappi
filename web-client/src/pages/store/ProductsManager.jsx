import { useEffect, useState } from "react"
import { useAuth } from "../../context/AuthContext"
 
const API = "http://localhost:3000/api"
 
export default function ProductsManager() {
    const { user } = useAuth()
    const storeId = user.store_id
 
    const [products, setProducts] = useState([])
    const [name, setName] = useState("")
    const [price, setPrice] = useState("")
 
    useEffect(() => {
        if (storeId) loadProducts()
    }, [storeId])
 
    async function loadProducts() {
        const res = await fetch(`${API}/products/store/${storeId}`)
        const data = await res.json()
        setProducts(Array.isArray(data) ? data : [])
    }
 
    async function createProduct() {
        if (!name || !price) return
 
        await fetch(`${API}/products`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, price: Number(price), store_id: storeId })
        })
 
        setName("")
        setPrice("")
        await loadProducts()
    }
 
    async function deleteProduct(id) {
        await fetch(`${API}/products/${id}`, { method: "DELETE" })
        await loadProducts()
    }
 
    return (
        <div className="container">
            <h2>Manage Products</h2>
 
            <div>
                <input
                    placeholder="Product name"
                    value={name}
                    onChange={e => setName(e.target.value)}
                />
                <input
                    placeholder="Price"
                    type="number"
                    value={price}
                    onChange={e => setPrice(e.target.value)}
                />
                <button onClick={createProduct}>Create product</button>
            </div>
 
            <hr />
 
            {products.length === 0 && <p>No products yet.</p>}
 
            {products.map(p => (
                <div key={p.id}>
                    <span>{p.name}</span>
                    <span> — ${p.price}</span>
                    <button onClick={() => deleteProduct(p.id)}>Delete</button>
                </div>
            ))}
        </div>
    )
}
 