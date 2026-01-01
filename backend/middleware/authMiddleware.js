const isAdmin = (req, res, next) => {
    // Giả sử sau khi đăng nhập, bạn lưu thông tin user vào req.user
    const user = req.user; 

    if (user && user.Role === 'admin') {
        next(); // Cho phép đi tiếp vào Controller
    } else {
        res.status(403).json({ error: 'Truy cập bị từ chối. Chỉ Admin mới có quyền này.' });
    }
};

module.exports = { isAdmin };