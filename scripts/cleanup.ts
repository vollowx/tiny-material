import { unlinkSync } from 'node:fs';
import path from 'node:path';

const projectRoot = path.resolve(import.meta.dir, '..');
const srcDir = path.join(projectRoot, 'src');

const command = Bun.argv[2];

interface TargetConfig {
  name: string;
  globs: string[];
  condition: (filePath: string) => Promise<boolean> | boolean;
}

const registry: Record<string, TargetConfig> = {
  compiled: {
    name: 'tsc compiled files',
    globs: ['**/*.js'],
    condition: async (filePath) => {
      if (filePath.endsWith('.css.js')) return true;
      const base = filePath.replace(/\.js$/, '');
      return await Bun.file(`${base}.ts`).exists();
    },
  },
  styles: {
    name: 'converted css-in-ts styles',
    globs: ['**/*-styles.css.ts'],
    condition: () => true,
  },
};

async function run() {
  const target = registry[command];

  if (!target) {
    const validKeys = Object.keys(registry).join(' | ');
    console.log(`usage: bun scripts/cleanup.ts <${validKeys}>`);
    return;
  }

  console.log(`cleaning: ${target.name}`);
  let totalDeleted = 0;

  for (const pattern of target.globs) {
    const globScanner = new Bun.Glob(pattern);

    for await (const filePath of globScanner.scan(srcDir)) {
      const fullPath = path.join(srcDir, filePath);

      if (await target.condition(fullPath)) {
        try {
          unlinkSync(fullPath);
          console.log(`deleted: ${filePath}`);
          totalDeleted++;
        } catch (err) {
          console.error(`failed to delete ${filePath}`);
        }
      }
    }
  }

  console.log(`cleanup finished. ${totalDeleted} files removed.`);
}

run().catch(() => process.exit(1));
