import { useEffect, useState } from "react"
import { useAuth } from "../../context/AuthContext"
 
const API = "https://lab-rappi-f8xt.vercel.app/api"
 
export default function AvailableOrders() {
    const { user } = useAuth()
    const [orders, setOrders] = useState([])
 
    useEffect(() => {
        loadOrders()
    }, [])
 
    async function loadOrders() {
        const res = await fetch(`${API}/orders/available`)
        const data = await res.json()
        setOrders(Array.isArray(data) ? data : [])
    }
 
    async function acceptOrder(id) {
        await fetch(`${API}/orders/${id}/status`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: "accepted", delivery_id: user.id })
        })
        await loadOrders()
    }
 
    async function declineOrder(id) {
        await fetch(`${API}/orders/${id}/status`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: "declined" })
        })
        await loadOrders()
    }
 
    return (
        <div>
            <h2>Available Orders</h2>
 
            {orders.length === 0 && <p>No available orders.</p>}
 
            {orders.map(o => (
                <div key={o.id}>
                    <p>Order #{o.id}</p>
                    <p>Status: {o.status}</p>
                    <p>Created: {new Date(o.created_at).toLocaleString()}</p>
 
                    {o.order_items && o.order_items.map(item => (
                        <p key={item.id}>
                            {item.products?.name} x{item.quantity} — ${item.unit_price}
                        </p>
                    ))}
 
                    <button onClick={() => acceptOrder(o.id)}>Accept</button>
                    <button onClick={() => declineOrder(o.id)}>Decline</button>
                </div>
            ))}
        </div>
    )
}
 