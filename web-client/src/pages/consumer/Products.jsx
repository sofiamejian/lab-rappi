import { useEffect, useState } from "react"
import { getProducts } from "../../services/api"
import { useParams, useNavigate } from "react-router-dom"
 
export default function Products() {
    const { id: storeId } = useParams()
    const navigate = useNavigate()
    const [products, setProducts] = useState([])
 
    useEffect(() => {
        getProducts(storeId).then(data => {
            setProducts(Array.isArray(data) ? data : [])
        })
    }, [storeId])
 
    function addToCart(product) {
        const existing = JSON.parse(localStorage.getItem("cart")) || { storeId, items: [] }
 
        const itemIndex = existing.items.findIndex(i => i.id === product.id)
        if (itemIndex >= 0) {
            existing.items[itemIndex].quantity += 1
        } else {
            existing.items.push({ id: product.id, name: product.name, price: product.price, quantity: 1 })
        }
 
        existing.storeId = storeId
        localStorage.setItem("cart", JSON.stringify(existing))
        alert(`${product.name} added to cart`)
    }
 
    return (
        <div>
            <button onClick={() => navigate("/cart")}>View Cart</button>
 
            <div className="grid">
                {products.length === 0 && <p>No products available.</p>}
 
                {products.map(p => (
                    <div className="card" key={p.id}>
                        <h3>{p.name}</h3>
                        <p>${p.price}</p>
                        {}
                        <button onClick={() => addToCart(p)}>Add to cart</button>
                    </div>
                ))}
            </div>
        </div>
    )
}