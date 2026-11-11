# syntax=docker/dockerfile:1

# Conteneur « toolbox » : la console Martylab y ouvre un shell complet
# (htop, git, curl, ...). Il n'expose aucun port et n'a aucun accès réseau ;
# il n'est joignable que par `docker exec` depuis le backend.
FROM docker:27-cli

RUN apk add --no-cache \
  htop \
  git \
  bash \
  curl \
  nano \
  procps \
  less \
  openssh-client

# Le toolbox tourne en root alors que les dépôts de l'hôte appartiennent à
# l'utilisateur : sans cette exception, chaque `git status` échoue avec
# "detected dubious ownership". Écrit dans /etc/gitconfig, donc persistant
# quand le conteneur est recréé.
RUN git config --system --add safe.directory '*'

# Image volontairement sans entrypoint : le service tourne sur `sleep infinity`
# et n'est utilisé que pour ses binaires.
