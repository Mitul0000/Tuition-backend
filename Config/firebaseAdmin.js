require("dotenv").config();
const { initializeApp, cert, getApps } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");

let serviceAccount = require(process.env.FIREBASE_SERVICE_ACCOUNT_PATH);

if (!getApps().length) {
  initializeApp({
    credential: cert(serviceAccount),
  });
}

const auth = getAuth();

module.exports = { auth };