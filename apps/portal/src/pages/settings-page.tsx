import { Bell, Download, Loader2, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useInstallPrompt } from "@/features/pwa/use-install-prompt";
import {
  usePushPublicKeyQuery,
  usePushStatusQuery,
  usePushSubscriptionMutation,
  usePushTestMutation,
  usePushUnsubscribeMutation,
} from "@/features/push/use-push-query";

export function SettingsPage() {
  const install = useInstallPrompt();
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

  return (
    <div className="space-y-6">
      <section className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Paramètres</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Installation mobile, notifications push et préférences du portail.
        </p>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Smartphone className="size-4" />
              Application mobile
            </CardTitle>
            <CardDescription>
              Installe Martylab comme PWA sur ton smartphone ou ta tablette.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {install.isInstalled ? (
              <p className="text-sm text-muted-foreground">
                Martylab est installé sur cet appareil.
              </p>
            ) : install.canInstall ? (
              <Button onClick={() => void install.promptInstall()}>
                <Download className="size-4" />
                Installer l&apos;application
              </Button>
            ) : (
              <p className="text-sm text-muted-foreground">
                Sur iOS : partage Safari → « Sur l&apos;écran d&apos;accueil ».
                Sur Android : menu du navigateur → « Installer l&apos;application »
                ou via la bannière d&apos;installation.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Bell className="size-4" />
              Notifications push
            </CardTitle>
            <CardDescription>
              Alertes Orion et Matchday envoyées en arrière-plan (toutes les 5 min).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {!pushConfigured ? (
              <p className="text-sm text-muted-foreground">
                Les notifications push ne sont pas configurées sur le serveur
                (clés VAPID manquantes).
              </p>
            ) : pushSubscribed ? (
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  disabled={pushBusy}
                  onClick={() => void testMutation.mutateAsync()}
                >
                  {testMutation.isPending ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : null}
                  Tester
                </Button>
                <Button
                  variant="destructive"
                  disabled={pushBusy}
                  onClick={() => void unsubscribeMutation.mutateAsync()}
                >
                  Désactiver
                </Button>
              </div>
            ) : (
              <Button
                disabled={pushBusy}
                onClick={() => void subscribeMutation.mutateAsync()}
              >
                {subscribeMutation.isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : null}
                Activer les notifications
              </Button>
            )}

            {subscribeMutation.error ? (
              <p className="text-sm text-destructive">
                {subscribeMutation.error.message}
              </p>
            ) : null}
            {testMutation.isSuccess ? (
              <p className="text-sm text-muted-foreground">
                Notification de test envoyée.
              </p>
            ) : null}
          </CardContent>
        </Card>
      </div>

    </div>
  );
}
