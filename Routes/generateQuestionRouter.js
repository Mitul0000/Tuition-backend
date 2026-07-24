const express = require("express");
const router = express.Router();
const multer = require("multer");
const dotenv = require("dotenv");
dotenv.config();
const upload = multer({ storage: multer.memoryStorage() });
const { isAuth } = require("../Middleware/isAuth");
const { postGenerateQuestion, postRegenerateQuestion, deleteSession } = require("../Controllers/generateController");

router.post("/generate", isAuth, upload.array("files"), postGenerateQuestion);
router.post("/regenerate", isAuth, postRegenerateQuestion);
router.delete("/session", isAuth, deleteSession);

module.exports = router;