const API = "https://lab-rappi-f8xt.vercel.app/api"
 
export const register = async (data) => {
    const res = await fetch(`${API}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
    })
    const result = await res.json()
    if (!res.ok) throw new Error(result.message || "Registration failed")
    return result
}
 
export const login = async (data) => {
    const res = await fetch(`${API}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
    })
    const result = await res.json()
    if (!res.ok) throw new Error(result.message || "Login failed")
    return result
}
 
export const getStores = async () => {
    const res = await fetch(`${API}/stores`)
    return res.json()
}
 
export const getProducts = async (storeId) => {
    const res = await fetch(`${API}/products/store/${storeId}`)
    return res.json()
}
 

export const getConsumerOrders = async (consumerId) => {
    const res = await fetch(`${API}/orders/consumer/${consumerId}`)
    return res.json()
}
 
export const getStoreOrders = async (storeId) => {
    const res = await fetch(`${API}/orders/store/${storeId}`)
    return res.json()
}
 

export const getAvailableOrders = async () => {
    const res = await fetch(`${API}/orders/available`)
    return res.json()
}
 

export const getMyDeliveries = async (deliveryId) => {
    const res = await fetch(`${API}/orders/delivery/${deliveryId}`)
    return res.json()
}
 
export const createOrder = async (consumer_id, store_id, items) => {
    const res = await fetch(`${API}/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ consumer_id, store_id, items })
    })
    return res.json()
}
 