
import { Category, User } from './types';

export const USERS: User[] = ['모두', '가족', '은', '미랑', '재성'];

export const USER_DETAILS: Record<User, { name: string; color: string }> = {
  '모두': { name: '모든 가족', color: 'from-[#667eea] to-[#764ba2]' },
  '가족': { name: '가족', color: 'from-[#4A90E2] to-[#357abd]' },
  '은': { name: '은', color: 'from-[#7ED321] to-[#5cb85c]' },
  '미랑': { name: '미랑', color: 'from-[#F5A623] to-[#e67e22]' },
  '재성': { name: '재성', color: 'from-[#D0021B] to-[#c0392b]' },
};

export const CATEGORIES: Category[] = ['건강', '취미', '운동', '학습', '일상', '기타'];

export const CATEGORY_DETAILS: Record<Category, { name: string; color: string; textColor: string }> = {
  '건강': { name: '건강', color: 'from-[#FF6B6B] to-[#ff5252]', textColor: 'text-white' },
  '취미': { name: '취미', color: 'from-[#4ECDC4] to-[#26a69a]', textColor: 'text-white' },
  '운동': { name: '운동', color: 'from-[#45B7D1] to-[#2196f3]', textColor: 'text-white' },
  '학습': { name: '학습', color: 'from-[#96CEB4] to-[#66bb6a]', textColor: 'text-white' },
  '일상': { name: '일상', color: 'from-[#FFEAA7] to-[#ffcc02]', textColor: 'text-gray-800' },
  '기타': { name: '기타', color: 'from-[#DDA0DD] to-[#ba68c8]', textColor: 'text-white' },
};
