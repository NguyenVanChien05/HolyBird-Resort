const verifyAdmin = (req, res, next) => {
    // Tạm thời cho phép đi qua để test hệ thống
    // Sau này bạn sẽ viết logic check JWT token và Role ở đây
    next();
};

module.exports = { verifyAdmin };