import { Router } from "express";
import { listPlugins } from "../plugins/registry.js";

export const pluginsRouter = Router();

pluginsRouter.get("/", (_req, res) => {
  res.status(200).json(listPlugins());
});
