import app from './app.js';
import { connectDB } from './src/config/db.js';
import { config } from './src/config/env.js';

const startServer = async () => {
  try {
    await connectDB();
    const PORT = config.port;
    app.listen(PORT, () => {
      console.log(`[CRM Backend Server]: Running on http://localhost:${PORT}`);
      console.log(`[Swagger UI Docs]: Available at http://localhost:${PORT}/api-docs`);
    });
  } catch (error) {
    console.error(`Failed to start server: ${error.message}`);
    process.exit(1);
  }
};

startServer();