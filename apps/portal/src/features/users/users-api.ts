import type {
  CreateUserRequest,
  UpdateUserRequest,
  User,
  UsersResponse,
} from "@martylab/shared";
import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/api-client";

export function fetchUsers(): Promise<UsersResponse> {
  return apiGet<UsersResponse>("/api/users");
}

export function createUser(body: CreateUserRequest): Promise<{ user: User }> {
  return apiPost<{ user: User }>("/api/users", body);
}

export function updateUser(
  userId: string,
  body: UpdateUserRequest,
): Promise<{ user: User }> {
  return apiPatch<{ user: User }>(`/api/users/${userId}`, body);
}

export function deleteUser(userId: string): Promise<void> {
  return apiDelete(`/api/users/${userId}`);
}
