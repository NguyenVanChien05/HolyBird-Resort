const jwt = require("jsonwebtoken");

module.exports = (...roles) => {
  return (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader)
      return res.status(401).json({ message: "Chưa đăng nhập" });

    const token = authHeader.split(" ")[1];
    if (!token)
      return res.status(401).json({ message: "Token không hợp lệ" });

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      // decoded = { accountId, role, groupId }

      req.user = decoded;

      // 👉 nếu có truyền role thì mới check
      if (roles.length && !roles.includes(decoded.role)) {
        return res.status(403).json({ message: "Không có quyền" });
      }

      next();
    } catch (err) {
      return res.status(401).json({ message: "Token hết hạn" });
    }
  };
};
