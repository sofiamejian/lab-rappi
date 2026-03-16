import Boom from "@hapi/boom"
import { supabase } from "../../config/supabase"
import { v4 as uuidv4 } from "uuid"
 
export const createOrderService = async (
  consumer_id: string,
  store_id: string,
  items: { product_id: string; quantity: number; unit_price: number }[]
) => {
  const orderId = uuidv4()
 
  const { error: orderError } = await supabase
    .from("orders")
    .insert({ id: orderId, consumer_id, store_id })
 
  if (orderError) throw Boom.badRequest(orderError.message)
 
  // ✅ insert order_items with unit_price snapshot
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
 
  if (error) throw Boom.badRequest(error.message)
  return data
}
 
export const getStoreOrdersService = async (storeId: string) => {
  const { data, error } = await supabase
    .from("orders")
    .select("*, order_items(*, products(name))")
    .eq("store_id", storeId)
 
  if (error) throw Boom.badRequest(error.message)
  return data
}
 
// ✅ available = pending orders (no delivery assigned yet)
export const getAvailableOrdersService = async () => {
  const { data, error } = await supabase
    .from("orders")
    .select("*, order_items(*, products(name))")
    .eq("status", "pending")
 
  if (error) throw Boom.badRequest(error.message)
  return data
}
 
// ✅ orders accepted by a specific delivery user
export const getDeliveryOrdersService = async (deliveryId: string) => {
  const { data, error } = await supabase
    .from("orders")
    .select("*, order_items(*, products(name))")
    .eq("delivery_id", deliveryId)
    .eq("status", "accepted")
 
  if (error) throw Boom.badRequest(error.message)
  return data
}
 
export const updateOrderStatusService = async (
  orderId: string,
  status: string,
  delivery_id?: string
) => {
  const updates: any = { status }
  if (delivery_id) updates.delivery_id = delivery_id // ✅ assign delivery user on accept
 
  const { data, error } = await supabase
    .from("orders")
    .update(updates)
    .eq("id", orderId)
 
  if (error) throw Boom.badRequest(error.message)
  return data
}