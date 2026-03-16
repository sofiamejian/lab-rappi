import { Router } from "express"
import {
  getProductsController,
  createProductController, deleteProductController
} from "./products.controller"

export const router = Router()

router.get("/store/:storeId", getProductsController)
router.post("/", createProductController)
router.delete("/:id", deleteProductController)