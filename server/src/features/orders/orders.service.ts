import Boom from "@hapi/boom"
import { supabase } from "../../config/supabase"
import { v4 as uuidv4 } from "uuid"

export enum OrderStatus {
  Creado = "Creado",
  EnEntrega = "En entrega",
  Entregado = "Entregado"
}

export const createOrderService = async (
  consumer_id: string,
  store_id: string,
  items: { product_id: string; quantity: number; unit_price: number }[],
  destination?: { lat: number; lng: number }
) => {
  const orderId = uuidv4()

  const orderData: any = {
    id: orderId,
    consumer_id,
    store_id,
    status: OrderStatus.Creado
  }

  // Store destination as PostGIS GEOGRAPHY point
  if (destination) {
    orderData.destination = `SRID=4326;POINT(${destination.lng} ${destination.lat})`
  }

  const { error: orderError } = await supabase
    .from("orders")
    .insert(orderData)

  if (orderError) throw Boom.badRequest(orderError.message)

  const orderItems = items.map(item => ({
    id: uuidv4(),
    order_id: orderId,
    product_id: item.product_id,
    quantity: item.quantity,
    unit_price: item.unit_price
  }))

  const { error: itemsError } = await supabase
    .from("order_items")
    .insert(orderItems)

  if (itemsError) throw Boom.badRequest(itemsError.message)

  return { id: orderId }
}

export const getConsumerOrdersService = async (consumerId: string) => {
  const { data, error } = await supabase
    .from("orders")
    .select("*, order_items(*, products(name))")
    .eq("consumer_id", consumerId)
    .order("created_at", { ascending: false })

  if (error) throw Boom.badRequest(error.message)
  return data
}

export const getStoreOrdersService = async (storeId: string) => {
  const { data, error } = await supabase
    .from("orders")
    .select("*, order_items(*, products(name))")
    .eq("store_id", storeId)
    .order("created_at", { ascending: false })

  if (error) throw Boom.badRequest(error.message)
  return data
}

export const getAvailableOrdersService = async () => {
  const { data, error } = await supabase
    .from("orders")
    .select("*, order_items(*, products(name))")
    .eq("status", OrderStatus.Creado)
    .order("created_at", { ascending: false })

  if (error) throw Boom.badRequest(error.message)
  return data
}

export const getDeliveryOrdersService = async (deliveryId: string) => {
  if (!deliveryId) throw Boom.badRequest("deliveryId is required")

  const { data, error } = await supabase
    .from("orders")
    .select("*, order_items(*, products(name))")
    .eq("delivery_id", deliveryId)
    .in("status", [OrderStatus.EnEntrega, "accepted"])
    .order("created_at", { ascending: false })

  if (error) throw Boom.badRequest(error.message)
  return data
}

export const updateOrderStatusService = async (
  orderId: string,
  status: OrderStatus,
  delivery_id?: string
) => {
  const updates: any = { status }
  if (delivery_id) updates.delivery_id = delivery_id

  const { data, error } = await supabase
    .from("orders")
    .update(updates)
    .eq("id", orderId)
    .select()
    .single()

  if (error) {
    console.error("Error updating order status:", error)
    throw Boom.badRequest(`Could not update order status: ${error.message}`)
  }
  return data
}

export const updateDeliveryPositionService = async (
  orderId: string,
  lat: number,
  lng: number
) => {
  // Check if delivery arrived (ST_DWithin < 5 meters)
  const { data: orderData, error: fetchError } = await supabase
    .rpc("check_arrival_and_update_position", {
      p_order_id: orderId,
      p_lat: lat,
      p_lng: lng,
      p_threshold: 5 // meters
    })

  if (fetchError) {
    // Fallback: just update position without distance check
    const pointWkt = `SRID=4326;POINT(${lng} ${lat})`
    const { data, error } = await supabase
      .from("orders")
      .update({ delivery_position: pointWkt })
      .eq("id", orderId)
      .select()
      .single()

    if (error) throw Boom.badRequest(error.message)
    return { arrived: false, order: data }
  }

  return orderData
}

export const getOrderByIdService = async (orderId: string) => {
  const { data, error } = await supabase
    .from("orders")
    .select("*, order_items(*, products(name))")
    .eq("id", orderId)
    .single()

  if (error) throw Boom.badRequest(error.message)
  return data
}
