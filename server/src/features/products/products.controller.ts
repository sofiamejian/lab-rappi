import { Request, Response } from "express"
import {
  getProductsByStoreService,
  createProductService
} from "./products.service"

export const getProductsController = async (
  req: Request,
  res: Response
) => {

  const { storeId } = req.params as { storeId: string }

  const products = await getProductsByStoreService(storeId)

  return res.json(products)
}

export const createProductController = async (
  req: Request,
  res: Response
) => {

  const { name, price, store_id } = req.body

  const product = await createProductService(
    name,
    price,
    store_id
  )

  return res.status(201).json(product)
}