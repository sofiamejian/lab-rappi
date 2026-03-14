import { Router } from "express"
import {
  createOrderController,
  getConsumerOrdersController,
  getStoreOrdersController
} from "./orders.controller"

export const router = Router()

router.post("/", createOrderController)

router.get("/consumer/:consumerId", getConsumerOrdersController)

router.get("/store/:storeId", getStoreOrdersController)