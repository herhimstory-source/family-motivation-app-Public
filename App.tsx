import React, { useState, useEffect, useCallback } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { View, User, Goal, GoalStatus, ToastMessage, Completion, CompletionStats, DailyChartData, CategoryStatsData } from './types';
import { USERS, USER_DETAILS, CATEGORY_DETAILS } from './constants';
import { api } from './services/apiService';
import GoalCard from './components/GoalCard';
import GoalModal from './components/GoalModal';
import GoalDetailModal from './components/GoalDetailModal';
import LoadingSpinner from './components/LoadingSpinner';
import EmptyState from './components/EmptyState';
import Toast from './components/Toast';

// Helper to group goals
const groupGoals = (goals: Goal[]) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const todayGoals = goals.filter(g => new Date(g.dueDate).setHours(0,0,0,0) === today.getTime() && g.status === GoalStatus.Pending);
  const todayCompleted = goals.filter(g => new Date(g.dueDate).setHours(0,0,0,0) === today.getTime() && g.status === GoalStatus.Completed);
  
  const thisWeekStart = new Date(today);
  thisWeekStart.setDate(today.getDate() - today.getDay());
  const thisWeekEnd = new Date(thisWeekStart);
  thisWeekEnd.setDate(thisWeekStart.getDate() + 6);
  const weekGoals = goals.filter(g => {
    const dueDate = new Date(g.dueDate);
    return dueDate >= thisWeekStart && dueDate <= thisWeekEnd && g.status === GoalStatus.Pending;
  });

  const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const thisMonthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  const monthGoals = goals.filter(g => {
    const dueDate = new Date(g.dueDate);
    return dueDate >= thisMonthStart && dueDate <= thisMonthEnd && g.status === GoalStatus.Pending;
  });

  return { todayGoals, todayCompleted, weekGoals, monthGoals };
};

