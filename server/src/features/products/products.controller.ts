import { Request, Response } from "express"
import {
  getProductsByStoreService,
  createProductService,
  deleteProductService
} from "./products.service"
 
export const getProductsController = async (req: Request, res: Response) => {
  const { storeId } = req.params as { storeId: string }
  const products = await getProductsByStoreService(storeId)
  return res.json(products)
}
 
export const createProductController = async (req: Request, res: Response) => {
  const { name, price, store_id } = req.body
  const product = await createProductService(name, price, store_id)
  return res.status(201).json(product)
}
 
export const deleteProductController = async (req: Request, res: Response) => {
  // ✅ was reading from req.body — DELETE requests should use req.params
  const { id } = req.params as { id: string }
  await deleteProductService(id)
  return res.status(200).json({ message: "Product deleted" })
}
 