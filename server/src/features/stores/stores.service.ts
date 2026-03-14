import Boom from "@hapi/boom"
import { supabase } from "../../config/supabase"

export const getStoresService = async () => {

  const { data, error } = await supabase
    .from("stores")
    .select("*")

  if (error) {
    throw Boom.badRequest(error.message)
  }

  return data
}

export const getStoreService = async (id: string) => {

  const { data, error } = await supabase
    .from("stores")
    .select("*")
    .eq("id", id)
    .single()

  if (error) {
    throw Boom.notFound("Store not found")
  }

  return data
}

export const updateStoreStatusService = async (
  id: string,
  is_open: boolean
) => {

  const { data, error } = await supabase
    .from("stores")
    .update({ is_open })
    .eq("id", id)

  if (error) {
    throw Boom.badRequest(error.message)
  }

  return data
}