import { useState, useRef, useMemo } from 'react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import axios from 'axios';
// 🚀 드래그 앤 드롭 라이브러리 추가
import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd';

interface PostFormProps {
  onCancel: () => void;
  onSuccess: () => void;
}

export default function PostForm({ onCancel, onSuccess }: PostFormProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [images, setImages] = useState<string[]>([]); 
  const [isUploading, setIsUploading] = useState(false); 
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 📸 1. 사진 추가 핸들러 
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    setIsUploading(true);

    const uploadPromises = Array.from(files).map(async (file) => {
      const formData = new FormData();
      formData.append('file', file); 

      try {
        const response = await axios.post('/api/images/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        return response.data; 
      } catch (error) {
        console.error('이미지 업로드 실패:', error);
        return null;
      }
    });

    try {
      const uploadedUrls = await Promise.all(uploadPromises);
      const validUrls = uploadedUrls.filter((url) => url !== null);
      setImages((prev) => [...prev, ...validUrls]);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // 🗑️ 2. 사진 삭제 핸들러 
  const removeImage = (indexToRemove: number) => {
    setImages((prev) => prev.filter((_, index) => index !== indexToRemove));
  };

  // 🔄 3. 드래그 앤 드롭 순서 변경 핸들러
  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return; // 영역 밖으로 드롭한 경우 무시

    const newImages = Array.from(images);
    const [reorderedItem] = newImages.splice(result.source.index, 1);
    newImages.splice(result.destination.index, 0, reorderedItem);

    setImages(newImages); // 변경된 순서 반영 (0번 인덱스가 썸네일이 됨)
  };

  const modules = useMemo(() => ({
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      [{ 'size': ['small', false, 'large', 'huge'] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'align': [] }],
      ['clean']
    ]
  }), []);

  // 🚀 4. 최종 서버 저장 핸들러
  const handleSubmit = async () => {
    if (!title || (!content && images.length === 0)) {
      alert("제목과 내용(또는 사진)을 입력해주세요.");
      return;
    }

    // ✨ 시간 계산
    const now = new Date();
    const localTime = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
                        .toISOString()
                        .slice(0, 19); // "2026-05-05T19:17:45" 형태로 자르기

    // ✨ LoginModal에서 저장해둔 작성자 이름(daddy 등)을 가져옵니다.
    // 만약 로그아웃 상태이거나 로컬 스토리지에 값이 없으면 '관리자'로 기본 설정합니다.
    const authorName = localStorage.getItem('userName') || '관리자';

    const postData = { 
      title: title, 
      content: content, 
      imageUrls: images, 
      author: authorName,   // 👈 백엔드에 문자열(String) 이름 전송!
      createdAt: localTime  
    };

    try {
      await axios.post('/api/posts', postData);
      alert("소중한 추억이 저장되었습니다! 👶");
      onCancel();
      onSuccess();
    } catch (error) {
      console.error('게시글 저장 실패:', error);
      alert("저장 중 오류가 발생했습니다.");
    }
  };

  return (
    <div className="bg-white border border-gray-100 rounded-[2.5rem] p-6 md:p-12 shadow-2xl animate-fade-in-up max-w-5xl mx-auto">
      <div className="space-y-8">
        <input 
          type="text" 
          value={title} 
          onChange={(e) => setTitle(e.target.value)}
          placeholder="제목을 입력하세요" 
          className="w-full text-2xl md:text-4xl font-bold border-none outline-none px-0"
        />

        {/* 사진 첨부 영역 */}
        <div className="space-y-3">
          <div className="flex justify-between items-end">
            <label className="block text-lg font-bold text-gray-900">
                사진 첨부 <span className="text-blue-500">{images.length}</span>
                {isUploading && <span className="ml-2 text-sm text-gray-400 font-normal">업로드 중...</span>}
            </label>
            <button 
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className={`text-sm font-bold px-4 py-2 rounded-lg transition-colors ${isUploading ? 'bg-gray-100 text-gray-400' : 'bg-blue-50 text-blue-500 hover:text-blue-700'}`}
            >
              + 사진 추가
            </button>
            <input 
              type="file" 
              multiple 
              accept="image/*" 
              ref={fileInputRef} 
              onChange={handleImageUpload} 
              className="hidden" 
            />
          </div>

          {/* 🌟 드래그 앤 드롭 UI 영역 */}
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="image-list" direction="horizontal">
              {(provided) => (
                <div 
                  className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar items-center min-h-[160px] bg-gray-50 rounded-2xl p-4 border border-gray-100"
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                >
                  {images.length === 0 ? (
                     <p className="text-gray-400 font-medium text-center w-full">사진을 추가해보세요!</p>
                  ) : (
                    images.map((src, index) => (
                      <Draggable key={src} draggableId={src} index={index}>
                        {(provided, snapshot) => (
                          <div 
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className={`relative flex-shrink-0 group ${snapshot.isDragging ? 'z-50 scale-105 shadow-xl opacity-90' : ''} transition-all duration-200`}
                            style={{ ...provided.draggableProps.style }}
                          >
                            {/* 👑 썸네일(첫 번째 사진) 강조 뱃지 */}
                            {index === 0 && (
                              <div className="absolute top-2 left-2 bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded-md z-20 shadow-md">
                                대표 사진
                              </div>
                            )}

                            <img 
                              src={src} 
                              alt={`uploaded-${index}`} 
                              className={`w-32 h-32 md:w-40 md:h-40 object-cover rounded-xl shadow-sm border-2 ${index === 0 ? 'border-blue-400' : 'border-transparent'}`} 
                            />
                            
                            <button 
                              onClick={() => removeImage(index)}
                              className="absolute -top-3 -right-3 bg-red-500 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold shadow-md hover:bg-red-600 hover:scale-110 transition-all z-20"
                            >
                              ✕
                            </button>

                            {/* 📱 모바일 드래그 핸들 */}
                            <div 
                              {...provided.dragHandleProps}
                              className="absolute inset-0 flex items-center justify-center bg-transparent hover:bg-opacity-30 transition-all cursor-grab active:cursor-grabbing rounded-xl z-10"
                            >
                              <div className="opacity-0 group-hover:opacity-100 bg-black bg-opacity-50 text-white p-2 rounded-full">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9h8M8 15h8" />
                                </svg>
                              </div>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))
                  )}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </div>

        {/* 텍스트 에디터 */}
        <div>
          <label className="block text-lg font-bold text-gray-900 mb-3">본문 작성</label>
          <div className="quill-wrapper border border-gray-100 rounded-2xl overflow-hidden">
            <ReactQuill 
              theme="snow" 
              value={content} 
              onChange={setContent}
              modules={modules} 
              placeholder="예쁜 폰트와 색상으로 아기의 일상을 적어주세요..."
            />
          </div>
        </div>

        <div className="flex justify-end gap-4 pt-10 border-t border-gray-50">
          <button onClick={onCancel} className="px-8 py-3 rounded-xl font-bold text-gray-400 hover:bg-gray-50">취소</button>
          <button 
            onClick={handleSubmit} 
            className="px-10 py-3 rounded-xl font-bold text-white bg-black hover:bg-gray-800 shadow-lg transform hover:-translate-y-1 transition-transform"
          >
            기록 저장하기
          </button>
        </div>
      </div>
    </div>
  );
}