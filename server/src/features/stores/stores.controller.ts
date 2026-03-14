import { Request, Response } from "express"
import {
  getStoresService,
  getStoreService,
  updateStoreStatusService
} from "./stores.service"

export const getStoresController = async (
  req: Request,
  res: Response
) => {

  const stores = await getStoresService()

  return res.json(stores)
}

export const getStoreController = async (
  req: Request,
  res: Response
) => {

  const { id } = req.params as {id : string}

  if (!id) {
    return res.status(400).json({ message: "ID de tienda requerido" });
  }

  const store = await getStoreService(id)

  return res.json(store)
}

export const updateStoreStatusController = async (
  req: Request,
  res: Response
) => {

  const { id } = req.params as {id : string}
  const { is_open } = req.body

  if (!id) {
    return res.status(400).json({ message: "ID de tienda requerido" });
  }

  const store = await updateStoreStatusService(id, is_open)

  return res.json(store)
}