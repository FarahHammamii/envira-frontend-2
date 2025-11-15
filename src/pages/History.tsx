import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Activity, Dumbbell, Clock, CheckCircle2, XCircle, Calendar as CalendarIcon } from "lucide-react";
import { exerciseAPI, deviceAPI } from "@/lib/api";
import { toast } from "sonner";

// Calendar Component for Environmental Data
const EnvironmentalCalendar = ({ deviceHistory }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);

  console.log("Calendar received device history:", deviceHistory);

  // Group device history by date - FIXED DATA TRANSFORMATION
  const historyByDate = deviceHistory.reduce((acc, record) => {
    try {
      // Use the correct timestamp field from the API response
      const timestamp = record.timestamp || record.processed_at;
      if (!timestamp) return acc;
      
      const date = new Date(timestamp).toDateString();
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(record);
      return acc;
    } catch (error) {
      console.warn("Error processing record:", record, error);
      return acc;
    }
  }, {});

  console.log("History grouped by date:", historyByDate);

  // Calculate average score for each day - FIXED SCORE EXTRACTION
  const dailyScores = Object.entries(historyByDate).reduce((acc, [date, records]) => {
    const scores = records.map(r => r.ieq_score || r.environmental_score || 0).filter(score => score > 0);
    console.log(`Date ${date} scores:`, scores);
    
    if (scores.length > 0) {
      acc[date] = Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
    }
    return acc;
  }, {});

  console.log("Daily scores:", dailyScores);

  const getScoreColor = (score) => {
    if (score >= 80) return "bg-green-500 hover:bg-green-600";
    if (score >= 60) return "bg-yellow-500 hover:bg-yellow-600";
    return "bg-red-500 hover:bg-red-600";
  };

  const getScoreDescription = (score) => {
    if (score >= 80) return "Excellent";
    if (score >= 60) return "Good";
    return "Needs Attention";
  };

  // Calendar generation functions
  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const navigateMonth = (direction) => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + direction, 1));
  };

  const generateCalendar = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const calendar = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      calendar.push(null);
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      const dateString = date.toDateString();
      const score = dailyScores[dateString];
      
      calendar.push({
        date,
        day,
        hasData: !!score,
        score,
        isToday: date.toDateString() === new Date().toDateString()
      });
    }

    return calendar;
  };

  const calendar = generateCalendar();
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  // Check if we have any data for the current month
  const currentMonthData = calendar.some(day => day && day.hasData);

  return (
    <div className="space-y-4">
      {/* Calendar Header */}
      <div className="flex items-center justify-between">
        <Button variant="outline" size="sm" onClick={() => navigateMonth(-1)}>
          ← Prev
        </Button>
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <CalendarIcon className="w-5 h-5" />
          {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
        </h3>
        <Button variant="outline" size="sm" onClick={() => navigateMonth(1)}>
          Next →
        </Button>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1 mb-4">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
          <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
            {day}
          </div>
        ))}
        {calendar.map((day, index) => (
          <div
            key={index}
            className={`aspect-square p-1 ${!day ? 'invisible' : ''}`}
          >
            {day && (
              <button
                onClick={() => setSelectedDate(day)}
                className={`w-full h-full rounded-lg flex flex-col items-center justify-center text-sm font-medium transition-all duration-200 ${
                  day.hasData
                    ? `${getScoreColor(day.score)} text-white shadow-md hover:shadow-lg transform hover:scale-105`
                    : day.isToday
                    ? 'bg-blue-100 text-blue-700 border-2 border-blue-300'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                } ${selectedDate?.date?.toDateString() === day.date.toDateString() ? 'ring-2 ring-primary ring-offset-2' : ''}`}
              >
                <span>{day.day}</span>
                {day.hasData && (
                  <span className="text-xs opacity-90 mt-1">
                    {day.score}
                  </span>
                )}
              </button>
            )}
          </div>
        ))}
      </div>

      {/* No Data Message */}
      {!currentMonthData && (
        <Card className="p-4 text-center text-muted-foreground">
          <p>No environmental data available for {monthNames[currentDate.getMonth()]}</p>
          <p className="text-sm mt-1">Try checking other months or ensure your device is connected</p>
        </Card>
      )}

      {/* Legend */}
      {currentMonthData && (
        <>
          <div className="flex justify-center gap-4 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-green-500"></div>
              <span>Excellent (80+)</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-yellow-500"></div>
              <span>Good (60-79)</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-red-500"></div>
              <span>Needs Attention (&lt;60)</span>
            </div>
          </div>

          {/* Selected Date Details */}
          {selectedDate && selectedDate.hasData && (
            <Card className="p-4 mt-4 animate-fade-in">
              <h4 className="font-semibold mb-2">
                {selectedDate.date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </h4>
              <div className="flex items-center gap-4">
                <div className={`w-16 h-16 rounded-xl flex items-center justify-center text-white font-bold text-xl ${getScoreColor(selectedDate.score)}`}>
                  {selectedDate.score}
                </div>
                <div>
                  <p className="font-medium">{getScoreDescription(selectedDate.score)} Environment</p>
                  <p className="text-sm text-muted-foreground">
                    {historyByDate[selectedDate.date.toDateString()]?.length || 0} records
                  </p>
                </div>
              </div>
              {/* Show sensor data for the selected day */}
              {historyByDate[selectedDate.date.toDateString()] && (
                <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                  {historyByDate[selectedDate.date.toDateString()].slice(0, 1).map((record, idx) => (
                    <div key={idx} className="space-y-1">
                      {record.sensors && (
                        <>
                          <div className="flex justify-between">
                            <span>Temperature:</span>
                            <span className="font-medium">{record.sensors.temperature}°C</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Humidity:</span>
                            <span className="font-medium">{record.sensors.humidity}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Air Quality:</span>
                            <span className="font-medium">{record.sensors.air_quality}/100</span>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}

          {selectedDate && !selectedDate.hasData && (
            <Card className="p-4 mt-4 text-center text-muted-foreground">
              No environmental data for {selectedDate.date.toLocaleDateString()}
            </Card>
          )}
        </>
      )}
    </div>
  );
};

const History = () => {
  const navigate = useNavigate();
  const [selectedTab, setSelectedTab] = useState("all");
  const [exerciseHistory, setExerciseHistory] = useState<any[]>([]);
  const [deviceHistory, setDeviceHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchHistoryWithFallback = async () => {
    try {
      console.log("Fetching history data...");
      
      // Fetch exercise history
      try {
        const exercisesResponse = await exerciseAPI.getHistory();
        console.log("Exercise history response:", exercisesResponse);
        
        const exercises = exercisesResponse.history || exercisesResponse || [];
        setExerciseHistory(Array.isArray(exercises) ? exercises : []);
      } catch (exerciseError) {
        console.error("Failed to load exercise history:", exerciseError);
        toast.error("Failed to load exercise history");
        setExerciseHistory([]);
      }

      // Fetch device history with better error handling and debugging
      try {
        const devicesResponse = await deviceAPI.getData("esp32-001", 50, 720);
        console.log("Device history RAW response:", devicesResponse);
        
        // FIX: Extract data from the correct property based on API response
        const devices = devicesResponse.data || devicesResponse || [];
        console.log("Processed device history:", devices);
        
        setDeviceHistory(Array.isArray(devices) ? devices : []);
      } catch (deviceError) {
        console.warn("Could not load device history:", deviceError);
        setDeviceHistory([]);
      }

    } catch (error) {
      console.error("Failed to load history:", error);
      toast.error("Failed to load history data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistoryWithFallback();
  }, []);

  // Rest of the component remains the same...
  const getTypeIcon = (type: string) => {
    switch (type) {
      case "device": return Activity;
      case "exercise": return Dumbbell;
      default: return Activity;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "device": return "from-primary to-accent";
      case "exercise": return "from-success to-emerald-500";
      default: return "from-muted to-muted-foreground";
    }
  };

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

  // Transform device history data to match the expected format - FIXED
  const transformedDeviceHistory = deviceHistory.map((dev: any) => ({
    ...dev,
    type: "device",
    title: "Environment Check",
    timestamp: dev.timestamp || dev.processed_at, // Use correct timestamp field
    status: "completed",
    score: dev.ieq_score || dev.environmental_score, // Use correct score field
    duration: undefined
  }));

  console.log("Transformed device history for calendar:", transformedDeviceHistory);

  // Transform exercise history data
  const transformedExerciseHistory = exerciseHistory.map((ex: any) => ({
    ...ex,
    type: "exercise",
    title: ex.exercise_name || ex.name || "Unknown Exercise",
    timestamp: ex.completed_at || ex.created_at || ex.timestamp,
    status: "completed",
    score: undefined,
    duration: ex.duration_minutes || ex.duration
  }));

  const allHistory = [
    ...transformedExerciseHistory,
    ...transformedDeviceHistory
  ].sort((a, b) => {
    try {
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    } catch {
      return 0;
    }
  });

  const filteredData = selectedTab === "all" ? allHistory : allHistory.filter(item => item.type === selectedTab);

  const stats = {
    total: allHistory.length,
    completed: transformedExerciseHistory.length,
    avgScore: transformedDeviceHistory.length > 0 
      ? Math.round(transformedDeviceHistory.reduce((sum: number, item: any) => sum + (item.score || 0), 0) / transformedDeviceHistory.length) 
      : 0,
    totalDeviceDays: new Set(transformedDeviceHistory.map(item => 
      new Date(item.timestamp).toDateString()
    )).size
  };

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
        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-3">
          <Card className="p-4 text-center animate-fade-in">
            <div className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              {stats.total}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Total Items</p>
          </Card>
          <Card className="p-4 text-center animate-fade-in" style={{ animationDelay: '50ms' }}>
            <div className="text-2xl font-bold text-success">
              {stats.completed}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Exercises</p>
          </Card>
          <Card className="p-4 text-center animate-fade-in" style={{ animationDelay: '100ms' }}>
            <div className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              {stats.avgScore || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Avg Score</p>
          </Card>
          <Card className="p-4 text-center animate-fade-in" style={{ animationDelay: '150ms' }}>
            <div className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              {stats.totalDeviceDays}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Active Days</p>
          </Card>
        </div>

        {/* History List */}
        <Card className="p-4 animate-fade-in" style={{ animationDelay: '200ms' }}>
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
                  {selectedTab === "all" 
                    ? "No history available yet" 
                    : `No ${selectedTab} history available`}
                </div>
              ) : (
                filteredData.map((item: any, index: number) => {
                  const Icon = getTypeIcon(item.type);
                  const color = getTypeColor(item.type);

                  return (
                    <div 
                      key={`${item.type}-${item.exercise_id || item.device_id || index}`} 
                      className="flex items-start gap-3 p-4 bg-muted/30 rounded-xl hover:bg-muted/50 transition-colors animate-fade-in"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
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
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatTimestamp(item.timestamp)}
                          </span>
                          {item.score !== undefined && (
                            <Badge variant="outline" className="text-xs">
                              Score: {Math.round(item.score)}
                            </Badge>
                          )}
                          {item.duration && (
                            <Badge variant="outline" className="text-xs">
                              {Math.round(item.duration)}min
                            </Badge>
                          )}
                          {item.steps_completed && item.total_steps && (
                            <Badge variant="outline" className="text-xs">
                              {item.steps_completed}/{item.total_steps} steps
                            </Badge>
                          )}
                        </div>
                        {item.notes && (
                          <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                            {item.notes}
                          </p>
                        )}
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