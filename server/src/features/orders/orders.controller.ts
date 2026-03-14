import { Request, Response } from "express"
import {
  createOrderService,
  getConsumerOrdersService,
  getStoreOrdersService
} from "./orders.service"

export const createOrderController = async (
  req: Request,
  res: Response
) => {

  const { consumer_id, store_id } = req.body

  const order = await createOrderService(
    consumer_id,
    store_id
  )

  return res.status(201).json(order)
}

export const getConsumerOrdersController = async (
  req: Request,
  res: Response
) => {

  const { consumerId } = req.params as { consumerId: string };

  const orders = await getConsumerOrdersService(
    consumerId
  )

  return res.json(orders)
}

export const getStoreOrdersController = async (
  req: Request,
  res: Response
) => {

  const { storeId } = req.params as { storeId: string }

  const orders = await getStoreOrdersService(
    storeId
  )

  return res.json(orders)
}