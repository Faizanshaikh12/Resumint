import { describe, it, expect } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";

function getAllFiles(dirPath: string, arrayOfFiles: string[] = []): string[] {
  const files = fs.readdirSync(dirPath);

  files.forEach((file) => {
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      arrayOfFiles = getAllFiles(fullPath, arrayOfFiles);
    } else if (/\.(tsx?|jsx?)$/.test(file)) {
      arrayOfFiles.push(fullPath);
    }
  });

  return arrayOfFiles;
}

describe("Security Static Analysis Audit", () => {
  const appDir = path.resolve(process.cwd(), "app");
  const allAppFiles = getAllFiles(appDir);

  it("finds zero usages of dangerouslySetInnerHTML across the entire app directory", () => {
    const violations: { file: string; line: number; content: string }[] = [];

    for (const filePath of allAppFiles) {
      const content = fs.readFileSync(filePath, "utf-8");
      const lines = content.split("\n");
      lines.forEach((line, index) => {
        if (line.includes("dangerouslySetInnerHTML")) {
          violations.push({
            file: path.relative(process.cwd(), filePath),
            line: index + 1,
            content: line.trim(),
          });
        }
      });
    }

    expect(
      violations,
      `Found dangerouslySetInnerHTML violations:\n${JSON.stringify(violations, null, 2)}`
    ).toEqual([]);
  });

  it("finds zero usages of eval() across the entire app directory", () => {
    const violations: { file: string; line: number; content: string }[] = [];

    for (const filePath of allAppFiles) {
      const content = fs.readFileSync(filePath, "utf-8");
      const lines = content.split("\n");
      lines.forEach((line, index) => {
        if (/\beval\s*\(/.test(line)) {
          violations.push({
            file: path.relative(process.cwd(), filePath),
            line: index + 1,
            content: line.trim(),
          });
        }
      });
    }

    expect(
      violations,
      `Found eval() violations:\n${JSON.stringify(violations, null, 2)}`
    ).toEqual([]);
  });

  it("finds zero usages of new Function() across the entire app directory", () => {
    const violations: { file: string; line: number; content: string }[] = [];

    for (const filePath of allAppFiles) {
      const content = fs.readFileSync(filePath, "utf-8");
      const lines = content.split("\n");
      lines.forEach((line, index) => {
        if (/\bnew\s+Function\s*\(/.test(line)) {
          violations.push({
            file: path.relative(process.cwd(), filePath),
            line: index + 1,
            content: line.trim(),
          });
        }
      });
    }

    expect(
      violations,
      `Found new Function() violations:\n${JSON.stringify(violations, null, 2)}`
    ).toEqual([]);
  });

  it("finds zero hardcoded secret tokens or private keys in source files", () => {
    const secretPatterns = [
      /-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----/,
      /(secret|token|password)\s*[:=]\s*["'][A-Za-z0-9+/]{32,}["']/i,
    ];

    const violations: { file: string; pattern: string }[] = [];

    for (const filePath of allAppFiles) {
      const content = fs.readFileSync(filePath, "utf-8");
      for (const pattern of secretPatterns) {
        if (pattern.test(content)) {
          violations.push({
            file: path.relative(process.cwd(), filePath),
            pattern: pattern.toString(),
          });
        }
      }
    }

    expect(violations).toEqual([]);
  });
});
