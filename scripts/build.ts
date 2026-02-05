import path from 'node:path';
import { transformSync } from '@swc/core';

const projectRoot = path.resolve(import.meta.dir, '..');
const srcDir = path.join(projectRoot, 'src');

async function buildLibrary() {
  const globScanner = new Bun.Glob('**/*.ts');
  const files = Array.from(globScanner.scanSync(srcDir));

  console.log(`transpiling ${files.length} files...`);

  for (const filePath of files) {
    if (filePath.endsWith('.d.ts')) continue;

    const fullPath = path.join(srcDir, filePath);
    const fileContent = await Bun.file(fullPath).text();

    try {
      const { code } = transformSync(fileContent, {
        filename: fullPath,
        jsc: {
          externalHelpers: true,
          parser: {
            syntax: 'typescript',
            decorators: true,
          },
          target: 'esnext',
          transform: {
            legacyDecorator: true,
            decoratorMetadata: false,
          },
        },
        module: {
          type: 'es6',
        },
      });

      const outPath = fullPath.replace(/\.ts$/, '.js');
      await Bun.write(outPath, code);

      console.log(`transformed: ${filePath}`);
    } catch (err: any) {
      console.error(`failed to transform ${filePath}: ${err.message}`);
    }
  }

  console.log('done');
}

buildLibrary().catch(console.error);
