const API = "http://localhost:3000/api"

export const register = async (data) => {
    const res = await fetch(`${API}/auth/register`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
    })

    const result = await res.json()

    if (!res.ok) {
        throw new Error(result.message || "Registration failed")
    }

    return result
}

export async function login(data) {

    const res = await fetch(`${API}/auth/login`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
    })

    if (!res.ok) {
        throw new Error("Login failed")
    }

    return res.json()
}

export const getStores = async () => {
    const res = await fetch(`${API}/stores`)
    return res.json()
}

export const getProducts = async (storeId) => {
    const res = await fetch(`${API}/products/store/${storeId}`)
    return res.json()
}

export const getOrders = async () => {
    const res = await fetch(`${API}/orders`)
    return res.json()
}