import { SwaggerOptions } from 'swagger-ui-express';

export const swaggerOptions: SwaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Matcha API Documentation',
      version: '1.0.0',
      description: 'API documentation for the Matcha dating application',
    },
    servers: [
      {
        url: 'http://localhost:3001',
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [{
      bearerAuth: [],
    }],
  },
  apis: ['./src/routes/*.ts'], // Path to the API routes
};
