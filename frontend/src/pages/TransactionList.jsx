import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
// Gộp chung các hàm API vào một dòng
import { getAllTransactions, getAllTransactionsClean, simulateDirtyUpdate } from "../api/transaction.api";
import "../styles/transactionList.css";

export default function TransactionList() {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(false); // Trạng thái chờ để demo Clean Read rõ hơn
  const navigate = useNavigate();

  // Hàm lấy dữ liệu mặc định (đang dùng READ UNCOMMITTED)
  const fetchTransactions = () => {
    getAllTransactions().then(res => setData(Array.isArray(res.data) ? res.data : []));
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  // KỊCH BẢN 1: Kích hoạt T1 nhập nhầm (Dirty Update)
  const handleDemoDirty = async (e, id) => {
    e.stopPropagation(); // Ngăn việc bị chuyển sang trang chi tiết khi nhấn nút
    
    alert("BẮT ĐẦU: Lễ tân (T1) đang nhập nhầm số tiền thành 999 Triệu...\n(Hệ thống sẽ treo trong 15 giây, hãy sang TAB KHÁC nhấn F5 để thấy lỗi)");
    
    try {
      await simulateDirtyUpdate(id);
      alert("XONG: T1 đã thực hiện ROLLBACK (Hủy bỏ nhập nhầm).\nDữ liệu hiện tại đã quay về con số đúng.");
      fetchTransactions(); 
    } catch (err) {
      console.error(err);
      alert("Lỗi demo: " + (err.response?.data?.message || err.message));
    }
  };

  // KỊCH BẢN 2: Admin (T2) truy vấn AN TOÀN (Clean Read - Read Committed)
  const handleDemoClean = async (e) => {
    if (e) e.stopPropagation();
    setIsLoading(true);
    
    try {
      // Hàm này sử dụng SP có 'SET TRANSACTION ISOLATION LEVEL READ COMMITTED'
      const res = await getAllTransactionsClean();
      setData(res.data);
      alert("KẾT QUẢ: Đã lấy dữ liệu AN TOÀN thành công!\n(Nếu bạn nhấn nút này khi T1 đang nhập nhầm, hệ thống sẽ tự đợi cho đến khi T1 xong mới hiển thị)");
    } catch (err) {
      alert("Lỗi truy vấn: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="transaction-list-page">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2>Transaction List</h2>
        
        {/* Nút Truy vấn An Toàn nên để ở trên đầu để Admin kiểm tra toàn bộ bảng */}
        <button 
          onClick={handleDemoClean} 
          disabled={isLoading}
          style={{
            backgroundColor: 'green', 
            color: 'white', 
            padding: '10px 20px', 
            borderRadius: '5px',
            cursor: isLoading ? 'not-allowed' : 'pointer'
          }}
        >
          {isLoading ? "Đang đợi T1 hoàn tất..." : "Truy vấn An Toàn (Read Committed)"}
        </button>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>STT</th>
              <th>ID</th>
              <th>Group</th>
              <th>Staff</th>
              <th>Start</th>
              <th>End</th>
              <th>Total</th>
              <th>Status</th>
              <th>Hành động Demo</th>
            </tr>
          </thead>

          <tbody>
            {data.map((t, index) => (
              <tr
                key={t.TransactionID}
                className="clickable"
                onClick={() => navigate(`/transactions/${t.TransactionID}`)}
              >
                <td>{index + 1}</td>
                <td>{t.TransactionID}</td>
                <td>{t.GroupID ?? "-"}</td>
                <td>{t.StaffName ?? "-"}</td>
                <td>{new Date(t.StartDate).toLocaleDateString()}</td>
                <td>{new Date(t.EndDate).toLocaleDateString()}</td>
                <td>{t.TotalPrice ? `${t.TotalPrice.toLocaleString()} VND` : "-"}</td>
                <td>
                  <span className={`badge ${t.Status.toLowerCase()}`}>
                    {t.Status}
                  </span>
                </td>
                <td>
                  <button 
                    onClick={(e) => handleDemoDirty(e, t.TransactionID)} 
                    style={{
                      backgroundColor: 'orange', 
                      color: 'white', 
                      border: 'none', 
                      padding: '5px 10px', 
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    Kích hoạt Nhập Nhầm (T1)
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}