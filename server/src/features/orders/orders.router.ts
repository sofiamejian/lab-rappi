import { Router } from "express"
import {
  createOrderController,
  getConsumerOrdersController,
  getStoreOrdersController,
  getAvailableOrdersController,
  getDeliveryOrdersController,
  updateOrderStatusController
} from "./orders.controller"
 
export const router = Router()
 
router.post("/", createOrderController)
 
router.get("/available", getAvailableOrdersController)           // delivery: browse pending orders
router.get("/consumer/:consumerId", getConsumerOrdersController) // consumer: their orders
router.get("/store/:storeId", getStoreOrdersController)          // store: incoming orders
router.get("/delivery/:deliveryId", getDeliveryOrdersController) // delivery: their accepted orders
 
router.patch("/:id/status", updateOrderStatusController)         // accept or decline
 