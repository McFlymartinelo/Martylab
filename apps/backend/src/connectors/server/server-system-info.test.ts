import { describe, expect, it } from "vitest";
import {
  computeDiskIoRates,
  parseBootTimestamp,
  parseCpuModel,
  parseDiskStats,
  parseLoadAverage,
  parseMdstat,
  parseMountTable,
  parseOsRelease,
  parseSwapUsage,
} from "./server-system-info.js";

describe("parseLoadAverage", () => {
  it("reads the three load averages and the process counts", () => {
    expect(parseLoadAverage("0.42 0.38 0.31 2/412 9876\n")).toEqual({
      one: 0.42,
      five: 0.38,
      fifteen: 0.31,
      runningProcesses: 2,
      totalProcesses: 412,
    });
  });

  it("returns null on malformed input", () => {
    expect(parseLoadAverage("not a loadavg")).toBeNull();
  });
});

describe("parseSwapUsage", () => {
  it("converts kB to bytes", () => {
    const meminfo = "MemTotal:       16384000 kB\nSwapTotal:       2097152 kB\nSwapFree:        1675000 kB\n";
    expect(parseSwapUsage(meminfo)).toEqual({
      totalBytes: 2097152 * 1024,
      freeBytes: 1675000 * 1024,
      usedBytes: (2097152 - 1675000) * 1024,
    });
  });

  it("returns null when no swap is configured", () => {
    expect(parseSwapUsage("SwapTotal: 0 kB\nSwapFree: 0 kB\n")).toBeNull();
  });
});

describe("parseCpuModel / parseOsRelease / parseBootTimestamp", () => {
  it("extracts the CPU model", () => {
    expect(
      parseCpuModel("processor\t: 0\nmodel name\t: Intel(R) Core(TM) i5-12400\n"),
    ).toBe("Intel(R) Core(TM) i5-12400");
  });

  it("extracts the distribution name", () => {
    expect(parseOsRelease('NAME="Debian GNU/Linux"\nPRETTY_NAME="Debian GNU/Linux 13"\n')).toBe(
      "Debian GNU/Linux 13",
    );
  });

  it("converts btime to an ISO date", () => {
    expect(parseBootTimestamp("cpu 1 2 3\nbtime 1759200000\n")).toBe(
      new Date(1759200000 * 1000).toISOString(),
    );
  });

  it("rejects invalid boot timestamps", () => {
    expect(parseBootTimestamp("btime 0\n")).toBeNull();
  });
});

describe("parseMountTable", () => {
  it("unescapes mount points and keeps real filesystems", () => {
    const entries = parseMountTable(
      [
        "/dev/nvme0n1p2 / ext4 rw,relatime 0 1",
        "/dev/sda1 /mnt/media\\040disk xfs rw 0 0",
        "proc /proc proc rw 0 0",
      ].join("\n"),
    );

    expect(entries).toHaveLength(3);
    expect(entries[1]).toMatchObject({
      device: "/dev/sda1",
      mountPoint: "/mnt/media disk",
      fileSystem: "xfs",
    });
  });
});

describe("parseDiskStats", () => {
  it("keeps whole disks and ignores partitions, loop and ram devices", () => {
    const content = [
      "   8       0 sda 1200 0 24000 100 800 0 16000 80 0 0 0",
      "   8       1 sda1 1100 0 23500 95 780 0 15900 78 0 0 0",
      " 259       0 nvme0n1 5000 0 900000 200 4000 0 700000 150 0 0 0",
      " 259       1 nvme0n1p1 4800 0 890000 190 3900 0 690000 140 0 0 0",
      "   7       0 loop0 10 0 80 1 0 0 0 0 0 0 0",
    ].join("\n");

    const entries = parseDiskStats(content);

    expect([...entries.keys()]).toEqual(["sda", "nvme0n1"]);
    expect(entries.get("sda")).toEqual({
      readBytes: 24000 * 512,
      writtenBytes: 16000 * 512,
      readOps: 1200,
      writeOps: 800,
    });
  });
});

describe("computeDiskIoRates", () => {
  it("returns zeroes on the first sample and a rate on the next one", () => {
    const first = computeDiskIoRates(
      new Map([
        ["sda", { readBytes: 1024, writtenBytes: 2048, readOps: 10, writeOps: 20 }],
      ]),
      1_000_000,
    );
    expect(first[0]?.readBytesPerSecond).toBe(0);

    const second = computeDiskIoRates(
      new Map([
        ["sda", { readBytes: 2048, writtenBytes: 4096, readOps: 30, writeOps: 60 }],
      ]),
      1_002_000,
    );
    expect(second[0]).toMatchObject({
      device: "sda",
      readBytesPerSecond: 512,
      writeBytesPerSecond: 1024,
      readOperationsPerSecond: 10,
      writeOperationsPerSecond: 20,
    });
  });
});

describe("parseMdstat", () => {
  it("reports healthy and degraded arrays", () => {
    const content = [
      "Personalities : [raid1]",
      "md0 : active raid1 sdb1[1] sda1[0]",
      "      976630336 blocks super 1.2 [2/2] [UU]",
      "",
      "md1 : active raid5 sdd1[2] sdc1[1]",
      "      1953260544 blocks super 1.2 level 5, 512k chunk, algorithm 2 [3/2] [UU_]",
      "",
      "unused devices: <none>",
    ].join("\n");

    expect(parseMdstat(content)).toEqual([
      {
        name: "md0",
        level: "raid1",
        state: "active",
        activeDevices: 2,
        totalDevices: 2,
      },
      {
        name: "md1",
        level: "raid5",
        state: "degraded",
        activeDevices: 2,
        totalDevices: 3,
      },
    ]);
  });

  it("returns an empty list when there is no array", () => {
    expect(parseMdstat("Personalities : \nunused devices: <none>\n")).toEqual([]);
  });
});
