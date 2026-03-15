import { useEffect, useState } from "react"
import { getOrders } from "../../services/api"

export default function Orders() {

    const [orders, setOrders] = useState([])

    useEffect(() => {
        getOrders().then(setOrders)
    }, [])

    return (
        <div>

            <h2>My orders</h2>

            {orders.map(o => (
                <div key={o.id}>
                    Order {o.id} - {o.status}
                </div>
            ))}

        </div>
    )

}