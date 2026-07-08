declare const process: {
  cwd(): string;
  env: Record<string, string | undefined>;
};
declare function require(moduleName: string): unknown;

const { existsSync, readFileSync } = require("fs") as {
  existsSync(path: string): boolean;
  readFileSync(path: string, encoding: "utf8"): string;
};
const { resolve } = require("path") as {
  resolve(...paths: string[]): string;
};

const defaultEnvFiles = [".env.local", ".env"];

export function loadLocalEnv(files = defaultEnvFiles): string[] {
  const loadedFiles: string[] = [];

  for (const file of files) {
    const filePath = resolve(process.cwd(), file);

    if (!existsSync(filePath)) {
      continue;
    }

    const values = parseEnvFile(readFileSync(filePath, "utf8"));

    for (const [key, value] of Object.entries(values)) {
      process.env[key] ??= value;
    }

    loadedFiles.push(file);
  }

  return loadedFiles;
}

export function parseEnvFile(contents: string): Record<string, string> {
  const values: Record<string, string> = {};

  for (const rawLine of contents.split(/\r?\n/)) {
    const line = rawLine.trim();

    if (!line || line.startsWith("#")) {
      continue;
    }

    const assignment = line.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);

    if (!assignment) {
      continue;
    }

    values[assignment[1]!] = normalizeEnvValue(assignment[2] ?? "");
  }

  return values;
}

function normalizeEnvValue(value: string): string {
  const trimmedValue = value.trim();
  const quotedValue = trimmedValue.match(/^(['"])(.*)\1$/);

  if (!quotedValue) {
    return trimmedValue.replace(/\s+#.*$/, "");
  }

  return quotedValue[2]!.replace(/\\n/g, "\n");
}
