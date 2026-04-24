export const API = import.meta.env.VITE_API_URL || "http://localhost:3000/api"

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
 
export const createOrder = async (consumer_id, store_id, items, destination = null) => {
  const res = await fetch(`${API}/orders`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ consumer_id, store_id, items, destination })
  })
  return res.json()
}
 
// ── Delivery actions ──────────────────────────────────────────────────────────
// Uses the status values the DEPLOYED backend actually accepts
export const acceptOrder = async (orderId, deliveryId) => {
  const res = await fetch(`${API}/orders/${orderId}/accept`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status: "En entrega", delivery_id: deliveryId })
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message || "Error al aceptar el pedido")
  }
  return res.json()
}
 
export const declineOrder = async (orderId) => {
  const res = await fetch(`${API}/orders/${orderId}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status: "Creado", delivery_id: null }) // Revert to Creado if declined?
  })
  return res.json()
}
 
export const updateDeliveryPosition = async (orderId, lat, lng) => {
  const res = await fetch(`${API}/orders/${orderId}/position`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ lat, lng })
  })
  // /position endpoint may not exist yet on deployed backend — handle gracefully
  if (!res.ok) return { arrived: false }
  return res.json()
}
 
export const getOrderById = async (orderId) => {
  const res = await fetch(`${API}/orders/${orderId}`)
  return res.json()
}
 
export const markAsDelivered = async (orderId) => {
  const res = await fetch(`${API}/orders/${orderId}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status: "Entregado" })
  })
  return res.json()
}
 