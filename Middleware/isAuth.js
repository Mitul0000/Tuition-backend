const admin = require("../Config/firebaseAdmin");

// This middleware takes the Firebase ID token sent by the app (Authorization: Bearer <idToken>),
// verifies it with the Firebase Admin SDK, and attaches the decoded user info to the request.
// The app gets this token for free after signing in with the Firebase Auth SDK client-side —
// nothing to issue or store on our side.

exports.isAuth = async (request, response, next) => {
  const authHeader = request.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return response.status(401).json({
      success: false,
      message: "Authorization header is missing or malformed",
    });
  }

  const idToken = authHeader.split(" ")[1];

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);

    // decodedToken includes uid, email, email_verified, etc.
    request.user = decodedToken;
    next();
  } catch (err) {
    console.log("Firebase ID token invalid or expired:", err.message);
    return response.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
};