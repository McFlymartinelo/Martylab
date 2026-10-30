import { describe, it, expect } from "vitest";
import { planToolCalls } from "./planner.js";

describe("planToolCalls", () => {
  it("returns climate tool for temperature keywords", () => {
    const calls = planToolCalls("Quelle est la température ?");
    expect(calls).toEqual([{ toolId: "orion.get_climate", parameters: {} }]);
  });

  it("returns lights list for lumière keyword", () => {
    const calls = planToolCalls("montre les lumières");
    expect(calls).toEqual([{ toolId: "orion.list_lights", parameters: {} }]);
  });

  it("returns set_light for allume with id", () => {
    const calls = planToolCalls("allume la lumière 3");
    expect(calls).toEqual([
      { toolId: "orion.set_light", parameters: { lightId: "3", on: true } },
    ]);
  });

  it("returns set_light off for éteint", () => {
    const calls = planToolCalls("éteint la lumière 2");
    expect(calls).toEqual([
      { toolId: "orion.set_light", parameters: { lightId: "2", on: false } },
    ]);
  });

  it("returns restart tool with container id", () => {
    const calls = planToolCalls("redémarre le conteneur nginx");
    expect(calls).toEqual([
      { toolId: "docker.restart_container", parameters: { containerId: "nginx" } },
    ]);
  });

  it("returns system metrics for cpu keyword", () => {
    const calls = planToolCalls("cpu et ram");
    expect(calls).toEqual([{ toolId: "system.get_metrics", parameters: {} }]);
  });

  it("returns empty for unknown input", () => {
    const calls = planToolCalls("bonjour");
    expect(calls).toEqual([]);
  });
});