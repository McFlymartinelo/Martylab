# Sauvegarde PostgreSQL

Martylab stocke ses données dans le volume Docker `martylab_postgres_data`.
Une sauvegarde régulière est recommandée.

## Sauvegarde manuelle

Depuis la racine du dépôt sur le serveur Debian :

```bash
chmod +x scripts/backup-postgres.sh
./scripts/backup-postgres.sh
```

Le fichier est écrit dans `backups/martylab-postgres-YYYYMMDD-HHMMSS.sql.gz`.

## Restauration

```bash
gunzip -c backups/martylab-postgres-YYYYMMDD-HHMMSS.sql.gz \
  | docker compose exec -T postgres psql \
      -U martylab \
      -d martylab
```

**Attention :** la restauration écrase les données existantes. Arrête le
trafic ou mets Martylab en maintenance avant une restauration complète.

## Automatisation (cron)

Exemple — sauvegarde quotidienne à 3h :

```cron
0 3 * * * cd /chemin/vers/Martylab && ./scripts/backup-postgres.sh /var/backups/martylab
```

Conserve plusieurs copies et teste une restauration de temps en temps.
