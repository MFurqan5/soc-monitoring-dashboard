const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());



// Global error handlers
process.on("uncaughtException", (error) => {
  console.error("❌ Uncaught Exception:", error.message);
  console.error(error.stack);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("❌ Unhandled Rejection at:", promise, "reason:", reason);
});

try {
  // Routes (add one at a time)
  console.log("Loading routes...");
  app.use("/api/events", require("./routes/events.route"));
  console.log("✓ Events route loaded");
  
  app.use("/api/attackers", require("./routes/attackers.route"));
  console.log("✓ Attackers route loaded");
  
  app.use("/api/stats", require("./routes/stats.route"));
  console.log("✓ Stats route loaded");
  
  app.use("/api/report", require("./routes/report.route"));
  console.log("✓ Report route loaded");
  
  app.use("/api/block", require("./routes/block.route"));
  console.log("✓ Block route loaded");
  
  app.use("/api/sessions", require("./routes/sessions.route"));
  console.log("✓ Sessions route loaded");

  const PORT = process.env.SOC_PORT || 5000;
  
  const server = app.listen(PORT, () => {
    console.log(`\n✅ SOC Server running on port ${PORT}`);
    console.log(`🌐 http://localhost:${PORT}`);
    console.log(`✓ All routes loaded successfully\n`);
  });

  server.on("error", (error) => {
    if (error.code === "EADDRINUSE") {
      console.error(`❌ Port ${PORT} is already in use. Kill the process or use a different port.`);
    } else {
      console.error("❌ Server error:", error.message);
    }
    process.exit(1);
  });

} catch (error) {
  console.error("❌ Error starting server:", error.message);
  console.error(error.stack);
  process.exit(1);
}
