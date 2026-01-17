// src/components/UserTrackingModal.tsx
import React, { useEffect, useState } from 'react';
import { FaTimes, FaHeart, FaBookmark, FaComment, FaSpinner } from 'react-icons/fa';
import type { User } from '../types/types';
import { getUserTracking } from '../services/dataService';

interface UserTrackingModalProps {
    user: User;
    onClose: () => void;
}

const UserTrackingModal: React.FC<UserTrackingModalProps> = ({ user, onClose }) => {
    const [trackingData, setTrackingData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'likes' | 'saves' | 'comments'>('likes');

    useEffect(() => {
        const fetchTracking = async () => {
            setLoading(true);
            try {
                const data = await getUserTracking(user.uid);
                setTrackingData(data);
            } catch (error) {
                console.error('Lỗi lấy tracking data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchTracking();
    }, [user.uid]);

    const formatDate = (timestamp: number) => {
        if (!timestamp) return 'N/A';
        return new Date(timestamp).toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const tabs = [
        { id: 'likes', label: 'Liked Videos', icon: FaHeart, count: trackingData?.likedVideos?.count || 0 },
        { id: 'saves', label: 'Saved Videos', icon: FaBookmark, count: trackingData?.savedVideos?.count || 0 },
        { id: 'comments', label: 'Comments', icon: FaComment, count: trackingData?.comments?.count || 0 },
    ];

    return (
        <div
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0, 0, 0, 0.6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000,
                padding: '20px'
            }}
            onClick={onClose}
        >
            <div
                style={{
                    background: 'white',
                    borderRadius: '16px',
                    maxWidth: '900px',
                    width: '100%',
                    maxHeight: '85vh',
                    display: 'flex',
                    flexDirection: 'column',
                    boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div style={{
                    padding: '24px',
                    borderBottom: '1px solid #eee',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <img
                            src={user.avatarUrl || `https://ui-avatars.com/api/?name=${user.username}&background=random`}
                            alt={user.username}
                            style={{ width: '56px', height: '56px', borderRadius: '50%', border: '2px solid #eee' }}
                        />
                        <div>
                            <h2 style={{ margin: 0, fontSize: '22px', fontWeight: '700' }}>
                                Tracking: @{user.username}
                            </h2>
                            <p style={{ margin: '4px 0 0', color: '#666', fontSize: '14px' }}>{user.email}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        style={{
                            background: '#f5f5f5',
                            border: 'none',
                            borderRadius: '50%',
                            width: '40px',
                            height: '40px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            transition: 'background 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#e0e0e0'}
                        onMouseLeave={(e) => e.currentTarget.style.background = '#f5f5f5'}
                    >
                        <FaTimes size={18} />
                    </button>
                </div>

                {/* Tabs */}
                <div style={{
                    display: 'flex',
                    borderBottom: '1px solid #eee',
                    padding: '0 24px',
                    gap: '8px'
                }}>
                    {tabs.map(tab => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                style={{
                                    padding: '16px 20px',
                                    border: 'none',
                                    background: 'transparent',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    fontSize: '14px',
                                    fontWeight: isActive ? '600' : '500',
                                    color: isActive ? '#fe2c55' : '#666',
                                    borderBottom: isActive ? '3px solid #fe2c55' : '3px solid transparent',
                                    transition: 'all 0.2s'
                                }}
                            >
                                <Icon size={16} />
                                {tab.label}
                                <span style={{
                                    background: isActive ? '#fe2c55' : '#e0e0e0',
                                    color: isActive ? 'white' : '#666',
                                    padding: '2px 8px',
                                    borderRadius: '12px',
                                    fontSize: '12px',
                                    fontWeight: '600'
                                }}>
                                    {tab.count}
                                </span>
                            </button>
                        );
                    })}
                </div>

                {/* Content */}
                <div style={{
                    flex: 1,
                    overflow: 'auto',
                    padding: '24px'
                }}>
                    {loading ? (
                        <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            height: '300px',
                            gap: '16px'
                        }}>
                            <FaSpinner size={32} color="#fe2c55" className="spinner" />
                            <p style={{ color: '#666' }}>Đang tải dữ liệu tracking...</p>
                        </div>
                    ) : (
                        <>
                            {/* Liked Videos */}
                            {activeTab === 'likes' && (
                                <div>
                                    {trackingData?.likedVideos?.videos?.length > 0 ? (
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
                                            {trackingData.likedVideos.videos.map((video: any) => (
                                                <div key={video.id} style={{
                                                    border: '1px solid #eee',
                                                    borderRadius: '12px',
                                                    overflow: 'hidden',
                                                    transition: 'transform 0.2s, box-shadow 0.2s',
                                                    cursor: 'pointer'
                                                }}
                                                    onMouseEnter={(e) => {
                                                        e.currentTarget.style.transform = 'translateY(-4px)';
                                                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        e.currentTarget.style.transform = 'translateY(0)';
                                                        e.currentTarget.style.boxShadow = 'none';
                                                    }}
                                                >
                                                    <video
                                                        src={video.videoUrl}
                                                        style={{ width: '100%', height: '280px', objectFit: 'cover', background: '#000' }}
                                                        muted
                                                    />
                                                    <div style={{ padding: '12px' }}>
                                                        <div style={{ fontSize: '13px', fontWeight: '600', marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                            {video.caption || 'No caption'}
                                                        </div>
                                                        <div style={{ fontSize: '12px', color: '#888', marginBottom: '4px' }}>
                                                            by @{video.ownerName}
                                                        </div>
                                                        <div style={{ fontSize: '11px', color: '#aaa' }}>
                                                            Liked: {formatDate(video.likedAt)}
                                                        </div>
                                                        <div style={{ fontSize: '11px', color: '#666', marginTop: '6px', display: 'flex', gap: '12px' }}>
                                                            <span>❤️ {video.likesCount || 0}</span>
                                                            <span>💬 {video.commentsCount || 0}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#888' }}>
                                            <FaHeart size={48} color="#ddd" style={{ marginBottom: '16px' }} />
                                            <p>Người dùng chưa like video nào</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Saved Videos */}
                            {activeTab === 'saves' && (
                                <div>
                                    {trackingData?.savedVideos?.videos?.length > 0 ? (
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
                                            {trackingData.savedVideos.videos.map((video: any) => (
                                                <div key={video.id} style={{
                                                    border: '1px solid #eee',
                                                    borderRadius: '12px',
                                                    overflow: 'hidden',
                                                    transition: 'transform 0.2s, box-shadow 0.2s',
                                                    cursor: 'pointer'
                                                }}
                                                    onMouseEnter={(e) => {
                                                        e.currentTarget.style.transform = 'translateY(-4px)';
                                                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        e.currentTarget.style.transform = 'translateY(0)';
                                                        e.currentTarget.style.boxShadow = 'none';
                                                    }}
                                                >
                                                    <video
                                                        src={video.videoUrl}
                                                        style={{ width: '100%', height: '280px', objectFit: 'cover', background: '#000' }}
                                                        muted
                                                    />
                                                    <div style={{ padding: '12px' }}>
                                                        <div style={{ fontSize: '13px', fontWeight: '600', marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                            {video.caption || 'No caption'}
                                                        </div>
                                                        <div style={{ fontSize: '12px', color: '#888', marginBottom: '4px' }}>
                                                            by @{video.ownerName}
                                                        </div>
                                                        <div style={{ fontSize: '11px', color: '#aaa' }}>
                                                            Saved: {formatDate(video.savedAt)}
                                                        </div>
                                                        <div style={{ fontSize: '11px', color: '#666', marginTop: '6px', display: 'flex', gap: '12px' }}>
                                                            <span>❤️ {video.likesCount || 0}</span>
                                                            <span>💬 {video.commentsCount || 0}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#888' }}>
                                            <FaBookmark size={48} color="#ddd" style={{ marginBottom: '16px' }} />
                                            <p>Người dùng chưa save video nào</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Comments */}
                            {activeTab === 'comments' && (
                                <div>
                                    {trackingData?.comments?.comments?.length > 0 ? (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                            {trackingData.comments.comments.map((comment: any) => (
                                                <div key={comment.id} style={{
                                                    border: '1px solid #eee',
                                                    borderRadius: '12px',
                                                    padding: '16px',
                                                    background: '#fafafa',
                                                    transition: 'background 0.2s'
                                                }}
                                                    onMouseEnter={(e) => e.currentTarget.style.background = '#f5f5f5'}
                                                    onMouseLeave={(e) => e.currentTarget.style.background = '#fafafa'}
                                                >
                                                    <div style={{ display: 'flex', gap: '12px', marginBottom: '8px' }}>
                                                        <img
                                                            src={comment.avatarUrl || `https://ui-avatars.com/api/?name=${comment.username}&background=random`}
                                                            alt={comment.username}
                                                            style={{ width: '40px', height: '40px', borderRadius: '50%' }}
                                                        />
                                                        <div style={{ flex: 1 }}>
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                                                                <span style={{ fontWeight: '600', fontSize: '14px' }}>@{comment.username}</span>
                                                                <span style={{ fontSize: '12px', color: '#888' }}>{formatDate(comment.timestamp)}</span>
                                                            </div>
                                                            <p style={{ margin: '0 0 8px', fontSize: '14px', color: '#333' }}>{comment.text}</p>
                                                            {comment.videoData && (
                                                                <div style={{
                                                                    background: 'white',
                                                                    border: '1px solid #e0e0e0',
                                                                    borderRadius: '8px',
                                                                    padding: '8px',
                                                                    fontSize: '12px',
                                                                    display: 'flex',
                                                                    gap: '8px',
                                                                    alignItems: 'center'
                                                                }}>
                                                                    <video
                                                                        src={comment.videoData.videoUrl}
                                                                        style={{ width: '60px', height: '80px', objectFit: 'cover', borderRadius: '6px', background: '#000' }}
                                                                        muted
                                                                    />
                                                                    <div style={{ flex: 1 }}>
                                                                        <div style={{ fontWeight: '600', marginBottom: '2px' }}>
                                                                            {comment.videoData.caption || 'No caption'}
                                                                        </div>
                                                                        <div style={{ color: '#888' }}>by @{comment.videoData.ownerName}</div>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#888' }}>
                                            <FaComment size={48} color="#ddd" style={{ marginBottom: '16px' }} />
                                            <p>Người dùng chưa comment video nào</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* CSS Animation for spinner */}
            <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .spinner {
          animation: spin 1s linear infinite;
        }
      `}</style>
        </div>
    );
};

export default UserTrackingModal;
