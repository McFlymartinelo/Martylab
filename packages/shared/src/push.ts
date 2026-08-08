export interface PushPublicKeyResponse {
  configured: boolean;
  publicKey: string | null;
}

export interface PushSubscribeRequest {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export interface PushSubscribeResponse {
  subscribed: boolean;
}

export interface PushStatusResponse {
  configured: boolean;
  subscribed: boolean;
}
