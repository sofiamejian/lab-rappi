import { Router } from "express"
import {
  createOrderController,
  getConsumerOrdersController,
  getStoreOrdersController,
  getAvailableOrdersController,
  getDeliveryOrdersController,
  updateOrderStatusController,
  updateDeliveryPositionController,
  getOrderByIdController
} from "./orders.controller"

export const router = Router()

router.post("/", createOrderController)

router.get("/available", getAvailableOrdersController)            // delivery: browse pending orders
router.get("/consumer/:consumerId", getConsumerOrdersController)  // consumer: their orders
router.get("/store/:storeId", getStoreOrdersController)           // store: incoming orders
router.get("/delivery/:deliveryId", getDeliveryOrdersController)  // delivery: their accepted orders
router.get("/:id", getOrderByIdController)                        // get single order

router.patch("/:id/status", updateOrderStatusController)          // general status update
router.patch("/:id/accept", updateOrderStatusController)          // specific accept endpoint (shares logic or can be separate)
router.patch("/:id/position", updateDeliveryPositionController)   // update delivery GPS position