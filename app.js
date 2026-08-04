const dns = require("dns");
dns.setServers(["1.1.1.1", "1.0.0.1", "8.8.8.8"]);

require("dotenv").config();
const express = require("express");
const {connectDB} = require("./Config/mogoDB");
const questionRouter = require("./Routes/generateQuestionRouter");
const cors = require("cors");
const dotenv = require("dotenv");
dotenv.config();
const paperRoutes = require("./Routes/paperRouter");

const app = express();
app.use(cors());

app.use(express.json());
app.use("/api", questionRouter);
app.use("/api", paperRoutes);

app.get("/", (req, res) => {
  res.json({ status: "ok", message: "Tuition backend is running" });
});

const PORT = process.env.PORT || 8080;

connectDB().then(() => {
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is running on port ${PORT}`);
  });
});