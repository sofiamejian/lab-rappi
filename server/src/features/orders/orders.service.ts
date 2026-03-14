import Boom from "@hapi/boom"
import { supabase } from "../../config/supabase"
import { v4 as uuidv4 } from "uuid"

export const createOrderService = async (
  consumer_id: string,
  store_id: string
) => {

  const { data, error } = await supabase
    .from("orders")
    .insert({
      id: uuidv4(),
      consumer_id,
      store_id
    })

  if (error) {
    throw Boom.badRequest(error.message)
  }

  return data
}

export const getConsumerOrdersService = async (
  consumerId: string
) => {

  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("consumer_id", consumerId)

  if (error) {
    throw Boom.badRequest(error.message)
  }

  return data
}

export const getStoreOrdersService = async (
  storeId: string
) => {

  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("store_id", storeId)

  if (error) {
    throw Boom.badRequest(error.message)
  }

  return data
}