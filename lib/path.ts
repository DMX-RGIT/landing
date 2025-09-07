import * as fs from "fs";

export function extractJoinedPathFromSVGFile(filePath: string): string {
  const svgContent = fs.readFileSync(filePath, "utf8");

  // Match all <path ... d="..."> attributes
  const matches = [...svgContent.matchAll(/<path[^>]*d="([^"]+)"/g)];

  if (matches.length === 0) {
    throw new Error("No <path> elements found in SVG");
  }

  return matches.map((m) => m[1].trim()).join(" ");
}

const result = extractJoinedPathFromSVGFile("public/file.svg");
console.log(result);
