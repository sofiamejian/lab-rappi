import { Request, Response } from "express"
import {
  createOrderService,
  getConsumerOrdersService,
  getStoreOrdersService,
  getAvailableOrdersService,
  getDeliveryOrdersService,
  updateOrderStatusService
} from "./orders.service"
 
export const createOrderController = async (req: Request, res: Response) => {
  const { consumer_id, store_id, items } = req.body
  const order = await createOrderService(consumer_id, store_id, items)
  return res.status(201).json(order)
}
 
export const getConsumerOrdersController = async (req: Request, res: Response) => {
  const { consumerId } = req.params as { consumerId: string }
  const orders = await getConsumerOrdersService(consumerId)
  return res.json(orders)
}
 
export const getStoreOrdersController = async (req: Request, res: Response) => {
  const { storeId } = req.params as { storeId: string }
  const orders = await getStoreOrdersService(storeId)
  return res.json(orders)
}
 
// ✅ new: pending orders for delivery users to browse
export const getAvailableOrdersController = async (req: Request, res: Response) => {
  const orders = await getAvailableOrdersService()
  return res.json(orders)
}
 
// ✅ new: accepted orders for a specific delivery user
export const getDeliveryOrdersController = async (req: Request, res: Response) => {
  const { deliveryId } = req.params as { deliveryId: string }
  const orders = await getDeliveryOrdersService(deliveryId)
  return res.json(orders)
}
 
// ✅ new: accept or decline an order
export const updateOrderStatusController = async (req: Request, res: Response) => {
  const { id } = req.params as { id: string }
  const { status, delivery_id } = req.body
  const order = await updateOrderStatusService(id, status, delivery_id)
  return res.json(order)
}