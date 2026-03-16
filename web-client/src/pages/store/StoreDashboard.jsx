import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { useAuth } from "../../context/AuthContext"
 
const API = "http://localhost:3000/api"
 
export default function StoreDashboard() {
    const { user } = useAuth()
    const [store, setStore] = useState(null)
    const [orders, setOrders] = useState([])
    const [name, setName] = useState("")
    const [price, setPrice] = useState("")
 
    useEffect(() => {
        async function init() {
            await loadStore()
        }
        init()
    }, [])
 
    async function loadStore() {
        // ✅ fetch the specific store for this user via user.store_id
        const res = await fetch(`${API}/stores/${user.store_id}`)
        const data = await res.json()
        setStore(data)
        await loadOrders(data.id)
    }
 
    async function loadOrders(storeId) {
        const res = await fetch(`${API}/orders/store/${storeId}`)
        const data = await res.json()
        setOrders(Array.isArray(data) ? data : [])
    }
 
    async function openStore() {
        await fetch(`${API}/stores/${store.id}/status`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ is_open: true })
        })
        await loadStore()
    }
 
    async function closeStore() {
        await fetch(`${API}/stores/${store.id}/status`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ is_open: false })
        })
        await loadStore()
    }
 
    async function createProduct(e) {
        e.preventDefault()
        if (!name || !price) return
 
        await fetch(`${API}/products`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                name,
                price: Number(price),
                store_id: store.id
            })
        })
 
        setName("")
        setPrice("")
    }
 
    if (!store) return <p>Loading store...</p>
 
    return (
        <div className="container">
            <h2>Store Dashboard</h2>
 
            {/* Store Info */}
            <div>
                <h3>Store Info</h3>
                <p>Name: {store.name}</p>
                <p>Status: {store.is_open ? "Open" : "Closed"}</p>
                <button onClick={openStore}>Open store</button>
                <button onClick={closeStore}>Close store</button>
            </div>
 
            <hr />
 
            {/* Create Product */}
            <div>
                <h3>Create Product</h3>
                <form onSubmit={createProduct}>
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
                    <button type="submit">Add Product</button>
                </form>
                {/* ✅ fixed: was using string literal instead of template literal */}
                <p>Manage Products <Link to="/store/products">Here</Link></p>
            </div>
 
            <hr />
 
            {/* Incoming Orders */}
            <div>
                <h3>Incoming Orders</h3>
                {orders.length === 0 && <p>No orders yet</p>}
                {orders.map(order => (
                    <div key={order.id} className="order">
                        <p>Order #{order.id}</p>
                        <p>Status: {order.status}</p>
                    </div>
                ))}
            </div>
        </div>
    )
}
 