import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { productsSeed, validateProductsSeed } from './products.seed';

function runSeed(): void {
  validateProductsSeed(productsSeed);

  const outputDir = join(process.cwd(), 'data');
  const outputPath = join(outputDir, 'products.seed.json');
  mkdirSync(outputDir, { recursive: true });
  writeFileSync(outputPath, JSON.stringify(productsSeed, null, 2), 'utf-8');

  const outOfStockCount = productsSeed.filter((product) => product.quantityInStock === 0).length;
  const categories = [...new Set(productsSeed.map((product) => product.category))];

  console.log(`Seed exported: ${productsSeed.length} products`);
  console.log(`Categories: ${categories.join(', ')}`);
  console.log(`Out-of-stock products: ${outOfStockCount}`);
  console.log(`Output file: ${outputPath}`);
}

runSeed();
