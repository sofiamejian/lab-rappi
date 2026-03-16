import { useEffect, useState } from "react"
import { useAuth } from "../../context/AuthContext"
 
const API = "http://localhost:3000/api"
 
export default function MyOrders() {
    const { user } = useAuth()
    const [orders, setOrders] = useState([])
 
    useEffect(() => {
        loadMyOrders()
    }, [])
 
    async function loadMyOrders() {
        // ✅ fetch orders assigned to this delivery user by their id
        const res = await fetch(`${API}/orders/delivery/${user.id}`)
        const data = await res.json()
        setOrders(Array.isArray(data) ? data : [])
    }
 
    return (
        <div>
            <h2>My Deliveries</h2>
 
            {orders.length === 0 && <p>No accepted orders yet.</p>}
 
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
                </div>
            ))}
        </div>
    )
}