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

// destination: { lat, lng } — optional delivery point
export const createOrder = async (consumer_id, store_id, items, destination = null) => {
  const res = await fetch(`${API}/orders`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ consumer_id, store_id, items, destination })
  })
  return res.json()
}

// Accept an order (delivery person)
export const acceptOrder = async (orderId, deliveryId) => {
  const res = await fetch(`${API}/orders/${orderId}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status: "En entrega", delivery_id: deliveryId })
  })
  return res.json()
}

// Update delivery GPS position
export const updateDeliveryPosition = async (orderId, lat, lng) => {
  const res = await fetch(`${API}/orders/${orderId}/position`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ lat, lng })
  })
  return res.json()
}

// Get single order
export const getOrderById = async (orderId) => {
  const res = await fetch(`${API}/orders/${orderId}`)
  return res.json()
}

// Mark as delivered
export const markAsDelivered = async (orderId) => {
  const res = await fetch(`${API}/orders/${orderId}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status: "Entregado" })
  })
  return res.json()
}
