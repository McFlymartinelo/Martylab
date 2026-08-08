import type {
  PushPublicKeyResponse,
  PushStatusResponse,
  PushSubscribeRequest,
  PushSubscribeResponse,
} from "@martylab/shared";
import { apiGet, apiPost, apiPostVoid } from "@/lib/api-client";

export function fetchPushPublicKey() {
  return apiGet<PushPublicKeyResponse>("/api/push/public-key");
}

export function fetchPushStatus() {
  return apiGet<PushStatusResponse>("/api/push/status");
}

export function subscribePush(body: PushSubscribeRequest) {
  return apiPost<PushSubscribeResponse>("/api/push/subscribe", body);
}

export function unsubscribePush(endpoint: string) {
  return apiPost<void>("/api/push/unsubscribe", { endpoint });
}

export function sendPushTest() {
  return apiPostVoid("/api/push/test");
}
