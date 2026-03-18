import http from "http";
import app from "./app";
import { env } from "./config/env";
import { connectDB } from "./config/db";
import { initSocket } from "./socket"; 

const PORT = env.PORT || 8000;

const startServer = async () => {
  try {
    // 1. Connect Database
    await connectDB();

    // 2. Create the HTTP server instance
    const server = http.createServer(app);

    // 3. Initialize Sockets
    await initSocket(server);

    /**
     * 4. Start listening on 0.0.0.0
     * This is the "Magic Fix" for Mobile. 
     * It tells the server to listen to requests from ANY device on the network,
     * not just the computer itself.
     */
    server.listen(PORT, "0.0.0.0", () => {
      console.log("-----------------------------------------");
      console.log(`🚀 Server running on port: ${PORT}`);
      console.log(`🌐 Local:   http://localhost:${PORT}`);
      console.log(`📱 Mobile:  http://192.168.137.76:8000:${PORT}`); // Use your specific IP here
      console.log(`🛠️  Env:     ${env.NODE_ENV}`);
      console.log("-----------------------------------------");
    });
  } catch (error) {
    console.error("❌ Critical Server Failure:", error);
    process.exit(1);
  }
};

startServer();