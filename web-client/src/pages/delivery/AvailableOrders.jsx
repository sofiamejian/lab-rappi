import { useEffect, useState } from "react"
import { getOrders } from "../../services/api"

export default function AvailableOrders() {

    const [orders, setOrders] = useState([])

    useEffect(() => {
        getOrders().then(setOrders)
    }, [])

    return (
        <div>

            <h2>Available orders</h2>

            {orders.map(o => (
                <div key={o.id}>

                    Order {o.id}

                    <button>Accept</button>
                    <button>Decline</button>

                </div>
            ))}

        </div>
    )

}