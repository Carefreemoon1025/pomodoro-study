import { mkdtemp, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { createDefaultData } from "../../domain/defaults";
import { FileStore } from "./file-store";

const tempDirectories: string[] = [];

async function createStore(): Promise<{ directory: string; store: FileStore }> {
  const directory = await mkdtemp(join(tmpdir(), "pomodoro-store-"));
  tempDirectories.push(directory);
  return {
    directory,
    store: new FileStore(join(directory, "data.json"))
  };
}

afterEach(async () => {
  await Promise.all(tempDirectories.splice(0).map((directory) => rm(directory, { recursive: true })));
});

describe("FileStore", () => {
  it("returns default data when the file does not exist", async () => {
    const { store } = await createStore();

    await expect(store.load()).resolves.toEqual(createDefaultData());
  });

  it("saves and loads data", async () => {
    const { store } = await createStore();
    const data = {
      ...createDefaultData(),
      settings: {
        ...createDefaultData().settings,
        theme: "dark" as const
      }
    };

    await store.save(data);

    await expect(store.load()).resolves.toEqual(data);
    expect(JSON.parse(await readFile(store.dataPath, "utf8")).settings.theme).toBe("dark");
  });

  it("recovers from a corrupt primary file using the backup", async () => {
    const { store } = await createStore();
    const first = {
      ...createDefaultData(),
      settings: { ...createDefaultData().settings, theme: "dark" as const }
    };
    const second = {
      ...createDefaultData(),
      settings: { ...createDefaultData().settings, theme: "light" as const }
    };

    await store.save(first);
    await store.save(second);
    await writeFile(store.dataPath, "{bad json", "utf8");

    await expect(store.load()).resolves.toEqual(first);
  });

  it("creates a corrupt copy and defaults when both files are invalid", async () => {
    const { directory, store } = await createStore();
    await writeFile(store.dataPath, "{bad primary", "utf8");
    await writeFile(`${store.dataPath}.bak`, "{bad backup", "utf8");

    await expect(store.load()).resolves.toEqual(createDefaultData());
    expect(JSON.parse(await readFile(store.dataPath, "utf8")).schemaVersion).toBe(1);
    const files = await readdir(directory);
    expect(files.some((name) => name.startsWith("data.json.corrupt-"))).toBe(true);
  });
});
