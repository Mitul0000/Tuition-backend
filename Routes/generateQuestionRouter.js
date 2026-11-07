const express = require("express");
const router = express.Router();
const multer = require("multer");
const { isAuth } = require("../Middleware/isAuth");
const { postGenerateQuestion, postRegenerateQuestion, deleteSession } = require("../Controllers/generateController");

const MAX_TOTAL_BYTES = 20 * 1024 * 1024;
const MAX_CONCURRENT_GENERATIONS = 4;
const SIZE_ERROR_MESSAGE = "The files you uploaded are too large. Please upload files totalling 20 MB or less.";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_TOTAL_BYTES },
});

let active = 0;
const waiters = [];

const limitConcurrency = (req, res, next) => {
  const start = () => {
    active++;
    let released = false;
    const release = () => {
      if (released) return;
      released = true;
      active--;
      const nextWaiter = waiters.shift();
      if (nextWaiter) nextWaiter();
    };
    res.on("finish", release);
    res.on("close", release);
    next();
  };

  if (active < MAX_CONCURRENT_GENERATIONS) start();
  else waiters.push(start);
};

const handleUpload = (req, res, next) => {
  if (Number(req.headers["content-length"]) > MAX_TOTAL_BYTES) {
    return res.status(413).json({ error: SIZE_ERROR_MESSAGE });
  }
  upload.array("files")(req, res, (err) => {
    if (!err) return next();
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(413).json({ error: SIZE_ERROR_MESSAGE });
    }
    return res.status(400).json({ error: err.message });
  });
};

router.post("/generate", isAuth, limitConcurrency, handleUpload, postGenerateQuestion);
router.post("/regenerate", isAuth, postRegenerateQuestion);
router.delete("/session", isAuth, deleteSession);

module.exports = router;