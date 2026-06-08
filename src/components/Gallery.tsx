import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import axios from 'axios';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

// 🎬 동영상 네트워크 에러 방지 및 첫 프레임 로딩 개선 컴포넌트
const LazyVideo = ({ src }: { src: string }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isIntersecting, setIsIntersecting] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setIsIntersecting(true);
          observer.disconnect(); 
        }
      },
      { threshold: 0.1 } 
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }
    
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="bg-gray-900 w-full aspect-video flex items-center justify-center relative rounded-2xl overflow-hidden shadow-sm">
      {!isIntersecting && <span className="text-gray-400 absolute text-sm font-bold">Loading... 🎬</span>}
      {isIntersecting && (
        <video 
          // 💡 [핵심 패치 1] iOS/모바일 사파리에서 첫 프레임(썸네일)을 강제로 렌더링하도록 힌트 추가
          src={`${src}#t=0.1`} 
          controls 
          // 💡 [핵심 패치 2] 모바일 브라우저의 가속 및 인라인 재생 표준 속성 부여
          preload="metadata"
          playsInline
          muted
          className="w-full h-full object-cover"
          crossOrigin="anonymous"
        />
      )}
    </div>
  );
};

interface GalleryProps {
  isLoggedIn: boolean;
  posts: any[];
}

