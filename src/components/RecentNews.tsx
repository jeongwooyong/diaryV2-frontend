import { useState } from 'react';
import PostDetail from './PostDetail';

// ✨ 부모로부터 받아올 프롭스 타입 정의 추가
interface RecentNewsProps {
  posts: any[];
  isAdmin: boolean;         // 로그인 여부
  refreshPosts: () => void; // 삭제 시 목록 새로고침 함수
}

export default function RecentNews({ posts, isAdmin, refreshPosts }: RecentNewsProps) {
  const [selectedPost, setSelectedPost] = useState<any | null>(null);
  
  // 최신 글 3개만 추출
  const recentPosts = posts.slice(0, 3);

  const stripHtml = (html: string) => {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return doc.body.textContent || "";
  };

  // ✨ 선택된 게시글 상세 보기 (isAdmin과 onDeleteSuccess 연결)
  if (selectedPost) {
    return (
      <PostDetail 
        post={selectedPost} 
        isAdmin={isAdmin} 
        onBack={() => setSelectedPost(null)} 
        onDeleteSuccess={() => {
          setSelectedPost(null); // 1. 상세 페이지 닫기
          refreshPosts();        // 2. 부모(App.tsx)의 데이터 새로고침 호출
        }} 
      />
    );
  }

  return (
    <div className="animate-fade-in-up">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {recentPosts.map((post) => {
          // 📸 S3 이미지 주소가 있으면 첫 번째 사진을, 없으면 기존 thumbnail 사용
          const thumb = (post.imageUrls && post.imageUrls.length > 0) ? post.imageUrls[0] : post.thumbnail;
          const displayDate = post.createdAt ? new Date(post.createdAt).toLocaleDateString('ko-KR') : post.date;

          return (
            <div 
              key={post.id}
              onClick={() => setSelectedPost(post)}
              className="group cursor-pointer"
            >
              <div className="relative aspect-video overflow-hidden rounded-2xl mb-4 bg-gray-100">
                {thumb ? (
                  <img 
                    src={thumb} 
                    alt={post.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    crossOrigin="anonymous" // CORS 방어
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300 font-bold">
                    No Image
                  </div>
                )}
              </div>
              <div className="px-2">
                <p className="text-sm text-blue-500 font-bold mb-1">{displayDate}</p>
                <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors line-clamp-1">
                  {post.title}
                </h3>
                <p className="text-gray-500 text-sm line-clamp-2">
                  {stripHtml(post.content)}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}