import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import api from '../api/api';
import TopHeader from '../components/TopHeader';

// Shadcn/ui imports
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Users, 
  UserPlus, 
  Smartphone, 
  Star, 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  CheckCircle2,
  ArrowRight,
  Sun,
  Wind,
  Activity,
  BarChart3,
  Settings,
  HelpCircle,
  Loader2,
  Trophy,
  Calendar,
  Target
} from 'lucide-react';

interface DashboardStats {
  teamCount: number;
  athleteCount: number;
  appUsersCount: number;
  recentJoins: number;
}

interface RecentActivity {
  id: number;
  type: 'new_athlete' | 'app_join' | 'team_created' | 'achievement';
  message: string;
  time: string;
  icon: React.ReactNode;
}

interface TodoItem {
  task: string;
  priority: 'magas' | 'közepes' | 'alacsony';
  completed: boolean;
}

export default function Dashboard() {
  const { firstName } = useAuthStore();
  const [stats, setStats] = useState<DashboardStats>({
    teamCount: 0,
    athleteCount: 0,
    appUsersCount: 0,
    recentJoins: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [todos, setTodos] = useState<TodoItem[]>([
    { task: 'Heti teljesítmény áttekintése', priority: 'magas', completed: false },
    { task: 'Új sportolók app-ba meghívása', priority: 'közepes', completed: false },
    { task: 'Sprint csapat edzésterv frissítése', priority: 'alacsony', completed: true },
    { task: 'Verseny eredmények rögzítése', priority: 'magas', completed: false }
  ]);

  const recentActivities: RecentActivity[] = [
    {
      id: 1,
      type: 'app_join',
      message: 'Nagy Eszter csatlakozott az alkalmazásba',
      time: '2 órája',
      icon: <Smartphone className="w-4 h-4" />
    },
    {
      id: 2,
      type: 'achievement',
      message: 'Kovács Péter új egyéni rekordot ért el (11.2s)',
      time: '5 órája',
      icon: <Trophy className="w-4 h-4" />
    },
    {
      id: 3,
      type: 'team_created',
      message: 'Sprint csapat létrehozva 3 sportolóval',
      time: '1 napja',
      icon: <Users className="w-4 h-4" />
    },
    {
      id: 4,
      type: 'new_athlete',
      message: 'Szabó János hozzáadva a Futó csapathoz',
      time: '2 napja',
      icon: <UserPlus className="w-4 h-4" />
    }
  ];

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      
      const [teamsRes, athletesRes] = await Promise.all([
        api.get('/teams/my-teams'),
        api.get('/athletes')
      ]);
      
      const teams = teamsRes.data;
      const athletes = athletesRes.data;
      const appUsers = athletes.filter((athlete: any) => athlete.HasUserAccount);
      
      setStats({
        teamCount: teams.length,
        athleteCount: athletes.length,
        appUsersCount: appUsers.length,
        recentJoins: Math.floor(Math.random() * 5) + 1
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const currentHour = new Date().getHours();
  const getGreeting = () => {
    if (currentHour < 12) return 'Jó reggelt';
    if (currentHour < 18) return 'Jó napot';
    return 'Jó estét';
  };

  const quickActions = [
    { name: 'Új sportoló', href: '/athletes', icon: <UserPlus className="w-6 h-6" />, description: 'Sportoló hozzáadása' },
    { name: 'Csapatok', href: '/my-teams', icon: <Users className="w-6 h-6" />, description: 'Csapatok kezelése' },
    { name: 'Edzéstervek', href: '/training-plans', icon: <Calendar className="w-6 h-6" />, description: 'Tervek létrehozása' },
    { name: 'Analitika', href: '/analytics', icon: <BarChart3 className="w-6 h-6" />, description: 'Hamarosan elérhető' },
    { name: 'Profil', href: '/profile', icon: <Settings className="w-6 h-6" />, description: 'Fiók beállítások' },
    { name: 'Segítség', href: '/help', icon: <HelpCircle className="w-6 h-6" />, description: 'Támogatás' }
  ];

  const toggleTodo = (index: number) => {
    setTodos(prev => prev.map((todo, i) => 
      i === index ? { ...todo, completed: !todo.completed } : todo
    ));
  };

  const getPriorityVariant = (priority: string) => {
    switch (priority) {
      case 'magas': return 'destructive';
      case 'közepes': return 'secondary';
      case 'alacsony': return 'outline';
      default: return 'secondary';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background lg:pl-64 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Dashboard betöltése...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background lg:pl-64">
      <TopHeader title="Főoldal" />
      
      <div className="px-6 lg:px-8 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Welcome Section */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-1">
              {getGreeting()}, {firstName || 'Edző'}! 👋
            </h2>
            <p className="text-muted-foreground">
              Itt van a mai áttekintésed és a legfontosabb teendők
            </p>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="hover:shadow-lg transition-all duration-200 border-border/50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Csapatok</CardTitle>
                <div className="h-8 w-8 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                  <Users className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold mb-1">{stats.teamCount}</div>
                <p className="text-xs text-muted-foreground">Aktív csapatok száma</p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-all duration-200 border-border/50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Sportolók</CardTitle>
                <div className="h-8 w-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <Target className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold mb-1">{stats.athleteCount}</div>
                <p className="text-xs text-muted-foreground">Összes sportoló</p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-all duration-200 border-border/50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">App felhasználók</CardTitle>
                <div className="h-8 w-8 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <Smartphone className="h-4 w-4 text-green-600 dark:text-green-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold mb-1">{stats.appUsersCount}</div>
                <p className="text-xs text-muted-foreground">Regisztrált sportolók</p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-all duration-200 border-border/50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Új csatlakozók</CardTitle>
                <div className="h-8 w-8 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                  <Star className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold mb-1">{stats.recentJoins}</div>
                <p className="text-xs text-muted-foreground">Ez a héten</p>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Recent Activity & Quick Actions */}
            <div className="lg:col-span-2 space-y-8">
              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Activity className="w-5 h-5 mr-2" />
                    Legújabb tevékenységek
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentActivities.map((activity) => (
                      <div key={activity.id} className="flex items-start space-x-4 p-3 hover:bg-muted/50 rounded-lg transition-colors">
                        <div className="flex-shrink-0 w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                          {activity.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground">{activity.message}</p>
                          <div className="flex items-center text-xs text-muted-foreground mt-1">
                            <Clock className="w-3 h-3 mr-1" />
                            {activity.time}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <Button variant="ghost" className="w-full mt-6" asChild>
                    <Link to="/activity">
                      Összes tevékenység megtekintése
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Gyors műveletek</CardTitle>
                  <CardDescription>
                    Gyakran használt funkciók egyszerű elérése
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {quickActions.map((action) => (
                      <Button key={action.name} variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2" asChild>
                        <Link to={action.href}>
                          <div className="text-primary">
                            {action.icon}
                          </div>
                          <div className="text-center">
                            <div className="text-sm font-medium">{action.name}</div>
                            <div className="text-xs text-muted-foreground">{action.description}</div>
                          </div>
                        </Link>
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-8">
              {/* Today's Focus */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <CheckCircle2 className="w-5 h-5 mr-2" />
                    Mai teendők
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {todos.map((item, index) => (
                      <div key={index} className="flex items-start space-x-3 p-2 hover:bg-muted/50 rounded-lg transition-colors">
                        <Checkbox 
                          checked={item.completed}
                          onCheckedChange={() => toggleTodo(index)}
                          className="mt-1"
                        />
                        <div className="flex-1 space-y-2">
                          <p className={`text-sm ${item.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                            {item.task}
                          </p>
                          <Badge variant={getPriorityVariant(item.priority)} className="text-xs">
                            {item.priority}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Weather Widget */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Sun className="w-5 h-5 mr-2" />
                    Mai időjárás
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <div className="space-y-2">
                    <Sun className="w-12 h-12 mx-auto text-yellow-500" />
                    <div className="text-2xl font-bold">22°C</div>
                    <div className="flex items-center justify-center text-sm text-muted-foreground">
                      <Wind className="w-4 h-4 mr-1" />
                      Napos, szél: 10 km/h
                    </div>
                    <Badge variant="secondary" className="text-green-600 bg-green-50">
                      Tökéletes külső edzéshez! 🏃‍♂️
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Team Performance */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <BarChart3 className="w-5 h-5 mr-2" />
                    Csapat teljesítmény
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 hover:bg-muted/50 rounded-lg transition-colors">
                      <span className="text-sm font-medium">Sprint csapat</span>
                      <div className="flex items-center text-green-600">
                        <TrendingUp className="w-4 h-4 mr-1" />
                        <span className="text-sm font-medium">+5.2%</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center p-3 hover:bg-muted/50 rounded-lg transition-colors">
                      <span className="text-sm font-medium">Futó csapat</span>
                      <div className="flex items-center text-blue-600">
                        <TrendingUp className="w-4 h-4 mr-1" />
                        <span className="text-sm font-medium">+2.1%</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center p-3 hover:bg-muted/50 rounded-lg transition-colors">
                      <span className="text-sm font-medium">Távfutó csapat</span>
                      <div className="flex items-center text-orange-600">
                        <TrendingDown className="w-4 h-4 mr-1" />
                        <span className="text-sm font-medium">-1.3%</span>
                      </div>
                    </div>
                  </div>
                  <Button variant="ghost" className="w-full mt-4" asChild>
                    <Link to="/analytics">
                      Részletes analitika
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}