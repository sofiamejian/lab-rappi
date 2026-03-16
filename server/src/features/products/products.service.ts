import Boom from "@hapi/boom"
import { supabase } from "../../config/supabase"
import { v4 as uuidv4 } from "uuid"

export const getProductsByStoreService = async (storeId: string) => {

  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("store_id", storeId)

  if (error) {
    throw Boom.badRequest(error.message)
  }

  return data
}

export const createProductService = async (
  name: string,
  price: number,
  store_id: string
) => {

  const { data, error } = await supabase
    .from("products")
    .insert({
      id: uuidv4(),
      name,
      price,
      store_id
    })

  if (error) {
    throw Boom.badRequest(error.message)
  }

  return data
}

export const deleteProductService = async (id: string) => {
    const { error } = await supabase
        .from("products")
        .delete()
        .eq("id", id)

    if (error) throw Boom.badRequest(error.message)
}