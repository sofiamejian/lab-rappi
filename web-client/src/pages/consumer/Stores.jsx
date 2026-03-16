import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { getStores } from "../../services/api"
 
export default function Stores() {
    const [stores, setStores] = useState([])
    const navigate = useNavigate()
 
    useEffect(() => {
        getStores().then(data => {
            setStores(Array.isArray(data) ? data : [])
        })
    }, [])
 
    return (
        <div className="grid">
            {stores.length === 0 && <p>No stores available.</p>}
 
            {stores.map(store => (
                <div className="card" key={store.id}>
                    <h3>{store.name}</h3>
                    <p>{store.is_open ? "Open" : "Closed"}</p>
                    {/* ✅ navigate to /products/:id on click */}
                    <button
                        onClick={() => navigate(`/products/${store.id}`)}
                        disabled={!store.is_open}
                    >
                        View products
                    </button>
                </div>
            ))}
        </div>
    )
}