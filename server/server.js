const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

// Routes (add one at a time)
app.use("/api/events", require("./routes/events.route"));
app.use("/api/attackers", require("./routes/attackers.route"));
app.use("/api/stats", require("./routes/stats.route"));
// app.use("/api/report", require("./routes/report.route"));
// app.use("/api/block", require("./routes/block.route"));

app.listen(process.env.SOC_PORT, () => {
  console.log(`SOC Server running on port ${process.env.SOC_PORT}`);
});
