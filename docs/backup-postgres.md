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

## Vérifier une sauvegarde sans toucher à la base de production

La meilleure vérification consiste à restaurer la sauvegarde dans une base
PostgreSQL isolée, puis à contrôler que les tables et les données attendues
sont présentes. Ne restaure pas directement sur la base utilisée par Martylab
pour un test : la commande de restauration ci-dessus fusionne les données et
peut remplacer des objets existants.

Après un exercice de restauration, vérifie au minimum :

1. que PostgreSQL démarre et que les migrations sont cohérentes ;
2. que les utilisateurs, conversations et journaux attendus sont présents ;
3. que le backend peut se connecter à la base restaurée ;
4. que le fichier de sauvegarde reste lisible et que sa taille est plausible.

Note la date du dernier exercice et conserve la sauvegarde hors du serveur
principal. Les secrets de production ne sont pas inclus dans le dump PostgreSQL
et doivent être sauvegardés séparément dans un emplacement sécurisé.
