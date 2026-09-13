import swaggerJsdoc from 'swagger-jsdoc';
import path from 'path';

export const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'Financial Analytics Dashboard API',
      version: '1.0.0',
      description: 'JWT-authenticated REST API for transactions, dashboard summary data, and CSV export.',
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        Transaction: {
          type: 'object',
          properties: {
            id: { type: 'string', example: '66d1f0c9a1b2c3d4e5f60789', description: 'Mongo document id' },
            date: { type: 'string', format: 'date-time' },
            amount: { type: 'number', example: 1500 },
            category: { type: 'string', enum: ['Revenue', 'Expense'] },
            status: { type: 'string', enum: ['Paid', 'Pending'] },
            user_id: { type: 'string', example: 'user_001' },
            user_name: { type: 'string', example: 'Matheus Ferrero' },
            user_profile: { type: 'string', format: 'uri' },
          },
        },
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'object',
              properties: {
                message: { type: 'string' },
                details: { type: 'array', items: { type: 'object' } },
              },
            },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: [path.join(__dirname, '../routes/*.ts'), path.join(__dirname, '../routes/*.js')],
});
