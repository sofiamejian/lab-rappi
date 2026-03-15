import { useState } from "react"
import { register } from "../services/api"

export default function Register() {

    const [role, setRole] = useState("consumer")
    const [form, setForm] = useState({})

    function handleChange(e) {
        setForm({ ...form, [e.target.name]: e.target.value })
    }

    async function handleSubmit(e) {
        e.preventDefault()

        try {

            await register({ ...form, role })

            alert("User registered successfully!")

        } catch (err) {

            alert(err.message)

        }

    }

    return (
        <div className="container">

            <h2>Register</h2>

            <form onSubmit={handleSubmit}>

                <input name="name" placeholder="Name" onChange={handleChange} />
                <input name="email" placeholder="Email" onChange={handleChange} />
                <input name="password" type="password" placeholder="Password" onChange={handleChange} />

                <select onChange={e => setRole(e.target.value)}>

                    <option value="consumer">Consumer</option>
                    <option value="store">Store</option>
                    <option value="delivery">Delivery</option>

                </select>

                {role === "store" && (
                    <input name="store_name" placeholder="Store Name" onChange={handleChange} />
                )}

                <button>Register</button>

            </form>

        </div>
    )
}