import { useState } from 'react';
import PostForm from './PostForm';
import PostDetail from './PostDetail';

interface PostListProps {
  posts: any[];
  isAdmin: boolean;
  refreshPosts: () => void;
}

// 💡 맥미니 스프링 부트 서버의 베이스 주소를 정의합니다. (포트 번호나 IP는 환경에 맞게 수정)
const BACKEND_URL = "http://localhost:8080"; 

export default function PostList({ posts, isAdmin, refreshPosts }: PostListProps) {
  const [isWriting, setIsWriting] = useState(false);
  const [selectedPost, setSelectedPost] = useState<any | null>(null);
  
  // ✨ HTML 태그 및 특수 기호(&nbsp; 등)를 제거하는 함수
  const stripHtml = (html: string) => {
    if (!html) return "";
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return doc.body.textContent || "";
  };

  // ✍️ 글 작성 화면 처리
  if (isWriting) {
    return (
      <PostForm 
        onCancel={() => setIsWriting(false)} 
        onSuccess={() => {
          setIsWriting(false); 
          refreshPosts();
        }}
      />
    );
  }

  // 📝 상세 페이지 화면 처리
  if (selectedPost) {
    return (
      <PostDetail 
        post={selectedPost} 
        isAdmin={isAdmin} 
        onBack={() => setSelectedPost(null)} 
        onDeleteSuccess={() => {
          setSelectedPost(null); 
          refreshPosts();        
        }} 
      />
    );
  }

  return (
    <div className="animate-fade-in-up">
      <div className="flex justify-between items-center border-b-2 border-black pb-4 mb-8">
        <span className="font-bold text-gray-600">
          전체 <span className="text-black">{posts.length}</span>건
        </span>
        {isAdmin && (
          <button 
            onClick={() => setIsWriting(true)}
            className="bg-black text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-gray-800 transition-all shadow-md"
          >
            글 작성하기
          </button>
        )}
      </div>

      <div className="space-y-6">
        {posts.map((post) => {
          
          // 📸 [경로 정정 로직] 썸네일 우선 매핑 및 백엔드 도메인 주소 조립
          const getThumbnailUrl = () => {
            // 1. 새 백엔드의 썸네일 주소가 있는 경우 (최우선순위)
            if (post.thumbnailUrl) return `${BACKEND_URL}${post.thumbnailUrl}`;
            // 2. 썸네일은 없고 원본 파일 주소만 있는 경우
            if (post.fileUrl) return `${BACKEND_URL}${post.fileUrl}`;
            // 3. 기존 이관 전 배열 형태의 데이터 구조 방어용
            if (post.imageUrls && post.imageUrls.length > 0) {
              const url = post.imageUrls[0];
              return url.startsWith('http') ? url : `${BACKEND_URL}${url}`;
            }
            return null;
          };

          const thumbnail = getThumbnailUrl();
          const date = post.createdAt ? new Date(post.createdAt).toLocaleDateString('ko-KR') : post.date;

          return (
            <div 
              key={post.id} 
              onClick={() => setSelectedPost(post)}
              className="flex gap-6 p-4 hover:bg-gray-50 rounded-2xl transition-colors cursor-pointer border border-transparent hover:border-gray-100"
            >
              {/* 🖼️ 썸네일 영역 */}
              <div className="w-32 h-32 md:w-40 md:h-40 flex-shrink-0 overflow-hidden rounded-xl bg-gray-100">
                {thumbnail ? (
                  <img 
                    src={thumbnail} 
                    alt={post.title} 
                    className="w-full h-full object-cover"
                    crossOrigin="anonymous" // CORS 방어
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs text-center p-2">
                    이미지 없음
                  </div>
                )}
              </div>
              
              <div className="flex flex-col justify-center flex-1">
                <h3 className="text-lg md:text-2xl font-bold text-gray-900 mb-2">{post.title}</h3>
                
                {/* 📝 본문 요약 */}
                <p className="text-gray-500 text-sm md:text-base line-clamp-2 mb-3">
                  {stripHtml(post.content)}
                </p>

                <div className="text-xs md:text-sm text-gray-400 font-medium">
                  <span>{post.author || '관리자'}</span>
                  <span className="mx-2">|</span>
                  <span>{date}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}