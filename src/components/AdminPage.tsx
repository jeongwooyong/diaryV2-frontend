import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';

interface AdminPageProps {
  isLoggedIn: boolean;
  setIsLoginModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  selectedDate: Date;
  setSelectedDate: React.Dispatch<React.SetStateAction<Date>>;
  setRecordType: React.Dispatch<React.SetStateAction<'feeding' | 'sleep' | 'diaper' | 'growth' | null>>;
}

function getSubArcPath(startMinutes: number, endMinutes: number, radius: number, cx: number, cy: number) {
  const startAngle = (startMinutes / 1440) * 360 - 90;
  let endAngle = (endMinutes / 1440) * 360 - 90;
  if (endAngle < startAngle) endAngle += 360;

  const rad = Math.PI / 180;
  const x1 = cx + radius * Math.cos(startAngle * rad);
  const y1 = cy + radius * Math.sin(startAngle * rad);
  const x2 = cx + radius * Math.cos(endAngle * rad);
  const y2 = cy + radius * Math.sin(endAngle * rad);

  const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0;

  return `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`;
}

export default function AdminPage({
  isLoggedIn,
  setIsLoginModalOpen,
  selectedDate,
  setSelectedDate,
  setRecordType,
}: AdminPageProps) {
  
  const [activeRecordFilter, setActiveRecordFilter] = useState('all');
  const [records, setRecords] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const year = selectedDate.getFullYear();
  const month = selectedDate.getMonth();

  const fetchMonthRecords = useCallback(async () => {
    if (!isLoggedIn) return;
    setIsLoading(true);
    try {
      const yearMonthStr = `${year}-${String(month + 1).padStart(2, '0')}`;
      const response = await axios.get('/api/records', {
        params: { yearMonth: yearMonthStr }
      });
      setRecords(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('월별 기록 로드 실패:', error);
      setRecords([]);
    } finally {
      setIsLoading(false);
    }
  }, [year, month, isLoggedIn]);

  useEffect(() => {
    fetchMonthRecords();
  }, [fetchMonthRecords]);

  const { daysInMonth, startDayOfWeek } = useMemo(() => {
    const totalDays = new Date(year, month + 1, 0).getDate();
    const startDay = new Date(year, month, 1).getDay();
    return { daysInMonth: totalDays, startDayOfWeek: startDay };
  }, [year, month]);

  const dailyRecords = useMemo(() => {
    return records
      .filter((record) => {
        const recordDateStr = record.startTime;
        if (!recordDateStr) return false;
        const rDate = new Date(recordDateStr);
        return (
          rDate.getFullYear() === year &&
          rDate.getMonth() === month &&
          rDate.getDate() === selectedDate.getDate()
        );
      })
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  }, [records, year, month, selectedDate]);

  const filteredRecords = useMemo(() => {
    if (activeRecordFilter === 'all') return dailyRecords;
    return dailyRecords.filter((r) => r.recordType === activeRecordFilter);
  }, [dailyRecords, activeRecordFilter]);

  const chartSegments = useMemo(() => {
    const colors: Record<string, string> = {
      feeding: '#60a5fa',
      sleep: '#c084fc',
      diaper: '#fbbf24',
      growth: '#4ade80',
    };

    return dailyRecords.map((r) => {
      const sDate = new Date(r.startTime);
      const startMin = sDate.getHours() * 60 + sDate.getMinutes();
      
      let endMin = startMin + 25;
      if (r.endTime) {
        const eDate = new Date(r.endTime);
        endMin = eDate.getHours() * 60 + eDate.getMinutes();
        if (endMin <= startMin) endMin = 1440;
      }

      return {
        path: getSubArcPath(startMin, endMin, 80, 100, 100),
        color: colors[r.recordType] || '#ef4444',
        id: r.id
      };
    });
  }, [dailyRecords]);

  if (!isLoggedIn) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center px-4">
        <p className="text-gray-500 font-bold mb-4">관리자전용 공간입니다. 로그인 후 이용해 주세요.</p>
        <button onClick={() => setIsLoginModalOpen(true)} className="w-full max-w-xs px-6 py-3 bg-black text-white font-bold rounded-xl hover:bg-gray-800 transition-colors">로그인 하기</button>
      </div>
    );
  }

  return (
    /* 💡 PWA 핵심변경: 모바일 뷰포트 튕김 방지를 위해 부모 너비를 유연하게 열고 xl 이상에서만 그리드 격자 분할 */
    <div className="w-full flex flex-col xl:grid xl:grid-cols-3 gap-6 px-1 md:px-4 pb-12">
      
      {/* 왼쪽 코어 섹션 (달력 + 원형 일과표) */}
      <div className="w-full xl:col-span-2 space-y-6">
        
        {/* 달력 영역 */}
        <div className="bg-white rounded-[1.5rem] md:rounded-[2rem] p-4 md:p-6 border border-gray-100 shadow-sm relative">
          <div className="flex justify-between items-center mb-5">
            <h3 className="text-lg md:text-xl font-black text-gray-900">{year}년 {month + 1}월 달력</h3>
            <div className="flex gap-1.5">
              <button onClick={() => setSelectedDate(new Date(year, month - 1, 1))} className="px-2.5 py-1.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl text-xs font-bold transition-colors">이전달</button>
              <button onClick={() => setSelectedDate(new Date(year, month + 1, 1))} className="px-2.5 py-1.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl text-xs font-bold transition-colors">다음달</button>
            </div>
          </div>

          {isLoading ? (
            <div className="p-16 text-center text-gray-400 font-bold text-sm">데이터를 로드하고 있습니다... 🔄</div>
          ) : (
            <>
              {/* 💡 모바일 터치 영역 최적화를 위해 그리드 간격 및 패딩 미세 조정 */}
              <div className="grid grid-cols-7 gap-1 text-center font-black text-[11px] text-gray-400 mb-2">
                <div className="text-red-400">일</div><div>월</div><div>화</div><div>수</div><div>목</div><div>금</div><div className="text-blue-400">토</div>
              </div>
              <div className="grid grid-cols-7 gap-1 md:gap-1.5">
                {Array.from({ length: startDayOfWeek }).map((_, i) => <div key={`empty-${i}`} className="h-11 md:h-12 bg-gray-50/40 rounded-lg" />)}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const dayNum = i + 1;
                  const isCurrentSelected = selectedDate.getDate() === dayNum;
                  const hasRecords = records.some(r => r.startTime && new Date(r.startTime).getDate() === dayNum && new Date(r.startTime).getMonth() === month);

                  return (
                    <button
                      key={`day-${dayNum}`}
                      onClick={() => setSelectedDate(new Date(year, month, dayNum))}
                      className={`h-12 md:h-14 rounded-xl font-bold text-xs md:text-sm relative flex flex-col items-center justify-center transition-all ${isCurrentSelected ? 'bg-black text-white shadow-md scale-105 z-10' : 'bg-gray-50 text-gray-800 hover:bg-gray-100/80'}`}
                    >
                      <span>{dayNum}</span>
                      {hasRecords && <span className={`w-1 h-1 md:w-1.5 md:h-1.5 rounded-full mt-0.5 md:mt-1 ${isCurrentSelected ? 'bg-white' : 'bg-blue-500'}`} />}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* ⏰ 24시간 일과 순환표 */}
        <div className="bg-white rounded-[1.5rem] md:rounded-[2rem] p-5 md:p-6 border border-gray-100 shadow-sm flex flex-col sm:flex-row items-center justify-around gap-6">
          <div className="text-center sm:text-left w-full sm:w-auto">
            <h4 className="text-base md:text-lg font-black text-gray-900 mb-1">⏰ 24시간 일과 순환표</h4>
            <p className="text-[11px] text-gray-400 font-medium mb-4">{selectedDate.toLocaleDateString()} 활동 요약</p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs font-bold text-gray-600 max-w-[240px] mx-auto sm:mx-0">
              <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-blue-400 rounded-full inline-block" />수유 시간</div>
              <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-purple-400 rounded-full inline-block" />수면 상태</div>
              <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-yellow-400 rounded-full inline-block" />배설 확인</div>
              <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-green-400 rounded-full inline-block" />신체 성장</div>
            </div>
          </div>

          {/* SVG 아크 그래프 (모바일 컴팩트 반응형 고정) */}
          <div className="relative w-44 h-44 md:w-52 md:h-52 flex items-center justify-center flex-shrink-0">
            <svg width="180" height="180" viewBox="0 0 200 200" className="md:w-[200px] md:h-[200px]">
              <circle cx="100" cy="100" r="80" fill="none" stroke="#f3f4f6" strokeWidth="20" />
              {chartSegments.map((seg, idx) => (
                <path key={seg.id || idx} d={seg.path} fill="none" stroke={seg.color} strokeWidth="20" strokeLinecap="round" opacity="0.85" />
              ))}
            </svg>

            <div className="absolute w-28 h-28 md:w-32 md:h-32 bg-white rounded-full flex flex-col items-center justify-center text-center shadow-sm">
              <span className="text-[9px] md:text-[11px] font-black text-gray-400 tracking-wider">TODAY ROUTINE</span>
              <span className="text-xl md:text-2xl font-black text-gray-900 mt-0.5">{dailyRecords.length}건</span>
            </div>

            <span className="absolute top-0 text-[9px] md:text-[10px] font-black text-gray-400">24시</span>
            <span className="absolute bottom-0 text-[9px] md:text-[10px] font-black text-gray-400">12시</span>
            <span className="absolute right-1 text-[9px] md:text-[10px] font-black text-gray-400">06시</span>
            <span className="absolute left-1 text-[9px] md:text-[10px] font-black text-gray-400">18시</span>
          </div>
        </div>

      </div>

      {/* 우측 사이드바 패널 (기록 및 타임라인) */}
      {/* 💡 억제 구조 해제: 모바일 스크롤 끊김 및 뷰포트 먹통을 막기 위해 max-h 제한 해제 및 패딩 리밸런싱 */}
      <div className="bg-white border border-gray-100 rounded-[1.5rem] md:rounded-[2rem] p-5 md:p-6 shadow-sm flex flex-col justify-between w-full h-auto xl:max-h-[calc(100vh-100px)] xl:overflow-y-auto">
        <div>
          <h3 className="text-base md:text-lg font-black text-gray-900 mb-3">기록 추가하기</h3>
          <div className="grid grid-cols-2 gap-2 mb-5">
            <button onClick={() => setRecordType('feeding')} className="p-3 bg-blue-50 text-blue-600 rounded-xl font-bold text-xs md:text-sm hover:bg-blue-100/70 active:scale-95 transition-all">🍼 수유</button>
            <button onClick={() => setRecordType('diaper')} className="p-3 bg-yellow-50 text-yellow-600 rounded-xl font-bold text-xs md:text-sm hover:bg-yellow-100/70 active:scale-95 transition-all">🧻 배설</button>
            <button onClick={() => setRecordType('sleep')} className="p-3 bg-purple-50 text-purple-600 rounded-xl font-bold text-xs md:text-sm hover:bg-purple-100/70 active:scale-95 transition-all">😴 수면</button>
            <button onClick={() => setRecordType('growth')} className="p-3 bg-green-50 text-green-600 rounded-xl font-bold text-xs md:text-sm hover:bg-green-100/70 active:scale-95 transition-all">📈 성장</button>
          </div>

          <div className="border-t pt-4">
            <span className="text-[11px] font-bold text-gray-400 block mb-2">기록 필터</span>
            <div className="flex flex-wrap gap-1.5 text-xs font-bold mb-4">
              {[
                ['all', '전체', 'bg-black'],
                ['feeding', '수유', 'bg-blue-500'],
                ['diaper', '배설', 'bg-yellow-500'],
                ['sleep', '수면', 'bg-purple-500']
              ].map(([key, name, color]) => (
                <button 
                  key={key} 
                  onClick={() => setActiveRecordFilter(key)} 
                  className={`px-3 py-1.5 rounded-lg transition-colors ${activeRecordFilter === key ? `${color} text-white` : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                >
                  {name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 타임라인 목록 파트 */}
        {/* 💡 모바일 가독성 증대: max-h를 유연하게 설정하여 모바일 브라우저 뷰 내에서 스크롤 흐름이 유연하게 뚫리도록 조정 */}
        <div className="mt-2 border-t pt-4 flex-1">
          <div className="flex justify-between items-center mb-3">
            <span className="text-xs font-black text-gray-900">⏱️ {selectedDate.getDate()}일 타임라인 ({filteredRecords.length}건)</span>
          </div>
          
          {filteredRecords.length === 0 ? (
            <p className="text-xs text-gray-400 py-8 text-center font-medium">기록이 없습니다.</p>
          ) : (
            <div className="space-y-2.5 max-h-[380px] xl:max-h-none overflow-y-auto pr-0.5 custom-scrollbar">
              {filteredRecords.map((r, idx) => {
                const itemTime = new Date(r.startTime);
                const timeString = itemTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });

                const styleMap: Record<string, string> = {
                  feeding: 'border-l-blue-400 bg-blue-50/40 text-blue-700',
                  diaper: 'border-l-yellow-400 bg-yellow-50/40 text-yellow-700',
                  sleep: 'border-l-purple-400 bg-purple-50/40 text-purple-700',
                  growth: 'border-l-green-400 bg-green-50/40 text-green-700'
                };

                return (
                  <div key={r.id || idx} className={`text-xs p-3 rounded-xl border border-gray-100 border-l-4 ${styleMap[r.recordType] || 'border-l-gray-400'} flex items-start justify-between shadow-sm`}>
                    <div className="space-y-1 min-w-0 flex-1 pr-2">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="font-extrabold bg-white px-1.5 py-0.5 rounded-md border border-gray-100 text-[10px]">
                          {timeString}
                        </span>
                        <span className="font-black text-gray-800 truncate">
                          {r.recordType === 'feeding' && `🍼 수유 (${r.feedType || '분유'})`}
                          {r.recordType === 'diaper' && `🧻 배설 (${r.diaperType || '소변'})`}
                          {r.recordType === 'sleep' && '💤 수면 상태'}
                          {r.recordType === 'growth' && '📏 신체 성장'}
                        </span>
                      </div>
                      {r.memo && <p className="text-[11px] text-gray-500 font-medium pl-0.5 break-all">📝 {r.memo}</p>}
                    </div>
                    
                    <div className="text-right font-black self-center text-gray-900 flex-shrink-0 text-[11px] md:text-xs">
                      {r.recordType === 'feeding' && r.amount ? `${r.amount}ml` : 
                       r.recordType === 'growth' && r.height ? `${r.height}cm/${r.weight}kg` : 
                       r.recordType === 'diaper' && r.diaperType === '대변' ? `${r.diaperStatus || '보통'}` : '확인'}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}