import fs from "fs";
import path from "path";

function walk(dir, files = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory() && e.name !== "node_modules") walk(p, files);
    else if (e.isFile() && /\.(tsx|ts)$/.test(e.name)) files.push(p);
  }
  return files;
}

const replacements = [
  [/bg-\[#F5F4F0\]/g, "bg-media-bg"],
  [/bg-\[#F8F7F4\]/g, "bg-skeleton"],
  [/bg-white\/95/g, "bg-card/95"],
  [/bg-white\/90/g, "bg-card/90"],
  [/bg-white\/60/g, "bg-card/60"],
  [/hover:bg-white\b/g, "hover:bg-warka-bg"],
  [/border-2 border-white/g, "border-2 border-card"],
  [/bg-white\/10/g, "bg-foreground/10"],
  [/bg-white\/5/g, "bg-foreground/5"],
  [/bg-white\b/g, "bg-card"],
  [/text-\[#5C5C47\]/g, "text-warka-primary"],
];

let count = 0;
for (const file of walk("src")) {
  if (file.includes("dashboard-sidebar")) continue;
  const content = fs.readFileSync(file, "utf8");
  let next = content;
  for (const [re, rep] of replacements) next = next.replace(re, rep);
  if (next !== content) {
    fs.writeFileSync(file, next);
    count++;
  }
}

console.log(`Updated ${count} files`);
