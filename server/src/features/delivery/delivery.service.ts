import Boom from "@hapi/boom"
import { supabase } from "../../config/supabase"

export const getAvailableOrdersService = async () => {
    const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("status", "pending") // ✅ replaces .is("delivery_id", null)

    if (error) throw Boom.badRequest(error.message)
    return data
}

export const acceptOrderService = async (orderId: string, deliveryId: string) => {
    const { data, error } = await supabase
        .from("orders")
        .update({
            delivery_id: deliveryId,
            status: "accepted" // ✅ was missing
        })
        .eq("id", orderId)

    if (error) throw Boom.badRequest(error.message)
    return data
}
