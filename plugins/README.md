# Plugins Martylab

Chaque plugin est un connecteur vers une application indépendante.

## Structure

```text
plugins/
  <plugin-id>/
    manifest.json
```

## manifest.json

```json
{
  "id": "orion",
  "name": "Orion",
  "version": "0.0.0",
  "capabilities": ["dashboard", "health", "actions"],
  "enabled": false
}
```

Les manifests sont chargés au démarrage du backend et exposés via `GET /api/plugins`.

Un plugin `enabled: false` apparaît dans le registre mais n'est pas encore connecté.
