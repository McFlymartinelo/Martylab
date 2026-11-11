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

# Image volontairement sans entrypoint : le service tourne sur `sleep infinity`
# et n'est utilisé que pour ses binaires.
