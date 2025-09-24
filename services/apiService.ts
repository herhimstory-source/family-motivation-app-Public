
import { Goal, GoalStatus, User, Category, Completion, CompletionStats, DailyChartData, CategoryStatsData } from '../types';

// In-memory database
let goals: Goal[] = [];
let completions: Completion[] = [];

const generateUUID = () => crypto.randomUUID();
const getCurrentDateTime = () => new Date().toISOString();

const initializeData = () => {
  const today = new Date();
  const getOffsetDate = (offset: number) => {
      const date = new Date(today);
      date.setDate(today.getDate() + offset);
      return date.toISOString().split('T')[0];
  };

  goals = [
    { id: '1', title: '아침 7시 기상', assignee: '은', category: '건강', dueDate: getOffsetDate(0), dueTime: '07:00', status: GoalStatus.Pending, createdAt: getCurrentDateTime(), updatedAt: getCurrentDateTime() },
    { id: '2', title: '하루 30분 책읽기', assignee: '미랑', category: '학습', dueDate: getOffsetDate(0), status: GoalStatus.Pending, createdAt: getCurrentDateTime(), updatedAt: getCurrentDateTime() },
    { id: '3', title: '저녁 산책', assignee: '가족', category: '운동', dueDate: getOffsetDate(0), dueTime: '20:00', status: GoalStatus.Completed, createdAt: getCurrentDateTime(), updatedAt: getCurrentDateTime() },
    { id: '4', title: '플랭크 1분', assignee: '재성', category: '운동', dueDate: getOffsetDate(0), status: GoalStatus.Pending, createdAt: getCurrentDateTime(), updatedAt: getCurrentDateTime() },
    { id: '5', title: 'React 공부 1시간', assignee: '미랑', category: '학습', dueDate: getOffsetDate(1), status: GoalStatus.Pending, createdAt: getCurrentDateTime(), updatedAt: getCurrentDateTime() },
    { id: '6', title: '주말 대청소', assignee: '가족', category: '일상', dueDate: getOffsetDate(4), status: GoalStatus.Pending, createdAt: getCurrentDateTime(), updatedAt: getCurrentDateTime() },
    { id: '7', title: '장보기', assignee: '재성', category: '일상', dueDate: getOffsetDate(-1), status: GoalStatus.Completed, createdAt: getCurrentDateTime(), updatedAt: getCurrentDateTime() },
    { id: '8', title: '요가 수련', assignee: '은', category: '취미', dueDate: getOffsetDate(2), dueTime: '18:00', status: GoalStatus.Pending, createdAt: getCurrentDateTime(), updatedAt: getCurrentDateTime() },
  ];
  
  completions = [
      { id: 'c1', goalId: '3', completedAt: getOffsetDate(0), completedBy: '가족' },
      { id: 'c2', goalId: '7', completedAt: getOffsetDate(-1), completedBy: '재성' },
  ];
};

initializeData();

const simulateDelay = <T,>(data: T): Promise<T> => {
  return new Promise(resolve => setTimeout(() => resolve(data), 300));
};

export const api = {
  getGoalsByUser: (username: User): Promise<Goal[]> => {
    const userGoals = username === '모두' ? goals : goals.filter(g => g.assignee === username);
    return simulateDelay([...userGoals].sort((a,b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()));
  },
  getGoalById: (id: string): Promise<Goal | undefined> => {
    return simulateDelay(goals.find(g => g.id === id));
  },
  createGoal: (data: Omit<Goal, 'id' | 'status' | 'createdAt' | 'updatedAt'>): Promise<Goal> => {
    const newGoal: Goal = {
      ...data,
      id: generateUUID(),
      status: GoalStatus.Pending,
      createdAt: getCurrentDateTime(),
      updatedAt: getCurrentDateTime(),
    };
    goals.push(newGoal);
    return simulateDelay(newGoal);
  },
  updateGoal: (id: string, data: Partial<Omit<Goal, 'id'>>): Promise<Goal | undefined> => {
    const index = goals.findIndex(g => g.id === id);
    if (index !== -1) {
      goals[index] = { ...goals[index], ...data, updatedAt: getCurrentDateTime() };
      return simulateDelay(goals[index]);
    }
    return simulateDelay(undefined);
  },
  deleteGoal: (id: string): Promise<{ success: boolean }> => {
    goals = goals.filter(g => g.id !== id);
    return simulateDelay({ success: true });
  },
  completeGoal: (id: string, completedBy: User): Promise<Goal | undefined> => {
    const index = goals.findIndex(g => g.id === id);
    if (index !== -1) {
      goals[index].status = GoalStatus.Completed;
      goals[index].updatedAt = getCurrentDateTime();
      const newCompletion: Completion = {
          id: generateUUID(),
          goalId: id,
          completedAt: getCurrentDateTime(),
          completedBy,
      };
      completions.push(newCompletion);
      return simulateDelay(goals[index]);
    }
    return simulateDelay(undefined);
  },
  revertGoal: (id: string): Promise<Goal | undefined> => {
    const index = goals.findIndex(g => g.id === id);
    if (index !== -1) {
      goals[index].status = GoalStatus.Pending;
      goals[index].updatedAt = getCurrentDateTime();
      completions = completions.filter(c => c.goalId !== id);
      return simulateDelay(goals[index]);
    }
    return simulateDelay(undefined);
  },
  getCompletionByGoalId: (goalId: string): Promise<Completion | undefined> => {
    return simulateDelay(completions.find(c => c.goalId === goalId));
  },
  getCompletionStats: (username: User): Promise<CompletionStats> => {
      const userGoals = username === '모두' ? goals : goals.filter(g => g.assignee === username);
      const completed = userGoals.filter(g => g.status === GoalStatus.Completed).length;
      const pending = userGoals.filter(g => g.status === GoalStatus.Pending).length;
      const total = userGoals.length;
      const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
      return simulateDelay({ completed, pending, total, completionRate });
  },
  getDailyChartData: (username: User): Promise<DailyChartData[]> => {
    const userGoals = username === '모두' ? goals : goals.filter(g => g.assignee === username);
    const userGoalIds = new Set(userGoals.map(g => g.id));
    
    const data: DailyChartData[] = [];
    const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
    for(let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateString = date.toISOString().split('T')[0];
        
        const count = completions.filter(c => {
            return c.completedAt.startsWith(dateString) && userGoalIds.has(c.goalId);
        }).length;

        data.push({ date: dateString, count, dayName: dayNames[date.getDay()] });
    }
    return simulateDelay(data);
  },
  getCategoryStats: (username: User): Promise<CategoryStatsData[]> => {
      const userGoals = username === '모두' ? goals : goals.filter(g => g.assignee === username);
      const pendingGoals = userGoals.filter(g => g.status === GoalStatus.Pending);
      const stats: Partial<Record<Category, number>> = {};
      
      for (const goal of pendingGoals) {
          stats[goal.category] = (stats[goal.category] || 0) + 1;
      }
      
      const totalPending = pendingGoals.length;
      if (totalPending === 0) return simulateDelay([]);

      const result = Object.entries(stats).map(([category, count]) => ({
          category: category as Category,
          count: count as number,
          percentage: totalPending > 0 ? Math.round((count as number / totalPending) * 100) : 0,
      }));

      return simulateDelay(result);
  }
};
