import { useState, useEffect } from 'react';
import img1 from '../assets/0428-born.jpg';
import img2 from '../assets/0428-born1.jpg';
import img3 from '../assets/0428-born2.jpg';
import img4 from '../assets/0428-born3.jpg';
import img5 from '../assets/0428-born4.png';

export default function HomeSlider() {
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    { id: 1, url: img1, title: '우용 ❤️ 주영이네', desc: '건강하게 태어난 소중한 순간' },
    { id: 2, url: img2, title: '우용 ❤️ 주영이네', desc: '건강하게 태어난 소중한 순간' },
    { id: 3, url: img3, title: '우용 ❤️ 주영이네', desc: '건강하게 태어난 소중한 순간' },
    { id: 4, url: img4, title: '우용 ❤️ 주영이네', desc: '건강하게 태어난 소중한 순간' },
    { id: 5, url: img5, title: '우용 ❤️ 주영이네', desc: '건강하게 태어난 소중한 순간' },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [slides.length]);

  return (
    <section className="relative w-full h-[60vh] md:h-[85vh] overflow-hidden bg-black"> 
      {slides.map((slide, index) => (
        <div
          key={slide.id}
          className={`absolute inset-0 transition-opacity duration-1000 ${
            index === currentSlide ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <img 
            src={slide.url} 
            className="w-full h-full object-cover opacity-75" 
            style={{ objectPosition: 'center 50%' }}
          />
          <div className="absolute inset-0 flex flex-col pt-40 md:pt-48 px-6 md:px-20">
            <p className="text-white text-base md:text-lg font-medium mb-4 animate-fade-in">{slide.desc}</p>
            <h4 className="text-3xl md:text-5xl font-black text-white leading-tight tracking-tighter mb-10 animate-fade-in-up">
              {slide.title} <br/> 
              <span className="text-blue-400">성장 기록.</span>
            </h4>
          </div>
        </div>
      ))}
      
      {/* 🌟 하단 스와이프 버튼 (크기 및 터치 영역 개선) */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center space-x-2 md:space-x-3 z-20">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            // ✨ 핵심: p-3을 주어 눈에 보이지 않는 클릭/터치 영역을 대폭 넓힘
            className="p-3 group cursor-pointer outline-none"
            aria-label={`${index + 1}번째 사진 보기`}
          >
            {/* 눈에 보이는 실제 버튼 디자인 */}
            <div 
              className={`transition-all duration-500 rounded-full ${
                index === currentSlide 
                  ? 'w-12 h-2.5 md:w-16 md:h-3 bg-white shadow-lg' 
                  : 'w-2.5 h-2.5 md:w-3 md:h-3 bg-white/40 group-hover:bg-white/80'
              }`}
            />
          </button>
        ))}
      </div>
    </section>
  );
}