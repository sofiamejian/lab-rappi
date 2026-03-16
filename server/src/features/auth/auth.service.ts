import { AuthenticateUserDTO, CreateUserDTO } from './auth.types';
import Boom from '@hapi/boom';
import { supabase } from '../../config/supabase';
import { AuthResponse } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
 
export const authenticateUserService = async (
  credentials: AuthenticateUserDTO
) => {
  const signInResponse = await supabase.auth.signInWithPassword({
    email: credentials.email,
    password: credentials.password,
  });
 
  if (signInResponse.error) {
    throw Boom.unauthorized(signInResponse.error.message);
  }
 
  const authUser = signInResponse.data.user;
 
  const { data: profile, error } = await supabase
    .from("users")
    .select("role")
    .eq("id", authUser.id)
    .single();
 
  if (error) throw Boom.badRequest(error.message);
 
  let store_id = null;
  if (profile.role === "store") {
    const { data: store, error: storeError } = await supabase
      .from("stores")
      .select("id")
      .eq("user_id", authUser.id)
      .single();
 
    if (storeError) throw Boom.badRequest(storeError.message);
    store_id = store.id;
  }
 
  // ✅ return a flat object — id at top level, not buried inside data.user
  return {
    id: authUser.id,
    email: authUser.email,
    role: profile.role,
    store_id
  };
};
 
export const createUserService = async (
  user: CreateUserDTO
): Promise<AuthResponse['data']> => {
 
  const signUpResponse = await supabase.auth.signUp({
    email: user.email,
    password: user.password,
  });
 
  if (signUpResponse.error) {
    throw Boom.badRequest(signUpResponse.error.message);
  }
 
  const authUser = signUpResponse.data.user;
 
  if (!authUser) {
    throw Boom.badRequest('User creation failed');
  }
 
  const userId = authUser.id;
 
  const { error: userError } = await supabase.from('users').insert({
    id: userId,
    name: user.name,
    email: user.email,
    password: user.password,
    role: user.role,
  });
 
  if (userError) throw Boom.badRequest(userError.message);
 
  if (user.role === 'store') {
    if (!user.storeName) throw Boom.badRequest('Store name is required');
 
    const { error: storeError } = await supabase.from('stores').insert({
      id: uuidv4(),
      name: user.storeName,
      user_id: userId,
      is_open: false,
    });
 
    if (storeError) throw Boom.badRequest(storeError.message);
  }
 
  return signUpResponse.data;
};
 