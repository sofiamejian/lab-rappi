import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../../context/AuthContext"
import { createOrder } from "../../services/api"
 
export default function Cart() {
    const { user } = useAuth()
    const navigate = useNavigate()
    const [cart, setCart] = useState(null)
 
    useEffect(() => {

        const stored = JSON.parse(localStorage.getItem("cart"))
        setCart(stored)
    }, [])
 
    function removeItem(id) {
        const updated = { ...cart, items: cart.items.filter(i => i.id !== id) }
        setCart(updated)
        localStorage.setItem("cart", JSON.stringify(updated))
    }
 
    async function handleCreateOrder() {
        if (!cart || cart.items.length === 0) return
 
        
        await createOrder(
            user.id,
            cart.storeId,
            cart.items.map(i => ({ product_id: i.id, quantity: i.quantity, unit_price: i.price }))
        )
 
        localStorage.removeItem("cart")
        navigate("/orders")
    }
 
    if (!cart || cart.items.length === 0) {
        return (
            <div className="container">
                <h2>Your cart</h2>
                <p>Your cart is empty.</p>
            </div>
        )
    }
 
    const total = cart.items.reduce((sum, i) => sum + i.price * i.quantity, 0)
 
    return (
        <div className="container">
            <h2>Your cart</h2>
 
            {cart.items.map(item => (
                <div key={item.id}>
                    <span>{item.name} x{item.quantity} — ${item.price * item.quantity}</span>
                    <button onClick={() => removeItem(item.id)}>Remove</button>
                </div>
            ))}
 
            <p>Total: ${total}</p>
            <button onClick={handleCreateOrder}>Create order</button>
        </div>
    )
}