const App: React.FC = () => {
    const [view, setView] = useState<View>(View.Tasks);
    const [currentUser, setCurrentUser] = useState<User>('모두');
    const [goals, setGoals] = useState<Goal[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
    const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
    const [selectedCompletion, setSelectedCompletion] = useState<Completion | null>(null);
    const [toast, setToast] = useState<ToastMessage | null>(null);
    const [stats, setStats] = useState<CompletionStats | null>(null);
    const [dailyChartData, setDailyChartData] = useState<DailyChartData[]>([]);
    const [categoryStats, setCategoryStats] = useState<CategoryStatsData[]>([]);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedCalendarDate, setSelectedCalendarDate] = useState<Date | null>(new Date());
    const [installPrompt, setInstallPrompt] = useState<Event | null>(null);
    const [isStandalone, setIsStandalone] = useState(false);


    const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
      const newToast = { id: Date.now(), message, type };
      setToast(newToast);
      setTimeout(() => setToast(null), 3000);
    };
    
    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const fetchedGoals = await api.getGoalsByUser(currentUser);
            setGoals(fetchedGoals);
            if (view === View.Stats) {
              const [fetchedStats, fetchedDaily, fetchedCategory] = await Promise.all([
                api.getCompletionStats(currentUser),
                api.getDailyChartData(currentUser),
                api.getCategoryStats(currentUser)
              ]);
              setStats(fetchedStats);
              setDailyChartData(fetchedDaily);
              setCategoryStats(fetchedCategory);
            }
        } catch (error) {
            console.error("Failed to fetch data", error);
            showToast("데이터를 불러오는데 실패했습니다.", "error");
        } finally {
            setIsLoading(false);
        }
    }, [currentUser, view]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    useEffect(() => {
        const standalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
        setIsStandalone(standalone);

        const handleBeforeInstallPrompt = (e: Event) => {
            if (standalone) return; // Don't show if already installed
            e.preventDefault();
            setInstallPrompt(e);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        };
    }, []);

    const handleSaveGoal = async (goalData: Omit<Goal, 'id' | 'status' | 'createdAt' | 'updatedAt'>) => {
      try {
        if (editingGoal) {
            await api.updateGoal(editingGoal.id, goalData);
            showToast("목표가 수정되었습니다!", "success");
        } else {
            await api.createGoal(goalData);
            showToast("새로운 목표가 추가되었습니다!", "success");
        }
        setIsModalOpen(false);
        setEditingGoal(null);
        fetchData();
      } catch (error) {
          showToast(editingGoal ? "목표 수정에 실패했습니다." : "목표 추가에 실패했습니다.", "error");
      }
    };
    
    const handleGoalClick = async (goal: Goal) => {
      setSelectedGoal(goal);
      if(goal.status === 'completed') {
        const completion = await api.getCompletionByGoalId(goal.id);
        setSelectedCompletion(completion || null);
      } else {
        setSelectedCompletion(null);
      }
      setIsDetailModalOpen(true);
    };

    const handleCompleteGoal = async () => {
        if (!selectedGoal) return;
        await api.completeGoal(selectedGoal.id, currentUser === '모두' ? '가족' : currentUser);
        showToast("목표 완료!", "success");
        setIsDetailModalOpen(false);
        fetchData();
    };

    const handleEditGoal = () => {
        setEditingGoal(selectedGoal);
        setIsDetailModalOpen(false);
        setIsModalOpen(true);
    };
    
    const handleDeleteGoal = async () => {
        if (!selectedGoal || !window.confirm("정말로 이 목표를 삭제하시겠습니까?")) return;
        await api.deleteGoal(selectedGoal.id);
        showToast("목표가 삭제되었습니다.", "info");
        setIsDetailModalOpen(false);
        fetchData();
    };

    const handleRevertGoal = async () => {
        if (!selectedGoal) return;
        await api.revertGoal(selectedGoal.id);
        showToast("목표를 다시 시작합니다.", "success");
        setIsDetailModalOpen(false);
        fetchData();
    };

    const handleInstallClick = async () => {
        if (!installPrompt) return;
        (installPrompt as any).prompt();
        const { outcome } = await (installPrompt as any).userChoice;
        if (outcome === 'accepted') {
            setInstallPrompt(null); // Clear the prompt
            showToast('앱이 성공적으로 설치되었습니다!', 'success');
        }
    };
    
    const renderCalendar = () => {
        const monthYear = currentDate.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long' });
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const startDate = new Date(firstDay);
        startDate.setDate(startDate.getDate() - firstDay.getDay());

        const days = [];
        for (let i = 0; i < 42; i++) {
            const date = new Date(startDate);
            date.setDate(startDate.getDate() + i);
            days.push(date);
        }

        return (
            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm">
                <div className="flex justify-between items-center mb-4">
                    <button onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)))} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700">
                      <span className="material-icons">chevron_left</span>
                    </button>
                    <div className="font-semibold text-slate-800 dark:text-slate-100">{monthYear}</div>
                    <button onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)))} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700">
                      <span className="material-icons">chevron_right</span>
                    </button>
                </div>
                <div className="grid grid-cols-7 gap-1 text-center text-xs text-slate-500 dark:text-slate-400">
                    {['일', '월', '화', '수', '목', '금', '토'].map(day => <div key={day} className="py-2 font-medium">{day}</div>)}
                    {days.map((day, index) => {
                        const isCurrentMonth = day.getMonth() === month;
                        const isToday = day.toDateString() === new Date().toDateString();
                        const goalsOnDay = goals.filter(g => new Date(g.dueDate).toDateString() === day.toDateString());
                        return (
                            <div key={index} className={`py-2 rounded-lg cursor-pointer transition-all duration-200 ${isCurrentMonth ? 'dark:text-slate-200' : 'text-slate-300 dark:text-slate-600'} ${isToday ? 'bg-blue-500 text-white font-bold' : ''} ${selectedCalendarDate?.toDateString() === day.toDateString() ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-white dark:ring-offset-slate-800' : 'hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                                onClick={() => setSelectedCalendarDate(day)}>
                                {day.getDate()}
                                <div className="flex justify-center mt-1 h-1.5 space-x-0.5">
                                    {goalsOnDay.slice(0, 3).map(g => <div key={g.id} className={`w-1.5 h-1.5 rounded-full ${g.status === 'completed' ? 'bg-green-500' : 'bg-yellow-500'}`}></div>)}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        )
    };
    
    const GoalSection:React.FC<{title: string, count: number, children: React.ReactNode, initiallyOpen?: boolean}> = ({title, count, children, initiallyOpen=true}) => {
        const [isOpen, setIsOpen] = useState(initiallyOpen);
        return(
            <section className="mb-6">
                <header onClick={() => setIsOpen(!isOpen)} className="flex justify-between items-center cursor-pointer p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700/50 transition">
                    <div className="flex items-center gap-2">
                        <span className={`material-icons transition-transform ${isOpen ? 'rotate-0' : '-rotate-90'}`}>expand_more</span>
                        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">{title}</h2>
                    </div>
                    <span className="text-xs font-semibold bg-blue-500 text-white rounded-full px-2.5 py-1">{count}</span>
                </header>
                {isOpen && <div className="mt-2 pl-4">{children}</div>}
            </section>
        );
    }
    
    const { todayGoals, todayCompleted, weekGoals, monthGoals } = groupGoals(goals);

    return (
        <div className="bg-slate-50 dark:bg-slate-900 min-h-screen text-slate-800 dark:text-slate-200">
          <div className="app-container relative flex flex-col w-full max-w-full min-h-screen bg-white dark:bg-black md:max-w-xl lg:max-w-4xl md:mx-auto md:my-8 md:rounded-2xl md:shadow-2xl md:min-h-[calc(100vh-4rem)]">
            <header className="sticky top-0 bg-white/80 dark:bg-black/80 backdrop-blur-xl z-10 p-4 border-b border-slate-200 dark:border-slate-800">
                <h1 className="text-xl font-bold text-center mb-4 text-slate-800 dark:text-slate-100">🎯 가족 동기부여</h1>
                <select value={currentUser} onChange={(e) => setCurrentUser(e.target.value as User)} className="w-full p-4 border border-slate-300 dark:border-slate-700 rounded-lg text-base bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition">
                    {USERS.map(user => (
                        <option key={user} value={user}>
                            {USER_DETAILS[user].name}
                        </option>
                    ))}
                </select>
                <div className="text-sm text-blue-600 dark:text-blue-400 mt-2 text-center">{USER_DETAILS[currentUser].name}의 목표 {goals.length}개</div>
            </header>
            
            <main className="flex-1 overflow-y-auto p-4 pb-24">
                {isLoading ? (
                    <div className="flex justify-center items-center h-full pt-20"><LoadingSpinner /></div>
                ) : (
                    <>
                    {view === View.Tasks && (
                      <div>
                        {goals.length === 0 ? <EmptyState icon="assignment" title="목표가 없습니다" subtitle="+ 버튼을 눌러 새 목표를 추가하세요." /> :
                        <>
                            <GoalSection title="오늘" count={todayGoals.length}>
                                {todayGoals.length > 0 ? todayGoals.map(g => <GoalCard key={g.id} goal={g} onClick={() => handleGoalClick(g)} />) : <p className="text-slate-400 text-sm p-4">오늘의 목표가 없습니다.</p>}
                            </GoalSection>
                            <GoalSection title="오늘 완료" count={todayCompleted.length} initiallyOpen={false}>
                                {todayCompleted.length > 0 ? todayCompleted.map(g => <GoalCard key={g.id} goal={g} onClick={() => handleGoalClick(g)} />) : <p className="text-slate-400 text-sm p-4">오늘 완료한 목표가 없습니다.</p>}
                            </GoalSection>
                             <GoalSection title="이번 주" count={weekGoals.length} initiallyOpen={false}>
                                {weekGoals.length > 0 ? weekGoals.map(g => <GoalCard key={g.id} goal={g} onClick={() => handleGoalClick(g)} />) : <p className="text-slate-400 text-sm p-4">이번 주 목표가 없습니다.</p>}
                            </GoalSection>
                            <GoalSection title="이번 달" count={monthGoals.length} initiallyOpen={false}>
                                {monthGoals.length > 0 ? monthGoals.map(g => <GoalCard key={g.id} goal={g} onClick={() => handleGoalClick(g)} />) : <p className="text-slate-400 text-sm p-4">이번 달 목표가 없습니다.</p>}
                            </GoalSection>
                        </>
                        }
                      </div>
                    )}
                    {view === View.Calendar && (
                      <div className="lg:flex lg:gap-6">
                        <div className="lg:w-1/2 flex-shrink-0">
                          {renderCalendar()}
                        </div>
                        <div className="mt-4 lg:mt-0 lg:w-1/2 flex-grow">
                          {selectedCalendarDate && (
                            <>
                              <h3 className="font-semibold mb-2 text-lg">{selectedCalendarDate.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}의 목표</h3>
                              {goals.filter(g => new Date(g.dueDate).toDateString() === selectedCalendarDate.toDateString()).map(g => <GoalCard key={g.id} goal={g} onClick={() => handleGoalClick(g)} />) }
                              {goals.filter(g => new Date(g.dueDate).toDateString() === selectedCalendarDate.toDateString()).length === 0 && <div className="mt-4"><EmptyState icon="event_available" title="선택한 날짜에 목표가 없습니다" /></div>}
                            </>
                          )}
                        </div>
                      </div>
                    )}
                    {view === View.Stats && stats && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                <div className="p-4 bg-blue-100 dark:bg-blue-900/50 rounded-lg text-center"><div className="text-2xl font-bold text-blue-600 dark:text-blue-300">{stats.completed}</div><div className="text-sm">완료</div></div>
                                <div className="p-4 bg-yellow-100 dark:bg-yellow-900/50 rounded-lg text-center"><div className="text-2xl font-bold text-yellow-600 dark:text-yellow-300">{stats.pending}</div><div className="text-sm">진행중</div></div>
                                <div className="p-4 bg-gray-100 dark:bg-gray-700/50 rounded-lg text-center"><div className="text-2xl font-bold">{stats.total}</div><div className="text-sm">전체</div></div>
                                <div className="p-4 bg-green-100 dark:bg-green-900/50 rounded-lg text-center"><div className="text-2xl font-bold text-green-600 dark:text-green-300">{stats.completionRate}%</div><div className="text-sm">완료율</div></div>
                            </div>
                            
                            <div className="lg:flex lg:gap-6 space-y-6 lg:space-y-0">
                              <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm lg:w-1/2">
                                  <h3 className="font-semibold text-center mb-4">일일 완료 현황 (최근 7일)</h3>
                                  <ResponsiveContainer width="100%" height={150}>
                                      <BarChart data={dailyChartData}>
                                          <XAxis dataKey="dayName" tick={{fill: 'currentColor', fontSize: 12}} axisLine={false} tickLine={false} />
                                          <YAxis tick={{fill: 'currentColor', fontSize: 12}} axisLine={false} tickLine={false} allowDecimals={false} />
                                          <Tooltip contentStyle={{backgroundColor: 'rgba(30, 41, 59, 0.8)', border: 'none', borderRadius: '8px'}} labelStyle={{color: '#cbd5e1'}}/>
                                          <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                                      </BarChart>
                                  </ResponsiveContainer>
                              </div>
                              
                              <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm lg:w-1/2">
                                  <h3 className="font-semibold text-center mb-4">카테고리별 미완료 목표</h3>
                                  <div className="space-y-3">
                                    {categoryStats.length > 0 ? categoryStats.map(cat => (
                                      <div key={cat.category}>
                                        <div className="flex justify-between items-center text-sm mb-1">
                                          <span className={`font-medium`}>{cat.category}</span>
                                          <span className="text-slate-500 dark:text-slate-400">{cat.count}개</span>
                                        </div>
                                        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                                          <div className="bg-blue-500 h-2 rounded-full" style={{width: `${cat.percentage}%`}}></div>
                                        </div>
                                      </div>
                                    )) : <EmptyState icon="pie_chart" title="데이터가 없습니다." />}
                                  </div>
                              </div>
                            </div>
                        </div>
                    )}
                    {view === View.Settings && (
                      <div className="p-4 space-y-6">
                        <div className="text-center">
                            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">설정</h2>
                            <p className="text-sm text-slate-500">앱 설치 및 기타 옵션을 관리합니다.</p>
                        </div>
                    
                        {/* App Installation Section */}
                        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm">
                          <div className="flex items-center gap-4 mb-4">
                              <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                                  <span className="material-icons text-2xl text-blue-500">install_mobile</span>
                              </div>
                              <div>
                                <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">앱 설치</h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400">홈 화면에 추가하여 더 빠르게 액세스하세요.</p>
                              </div>
                          </div>
                          
                          {isStandalone ? (
                              <p className="text-sm text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30 p-3 rounded-lg flex items-center gap-2">
                                <span className="material-icons text-lg">check_circle</span>
                                <span className="font-semibold">설치 완료!</span> 앱이 홈 화면에 설치되었습니다.
                              </p>
                          ) : installPrompt ? (
                            <div>
                              <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
                                이 웹앱을 홈 화면에 추가하여 네이티브 앱처럼 사용하세요. 오프라인에서도 작동합니다.
                              </p>
                              <button onClick={handleInstallClick} className="w-full p-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg font-semibold transition hover:opacity-90 active:scale-95 flex items-center justify-center gap-2">
                                <span className="material-icons text-lg">download</span>
                                앱 설치하기
                              </button>
                            </div>
                          ) : (
                            <div>
                                <p className="text-sm text-slate-600 dark:text-slate-300">
                                  현재 사용 중인 브라우저에서는 자동 설치를 지원하지 않을 수 있습니다.
                                </p>
                                <div className="mt-4 p-4 bg-slate-100 dark:bg-slate-700/50 rounded-lg">
                                    <p className="font-semibold text-sm mb-2 text-slate-700 dark:text-slate-200">수동 설치 방법:</p>
                                    <ul className="text-sm text-slate-600 dark:text-slate-300 space-y-2">
                                        <li className="flex items-start gap-2">
                                            <span className="material-icons text-base mt-0.5">android</span>
                                            <div><strong>Chrome (Android):</strong> 메뉴 ⋮ {'>'} '앱 설치' 또는 '홈 화면에 추가'</div>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <span className="material-icons text-base mt-0.5">phone_iphone</span>
                                            <div><strong>Safari (iOS):</strong> 공유 <span className="material-icons text-sm align-middle">ios_share</span> {'>'} '홈 화면에 추가'</div>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    </>
                )}
            </main>

            <button onClick={() => { setEditingGoal(null); setIsModalOpen(true); }} className="fixed bottom-24 right-5 md:right-auto md:left-1/2 md:translate-x-[220px] lg:translate-x-[400px] w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-full flex items-center justify-center shadow-lg z-20 transition-transform active:scale-90">
              <span className="material-icons">add</span>
            </button>
            
            <nav className="fixed bottom-0 left-0 right-0 bg-white/80 dark:bg-black/80 backdrop-blur-xl border-t border-slate-200 dark:border-slate-800 flex justify-around md:absolute md:left-1/2 md:-translate-x-1/2 md:w-full md:max-w-xl lg:max-w-4xl md:rounded-b-2xl">
                {[
                  { id: View.Tasks, icon: 'assignment', label: '작업' },
                  { id: View.Calendar, icon: 'calendar_today', label: '캘린더' },
                  { id: View.Stats, icon: 'trending_up', label: '달성도' },
                  { id: View.Settings, icon: 'settings', label: '설정' },
                ].map(item => (
                    <button key={item.id} onClick={() => setView(item.id)} className={`flex-1 flex flex-col items-center justify-center p-3 transition-colors ${view === item.id ? 'text-blue-500 dark:text-blue-400' : 'text-slate-500'}`}>
                        <span className="material-icons">{item.icon}</span>
                        <span className="text-xs font-medium">{item.label}</span>
                    </button>
                ))}
            </nav>
            <Toast toast={toast} onDismiss={() => setToast(null)} />
            <GoalModal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setEditingGoal(null); }} onSave={handleSaveGoal} editingGoal={editingGoal} currentUser={currentUser} />
            <GoalDetailModal isOpen={isDetailModalOpen} onClose={() => setIsDetailModalOpen(false)} goal={selectedGoal} completion={selectedCompletion} onComplete={handleCompleteGoal} onEdit={handleEditGoal} onDelete={handleDeleteGoal} onRevert={handleRevertGoal} />
          </div>
        </div>
    );
};

export default App;