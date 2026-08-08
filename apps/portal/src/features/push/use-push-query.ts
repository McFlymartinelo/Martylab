import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchPushPublicKey,
  fetchPushStatus,
  sendPushTest,
  subscribePush,
  unsubscribePush,
} from "@/features/push/push-api";

export const pushStatusQueryKey = ["push", "status"] as const;
export const pushPublicKeyQueryKey = ["push", "public-key"] as const;

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let index = 0; index < rawData.length; index += 1) {
    outputArray[index] = rawData.charCodeAt(index);
  }

  return outputArray;
}

async function getServiceWorkerRegistration() {
  if (!("serviceWorker" in navigator)) {
    throw new Error("Service workers are not supported in this browser.");
  }

  const registration = await navigator.serviceWorker.ready;
  return registration;
}

export function usePushStatusQuery() {
  return useQuery({
    queryKey: pushStatusQueryKey,
    queryFn: fetchPushStatus,
    staleTime: 30_000,
  });
}

export function usePushPublicKeyQuery() {
  return useQuery({
    queryKey: pushPublicKeyQueryKey,
    queryFn: fetchPushPublicKey,
    staleTime: 60_000,
  });
}

export function usePushSubscriptionMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const publicKeyResponse = await fetchPushPublicKey();
      if (!publicKeyResponse.configured || !publicKeyResponse.publicKey) {
        throw new Error("Les notifications push ne sont pas configurées sur le serveur.");
      }

      if (!("Notification" in window) || !("PushManager" in window)) {
        throw new Error("Ce navigateur ne supporte pas les notifications push.");
      }

      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        throw new Error("Permission de notification refusée.");
      }

      const registration = await getServiceWorkerRegistration();
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKeyResponse.publicKey),
      });

      const json = subscription.toJSON();
      if (!json.endpoint || !json.keys?.p256dh || !json.keys.auth) {
        throw new Error("Abonnement push invalide.");
      }

      await subscribePush({
        endpoint: json.endpoint,
        keys: {
          p256dh: json.keys.p256dh,
          auth: json.keys.auth,
        },
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: pushStatusQueryKey });
    },
  });
}

export function usePushUnsubscribeMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const registration = await getServiceWorkerRegistration();
      const subscription = await registration.pushManager.getSubscription();

      if (!subscription) {
        return;
      }

      await unsubscribePush(subscription.endpoint);
      await subscription.unsubscribe();
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: pushStatusQueryKey });
    },
  });
}

export function usePushTestMutation() {
  return useMutation({
    mutationFn: sendPushTest,
  });
}
