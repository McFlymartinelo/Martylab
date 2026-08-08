# Martylab Architecture

## 1. Vision

Martylab is a self-hosted application hub.

It provides a unified interface for independently deployed applications and services.

The core principle is:

> One interface, independent applications.

Martylab does not replace the applications it integrates.

---

## 2. High-Level Architecture

```text
                         Internet
                            │
                            ▼
                    Cloudflare Tunnel
                            │
                            ▼
                     martylab.fr
                            │
                            ▼
                  ┌───────────────────┐
                  │ Martylab Portal   │
                  │ React + TypeScript│
                  └─────────┬─────────┘
                            │
                            ▼
                  ┌───────────────────┐
                  │ Martylab Backend  │
                  │ Express + TS      │
                  └─────────┬─────────┘
                            │
             ┌──────────────┼──────────────┐
             │              │              │
             ▼              ▼              ▼
        Orion Plugin   Matchday Plugin  Jellyfin Plugin
             │              │              │
             ▼              ▼              ▼
           Orion         Matchday        Jellyfin