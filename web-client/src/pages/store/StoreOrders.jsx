import { useEffect, useState } from "react"
import { useAuth } from "../../context/AuthContext"
import { getStoreOrders } from "../../services/api"
 
export default function StoreOrders() {
    const { user } = useAuth()
    const [orders, setOrders] = useState([])
 
    useEffect(() => {
        getStoreOrders(user.store_id).then(data => {
            setOrders(Array.isArray(data) ? data : [])
        })
    }, [])
 
    return (
        <div>
            <h2>Incoming Orders</h2>
 
            {orders.length === 0 && <p>No orders yet.</p>}
 
            {orders.map(o => (
                <div key={o.id}>
                    <p>Order #{o.id} — {o.status}</p>
                    <p>Created: {new Date(o.created_at).toLocaleString()}</p>
                </div>
            ))}
        </div>
    )
}
 