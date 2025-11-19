import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Activity, Dumbbell, Clock, CheckCircle2, XCircle, Calendar as CalendarIcon } from "lucide-react";
import { exerciseAPI, deviceAPI } from "@/lib/api";
import { toast } from "sonner";
import { DeviceHistoryRecord, ExerciseHistoryRecord, TransformedHistoryItem } from "@/types/history";

// -------------------- Calendar Component --------------------
interface CalendarDay {
  date: Date;
  day: number;
  hasData: boolean;
  score?: number;
  isToday: boolean;
}

interface EnvironmentalCalendarProps {
  deviceHistory: TransformedHistoryItem[];
}

const parseDateString = (dateStr: string) => {
  // Handles "DD/MM/YYYY" format
  const parts = dateStr.split("/");
  if (parts.length !== 3) return new Date(dateStr);
  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const year = parseInt(parts[2], 10);
  return new Date(year, month, day);
};

const EnvironmentalCalendar: React.FC<EnvironmentalCalendarProps> = ({ deviceHistory }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<CalendarDay | null>(null);

  // Group device history by date
  const historyByDate = deviceHistory.reduce((acc: Record<string, TransformedHistoryItem[]>, record) => {
    try {
      if (!record.timestamp) return acc;

      const dateObj = new Date(record.timestamp);
      const dateStr = `${dateObj.getDate().toString().padStart(2, "0")}/${(dateObj.getMonth() + 1)
        .toString()
        .padStart(2, "0")}/${dateObj.getFullYear()}`;
      if (!acc[dateStr]) acc[dateStr] = [];
      acc[dateStr].push(record);
      return acc;
    } catch {
      return acc;
    }
  }, {});

  // Calculate average score per day
  const dailyScores = Object.entries(historyByDate).reduce((acc: Record<string, number>, [date, records]) => {
    const validRecords = records.filter(r => r.score != null && r.score > 0);
    if (validRecords.length > 0) {
      const totalScore = validRecords.reduce((sum, r) => sum + (r.score || 0), 0);
      acc[date] = Number((totalScore / validRecords.length).toFixed(1));

    }
    return acc;
  }, {});

  const getScoreColor = (score: number) => {
    if (score >= 80) return "bg-green-500 hover:bg-green-600";
    if (score >= 60) return "bg-yellow-500 hover:bg-yellow-600";
    return "bg-red-500 hover:bg-red-600";
  };

  const getScoreDescription = (score: number) => {
    if (score >= 80) return "Excellent";
    if (score >= 60) return "Good";
    return "Needs Attention";
  };

  const getDaysInMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const getFirstDayOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();

  const navigateMonth = (dir: number) => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + dir, 1));
  };

  const generateCalendar = (): (CalendarDay | null)[] => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const calendar: (CalendarDay | null)[] = [];

    for (let i = 0; i < firstDay; i++) calendar.push(null);

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      const dateStr = `${date.getDate().toString().padStart(2, "0")}/${(date.getMonth() + 1)
        .toString()
        .padStart(2, "0")}/${date.getFullYear()}`;
      const score = dailyScores[dateStr];
      calendar.push({
        date,
        day,
        hasData: score !== undefined,
        score,
        isToday: date.toDateString() === new Date().toDateString()
      });
    }

    return calendar;
  };

  const calendar = generateCalendar();
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const currentMonthData = calendar.some(day => day && day.hasData);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Button variant="outline" size="sm" onClick={() => navigateMonth(-1)}>← Prev</Button>
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <CalendarIcon className="w-5 h-5" />
          {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
        </h3>
        <Button variant="outline" size="sm" onClick={() => navigateMonth(1)}>Next →</Button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-4">
        {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(d => (
          <div key={d} className="text-center text-sm font-medium text-gray-500 py-2">{d}</div>
        ))}
        {calendar.map((day, idx) => (
          <div key={idx} className={`aspect-square p-1 ${!day ? "invisible" : ""}`}>
            {day && (
              <button
                onClick={() => setSelectedDate(day)}
                className={`w-full h-full rounded-lg flex flex-col items-center justify-center text-sm font-medium transition-all duration-200 ${
                  day.hasData && day.score
                    ? `${getScoreColor(day.score)} text-white shadow-md hover:shadow-lg transform hover:scale-105`
                    : day.isToday
                      ? "bg-blue-100 text-blue-700 border-2 border-blue-300"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                } ${selectedDate?.date.toDateString() === day.date.toDateString() ? "ring-2 ring-primary ring-offset-2" : ""}`}
              >
                <span>{day.day}</span>
                {day.hasData && day.score && <span className="text-xs opacity-90 mt-1">{day.score}</span>}
              </button>
            )}
          </div>
        ))}
      </div>

      {!currentMonthData && (
        <Card className="p-4 text-center text-muted-foreground">
          <p>No environmental data available for {monthNames[currentDate.getMonth()]}</p>
          <p className="text-sm mt-1">Try checking other months or ensure your device is connected</p>
        </Card>
      )}

      {currentMonthData && selectedDate && (
        <>
          {selectedDate.hasData && selectedDate.score ? (
            <Card className="p-4 mt-4 animate-fade-in">
              <h4 className="font-semibold mb-2">{selectedDate.date.toLocaleDateString('en-GB', { weekday:'long', year:'numeric', month:'long', day:'numeric' })}</h4>
              <div className="flex items-center gap-4">
                <div className={`w-16 h-16 rounded-xl flex items-center justify-center text-white font-bold text-xl ${getScoreColor(selectedDate.score)}`}>
                  {selectedDate.score}
                </div>
                <div>
                  <p className="font-medium">{getScoreDescription(selectedDate.score)} Environment</p>
                  <p className="text-sm text-muted-foreground">{historyByDate[`${selectedDate.date.getDate().toString().padStart(2,"0")}/${(selectedDate.date.getMonth()+1).toString().padStart(2,"0")}/${selectedDate.date.getFullYear()}`]?.length || 0} records</p>
                </div>
              </div>
            </Card>
          ) : (
            <Card className="p-4 mt-4 text-center text-muted-foreground">
              No environmental data for {selectedDate.date.toLocaleDateString()}
            </Card>
          )}
        </>
      )}
    </div>
  );
};

