import { MOCK_STATS } from '../constants';
import { Question } from '../types';

// Generic shuffle function using Fisher-Yates algorithm
export const shuffleArray = <T,>(array: T[]): T[] => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

export const getQuestions = (
  allQuestions: Question[], 
  mode: 'practice' | 'weak_zone' | 'full_mock', 
  count: number = 10
): Question[] => {
  let filtered = [...allQuestions];
  
  if (mode === 'weak_zone') {
    // Simulate filtering by mistake count or difficulty
    filtered = filtered.filter(q => q.mistakeCount > 3 || q.difficulty === 'hard');
  }
  
  // Shuffle the questions themselves
  filtered = shuffleArray(filtered);
  
  return filtered.slice(0, count);
};

export const getUserStats = () => {
  return MOCK_STATS;
};