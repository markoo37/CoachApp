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
  Target,
  Info,
  Search,
  Bell,
  MessageCircle,
  MoreVertical,
  ArrowUpDown,
  Maximize2,
  Package,
  Shield,
  XCircle
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface DashboardStats {
  teamCount: number;
  athleteCount: number;
  appUsersCount: number;
  recentJoins: number;
}

interface MetricCard {
  title: string;
  value: number;
  change: number;
  isPositive: boolean;
  icon: React.ReactNode;
}

interface RecentActivity {
  id: number;
  orderId: string;
  category: string;
  company: string;
  arrivalTime: string;
  route: string;
  price: string;
  status: 'Delivered' | 'InProgress' | 'Canceled' | 'Pending' | 'Processing';
}

interface HeatmapData {
  day: string;
  cells: number[];
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
  const [timeRange, setTimeRange] = useState<'Day' | 'Week' | 'Month' | 'Year'>('Week');
  const [activityFilter, setActivityFilter] = useState<'All' | 'Delivered' | 'In Transit' | 'Pending' | 'Processing'>('All');

  // Mock data for metrics
  const metrics: MetricCard[] = [
    {
      title: 'Total Shipment',
      value: 232,
      change: 58.5,
      isPositive: true,
      icon: <Package className="w-5 h-5" />
    },
    {
      title: 'Pending Package',
      value: 132,
      change: 58.5,
      isPositive: true,
      icon: <Clock className="w-5 h-5" />
    },
    {
      title: 'Delivery Shipment',
      value: 100,
      change: 58.5,
      isPositive: false,
      icon: <CheckCircle2 className="w-5 h-5" />
    },
    {
      title: 'Safe',
      value: 100,
      change: 58.5,
      isPositive: false,
      icon: <Shield className="w-5 h-5" />
    },
    {
      title: 'Canceled',
      value: 100,
      change: 58.5,
      isPositive: false,
      icon: <XCircle className="w-5 h-5" />
    }
  ];

  // Mock data for tracking analytics
  const trackingData = [
    { day: 'Mon', value: 8 },
    { day: 'Tue', value: 12 },
    { day: 'Wed', value: 17 },
    { day: 'Thu', value: 21 },
    { day: 'Fri', value: 12 },
    { day: 'Sat', value: 15 },
    { day: 'Sun', value: 19 }
  ];

  // Mock heatmap data - including a red cell on Wednesday
  const heatmapData: HeatmapData[] = [
    { day: 'Mon', cells: [2, 3, 1, 2, 4, 3, 2, 1, 2, 3, 2, 1] },
    { day: 'Tue', cells: [3, 2, 4, 3, 2, 1, 3, 2, 4, 1, 2, 3] },
    { day: 'Wed', cells: [1, 4, 2, -1, 1, 3, 2, 4, 1, 2, 3, 1] }, // -1 for red cell
    { day: 'Thu', cells: [2, 3, 1, 2, 4, 3, 2, 1, 2, 3, 2, 1] },
    { day: 'Fri', cells: [3, 2, 4, 3, 2, 1, 3, 2, 4, 1, 2, 3] },
    { day: 'Sat', cells: [1, 4, 2, 5, 1, 3, 2, 4, 1, 2, 3, 1] },
    { day: 'Sun', cells: [2, 3, 1, 2, 4, 3, 2, 1, 2, 3, 2, 1] }
  ];

  const recentActivities: RecentActivity[] = [
    {
      id: 1,
      orderId: '19266755',
      category: 'Electronics',
      company: 'Fantom',
      arrivalTime: '12 Sept 2024',
      route: 'Ch-BD',
      price: '$23423.3',
      status: 'Delivered'
    },
    {
      id: 2,
      orderId: '19266755',
      category: 'Electronics',
      company: 'Fantom',
      arrivalTime: '12 Sept 2024',
      route: 'Ch-BD',
      price: '$23423.3',
      status: 'InProgress'
    },
    {
      id: 3,
      orderId: '19266755',
      category: 'Electronics',
      company: 'Fantom',
      arrivalTime: '12 Sept 2024',
      route: 'Ch-BD',
      price: '$23423.3',
      status: 'Canceled'
    },
    {
      id: 4,
      orderId: '19266755',
      category: 'Electronics',
      company: 'Fantom',
      arrivalTime: '12 Sept 2024',
      route: 'Ch-BD',
      price: '$23423.3',
      status: 'Delivered'
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Delivered':
        return 'text-green-600 dark:text-green-400';
      case 'InProgress':
        return 'text-blue-600 dark:text-blue-400';
      case 'Canceled':
        return 'text-red-600 dark:text-red-400';
      case 'Pending':
        return 'text-yellow-600 dark:text-yellow-400';
      case 'Processing':
        return 'text-purple-600 dark:text-purple-400';
      default:
        return 'text-muted-foreground';
    }
  };

  const getHeatmapColor = (value: number) => {
    if (value === -1) return 'bg-red-600 dark:bg-red-500'; // Special red cell
    if (value >= 4) return 'bg-green-600 dark:bg-green-700';
    if (value >= 3) return 'bg-green-500 dark:bg-green-600';
    if (value >= 2) return 'bg-green-400 dark:bg-green-500';
    if (value >= 1) return 'bg-green-300 dark:bg-green-800';
    return 'bg-muted';
  };