// -------------------- History Component --------------------
const History = () => {
  const navigate = useNavigate();
  const [selectedTab, setSelectedTab] = useState("all");
  const [exerciseHistory, setExerciseHistory] = useState<ExerciseHistoryRecord[]>([]);
  const [deviceHistory, setDeviceHistory] = useState<DeviceHistoryRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchHistoryWithFallback = async () => {
    try {
      // Fetch exercise history
      try {
        const exercisesResponse = await exerciseAPI.getHistory();
        const exercises = (exercisesResponse.history || exercisesResponse || []) as ExerciseHistoryRecord[];
        setExerciseHistory(Array.isArray(exercises) ? exercises : []);
      } catch (exerciseError) {
        console.error("Failed to load exercise history:", exerciseError);
        toast.error("Failed to load exercise history");
        setExerciseHistory([]);
      }

      // Fetch device history
      try {
        const devicesResponse = await deviceAPI.getData("esp32-001", 50, 800);
        const devices = (devicesResponse.data || devicesResponse || []) as DeviceHistoryRecord[];
        setDeviceHistory(Array.isArray(devices) ? devices : []);
      } catch (deviceError) {
        console.error("Device history error details:", deviceError);
        toast.error("Failed to load device history");
        setDeviceHistory([]);
      }
    } catch (error) {
      toast.error("Failed to load history data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistoryWithFallback();
  }, []);

const calculateStats = () => {
  // Only device records with valid score
  const validDeviceRecords = deviceHistory.filter(r => r.ieq_score != null && !isNaN(Number(r.ieq_score)));

  // Group by processed day
  const scoresByDay: Record<string, number[]> = {};
  validDeviceRecords.forEach(r => {
    const dateStr = new Date(r.processed_at).toDateString();
    if (!scoresByDay[dateStr]) scoresByDay[dateStr] = [];
    scoresByDay[dateStr].push(Number(r.ieq_score));
  });

  // Average per day
  const dailyAverages = Object.values(scoresByDay).map(scores => {
    const total = scores.reduce((sum, s) => sum + s, 0);
    return total / scores.length;
  });

  // Final average across all days
  const avgScore = dailyAverages.length
    ? Math.round(dailyAverages.reduce((sum, s) => sum + s, 0) / dailyAverages.length)
    : 0;
  const avgScoreDisplay = avgScore.toFixed(1);

  const uniqueDays = Object.keys(scoresByDay).length;

  return {
    total: deviceHistory.length + exerciseHistory.length,
    completed: exerciseHistory.length,
    avgScore:avgScoreDisplay,
    totalDeviceDays: uniqueDays,
    validRecords: validDeviceRecords.length
  };
};



  const stats = calculateStats();

  const getTypeIcon = (type: string) => (type === "device" ? Activity : type === "exercise" ? Dumbbell : Activity);
  const getTypeColor = (type: string) => (type === "device" ? "from-primary to-accent" : type === "exercise" ? "from-success to-emerald-500" : "from-muted to-muted-foreground");

  const formatTimestamp = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffHours / 24);
      if (diffHours < 1) return "Just now";
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays === 1) return "Yesterday";
      if (diffDays < 7) return `${diffDays} days ago`;
      return date.toLocaleDateString();
    } catch {
      return "Unknown time";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-wellness flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Transform histories
  const transformedDeviceHistory: TransformedHistoryItem[] = deviceHistory.map(dev => ({
    ...dev,
    type: "device" as const,
    title: "Environment Check",
    timestamp: dev.processed_at || dev.timestamp,
    status: "completed",
    score: dev.ieq_score,
    duration: undefined
  }));

  const transformedExerciseHistory: TransformedHistoryItem[] = exerciseHistory.map(ex => ({
    ...ex,
    type: "exercise" as const,
    title: ex.exercise_name || ex.name || "Unknown Exercise",
    timestamp: ex.completed_at || ex.created_at || ex.timestamp || "",
    status: "completed",
    score: undefined,
    duration: ex.duration_minutes || ex.duration
  }));

  const allHistory: TransformedHistoryItem[] = [...transformedExerciseHistory, ...transformedDeviceHistory].sort((a, b) => {
    try {
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    } catch {
      return 0;
    }
  });

  const filteredData = selectedTab === "all" ? allHistory : allHistory.filter(item => item.type === selectedTab);

  return (
    <div className="min-h-screen bg-gradient-wellness pb-24">
      <div className="bg-gradient-primary text-white p-4 shadow-wellness-lg sticky top-0 z-10">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")} className="text-white hover:bg-white/20">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold">History</h1>
            <p className="text-sm opacity-90">Your wellness journey</p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-3">
          <Card className="p-4 text-center animate-fade-in"><div className="text-2xl font-bold text-primary">{stats.total}</div><p className="text-xs text-muted-foreground mt-1">Total Items</p></Card>
          <Card className="p-4 text-center animate-fade-in"><div className="text-2xl font-bold text-success">{stats.completed}</div><p className="text-xs text-muted-foreground mt-1">Exercises</p></Card>
          <Card className="p-4 text-center animate-fade-in"><div className="text-2xl font-bold text-primary">{stats.avgScore}</div><p className="text-xs text-muted-foreground mt-1">Avg Score</p></Card>
          <Card className="p-4 text-center animate-fade-in"><div className="text-2xl font-bold text-primary">{stats.totalDeviceDays}</div><p className="text-xs text-muted-foreground mt-1">Active Days</p></Card>
        </div>

        <Card className="p-4 animate-fade-in">
          <Tabs value={selectedTab} onValueChange={setSelectedTab}>
            <TabsList className="grid w-full grid-cols-3 mb-4">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="device">Environment</TabsTrigger>
              <TabsTrigger value="exercise">Exercises</TabsTrigger>
            </TabsList>

            <TabsContent value={selectedTab} className="space-y-3 mt-0">
              {selectedTab === "device" ? (
                <EnvironmentalCalendar deviceHistory={transformedDeviceHistory} />
              ) : filteredData.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {selectedTab === "all" ? "No history available yet" : `No ${selectedTab} history available`}
                </div>
              ) : (
                filteredData.map((item, index) => {
                  const Icon = getTypeIcon(item.type);
                  const color = getTypeColor(item.type);

                  return (
                    <div key={`${item.type}-${item.exercise_id || item.device_id || index}`} className="flex items-start gap-3 p-4 bg-muted/30 rounded-xl hover:bg-muted/50 transition-colors animate-fade-in" style={{ animationDelay: `${index * 50}ms` }}>
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-gradient-to-br ${color}`}>
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-semibold truncate">{item.title}</h3>
                          {item.status === "completed" ? (
                            <CheckCircle2 className="w-4 h-4 text-success flex-shrink-0" />
                          ) : (
                            <XCircle className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-1 flex-wrap">
                          <span className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3" />{formatTimestamp(item.timestamp)}</span>
                          {item.score != null && <span className="text-xs text-muted-foreground flex items-center gap-1"><Activity className="w-3 h-3" />Score: {item.score}</span>}
                          {item.duration && <span className="text-xs text-muted-foreground flex items-center gap-1"><Dumbbell className="w-3 h-3" />{item.duration} mins</span>}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
};

export default History;
