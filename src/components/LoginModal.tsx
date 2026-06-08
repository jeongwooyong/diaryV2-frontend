import React, { useState } from 'react';
import axios from 'axios';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (token: string) => void;
}

export default function LoginModal({ isOpen, onClose, onLoginSuccess }: LoginModalProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await axios.post('/api/auth/login', { username, password });
      localStorage.setItem('userName', res.data.name);
      onLoginSuccess(res.data.accessToken);
      onClose();
    } catch (err) {
      alert('아이디 또는 비밀번호를 다시 확인해 주세요.');
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white w-full max-w-md rounded-[2.5rem] p-10 shadow-2xl animate-scale-up">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-black text-gray-900 mb-2">Welcome Back</h2>
          <p className="text-gray-400 font-medium">관리자 계정으로 로그인하세요.</p>
        </div>
        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="text"
            placeholder="아이디"
            className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-black outline-none"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <input
            type="password"
            placeholder="비밀번호"
            className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-black outline-none"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button type="submit" className="w-full bg-black text-white py-4 rounded-2xl font-bold text-lg hover:bg-gray-800 transition-all">
            로그인
          </button>
        </form>
        <button onClick={onClose} className="w-full mt-6 text-gray-400 font-medium hover:text-black">닫기</button>
      </div>
    </div>
  );
}