  const filteredActivities = activityFilter === 'All' 
    ? recentActivities 
    : recentActivities.filter(a => {
        if (activityFilter === 'Delivered') return a.status === 'Delivered';
        if (activityFilter === 'In Transit') return a.status === 'InProgress';
        if (activityFilter === 'Pending') return a.status === 'Pending';
        if (activityFilter === 'Processing') return a.status === 'Processing';
        return true;
      });

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

  const chartConfig = {
    value: {
      label: 'Value',
      color: 'hsl(var(--chart-1))',
    },
  };

  return (
    <div className="min-h-screen bg-background lg:pl-64">
      <TopHeader title="Főoldal" />
      
      <div className="px-6 lg:px-8 py-8">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Key Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            {metrics.map((metric, index) => (
              <Card key={index} className="hover:shadow-lg transition-all duration-200 border-border/50">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    {metric.title}
                    <button className="w-4 h-4 rounded-full bg-muted hover:bg-muted/80 flex items-center justify-center">
                      <Info className="w-3 h-3 text-muted-foreground" />
                    </button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold mb-2">{metric.value}</div>
                  <div className={`flex items-center text-sm ${metric.isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {metric.isPositive ? (
                      <TrendingUp className="w-4 h-4 mr-1" />
                    ) : (
                      <TrendingDown className="w-4 h-4 mr-1" />
                    )}
                    {metric.isPositive ? '+' : ''}{metric.change}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Time Range Selector */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {(['Day', 'Week', 'Month', 'Year'] as const).map((range) => (
                <Button
                  key={range}
                  variant={timeRange === range ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTimeRange(range)}
                  className={timeRange === range ? '' : 'bg-transparent'}
                >
                  {range}
                </Button>
              ))}
            </div>
            <Button variant="ghost" size="sm">
              <Maximize2 className="w-4 h-4" />
            </Button>
          </div>

          {/* Shipment Activates & Tracking Analytics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Shipment Activates */}
            <Card>
              <CardHeader>
                <CardTitle>Shipment Activates</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold">48</div>
                    <div className="text-sm text-muted-foreground">Shipment</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold">27</div>
                    <div className="text-sm text-muted-foreground">Delivered</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold">03</div>
                    <div className="text-sm text-muted-foreground">Canceled</div>
                  </div>
                </div>
                <div className="space-y-2">
                  {heatmapData.map((row, rowIndex) => (
                    <div key={rowIndex} className="flex items-center gap-2">
                      <div className="w-12 text-xs text-muted-foreground">{row.day}</div>
                      <div className="flex gap-1 flex-1">
                        {row.cells.map((cell, cellIndex) => (
                          <div
                            key={cellIndex}
                            className={`h-6 flex-1 rounded ${getHeatmapColor(cell)}`}
                            title={`Value: ${cell}`}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Tracking Analytics */}
            <Card>
              <CardHeader>
                <CardTitle>Tracking Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-[300px]">
                  <BarChart data={trackingData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="day" 
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                    />
                    <YAxis 
                      domain={[0, 25]}
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      ticks={[0, 5, 10, 15, 20, 25]}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar 
                      dataKey="value" 
                      fill="hsl(var(--primary))"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activities */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Recent Activities</CardTitle>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm">
                    Customize
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Filter Buttons */}
              <div className="flex items-center gap-2 mb-4">
                {(['All', 'Delivered', 'In Transit', 'Pending', 'Processing'] as const).map((filter) => (
                  <Button
                    key={filter}
                    variant={activityFilter === filter ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setActivityFilter(filter)}
                    className={activityFilter === filter ? '' : 'bg-transparent'}
                  >
                    {filter}
                  </Button>
                ))}
              </div>

              {/* Table */}
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox />
                      </TableHead>
                      <TableHead className="flex items-center gap-1">
                        Order ID
                        <ArrowUpDown className="w-3 h-3" />
                      </TableHead>
                      <TableHead className="flex items-center gap-1">
                        Category
                        <ArrowUpDown className="w-3 h-3" />
                      </TableHead>
                      <TableHead className="flex items-center gap-1">
                        Company
                        <ArrowUpDown className="w-3 h-3" />
                      </TableHead>
                      <TableHead className="flex items-center gap-1">
                        Arrival Time
                        <ArrowUpDown className="w-3 h-3" />
                      </TableHead>
                      <TableHead className="flex items-center gap-1">
                        Route
                        <ArrowUpDown className="w-3 h-3" />
                      </TableHead>
                      <TableHead className="flex items-center gap-1">
                        Price
                        <ArrowUpDown className="w-3 h-3" />
                      </TableHead>
                      <TableHead className="flex items-center gap-1">
                        Status
                        <ArrowUpDown className="w-3 h-3" />
                      </TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredActivities.map((activity) => (
                      <TableRow key={activity.id}>
                        <TableCell>
                          <Checkbox />
                        </TableCell>
                        <TableCell className="font-medium">{activity.orderId}</TableCell>
                        <TableCell>{activity.category}</TableCell>
                        <TableCell>{activity.company}</TableCell>
                        <TableCell>{activity.arrivalTime}</TableCell>
                        <TableCell>{activity.route}</TableCell>
                        <TableCell>{activity.price}</TableCell>
                        <TableCell>
                          <span className={getStatusColor(activity.status)}>
                            {activity.status}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-muted-foreground">
                  1-10 of 50
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm">
                    <ArrowRight className="w-4 h-4 rotate-180" />
                  </Button>
                  <Button variant="outline" size="sm">
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}