import { AuthenticateUserDTO, CreateUserDTO } from './auth.types';
import Boom from '@hapi/boom';
import { supabase } from '../../config/supabase';
import { AuthResponse, AuthTokenResponsePassword } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

export const authenticateUserService = async (
  credentials: AuthenticateUserDTO
): Promise<AuthTokenResponsePassword['data']> => {

  const signInResponse = await supabase.auth.signInWithPassword({
    email: credentials.email,
    password: credentials.password,
  });

  if (signInResponse.error) {
    throw Boom.unauthorized(signInResponse.error.message);
  }

  return signInResponse.data;
};

export const createUserService = async (
  user: CreateUserDTO
): Promise<AuthResponse['data']> => {

  // Crear usuario en Auth
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

  // Insertar en tabla users
  const { error: userError } = await supabase.from('users').insert({
    id: userId,
    name: user.name,
    email: user.email,
    password: user.password,
    role: user.role,
  });

  if (userError) {
    throw Boom.badRequest(userError.message);
  }

  // Si es store crear tienda
  if (user.role === 'store') {

    if (!user.storeName) {
      throw Boom.badRequest('Store name is required');
    }

    const { error: storeError } = await supabase.from('stores').insert({
      id: uuidv4(),
      name: user.storeName,
      user_id: userId,
      is_open: false,
    });

    if (storeError) {
      throw Boom.badRequest(storeError.message);
    }
  }

  return signUpResponse.data;
};