import { generateOpenApiDocument } from 'trpc-to-openapi';
import { appRouter } from '../index';
import { writeFileSync } from 'fs';
import path from 'path';

export const openApiDocument = generateOpenApiDocument(appRouter, {
  title: 'Luxella API Docs',
  version: '1.0.0',
  baseUrl: 'http://localhost:3000',
});

const outputPath = path.join(__dirname, '../openapi.json');
writeFileSync(outputPath, JSON.stringify(openApiDocument, null, 2));

console.log(` OpenAPI document generated at ${outputPath}`);

process.exit(0);
