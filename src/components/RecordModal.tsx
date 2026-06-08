import React, { useState, useEffect } from 'react';

type RecordType = 'feeding' | 'sleep' | 'diaper' | 'growth' | null;

interface RecordModalProps {
  isOpen: boolean;
  type: RecordType;
  selectedDate: Date;
  onClose: () => void;
  onSubmit: (data: any) => void;
}

export default function RecordModal({ isOpen, type, selectedDate, onClose, onSubmit }: RecordModalProps) {
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [memo, setMemo] = useState('');

  const [amount, setAmount] = useState(''); 
  const [feedType, setFeedType] = useState('분유'); 
  const [diaperType, setDiaperType] = useState('소변'); 
  const [diaperStatus, setDiaperStatus] = useState('보통'); 
  const [height, setHeight] = useState(''); 
  const [weight, setWeight] = useState(''); 

  useEffect(() => {
    if (isOpen) {
      const now = new Date();
      const defaultDateTime = new Date(selectedDate);
      defaultDateTime.setHours(now.getHours(), now.getMinutes());

      const toLocalISO = (date: Date) => {
        const offset = date.getTimezoneOffset() * 60000;
        const localISOTime = new Date(date.getTime() - offset).toISOString();
        return localISOTime.slice(0, 16);
      };

      const startISO = toLocalISO(defaultDateTime);
      setStartTime(startISO);
      setEndTime(startISO);
      
      setMemo('');
      setAmount('');
      setHeight('');
      setWeight('');
      setFeedType('분유');
      setDiaperType('소변');
      setDiaperStatus('보통');
    }
  }, [isOpen, selectedDate]);

  if (!isOpen || !type) return null;

  const titles = {
    feeding: '🍼 수유 기록하기',
    sleep: '💤 수면 기록하기',
    diaper: '🧻 배설 기록하기',
    growth: '📏 성장 기록하기',
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // 💡 [버그 수정] T 문자를 공백으로 치환하여 백엔드 BETWEEN 쿼리 누락 현상 원천 차단
    const formatToBackendDateTime = (dateTimeStr: string) => {
      if (!dateTimeStr) return null;
      const cleanedStr = dateTimeStr.replace('T', ' ');
      return cleanedStr.length === 16 ? `${cleanedStr}:00` : cleanedStr;
    };

    let payload: any = { 
      recordType: type,
      startTime: formatToBackendDateTime(startTime),
      endTime: (type === 'sleep' || type === 'feeding') ? formatToBackendDateTime(endTime) : null,
      memo: memo.trim() || null
    }; 

    if (type === 'feeding') {
      payload = { ...payload, amount: Number(amount), feedType };
    }
    if (type === 'diaper') {
      payload = { ...payload, diaperType, diaperStatus: diaperType === '대변' ? diaperStatus : null };
    }
    if (type === 'growth') {
      payload = { ...payload, height: Number(height), weight: Number(weight) };
    }

    onSubmit(payload);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="absolute inset-0 -z-10" onClick={onClose} />

      <div className="bg-white rounded-t-[2rem] sm:rounded-[2rem] p-6 sm:p-8 w-full sm:max-w-md shadow-2xl max-h-[85vh] sm:max-h-[90vh] overflow-y-auto transform transition-transform duration-300 ease-out flex flex-col pb-10 sm:pb-8">
        <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-4 sm:hidden" onClick={onClose} />

        <div className="flex justify-between items-center mb-5">
          <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">{titles[type]}</h2>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-black w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 flex-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs sm:text-sm font-black text-gray-700 mb-1.5">
                {type === 'sleep' ? '잠든 시간' : type === 'feeding' ? '수유 시작' : '기록 시간'}
              </label>
              <input 
                type="datetime-local" 
                value={startTime} 
                onChange={(e) => setStartTime(e.target.value)} 
                required 
                className="w-full px-4 py-3 text-sm rounded-xl border border-gray-200 focus:outline-none focus:border-black bg-gray-50/50 font-medium min-h-[48px]"
              />
            </div>
            {(type === 'sleep' || type === 'feeding') && (
              <div>
                <label className="block text-xs sm:text-sm font-black text-gray-700 mb-1.5">
                  {type === 'sleep' ? '일어난 시간' : '수유 종료'}
                </label>
                <input 
                  type="datetime-local" 
                  value={endTime} 
                  onChange={(e) => setEndTime(e.target.value)} 
                  required 
                  className="w-full px-4 py-3 text-sm rounded-xl border border-gray-200 focus:outline-none focus:border-black bg-gray-50/50 font-medium min-h-[48px]"
                />
              </div>
            )}
          </div>

          {type === 'feeding' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs sm:text-sm font-black text-gray-700 mb-1.5">수유 종류</label>
                <div className="flex gap-2">
                  {['분유', '모유', '이유식'].map((item) => (
                    <button 
                      type="button" 
                      key={item} 
                      onClick={() => setFeedType(item)} 
                      className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-bold border transition-all ${feedType === item ? 'bg-blue-500 text-white border-blue-500 shadow-sm' : 'bg-white text-gray-500 border-gray-200 active:bg-gray-50'}`}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-black text-gray-700 mb-1.5">수유량 (ml / g)</label>
                <input 
                  type="number" 
                  pattern="\d*"
                  inputMode="numeric"
                  value={amount} 
                  onChange={(e) => setAmount(e.target.value)} 
                  required 
                  className="w-full px-4 py-3 text-sm rounded-xl border border-gray-200 focus:outline-none focus:border-black bg-gray-50/50 font-bold min-h-[48px]" 
                  placeholder="예: 120" 
                />
              </div>
            </div>
          )}

          {type === 'diaper' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs sm:text-sm font-black text-gray-700 mb-1.5">대소변 구별</label>
                <div className="flex gap-2">
                  {['소변', '대변'].map((item) => (
                    <button 
                      type="button" 
                      key={item} 
                      onClick={() => setDiaperType(item)} 
                      className={`flex-1 py-3 rounded-xl text-sm font-extrabold border transition-all ${diaperType === item ? 'bg-yellow-400 text-white border-yellow-400 shadow-sm' : 'bg-white text-gray-500 border-gray-200 active:bg-gray-50'}`}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>
              {diaperType === '대변' && (
                <div className="animate-fade-in">
                  <label className="block text-xs sm:text-sm font-black text-gray-700 mb-1.5">변 상태 체크</label>
                  <div className="grid grid-cols-2 gap-2">
                    {['좋음', '무름', '설사', '딱딱함'].map((item) => (
                      <button 
                        type="button" 
                        key={item} 
                        onClick={() => setDiaperStatus(item)} 
                        className={`py-2 rounded-xl text-xs font-bold border transition-all ${diaperStatus === item ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-500 border-gray-200 active:bg-gray-50'}`}
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {type === 'growth' && (
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-xs sm:text-sm font-black text-gray-700 mb-1.5">키 (cm)</label>
                <input 
                  type="number" 
                  step="0.1" 
                  inputMode="decimal"
                  value={height} 
                  onChange={(e) => setHeight(e.target.value)} 
                  required 
                  className="w-full px-4 py-3 text-sm rounded-xl border border-gray-200 focus:outline-none focus:border-black bg-gray-50/50 font-bold min-h-[48px]" 
                  placeholder="예: 60.5" 
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs sm:text-sm font-black text-gray-700 mb-1.5">몸무게 (kg)</label>
                <input 
                  type="number" 
                  step="0.1" 
                  inputMode="decimal"
                  value={weight} 
                  onChange={(e) => setWeight(e.target.value)} 
                  required 
                  className="w-full px-4 py-3 text-sm rounded-xl border border-gray-200 focus:outline-none focus:border-black bg-gray-50/50 font-bold min-h-[48px]" 
                  placeholder="예: 6.2" 
                />
              </div>
            </div>
          )}
          
          <div>
            <label className="block text-xs sm:text-sm font-black text-gray-700 mb-1.5">특이사항 메모 (선택)</label>
            <textarea 
              value={memo} 
              onChange={(e) => setMemo(e.target.value)} 
              rows={2} 
              className="w-full px-4 py-3 text-sm rounded-xl border border-gray-200 focus:outline-none focus:border-black bg-gray-50/50 resize-none font-medium text-gray-800" 
              placeholder="컨디션을 간략히 기록해 보세요." 
            />
          </div>

          <button 
            type="submit" 
            className="w-full py-4 bg-black text-white rounded-xl font-black text-base sm:text-lg hover:bg-gray-800 active:scale-[0.99] transition-all shadow-lg mt-4 min-h-[52px]"
          >
            기록 저장하기 ✨
          </button>
        </form>
      </div>
    </div>
  );
}