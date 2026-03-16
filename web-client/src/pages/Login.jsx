import { useState, useContext } from "react"
import { login } from "../services/api"
import { AuthContext } from "../context/AuthContext"
import { useNavigate, Link } from "react-router-dom"
 
export default function Login() {
 
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const { loginUser } = useContext(AuthContext)
    const nav = useNavigate()
 
    async function handleLogin() {
        try {
            const data = await login({ email, password })
 
            
            const user = {
                id: data.id,
                email: data.email,
                role: data.role,
                store_id: data.store_id ?? null
            }
 
            loginUser(user)
 
            if (user.role === "consumer") nav("/stores")
            if (user.role === "store") nav("/store")
            if (user.role === "delivery") nav("/delivery")
 
        } catch (err) {
            alert("Invalid email or password")
            console.error(err)
        }
    }
 
    return (
        <div className="container">
            <h2>Login</h2>
 
            <input placeholder="Email" onChange={e => setEmail(e.target.value)} />
            <input type="password" placeholder="Password" onChange={e => setPassword(e.target.value)} />
 
            <button onClick={handleLogin}>Login</button>
 
            <p>
                Don't have an account? <Link to="/register">Register here</Link>
            </p>
        </div>
    )
}