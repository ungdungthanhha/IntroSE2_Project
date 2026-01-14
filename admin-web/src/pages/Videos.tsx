// src/pages/Dashboard.tsx
import React, { useEffect, useState } from 'react';
import type { Video } from '../types/types';
import { FaPlay, FaTrash, FaSync } from 'react-icons/fa';
import { getVideos, deleteVideo } from '../services/dataService';
import { useSearch } from '../context/SearchContext';

const Dashboard: React.FC = () => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);

  const { searchTerm } = useSearch();

  const fetchData = async () => {
    setLoading(true);
    const data = await getVideos();
    const sortedData = data.sort((a, b) => b.timestamp - a.timestamp);
    setVideos(sortedData);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleDelete = async (videoId: string) => {
    const confirm = window.confirm("CẢNH BÁO: Bạn có chắc chắn muốn xóa video này vĩnh viễn?");
    if (confirm) {
      try {
        await deleteVideo(videoId);
        setVideos(prev => prev.filter(v => v.id !== videoId));
        alert("Đã xóa thành công!");
      } catch (error) { alert("Lỗi khi xóa video!"); }
    }
  };

  // Hàm format ngày tháng
  const formatDate = (timestamp: number) => {
    if (!timestamp) return "N/A";
    return new Date(timestamp).toLocaleDateString('vi-VN', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  // 2. LOGIC LỌC TÌM KIẾM (Quan trọng nhất)
  const filteredVideos = videos.filter((v) => {
    // Nếu ô tìm kiếm rỗng thì hiện tất cả
    if (!searchTerm) return true;

    const term = searchTerm.toLowerCase().trim();

    // Tìm kiếm trong: ID, Caption, Tên người đăng
    return (
      v.id.toLowerCase().includes(term) ||
      (v.caption || "").toLowerCase().includes(term) ||
      v.ownerName.toLowerCase().includes(term)
    );
  });

  if (loading) { return <div style={{ padding: '40px', textAlign: 'center' }}>⏳ Đang tải dữ liệu...</div>; }

  return (
    <div style={{ padding: '24px', background: '#f8f9fa', minHeight: '100vh' }}>

      {/* Header của Dashboard */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#333' }}>Quản lý Video</h2>
        <button onClick={fetchData} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', border: 'none', background: '#333', color: 'white', borderRadius: '6px', cursor: 'pointer' }}>
          <FaSync /> Làm mới
        </button>
      </div>

      {/* Hiển thị dòng thông báo nếu đang tìm kiếm */}
      {searchTerm && (
        <div style={{ marginBottom: '15px', fontStyle: 'italic', color: '#666' }}>
          🔍 Kết quả tìm kiếm cho: "<b>{searchTerm}</b>" ({filteredVideos.length} kết quả)
        </div>
      )}

      {/* Bảng dữ liệu */}
      <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ background: '#f8f8f8', borderBottom: '1px solid #eee' }}>
            <tr style={{ textAlign: 'left', color: '#666', fontSize: '14px' }}>
              <th style={{ padding: '16px' }}>Video</th>
              <th style={{ padding: '16px' }}>Mô tả</th>
              <th style={{ padding: '16px' }}>Người đăng</th>
              <th style={{ padding: '16px' }}>Thống kê</th>
              <th style={{ padding: '16px' }}>Thời gian</th>
              <th style={{ padding: '16px' }}>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {filteredVideos.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: '#888' }}>
                  {searchTerm ? "Không tìm thấy video nào phù hợp." : "Chưa có video nào trong Database."}
                </td>
              </tr>
            ) : (
              filteredVideos.map((v) => (
                <tr key={v.id} style={{ borderBottom: '1px solid #eee' }}>

                  {/* Cột 1: Video Preview (Dùng thẻ Video vì không có thumbnail) */}
                  <td style={{ padding: '16px' }}>
                    <div style={{ position: 'relative', width: '60px', height: '80px', borderRadius: '8px', overflow: 'hidden', backgroundColor: '#000', cursor: 'pointer' }}>
                      <video
                        src={v.videoUrl}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        muted loop playsInline
                        onMouseOver={(e) => e.currentTarget.play()}
                        onMouseOut={(e) => { e.currentTarget.pause(); e.currentTarget.currentTime = 0; }}
                      />
                      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: 'white', pointerEvents: 'none', opacity: 0.8 }}>
                        <FaPlay size={12} />
                      </div>
                    </div>
                    <div style={{ fontSize: '10px', color: '#aaa', marginTop: '4px' }}>ID: {v.id.substring(0, 6)}...</div>
                  </td>

                  {/* Cột 2: Caption */}
                  <td style={{ padding: '16px', verticalAlign: 'top', maxWidth: '250px' }}>
                    <p style={{ margin: 0, fontWeight: '500', lineHeight: '1.4', fontSize: '14px' }}>{v.caption || "Không có mô tả"}</p>
                    <a href={v.videoUrl} target="_blank" rel="noreferrer" style={{ fontSize: '12px', color: '#fe2c55', textDecoration: 'none', display: 'block', marginTop: '5px' }}>Xem video gốc &rarr;</a>
                  </td>

                  {/* Cột 3: Owner */}
                  <td style={{ padding: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <img src={v.ownerAvatar || "https://ui-avatars.com/api/?name=User"} alt="avt" style={{ width: '36px', height: '36px', borderRadius: '50%', border: '1px solid #eee' }} />
                      <div>
                        <div style={{ fontWeight: 'bold', fontSize: '13px' }}>{v.ownerName}</div>
                        <div style={{ fontSize: '11px', color: '#888' }}>UID: {v.ownerUid?.substring(0, 6)}...</div>
                      </div>
                    </div>
                  </td>

                  {/* Cột 4: Stats */}
                  <td style={{ padding: '16px', color: '#555', fontSize: '13px' }}>
                    <div style={{ marginBottom: '4px' }}>❤️ <b>{v.likesCount?.toLocaleString() || 0}</b></div>
                    <div>💬 <b>{v.commentsCount?.toLocaleString() || 0}</b></div>
                  </td>

                  {/* Cột 5: Time */}
                  <td style={{ padding: '16px', fontSize: '13px', color: '#666' }}>{formatDate(v.timestamp)}</td>

                  {/* Cột 6: Action */}
                  <td style={{ padding: '16px' }}>
                    <button onClick={() => handleDelete(v.id)} style={{ padding: '8px 12px', border: '1px solid #fe2c55', color: '#fe2c55', background: 'white', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
                      <FaTrash size={12} /> Xóa
                    </button>
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

export default Dashboard;