export default function Gallery({ isLoggedIn, posts }: GalleryProps) {
  const [galleryTab, setGalleryTab] = useState<'photo' | 'video'>('photo');
  
  // 사진 관련 상태
  const [isSelectMode, setIsSelectMode] = useState(false); 
  const [selectedPhotos, setSelectedPhotos] = useState<string[]>([]); 
  const [isZipping, setIsZipping] = useState(false); 
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // 동영상 관련 상태
  const [videos, setVideos] = useState<string[]>([]);
  const [isVideoUploading, setIsVideoUploading] = useState(false);
  const videoInputRef = useRef<HTMLInputElement>(null);

  // App.tsx에서 받아온 posts에서 사진만 추출
  const allPhotos = useMemo(() => {
    return posts.flatMap((post) => {
      if (post.imageUrls) return post.imageUrls;
      if (post.images) return post.images.map((img: any) => img.url || img);
      return [];
    }).filter(Boolean);
  }, [posts]);

  // 동영상 목록 불러오기
  const fetchVideos = useCallback(async () => {
    try {
      const response = await axios.get('/api/videos');
      setVideos(response.data);
    } catch (error) {
      console.error('동영상 로드 실패:', error);
    }
  }, []);

  useEffect(() => {
    fetchVideos();
  }, [fetchVideos]);

  // --- 이벤트 핸들러 ---
  const handlePhotoClick = (photoUrl: string) => { 
    if (isSelectMode) { 
      setSelectedPhotos((prev) => prev.includes(photoUrl) ? prev.filter((url) => url !== photoUrl) : [...prev, photoUrl]); 
    } else { 
      setSelectedImage(photoUrl); 
    } 
  };

  const handleSingleDownload = async (url: string) => { 
    try { 
      const response = await fetch(url); 
        const blob = await response.blob(); 
        saveAs(blob, `suksuk_photo_${Date.now()}.jpg`); 
    } catch (error) { 
        console.error(error); 
    } 
  };
  
  const handleBatchDownload = async () => { 
    if (selectedPhotos.length === 0) return; 
    setIsZipping(true); 
    try { 
      const zip = new JSZip(); 
      const folder = zip.folder("suksuk_photos"); 
      const fetchPromises = selectedPhotos.map(async (url, index) => { 
        const response = await fetch(url); 
        const blob = await response.blob(); 
        folder?.file(`photo_${index + 1}.jpg`, blob); 
      }); 
      await Promise.all(fetchPromises); 
      const zipBlob = await zip.generateAsync({ type: "blob" }); 
      saveAs(zipBlob, `suksuk_album_${Date.now()}.zip`); 
      setIsSelectMode(false); 
      setSelectedPhotos([]); 
    } catch (error) { 
      console.error(error); 
    } finally { 
      setIsZipping(false); 
    } 
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 💡 용량 제한 버그 수정: 기존 코드가 10,000MB(10GB)로 잘못 계산되어 있던 부분을 100MB 표준 규격으로 정정
    if (file.size > 100 * 1024 * 1024) {
      alert("비용과 속도를 위해 100MB 이하의 짧은 영상만 업로드해주세요!");
      return;
    }

    setIsVideoUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      await axios.post('/api/videos/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      alert('동영상이 업로드되었습니다! 🎬');
      fetchVideos(); 
    } catch (error) {
      alert('동영상 업로드 중 오류가 발생했습니다.');
    } finally {
      setIsVideoUploading(false);
      if (videoInputRef.current) videoInputRef.current.value = '';
    }
  };

  return (
    <div className="animate-fade-in-up">
      {/* 탭 버튼 */}
      <div className="flex gap-4 mb-8">
        <button 
          onClick={() => setGalleryTab('photo')} 
          className={`px-8 py-3 rounded-full font-bold text-lg transition-all shadow-sm ${galleryTab === 'photo' ? 'bg-black text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
        >
          📷 사진
        </button>
        <button 
          onClick={() => setGalleryTab('video')} 
          className={`px-8 py-3 rounded-full font-bold text-lg transition-all shadow-sm ${galleryTab === 'video' ? 'bg-black text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
        >
          🎬 동영상
        </button>
      </div>

      {/* 사진 탭 */}
      {galleryTab === 'photo' && (
        <>
          {allPhotos.length > 0 && (
            <div className="flex justify-between items-center mb-6 bg-gray-50 p-4 rounded-2xl border border-gray-100">
              <span className="font-bold text-gray-700">총 <span className="text-blue-500">{allPhotos.length}</span>장의 사진</span>
              <div>
                {!isSelectMode ? (
                  <button onClick={() => setIsSelectMode(true)} className="px-5 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl font-bold text-sm shadow-sm hover:bg-gray-100 transition-colors">선택 후 다운로드</button>
                ) : (
                  <div className="flex items-center gap-3">
                    <button onClick={() => { setIsSelectMode(false); setSelectedPhotos([]); }} className="px-4 py-2 text-gray-500 font-medium text-sm hover:text-black" disabled={isZipping}>취소</button>
                    <button onClick={handleBatchDownload} disabled={selectedPhotos.length === 0 || isZipping} className={`px-6 py-2 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${selectedPhotos.length > 0 ? 'bg-black text-white hover:bg-gray-800 shadow-md' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}>
                      {isZipping ? <>처리 중... ⏳</> : <>({selectedPhotos.length}) 다운로드</>}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {allPhotos.length === 0 ? (
            <div className="bg-gray-50 border border-gray-100 rounded-[2.5rem] p-10 min-h-[400px] flex items-center justify-center">
              <p className="text-gray-400 font-bold text-xl">아직 등록된 사진이 없어요! 👶</p>
            </div>
          ) : (
            <div className="grid grid-cols-4 lg:grid-cols-8 gap-2 md:gap-4">
              {allPhotos.map((photoUrl, index) => {
                const isSelected = selectedPhotos.includes(photoUrl);
                return (
                  <div key={index} onClick={() => handlePhotoClick(photoUrl)} className={`aspect-square relative group overflow-hidden rounded-2xl md:rounded-[2rem] shadow-sm border-4 cursor-pointer transition-all duration-200 ${isSelectMode ? isSelected ? 'border-blue-500 scale-95 opacity-100' : 'border-transparent opacity-60 hover:opacity-100' : 'border-transparent bg-gray-50'}`}>
                    <img 
                      src={photoUrl} 
                      alt={`gallery-${index}`} 
                      loading="lazy" 
                      decoding="async" 
                      className={`w-full h-full object-cover transition-transform duration-700 ease-in-out ${!isSelectMode && 'group-hover:scale-110'}`} 
                      crossOrigin="anonymous" 
                    />
                    {!isSelectMode && (
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 flex items-center justify-center">
                        <span className="opacity-0 group-hover:opacity-100 text-white font-bold drop-shadow-md transition-opacity">크게 보기</span>
                      </div>
                    )}
                    {isSelectMode && (
                      <div className={`absolute top-3 right-3 w-7 h-7 rounded-full border-2 flex items-center justify-center transition-colors ${isSelected ? 'bg-blue-500 border-blue-500 text-white' : 'bg-black/20 border-white text-transparent'}`}>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* 동영상 탭 */}
      {galleryTab === 'video' && (
        <div className="animate-fade-in">
          <div className="flex justify-between items-center mb-6 bg-gray-50 p-4 rounded-2xl border border-gray-100">
            <span className="font-bold text-gray-700">총 <span className="text-blue-500">{videos.length}</span>개의 동영상</span>
            
            {isLoggedIn && (
              <div>
                <input 
                  type="file" 
                  accept="video/*" 
                  className="hidden" 
                  id="video-upload" 
                  ref={videoInputRef}
                  onChange={handleVideoUpload}
                />
                <button 
                  onClick={() => document.getElementById('video-upload')?.click()}
                  disabled={isVideoUploading}
                  className={`px-5 py-2 rounded-xl font-bold text-sm shadow-sm transition-colors flex items-center gap-2 ${isVideoUploading ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-blue-500 text-white hover:bg-blue-600'}`}
                >
                  {isVideoUploading ? '업로드 중... ⏳' : '+ 동영상 추가'}
                </button>
              </div>
            )}
          </div>

          {videos.length === 0 ? (
            <div className="bg-gray-50 border border-gray-100 rounded-[2.5rem] p-10 min-h-[400px] flex items-center justify-center">
              <p className="text-gray-400 font-bold text-xl">아직 등록된 동영상이 없어요! 🎬</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
              {videos.map((videoUrl, index) => (
                <LazyVideo key={index} src={videoUrl} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* 사진 크게 보기 모달 */}
      {selectedImage && ( 
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black bg-opacity-90 backdrop-blur-sm p-4 animate-fade-in-up">
          <button onClick={() => setSelectedImage(null)} className="absolute top-6 right-6 md:top-10 md:right-10 text-white hover:text-gray-300 bg-black bg-opacity-50 w-12 h-12 rounded-full flex items-center justify-center transition-colors z-[101]">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
          <img src={selectedImage} alt="expanded-view" className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl relative z-[100]" crossOrigin="anonymous" />
          <button onClick={() => handleSingleDownload(selectedImage)} className="absolute bottom-10 px-8 py-3 bg-white text-black font-bold rounded-full shadow-xl hover:bg-gray-100 hover:scale-105 transition-all flex items-center gap-2 z-[101]">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg> 이 사진 저장하기
          </button>
        </div>
      )}
    </div>
  );
}