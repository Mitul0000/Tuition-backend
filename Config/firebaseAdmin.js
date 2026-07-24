require("dotenv").config();
const admin = require("firebase-admin");

let serviceAccount = require(process.env.FIREBASE_SERVICE_ACCOUNT_PATH);

console.log(serviceAccount)

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

module.exports = admin;