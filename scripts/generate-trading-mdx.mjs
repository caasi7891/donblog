import fs from "fs/promises";
import path from "path";

const LOGS_DIR = path.join(process.cwd(), "logs/trading");
const CONTENT_DIR = path.join(process.cwd(), "content/trading");

async function main() {
  await fs.mkdir(CONTENT_DIR, { recursive: true });

  let files;
  try {
    files = await fs.readdir(LOGS_DIR);
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.log(`Logs directory ${LOGS_DIR} does not exist. Skipping...`);
      return;
    }
    throw error;
  }

  const jsonFiles = files.filter(f => f.endsWith('.json'));

  for (const file of jsonFiles) {
    const raw = await fs.readFile(path.join(LOGS_DIR, file), "utf-8");
    const data = JSON.parse(raw);
    
    // Frontmatter
    const frontmatter = `---
title: "${data.title.replace(/"/g, '\\"')}"
date: "${data.date}"
category: "trading"
tags: ${JSON.stringify(data.tags || [])}
summary: "${data.summary ? data.summary.replace(/"/g, '\\"') : ""}"
---
`;
    // MDX Payload
    const mdxContent = `${frontmatter}

${data.content || ""}

<StaticChart ticker="${data.ticker}" data={${JSON.stringify(data.chartSnapshot)}} buyPrice={${data.buyPrice || "null"}} sellPrice={${data.sellPrice || "null"}} />
`;

    const outName = file.replace(".json", ".mdx");
    await fs.writeFile(path.join(CONTENT_DIR, outName), mdxContent, "utf-8");
    console.log(`Generated ${outName}`);
  }
}

main().catch(console.error);
