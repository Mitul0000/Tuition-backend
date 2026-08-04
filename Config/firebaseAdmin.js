require("dotenv").config();
const { initializeApp, cert, getApps } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");


if (!process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
  throw new Error(
    "Missing FIREBASE_SERVICE_ACCOUNT_BASE64 env variable. Base64-encode your firebase-service-account.json and set it as an App Setting."
  );
}

const serviceAccount = JSON.parse(
  Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, "base64").toString("utf-8")
);

if (!getApps().length) {
  initializeApp({
    credential: cert(serviceAccount),
  });
}

const auth = getAuth();

module.exports = { auth };