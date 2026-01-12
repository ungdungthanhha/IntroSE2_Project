// src/pages/Reports.tsx
import React, { useEffect, useState } from 'react';
import { FaPlay, FaTrashAlt, FaTimesCircle, FaClock, FaUserShield, FaCheckCircle, FaSync } from 'react-icons/fa';
import { getReportsFull, updateReportStatus, deleteVideo, type ReportPopulated } from '../services/dataService'; 
import { useSearch } from '../context/SearchContext';

const Reports: React.FC = () => {
  const [reports, setReports] = useState<ReportPopulated[]>([]);
  const [loading, setLoading] = useState(true);

  const { searchTerm } = useSearch();

  const fetchData = async () => {
    setLoading(true);
    const data = await getReportsFull();
    setReports(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleResolve = async (report: ReportPopulated) => {
    const confirm = window.confirm(
      "⚠️ XÁC NHẬN: Video này vi phạm?\n\nHành động này sẽ:\n1. XÓA vĩnh viễn video này.\n2. Đánh dấu báo cáo là 'Đã giải quyết'."
    );
    if (!confirm) return;

    try {
      await deleteVideo(report.videoId);
      await updateReportStatus(report.id, 'resolved');

      setReports(prev => prev.map(r => 
        r.id === report.id ? { ...r, status: 'resolved' } : r
      ));
      
      alert("Đã xóa video vi phạm thành công!");
    } catch (error) {
      alert("Lỗi xử lý! Có thể video đã bị xóa trước đó.");
    }
  };

  const handleReject = async (report: ReportPopulated) => {
    const confirm = window.confirm("Bạn xác nhận video này AN TOÀN và muốn bỏ qua báo cáo?");
    if (!confirm) return;

    try {
      await updateReportStatus(report.id, 'rejected');
      setReports(prev => prev.map(r => 
        r.id === report.id ? { ...r, status: 'rejected' } : r
      ));
    } catch (error) {
      alert("Lỗi cập nhật trạng thái!");
    }
  };

  const formatDate = (ms: number) => {
    if (!ms) return "N/A";
    return new Date(ms).toLocaleDateString('vi-VN', { 
      day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' 
    });
  };

  const filteredReports = reports.filter((r) => {
    if (!searchTerm) return true; // Không tìm thì hiện hết
    const term = searchTerm.toLowerCase().trim();

    // Tìm trong: ID Video, Lý do, Tên người báo, Caption video
    return (
      r.videoId.toLowerCase().includes(term) ||
      r.reason.toLowerCase().includes(term) ||
      (r.reporterData?.username || "").toLowerCase().includes(term) ||
      r.reportedByUid.toLowerCase().includes(term) ||
      (r.videoData?.caption || "").toLowerCase().includes(term)
    );
  });

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>⏳ Đang tải danh sách báo cáo...</div>;
  }

  return (
    <div style={{ padding: '24px', background: '#f8f9fa', minHeight: '100vh' }}>
      
      {/* --- HEADER --- */}
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: '800', margin: 0, color: '#333' }}>Kiểm duyệt Báo cáo</h2>
          <div style={{ fontSize: '14px', color: '#666' }}>Xử lý các vi phạm cộng đồng</div>
        </div>
        <button 
          onClick={fetchData}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', border: 'none', background: '#333', color: 'white', borderRadius: '6px', cursor: 'pointer' }}
        >
          <FaSync /> Làm mới
        </button>
      </div>

      {/* Hiển thị kết quả tìm kiếm nếu đang tìm */}
      {searchTerm && (
        <div style={{ marginBottom: '15px', fontStyle: 'italic', color: '#666' }}>
          🔍 Kết quả tìm kiếm cho: "<b>{searchTerm}</b>" ({filteredReports.length} báo cáo)
        </div>
      )}

      {/* --- TABLE --- */}
      <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ background: '#f8f9fa', borderBottom: '1px solid #e9ecef' }}>
            <tr style={{ textAlign: 'left', color: '#6c757d', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              <th style={{ padding: '16px' }}>Video Vi phạm</th>
              <th style={{ padding: '16px' }}>Lý do & Người báo</th>
              <th style={{ padding: '16px' }}>Thời gian</th>
              <th style={{ padding: '16px' }}>Trạng thái</th>
              <th style={{ padding: '16px' }}>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {filteredReports.length === 0 ? (
                 <tr>
                    <td colSpan={5} style={{ padding: '30px', textAlign: 'center', color: '#888' }}>
                        {searchTerm ? "Không tìm thấy báo cáo nào phù hợp." : "Tuyệt vời! Không có báo cáo nào."}
                    </td>
                </tr>
            ) : (
                filteredReports.map((r) => (
                <tr key={r.id} style={{ borderBottom: '1px solid #f1f3f5', transition: '0.2s' }}>
                    
                    {/* Cột 1: Thumbnail Video */}
                    <td style={{ padding: '16px' }}>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                        <div style={{ 
                        position: 'relative', width: '50px', height: '80px', 
                        background: '#eee', borderRadius: '6px', overflow: 'hidden', flexShrink: 0, cursor: 'pointer' 
                        }}>
                        {/* Dùng ảnh placeholder */}
                        <img 
                            src={`https://placehold.co/50x80/333/white?text=ID:${r.videoId.substring(0,3)}`} 
                            alt="thumb" 
                            style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.8 }} 
                        />
                        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: 'white' }}>
                            <FaPlay size={14} />
                        </div>
                        </div>
                        <div>
                        <div style={{ fontWeight: '600', fontSize: '14px', marginBottom: '4px', color: '#2c3e50' }}>
                            ID: {r.videoId.substring(0,8)}...
                        </div>
                        <div style={{ fontSize: '13px', color: '#555', maxWidth: '200px', lineHeight: '1.4' }}>
                            {/* Lấy caption từ dữ liệu populate, nếu không có (video đã xóa) thì hiện thông báo */}
                            {r.videoData?.caption || <span style={{color: 'red', fontStyle: 'italic'}}>(Video này đã bị xóa)</span>}
                        </div>
                        </div>
                    </div>
                    </td>

                    {/* Cột 2: Lý do */}
                    <td style={{ padding: '16px' }}>
                    <div style={{ fontWeight: '700', color: '#e74c3c', fontSize: '14px', marginBottom: '6px' }}>
                        {r.reason}
                    </div>
                    <div style={{ fontSize: '12px', color: '#888', display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <FaUserShield size={12} /> 
                        {/* Lấy tên người báo từ populate */}
                        {r.reporterData ? `@${r.reporterData.username}` : `UID: ${r.reportedByUid}`}
                    </div>
                    </td>

                    {/* Cột 3: Thời gian */}
                    <td style={{ padding: '16px', fontSize: '13px', color: '#666' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <FaClock color="#bdc3c7" /> {formatDate(r.createdAt)}
                    </div>
                    </td>

                    {/* Cột 4: Trạng thái */}
                    <td style={{ padding: '16px' }}>
                    {r.status === 'pending' && (
                        <span style={{ background: '#fff7e6', color: '#d35400', padding: '6px 12px', borderRadius: '30px', fontSize: '12px', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                        ⏳ Chờ xử lý
                        </span>
                    )}
                    {r.status === 'resolved' && (
                        <span style={{ background: '#e6fffa', color: '#00b894', padding: '6px 12px', borderRadius: '30px', fontSize: '12px', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                        <FaCheckCircle /> Đã xóa video
                        </span>
                    )}
                    {r.status === 'rejected' && (
                        <span style={{ background: '#f1f2f6', color: '#747d8c', padding: '6px 12px', borderRadius: '30px', fontSize: '12px', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                        <FaTimesCircle /> Đã bác bỏ
                        </span>
                    )}
                    </td>

                    {/* Cột 5: Hành động */}
                    <td style={{ padding: '16px' }}>
                    {r.status === 'pending' ? (
                        <div style={{ display: 'flex', gap: '8px' }}>
                        {/* Nút Xóa (Đồng ý báo cáo) */}
                        <button 
                            onClick={() => handleResolve(r)}
                            title="Xác nhận vi phạm & Xóa Video"
                            style={{ 
                            padding: '8px 12px', background: '#ffebee', color: '#e74c3c', 
                            border: '1px solid #ffcdd2', borderRadius: '6px', cursor: 'pointer', fontWeight: '600',
                            display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', transition: '0.2s'
                            }}
                        >
                            <FaTrashAlt /> Xóa
                        </button>

                        {/* Nút Bỏ qua (Video an toàn) */}
                        <button 
                            onClick={() => handleReject(r)}
                            title="Video này an toàn"
                            style={{ 
                            padding: '8px 12px', background: '#f1f2f6', color: '#2f3542', 
                            border: '1px solid #dfe4ea', borderRadius: '6px', cursor: 'pointer', fontWeight: '600',
                            display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', transition: '0.2s'
                            }}
                        >
                            <FaTimesCircle /> Bỏ qua
                        </button>
                        </div>
                    ) : (
                        <div style={{ fontSize: '13px', color: '#b2bec3', fontStyle: 'italic' }}>
                        Hoàn tất
                        </div>
                    )}
                    </td>

                </tr>
                ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Reports;