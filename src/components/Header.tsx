import { useState } from 'react';

interface HeaderProps {
  categories: string[];
  activeCategory: string;
  setActiveCategory: (category: string) => void;
  isHome: boolean;
  isLoggedIn: boolean;     // 👈 추가
  onLoginClick: () => void; // 👈 추가
  onLogout: () => void;     // 👈 추가
}

export default function Header({ 
  categories, 
  activeCategory, 
  setActiveCategory, 
  isHome, 
  isLoggedIn,
  onLoginClick,
  onLogout
}: HeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header 
      className={`
        fixed top-0 left-0 w-full z-50 transition-all duration-700
        ${isHome && !isMobileMenuOpen ? 'bg-transparent' : 'bg-white border-b border-gray-100 shadow-sm'}
      `}
    >
      <div className="max-w-7xl mx-auto px-6 md:px-12 flex justify-between items-center h-16 md:h-20">
        <div 
          className={`text-xl md:text-2xl font-black cursor-pointer transition-colors duration-500 ${isHome && !isMobileMenuOpen ? 'text-white' : 'text-black'}`}
          onClick={() => {
            setActiveCategory('홈');
            setIsMobileMenuOpen(false);
          }}
        >
          SukSuk BABY
        </div>

        {/* PC용 메뉴 */}
        <nav className="hidden lg:flex space-x-10">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`
                text-[15px] font-bold transition-all duration-500 hover:opacity-100
                ${isHome ? 'text-white' : 'text-gray-600 hover:text-black'}
                ${activeCategory === category ? 'opacity-100' : 'opacity-60'}
              `}
            >
              {category}
            </button>
          ))}
        </nav>

        {/* 우측 버튼 영역 */}
        <div className="flex items-center space-x-4">
        <button 
            onClick={isLoggedIn ? onLogout : onLoginClick}
            className={`md:block px-5 py-2 text-xs font-bold border transition-all duration-500 
              ${isHome && !isMobileMenuOpen 
                ? 'text-white border-white hover:bg-white hover:text-black' 
                : 'text-black border-black hover:bg-black hover:text-white'}`}
          >
            {isLoggedIn ? '로그아웃' : '로그인'}
          </button>
          <button 
            className={`lg:hidden text-2xl font-bold transition-colors duration-500 ${isHome && !isMobileMenuOpen ? 'text-white' : 'text-black'}`}
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? '✕' : '☰'}
          </button>
        </div>
      </div>

      {/* 모바일 드롭다운 메뉴 */}
      <div 
        className={`lg:hidden bg-white w-full overflow-hidden transition-all duration-500 ease-in-out ${
          isMobileMenuOpen ? 'max-h-[500px] border-t border-gray-100 shadow-lg' : 'max-h-0'
        }`}
      >
        <nav className="flex flex-col px-6 py-6 space-y-5">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => {
                setActiveCategory(category);
                setIsMobileMenuOpen(false);
              }}
              className={`text-left text-lg font-bold ${activeCategory === category ? 'text-black' : 'text-gray-400'}`}
            >
              {category}
            </button>
          ))}
        </nav>
      </div>
    </header>
  );
}