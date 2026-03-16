import { useEffect, useState } from "react"
import { useAuth } from "../../context/AuthContext"
import { getConsumerOrders } from "../../services/api"
 
export default function Orders() {
    const { user } = useAuth()
    const [orders, setOrders] = useState([])
 
    useEffect(() => {
        
        getConsumerOrders(user.id).then(data => {
            setOrders(Array.isArray(data) ? data : [])
        })
    }, [])
 
    return (
        <div>
            <h2>My Orders</h2>
 
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
 