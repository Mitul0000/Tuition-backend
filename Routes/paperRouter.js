const express = require("express");
const router = express.Router();
const { isAuth } = require("../Middleware/isAuth");
const {
  postGeneratePdf,
  postGenerateAnswerSheet,
  postSavePaper,
  getMyPapers,
} = require("../Controllers/paperController");

router.post("/generate-pdf", isAuth, postGeneratePdf);
router.post("/generate-answersheet", isAuth, postGenerateAnswerSheet);

// New: "My Papers" — save a generated paper, list saved papers for the logged-in tutor
router.post("/papers", isAuth, postSavePaper);
router.get("/papers", isAuth, getMyPapers);

module.exports = router;