/** @type {import('tailwindcss').Config} */
export default {
    // Tailwind가 스타일을 적용할 파일들의 경로를 지정합니다.
    content: [
      "./index.html",
      "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
      extend: {
        // 아기 다이어리 특유의 따뜻하고 고급스러운 감성을 위해 폰트를 추가합니다.
        fontFamily: {
          // 본문용 깔끔한 고딕 (기본)
          sans: ['Pretendard', 'Noto Sans KR', 'Apple SD Gothic Neo', 'sans-serif'],
          // 제목용 감성적인 명조 (App.tsx에서 font-serif로 사용된 부분)
          serif: ['Noto Serif KR', 'Nanum Myeongjo', 'serif'],
        },
        // 추후 앱의 메인 테마 색상이 정해지면 여기에 추가할 수 있습니다.
        colors: {
          brand: {
            light: '#f5f0eb',
            DEFAULT: '#b89f85', // 타이틀이나 포인트 버튼에 쓸 따뜻한 베이지브라운
            dark: '#8a735c',
          }
        }
      },
    },
    plugins: [],
  }