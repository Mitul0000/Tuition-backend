const { auth } = require("../Config/firebaseAdmin");

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
    const decodedToken = await auth.verifyIdToken(idToken);
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