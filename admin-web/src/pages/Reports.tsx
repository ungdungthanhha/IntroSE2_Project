// src/pages/Reports.tsx
import React, { useEffect, useState } from 'react';
import { FaPlay, FaTrashAlt, FaTimesCircle, FaClock, FaUserShield, FaCheckCircle, FaSync, FaComment, FaVideo } from 'react-icons/fa';
import { getReportsFull, updateReportStatus, deleteVideo, getCommentReportsFull, updateCommentReportStatus, deleteComment, type ReportPopulated, type CommentReportPopulated } from '../services/dataService';
import { useSearch } from '../context/SearchContext';

type TabType = 'video' | 'comment';

const Reports: React.FC = () => {
  const [videoReports, setVideoReports] = useState<ReportPopulated[]>([]);
  const [commentReports, setCommentReports] = useState<CommentReportPopulated[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('video');

  const { searchTerm } = useSearch();

  const fetchData = async () => {
    setLoading(true);
    const [videoData, commentData] = await Promise.all([
      getReportsFull(),
      getCommentReportsFull()
    ]);
    setVideoReports(videoData);
    setCommentReports(commentData);
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

      setVideoReports(prev => prev.map(r =>
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
      setVideoReports(prev => prev.map(r =>
        r.id === report.id ? { ...r, status: 'rejected' } : r
      ));
    } catch (error) {
      alert("Lỗi cập nhật trạng thái!");
    }
  };

  // Comment Report Handlers
  const handleCommentResolve = async (report: CommentReportPopulated) => {
    const confirm = window.confirm(
      "⚠️ XÁC NHẬN: Comment này vi phạm?\n\nHành động này sẽ:\n1. XÓA bình luận này.\n2. Đánh dấu báo cáo là 'Đã giải quyết'."
    );
    if (!confirm) return;

    try {
      await deleteComment(report.videoId, report.commentId);
      await updateCommentReportStatus(report.id, 'resolved');

      setCommentReports(prev => prev.map(r =>
        r.id === report.id ? { ...r, status: 'resolved' } : r
      ));

      alert("Đã xóa comment vi phạm thành công!");
    } catch (error) {
      alert("Lỗi xử lý! Có thể comment đã bị xóa trước đó.");
    }
  };

  const handleCommentReject = async (report: CommentReportPopulated) => {
    const confirm = window.confirm("Bạn xác nhận comment này AN TOÀN và muốn bỏ qua báo cáo?");
    if (!confirm) return;

    try {
      await updateCommentReportStatus(report.id, 'rejected');
      setCommentReports(prev => prev.map(r =>
        r.id === report.id ? { ...r, status: 'rejected' } : r
      ));
    } catch (error) {
      alert("Lỗi cập nhật trạng thái!");
    }
  };

  const formatDate = (ms: number | undefined) => {
    if (!ms) return "N/A";
    return new Date(ms).toLocaleDateString('vi-VN', {
      day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
    });
  };

  // Format reason enum to readable text
  const formatReason = (reason: string) => {
    const reasonMap: Record<string, string> = {
      'spam': 'Spam / Lừa đảo',
      'inappropriate': 'Nội dung không phù hợp',
      'harassment': 'Quấy rối / Bắt nạt',
      'violence': 'Bạo lực / Nguy hiểm',
      'false_info': 'Thông tin sai lệch',
      'other': 'Lý do khác'
    };
    return reasonMap[reason] || reason;
  };

  const filteredVideoReports = videoReports.filter((r) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase().trim();
    return (
      r.videoId.toLowerCase().includes(term) ||
      r.reason.toLowerCase().includes(term) ||
      (r.additionalInfo || "").toLowerCase().includes(term) ||
      (r.reporterData?.username || "").toLowerCase().includes(term) ||
      (r.reportedBy || r.reportedByUid || "").toLowerCase().includes(term) ||
      (r.videoData?.caption || "").toLowerCase().includes(term)
    );
  });

  const filteredCommentReports = commentReports.filter((r) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase().trim();
    return (
      r.commentId.toLowerCase().includes(term) ||
      r.commentText.toLowerCase().includes(term) ||
      r.reason.toLowerCase().includes(term) ||
      (r.additionalInfo || "").toLowerCase().includes(term) ||
      (r.reporterData?.username || "").toLowerCase().includes(term) ||
      (r.commentOwnerName || "").toLowerCase().includes(term)
    );
  });

  const pendingVideoCount = videoReports.filter(r => r.status === 'pending').length;
  const pendingCommentCount = commentReports.filter(r => r.status === 'pending').length;

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

      {/* --- TABS --- */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        <button
          onClick={() => setActiveTab('video')}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 20px', border: 'none',
            background: activeTab === 'video' ? '#fe2c55' : '#e9ecef', color: activeTab === 'video' ? 'white' : '#333',
            borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '14px', transition: '0.2s'
          }}
        >
          <FaVideo /> Video Reports
          {pendingVideoCount > 0 && (
            <span style={{ background: activeTab === 'video' ? 'white' : '#fe2c55', color: activeTab === 'video' ? '#fe2c55' : 'white', padding: '2px 8px', borderRadius: '12px', fontSize: '12px' }}>
              {pendingVideoCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('comment')}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 20px', border: 'none',
            background: activeTab === 'comment' ? '#fe2c55' : '#e9ecef', color: activeTab === 'comment' ? 'white' : '#333',
            borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '14px', transition: '0.2s'
          }}
        >
          <FaComment /> Comment Reports
          {pendingCommentCount > 0 && (
            <span style={{ background: activeTab === 'comment' ? 'white' : '#fe2c55', color: activeTab === 'comment' ? '#fe2c55' : 'white', padding: '2px 8px', borderRadius: '12px', fontSize: '12px' }}>
              {pendingCommentCount}
            </span>
          )}
        </button>
      </div>

      {/* Hiển thị kết quả tìm kiếm nếu đang tìm */}
      {searchTerm && (
        <div style={{ marginBottom: '15px', fontStyle: 'italic', color: '#666' }}>
          🔍 Kết quả tìm kiếm cho: "<b>{searchTerm}</b>" ({activeTab === 'video' ? filteredVideoReports.length : filteredCommentReports.length} báo cáo)
        </div>
      )}

      {/* --- VIDEO REPORTS TAB --- */}
      {activeTab === 'video' && (
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
              {filteredVideoReports.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: '30px', textAlign: 'center', color: '#888' }}>
                    {searchTerm ? "Không tìm thấy báo cáo nào phù hợp." : "Tuyệt vời! Không có báo cáo video nào."}
                  </td>
                </tr>
              ) : (
                filteredVideoReports.map((r) => (
                  <tr key={r.id} style={{ borderBottom: '1px solid #f1f3f5', transition: '0.2s' }}>
                    <td style={{ padding: '16px' }}>
                      <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                        {r.videoData?.videoUrl ? (
                          <div style={{ position: 'relative', width: '60px', height: '90px', background: '#000', borderRadius: '8px', overflow: 'hidden', flexShrink: 0, cursor: 'pointer' }}>
                            <video src={r.videoData.videoUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} muted loop playsInline
                              onMouseOver={(e) => e.currentTarget.play()} onMouseOut={(e) => { e.currentTarget.pause(); e.currentTarget.currentTime = 0; }} />
                            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: 'white', pointerEvents: 'none', opacity: 0.8 }}><FaPlay size={14} /></div>
                          </div>
                        ) : (
                          <div style={{ position: 'relative', width: '60px', height: '90px', background: '#eee', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <span style={{ fontSize: '10px', color: '#999', textAlign: 'center' }}>Đã xóa</span>
                          </div>
                        )}
                        <div>
                          <div style={{ fontWeight: '600', fontSize: '14px', marginBottom: '4px', color: '#2c3e50' }}>ID: {r.videoId.substring(0, 8)}...</div>
                          <div style={{ fontSize: '13px', color: '#555', maxWidth: '200px', lineHeight: '1.4', marginBottom: '6px' }}>
                            {r.videoData?.caption || <span style={{ color: 'red', fontStyle: 'italic' }}>(Video này đã bị xóa)</span>}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '16px' }}>
                      <div style={{ fontWeight: '700', color: '#e74c3c', fontSize: '14px', marginBottom: '6px' }}>{formatReason(r.reason)}</div>
                      {r.additionalInfo && <div style={{ fontSize: '12px', color: '#555', marginBottom: '6px', fontStyle: 'italic' }}>"{r.additionalInfo}"</div>}
                      <div style={{ fontSize: '12px', color: '#888', display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <FaUserShield size={12} />
                        {r.reporterData ? `@${r.reporterData.username}` : r.reporterName ? `@${r.reporterName}` : `UID: ${r.reportedBy || r.reportedByUid}`}
                      </div>
                    </td>
                    <td style={{ padding: '16px', fontSize: '13px', color: '#666' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><FaClock color="#bdc3c7" /> {formatDate(r.timestamp || r.createdAt)}</div>
                    </td>
                    <td style={{ padding: '16px' }}>
                      {r.status === 'pending' && <span style={{ background: '#fff7e6', color: '#d35400', padding: '6px 12px', borderRadius: '30px', fontSize: '12px', fontWeight: 'bold' }}>⏳ Chờ xử lý</span>}
                      {r.status === 'resolved' && <span style={{ background: '#e6fffa', color: '#00b894', padding: '6px 12px', borderRadius: '30px', fontSize: '12px', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '5px' }}><FaCheckCircle /> Đã xóa</span>}
                      {r.status === 'rejected' && <span style={{ background: '#f1f2f6', color: '#747d8c', padding: '6px 12px', borderRadius: '30px', fontSize: '12px', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '5px' }}><FaTimesCircle /> Đã bác bỏ</span>}
                    </td>
                    <td style={{ padding: '16px' }}>
                      {r.status === 'pending' ? (
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button onClick={() => handleResolve(r)} title="Xác nhận vi phạm & Xóa Video"
                            style={{ padding: '8px 12px', background: '#ffebee', color: '#e74c3c', border: '1px solid #ffcdd2', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
                            <FaTrashAlt /> Xóa
                          </button>
                          <button onClick={() => handleReject(r)} title="Video này an toàn"
                            style={{ padding: '8px 12px', background: '#f1f2f6', color: '#2f3542', border: '1px solid #dfe4ea', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
                            <FaTimesCircle /> Bỏ qua
                          </button>
                        </div>
                      ) : <div style={{ fontSize: '13px', color: '#b2bec3', fontStyle: 'italic' }}>Hoàn tất</div>}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* --- COMMENT REPORTS TAB --- */}
      {activeTab === 'comment' && (
        <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ background: '#f8f9fa', borderBottom: '1px solid #e9ecef' }}>
              <tr style={{ textAlign: 'left', color: '#6c757d', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                <th style={{ padding: '16px' }}>Bình luận Vi phạm</th>
                <th style={{ padding: '16px' }}>Lý do & Người báo</th>
                <th style={{ padding: '16px' }}>Thời gian</th>
                <th style={{ padding: '16px' }}>Trạng thái</th>
                <th style={{ padding: '16px' }}>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {filteredCommentReports.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: '30px', textAlign: 'center', color: '#888' }}>
                    {searchTerm ? "Không tìm thấy báo cáo nào phù hợp." : "Tuyệt vời! Không có báo cáo bình luận nào."}
                  </td>
                </tr>
              ) : (
                filteredCommentReports.map((r) => (
                  <tr key={r.id} style={{ borderBottom: '1px solid #f1f3f5', transition: '0.2s' }}>
                    <td style={{ padding: '16px' }}>
                      <div style={{ maxWidth: '300px' }}>
                        <div style={{ background: '#f8f9fa', padding: '10px', borderRadius: '8px', borderLeft: '3px solid #fe2c55', marginBottom: '8px' }}>
                          <div style={{ fontSize: '12px', color: '#888', marginBottom: '4px' }}>@{r.commentOwnerName}</div>
                          <div style={{ fontSize: '13px', color: '#333', fontStyle: 'italic' }}>"{r.commentText}"</div>
                        </div>
                        <div style={{ fontSize: '11px', color: '#888' }}>
                          Video: {r.videoData?.caption?.substring(0, 30) || r.videoId.substring(0, 8)}...
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '16px' }}>
                      <div style={{ fontWeight: '700', color: '#e74c3c', fontSize: '14px', marginBottom: '6px' }}>{formatReason(r.reason)}</div>
                      {r.additionalInfo && <div style={{ fontSize: '12px', color: '#555', marginBottom: '6px', fontStyle: 'italic' }}>"{r.additionalInfo}"</div>}
                      <div style={{ fontSize: '12px', color: '#888', display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <FaUserShield size={12} />
                        {r.reporterData ? `@${r.reporterData.username}` : r.reporterName ? `@${r.reporterName}` : `UID: ${r.reportedBy}`}
                      </div>
                    </td>
                    <td style={{ padding: '16px', fontSize: '13px', color: '#666' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><FaClock color="#bdc3c7" /> {formatDate(r.timestamp || r.createdAt)}</div>
                    </td>
                    <td style={{ padding: '16px' }}>
                      {r.status === 'pending' && <span style={{ background: '#fff7e6', color: '#d35400', padding: '6px 12px', borderRadius: '30px', fontSize: '12px', fontWeight: 'bold' }}>⏳ Chờ xử lý</span>}
                      {r.status === 'resolved' && <span style={{ background: '#e6fffa', color: '#00b894', padding: '6px 12px', borderRadius: '30px', fontSize: '12px', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '5px' }}><FaCheckCircle /> Đã xóa</span>}
                      {r.status === 'rejected' && <span style={{ background: '#f1f2f6', color: '#747d8c', padding: '6px 12px', borderRadius: '30px', fontSize: '12px', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '5px' }}><FaTimesCircle /> Đã bác bỏ</span>}
                    </td>
                    <td style={{ padding: '16px' }}>
                      {r.status === 'pending' ? (
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button onClick={() => handleCommentResolve(r)} title="Xác nhận vi phạm & Xóa Comment"
                            style={{ padding: '8px 12px', background: '#ffebee', color: '#e74c3c', border: '1px solid #ffcdd2', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
                            <FaTrashAlt /> Xóa
                          </button>
                          <button onClick={() => handleCommentReject(r)} title="Comment này an toàn"
                            style={{ padding: '8px 12px', background: '#f1f2f6', color: '#2f3542', border: '1px solid #dfe4ea', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
                            <FaTimesCircle /> Bỏ qua
                          </button>
                        </div>
                      ) : <div style={{ fontSize: '13px', color: '#b2bec3', fontStyle: 'italic' }}>Hoàn tất</div>}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Reports;