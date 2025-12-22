const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  const h = req.headers.authorization;
  if (!h) return res.status(401).json({ message: "Thiếu token" });

  const token = h.startsWith("Bearer ") && h.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Token không hợp lệ" });

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ message: "Token không hợp lệ" });
  }
};
