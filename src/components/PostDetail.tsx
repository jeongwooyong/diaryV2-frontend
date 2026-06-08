import axios from 'axios';

interface PostDetailProps {
  post: any;
  isAdmin?: boolean;            // ✨ ?를 붙여서 에러 방지 (값이 안 넘어와도 안 뻗음)
  onBack: () => void;
  onDeleteSuccess?: () => void; // ✨ ?를 붙여서 에러 방지
}

export default function PostDetail({ post, isAdmin, onBack, onDeleteSuccess }: PostDetailProps) {
  // 💡 방어적 코드: post 데이터가 전달되지 않았으면 화면 렌더링 중단
  if (!post) return null;

  // 💡 방어적 코드: 본문(content)이 null일 경우 화면이 뻗는 현상 방지
  const createMarkup = () => ({ __html: post.content || "<p>내용이 없습니다.</p>" });

  const formattedDate = post.createdAt 
    ? new Date(post.createdAt).toLocaleDateString('ko-KR') 
    : (post.date || '');

  const images = post.imageUrls && post.imageUrls.length > 0 
    ? post.imageUrls 
    : post.thumbnail ? [post.thumbnail] : [];

  // 🗑️ 삭제 기능 핸들러
  const handleDelete = async () => {
    if (!window.confirm("정말 이 추억을 삭제할까요?")) return;

    try {
      await axios.delete(`/api/posts/${post.id}`);
      alert("삭제되었습니다.");
      if (onDeleteSuccess) {
        onDeleteSuccess(); // 부모 컴포넌트에게 알려 목록으로 돌아가기
      } else {
        onBack(); // onDeleteSuccess가 없으면 걍 뒤로가기 실행
      }
    } catch (error) {
      console.error("삭제 실패:", error);
      alert("삭제 중 오류가 발생했습니다.");
    }
  };

  return (
    <div className="animate-fade-in-up max-w-4xl mx-auto pb-20 px-4">
      {/* 🌟 상단 네비게이션 영역 (뒤로가기 & 삭제 버튼) */}
      <div className="flex justify-between items-center mb-8">
        <button 
          onClick={onBack}
          className="text-gray-500 hover:text-black font-bold flex items-center gap-2 transition-colors"
        >
          ← 목록으로 돌아가기
        </button>

        {/* ✨ 관리자(로그인) 상태일 때만 우측 상단에 삭제 버튼 표시 */}
        {isAdmin && (
          <button 
            onClick={handleDelete}
            className="text-gray-400 hover:text-red-500 font-bold flex items-center gap-1 transition-colors px-3 py-2 rounded-lg hover:bg-red-50"
            title="게시글 삭제"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            삭제
          </button>
        )}
      </div>

      {/* 📸 가로 스크롤 갤러리 */}
      {images.length > 0 && (
        <div className="mb-12 relative">
          <div className="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-4 scrollbar-hide scroll-smooth">
            {images.map((url: string, index: number) => (
              <div key={index} className="flex-shrink-0 w-full md:w-[80%] snap-center">
                <img 
                  src={url} 
                  alt={`post-img-${index}`} 
                  className="w-full aspect-[4/3] object-cover rounded-[2.5rem] shadow-md border border-gray-100"
                  crossOrigin="anonymous"
                />
              </div>
            ))}
          </div>
          <p className="text-center text-xs text-gray-400 mt-2">← 좌우로 밀어서 사진을 확인하세요 →</p>
        </div>
      )}

      {/* 📝 본문 영역 */}
      <div className="bg-white rounded-[2.5rem] p-8 md:p-14 shadow-sm border border-gray-100">
        <div className="border-b border-gray-50 pb-8 mb-10 text-center">
          <h1 className="text-3xl md:text-5xl font-black text-gray-900 mb-6 tracking-tight leading-tight">
            {post.title || '제목 없음'}
          </h1>
          <div className="text-gray-400 font-medium flex justify-center items-center gap-3 text-sm md:text-base">
            <span>{post.author || '관리자'}</span>
            <span className="w-1.5 h-1.5 rounded-full bg-gray-200"></span>
            <span>{formattedDate}</span>
          </div>
        </div>

        <div 
          className="prose prose-lg max-w-none text-gray-700 leading-relaxed prose-img:rounded-3xl"
          dangerouslySetInnerHTML={createMarkup()} 
        />
      </div>
    </div>
  );
}