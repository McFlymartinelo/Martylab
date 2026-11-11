import { Bell, BellRing, Loader2, ShieldAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  usePushPublicKeyQuery,
  usePushStatusQuery,
  usePushSubscriptionMutation,
  usePushTestMutation,
  usePushUnsubscribeMutation,
} from "@/features/push/use-push-query";

function browserPermission(): NotificationPermission | "unsupported" {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "unsupported";
  }
  return Notification.permission;
}

export function NotificationsSection() {
  const pushStatusQuery = usePushStatusQuery();
  const pushPublicKeyQuery = usePushPublicKeyQuery();
  const subscribeMutation = usePushSubscriptionMutation();
  const unsubscribeMutation = usePushUnsubscribeMutation();
  const testMutation = usePushTestMutation();

  const pushConfigured =
    pushPublicKeyQuery.data?.configured ?? pushStatusQuery.data?.configured;
  const pushSubscribed = pushStatusQuery.data?.subscribed ?? false;
  const pushBusy =
    subscribeMutation.isPending ||
    unsubscribeMutation.isPending ||
    testMutation.isPending;
  const permission = browserPermission();

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BellRing className="size-4 text-muted-foreground" />
            Notifications push
          </CardTitle>
          <CardDescription>
            Alertes Orion et Matchday envoyées en arrière-plan par le backend
            (toutes les 5 minutes par défaut).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <Badge variant={pushConfigured ? "success" : "outline"}>
              serveur : {pushConfigured ? "configuré" : "non configuré"}
            </Badge>
            <Badge variant={pushSubscribed ? "success" : "outline"}>
              appareil : {pushSubscribed ? "abonné" : "non abonné"}
            </Badge>
            <Badge variant={permission === "granted" ? "success" : "outline"}>
              navigateur :{" "}
              {permission === "unsupported"
                ? "non supporté"
                : permission === "granted"
                  ? "autorisé"
                  : permission === "denied"
                    ? "refusé"
                    : "à demander"}
            </Badge>
          </div>

          {!pushConfigured ? (
            <p className="rounded-lg border border-border bg-muted/20 px-3 py-2 text-sm text-muted-foreground">
              Les clés VAPID ne sont pas définies sur le serveur. Ajoute{" "}
              <code>VAPID_PUBLIC_KEY</code>, <code>VAPID_PRIVATE_KEY</code> et{" "}
              <code>VAPID_SUBJECT</code> dans <code>.env</code>, puis redémarre
              le backend.
            </p>
          ) : pushSubscribed ? (
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                disabled={pushBusy}
                onClick={() => void testMutation.mutateAsync()}
              >
                {testMutation.isPending ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Bell className="size-4" aria-hidden="true" />
                )}
                Envoyer un test
              </Button>
              <Button
                variant="destructive"
                disabled={pushBusy}
                onClick={() => void unsubscribeMutation.mutateAsync()}
              >
                Désactiver sur cet appareil
              </Button>
            </div>
          ) : (
            <Button
              disabled={pushBusy}
              onClick={() => void subscribeMutation.mutateAsync()}
            >
              {subscribeMutation.isPending ? (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              ) : (
                <BellRing className="size-4" aria-hidden="true" />
              )}
              Activer les notifications
            </Button>
          )}

          {subscribeMutation.error || unsubscribeMutation.error ? (
            <p className="text-sm text-destructive">
              {(subscribeMutation.error ?? unsubscribeMutation.error)?.message}
            </p>
          ) : null}
          {testMutation.isSuccess ? (
            <p className="text-sm text-muted-foreground">
              Notification de test envoyée à cet appareil.
            </p>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldAlert className="size-4 text-muted-foreground" />
            Prérequis
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-1.5 text-sm text-muted-foreground">
          <p>
            Les notifications web exigent HTTPS (ou <code>localhost</code>) et
            l&apos;application installée ou ouverte en PWA.
          </p>
          <p>
            La permission est demandée par le navigateur au moment de
            l&apos;activation, jamais à l&apos;ouverture du portail.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
