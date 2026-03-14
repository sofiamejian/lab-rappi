import { Router } from "express"
import {
  getStoresController,
  getStoreController,
  updateStoreStatusController
} from "./stores.controller"

export const router = Router()

router.get("/", getStoresController)
router.get("/:id", getStoreController)
router.patch("/:id/status", updateStoreStatusController)