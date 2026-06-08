import { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';

import Header from './components/Header';
import HomeSlider from './components/HomeSlider';
import RecentNews from './components/RecentNews';
import PostList from './components/PostList';
import LoginModal from './components/LoginModal';
import RecordModal from './components/RecordModal';
import AdminPage from './components/AdminPage';
import Gallery from './components/Gallery';

function App() {
  const categories = ['홈', '새로운 소식', '게시글', '사진첩', '관리자페이지'];
  const [activeCategory, setActiveCategory] = useState('홈');
  const [posts, setPosts] = useState<any[]>([]); 
  const [isLoggedIn, setIsLoggedIn] = useState(false); 
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  
  // 육아 기록 관련 상태
  const [recordType, setRecordType] = useState<'feeding' | 'sleep' | 'diaper' | 'growth' | null>(null);
  const [records, setRecords] = useState<any[]>([]); 
  const [selectedDate, setSelectedDate] = useState(new Date()); 

  const isHome = activeCategory === '홈';

  const isSameDay = (d1: Date, d2: Date) => 
    d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate();

  const getDday = useMemo(() => {
    const birthDate = new Date('2026-04-28T00:00:00'); 
    const today = new Date();
    const diffTime = today.getTime() - birthDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return diffDays + 1;
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('jwtToken');
    localStorage.removeItem('userName');
    setIsLoggedIn(false);
    alert('로그아웃 되었습니다.');
  };

  const handleLoginSuccess = (token: string) => {
    localStorage.setItem('jwtToken', token);
    setIsLoggedIn(true);
    setIsLoginModalOpen(false);
    alert('로그인 성공!');
  };

  const fetchPosts = useCallback(async () => {
    try {
      const response = await axios.get('/api/posts');
      
      // 💡 수정: response.data 자체가 58개의 데이터를 가진 배열입니다.
      // const fetchedPosts = response.data ?? []; 
      
      // console.log("통신 성공! 전체 데이터:", response.data);
      // console.log("데이터가 배열인가?:", Array.isArray(response.data));
      
      // 확실하게 배열일 때만 세팅하도록 검증
      setPosts(response.data.content);
    } catch (error) {
      console.error('게시글 데이터 로드 실패:', error);
      setPosts([]);
    }
  }, []);

  const fetchRecords = useCallback(async () => {
    try {
      const now = new Date();
      const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      const response = await axios.get('/api/records', {
        params: { yearMonth: currentMonthStr }
      });
      
      setRecords(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('육아 기록 데이터를 불러오는데 실패했습니다.', error);
      setRecords([]); 
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('jwtToken');
    setIsLoggedIn(!!token);
    
    fetchPosts();
    if (token) {
      fetchRecords();
    }
  }, [activeCategory, fetchPosts, fetchRecords]);

  const handleRecordSubmit = async (data: any) => {
    try {
      await axios.post('/api/records', data);
      alert('쑥쑥이의 기록이 저장되었습니다! 👶');
      setRecordType(null);
      fetchRecords(); 
    } catch (error) {
      alert('저장 중 문제가 발생했습니다.');
    }
  };

  const todaySummary = useMemo(() => {
    const todayDate = new Date();
    return records.reduce(
      (acc, record) => {
        if (isSameDay(new Date(record.startTime), todayDate)) {
          if (record.recordType === 'feeding' && record.amount) acc.totalFeeding += Number(record.amount);
          if (record.recordType === 'diaper') acc.totalDiaper += 1;
        }
        return acc;
      },
      { totalFeeding: 0, totalDiaper: 0 }
    );
  }, [records]);

  return (
    <div className="min-h-screen bg-white font-sans selection:bg-gray-200 overflow-x-hidden">
      <Header categories={categories} activeCategory={activeCategory} setActiveCategory={setActiveCategory} isHome={isHome} isLoggedIn={isLoggedIn} onLoginClick={() => setIsLoginModalOpen(true)} onLogout={handleLogout} />

      <main className="w-full">
        {isHome && (
          <div className="animate-fade-in w-full pb-20"> 
            <HomeSlider />
            <div className="w-full bg-white px-5 sm:px-6 py-8 md:py-20 flex flex-col items-center">
              <div className="bg-gray-50 border border-gray-100 rounded-[2rem] md:rounded-[3rem] p-6 sm:p-8 md:p-14 text-center w-full max-w-4xl shadow-sm hover:shadow-md transition-shadow mb-6 md:mb-10">
                <p className="text-gray-500 font-bold text-sm md:text-xl mb-3 tracking-tight">건강하게 태어난 소중한 순간부터</p>
                <h3 className="text-5xl md:text-7xl font-black text-gray-900 tracking-tighter"><span className="text-blue-500">{getDday}</span>일째 👶</h3>
              </div>

              <button onClick={()=>setActiveCategory('관리자페이지')}>
                <div className="w-full max-w-4xl grid grid-cols-2 gap-3 sm:gap-6 relative z-10">
                  <div className="bg-blue-50/40 border border-blue-100 rounded-2xl md:rounded-3xl p-4 sm:p-5 md:p-8 flex flex-col items-center justify-center text-center shadow-sm w-full min-h-[120px]">
                    <span className="text-2xl sm:text-3xl md:text-4xl mb-1 sm:mb-2 md:mb-3">🍼</span>
                    <span className="text-gray-600 font-bold text-xs sm:text-sm md:text-base mb-1 break-keep">오늘 수유량</span>
                    <span className="text-2xl sm:text-3xl md:text-4xl font-black text-blue-600 tracking-tight flex items-baseline justify-center">
                      {todaySummary.totalFeeding}
                      <span className="text-xs sm:text-sm md:text-lg ml-1 font-bold text-blue-400">ml</span>
                    </span>
                  </div>
                  <div className="bg-yellow-50/40 border border-yellow-100 rounded-2xl md:rounded-3xl p-4 sm:p-5 md:p-8 flex flex-col items-center justify-center text-center shadow-sm w-full min-h-[120px]">
                    <span className="text-2xl sm:text-3xl md:text-4xl mb-1 sm:mb-2 md:mb-3">🧻</span>
                    <span className="text-gray-600 font-bold text-xs sm:text-sm md:text-base mb-1 break-keep">오늘 배설</span>
                    <span className="text-2xl sm:text-3xl md:text-4xl font-black text-yellow-500 tracking-tight flex items-baseline justify-center">
                      {todaySummary.totalDiaper}
                      <span className="text-xs sm:text-sm md:text-lg ml-1 font-bold text-yellow-400">회</span>
                    </span>
                  </div>
                </div>
              </button>
            </div>
          </div>
        )}

        {!isHome && (
          <div className="pt-32 pb-20 max-w-7xl mx-auto px-6 animate-fade-in-up">
            <div className="border-l-4 border-black pl-6 mb-12">
              <h2 className="text-4xl font-black text-gray-900 tracking-tighter">{activeCategory}</h2>
              <p className="text-gray-500 mt-2 font-medium break-keep text-sm md:text-base">우리 아기의 소중한 {activeCategory} 페이지입니다.</p>
            </div>
            
            {activeCategory === '새로운 소식' && <RecentNews posts={posts} isAdmin={isLoggedIn} refreshPosts={fetchPosts} />}
            {activeCategory === '게시글' && <PostList posts={posts} isAdmin={isLoggedIn} refreshPosts={fetchPosts} />}
            
            {activeCategory === '관리자페이지' && (
              <AdminPage
                isLoggedIn={isLoggedIn}
                setIsLoginModalOpen={setIsLoginModalOpen}
                selectedDate={selectedDate}
                setSelectedDate={setSelectedDate}
                setRecordType={setRecordType}
              />
            )}
            
            {activeCategory === '사진첩' && <Gallery isLoggedIn={isLoggedIn} posts={posts} />}
          </div>
        )}
      </main>
      
      <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} onLoginSuccess={handleLoginSuccess} />
      <RecordModal isOpen={recordType !== null} type={recordType} selectedDate={selectedDate} onClose={() => setRecordType(null)} onSubmit={handleRecordSubmit} />
    </div>
  );
}

export default App;