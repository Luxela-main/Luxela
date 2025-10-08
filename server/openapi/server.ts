import express from 'express';
import swaggerUi from 'swagger-ui-express';
import fs from 'fs';
import path from 'path';

const app = express();

// Load generated OpenAPI JSON
const openApiPath = path.resolve(__dirname, '../openapi.json');
const openApiDoc = JSON.parse(fs.readFileSync(openApiPath, 'utf-8'));

// Serve Swagger UI
app.use('/docs', swaggerUi.serve, swaggerUi.setup(openApiDoc));

// Run on a separate port
const PORT = process.env.DOCS_PORT || 4100;
app.listen(PORT, () => {
  console.log(`Swagger docs available at http://localhost:${PORT}/docs`);
});
