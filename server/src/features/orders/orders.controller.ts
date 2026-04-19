import { Request, Response } from "express"
import {
  createOrderService,
  getConsumerOrdersService,
  getStoreOrdersService,
  getAvailableOrdersService,
  getDeliveryOrdersService,
  updateOrderStatusService,
  updateDeliveryPositionService,
  getOrderByIdService,
  OrderStatus
} from "./orders.service"
 
export const createOrderController = async (req: Request, res: Response) => {
  const { consumer_id, store_id, items, destination } = req.body
  const order = await createOrderService(consumer_id, store_id, items, destination)
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
 
export const getAvailableOrdersController = async (req: Request, res: Response) => {
  const orders = await getAvailableOrdersService()
  return res.json(orders)
}
 
export const getDeliveryOrdersController = async (req: Request, res: Response) => {
  const { deliveryId } = req.params as { deliveryId: string }
  const orders = await getDeliveryOrdersService(deliveryId)
  return res.json(orders)
}
 
export const updateOrderStatusController = async (req: Request, res: Response) => {
  const { id } = req.params as { id: string }
  const { status, delivery_id } = req.body
  const order = await updateOrderStatusService(id, status as OrderStatus, delivery_id)
  return res.json(order)
}
 
// New: update delivery position (called on every keyboard move)
export const updateDeliveryPositionController = async (req: Request, res: Response) => {
  const { id } = req.params as { id: string }
  const { lat, lng } = req.body
  if (typeof lat !== "number" || typeof lng !== "number") {
    return res.status(400).json({ message: "lat and lng are required numbers" })
  }
  const result = await updateDeliveryPositionService(id, lat, lng)
  return res.json(result)
}
 
// New: get single order by id
export const getOrderByIdController = async (req: Request, res: Response) => {
  const { id } = req.params as { id: string }
  const order = await getOrderByIdService(id)
  return res.json(order)
}