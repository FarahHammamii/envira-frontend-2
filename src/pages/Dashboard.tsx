import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Activity,
  Droplets,
  Wind,
  Sun,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Settings,
  LogOut,
  RefreshCw,
  Sparkles
} from "lucide-react";
import { deviceAPI, recommendationsAPI, removeAuthToken } from "@/lib/api";
import { toast } from "sonner";

const Dashboard = () => {
  const navigate = useNavigate();
  const [deviceData, setDeviceData] = useState<any>(null);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [scoreAnimation, setScoreAnimation] = useState(false);
  const previousScoreRef = useRef<number>(0);

  const fetchData = async () => {
    try {
      console.log("Fetching dashboard data...");
      
      // Fetch latest device data
      let latestResponse: any = null;
      try {
        latestResponse = await deviceAPI.getLatest("esp32-001");
        console.log("Device data response:", latestResponse);
      } catch (errLatest) {
        console.error("getLatest failed:", errLatest);
        // Try fallback endpoint
        try {
          latestResponse = await deviceAPI.getLatestSummary("esp32-001");
          console.log("Fallback device data response:", latestResponse);
        } catch (errSummary) {
          console.error("All device data endpoints failed:", errSummary);
          latestResponse = null;
        }
      }

      // Fetch general recommendations
      let recsResponse: any = null;
      try {
        recsResponse = await fetchGeneralRecommendations();
        console.log("Recommendations response:", recsResponse);
      } catch (reErr) {
        console.error("Could not fetch recommendations:", reErr);
        recsResponse = null;
      }

      // Trigger score animation if score changed
      const currentScore = latestResponse?.ieq_score || latestResponse?.environmental_score || 0;
      if (currentScore !== previousScoreRef.current) {
        setScoreAnimation(true);
        previousScoreRef.current = currentScore;
        setTimeout(() => setScoreAnimation(false), 800);
      }

      setDeviceData(latestResponse);
      setRecommendations(recsResponse?.recommendations || []);
    } catch (error) {
      console.error("Dashboard fetch error:", error);
      toast.error("Failed to fetch some data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchGeneralRecommendations = async () => {
    const token = localStorage.getItem("envira_token");
    const response = await fetch("https://envira-backend-production.up.railway.app/recommendations/general", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ device_id: "esp32-001" })
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: "Request failed" }));
      throw new Error(error.detail || error.message || "Request failed");
    }

    return response.json();
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleLogout = () => {
    removeAuthToken();
    toast.success("Logged out successfully");
    navigate("/");
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "bg-success";
    if (score >= 60) return "bg-warning";
    return "bg-destructive";
  };

  const getScoreStatus = (score: number) => {
    if (score >= 80) return { text: "Excellent", icon: CheckCircle };
    if (score >= 60) return { text: "Good", icon: TrendingUp };
    return { text: "Needs Attention", icon: AlertCircle };
  };

  const formatTimestamp = (timestamp: any) => {
    try {
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) return "Just now";
      return date.toLocaleString();
    } catch {
      return "Just now";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-wellness flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-lg font-semibold text-gray-600 animate-pulse">Loading your wellness data...</p>
        </div>
      </div>
    );
  }

  const currentScore = deviceData ? (deviceData.ieq_score || deviceData.environmental_score || 0) : 0;
  const status = deviceData ? getScoreStatus(currentScore) : null;
  const StatusIcon = status?.icon;

  return (
    <div className="min-h-screen bg-gradient-wellness pb-24">
      <div className="bg-gradient-primary text-white p-4 shadow-wellness-lg sticky top-0 z-10">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold">Envira</h1>
              <p className="text-sm opacity-90">Your Wellness Dashboard</p>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" size="icon" onClick={handleRefresh} disabled={refreshing} className="text-white hover:bg-white/20 transition-all duration-300 hover:scale-110">
                <RefreshCw className={`h-5 w-5 ${refreshing ? 'animate-spin' : ''}`} />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => navigate("/preferences")} className="text-white hover:bg-white/20 transition-all duration-300 hover:scale-110">
                <Settings className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" onClick={handleLogout} className="text-white hover:bg-white/20 transition-all duration-300 hover:scale-110">
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-6">
        {/* Score Card with Fixed Visibility and Animation */}
        {deviceData && (
          <Card className="p-8 text-center relative overflow-hidden animate-scale-in hover:shadow-wellness-md transition-all duration-300">
            {/* Animated background effect */}
            <div className={`absolute inset-0 bg-gradient-to-br from-blue-500/5 to-green-500/5 ${scoreAnimation ? 'animate-pulse' : ''}`}></div>
            
            <div className="relative z-10">
              <div className={`text-7xl font-black mb-4 transition-all duration-500 ${
                scoreAnimation ? 'animate-bounce scale-110' : ''
              }`} style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}>
                {Math.round(currentScore)}
              </div>
              
              <div className="flex items-center justify-center gap-3 mb-3">
                {StatusIcon && (
                  <StatusIcon className={`h-6 w-6 ${
                    scoreAnimation ? 'animate-ping' : ''
                  }`} />
                )}
                <Badge className={`${getScoreColor(currentScore)} text-white px-4 py-1 text-sm font-semibold transition-all duration-300 ${
                  scoreAnimation ? 'animate-pulse' : ''
                }`}>
                  {status?.text}
                </Badge>
              </div>
              
              <p className="text-sm text-muted-foreground font-medium">
                {formatTimestamp(deviceData.timestamp || deviceData.ts)}
              </p>
            </div>
          </Card>
        )}

        {/* Sensors Grid with Enhanced Animations */}
        {deviceData && deviceData.sensors && (
          <div className="grid grid-cols-2 gap-4">
            {[
              { key: 'humidity', label: 'Humidity', value: Math.round(deviceData.sensors.humidity ?? 0), unit: '%', icon: Droplets, color: "from-blue-400 to-cyan-400" },
              { key: 'temperature', label: 'Temperature', value: Math.round((deviceData.sensors.temperature ?? 0) * 10) / 10, unit: '°C', icon: Sun, color: "from-orange-400 to-red-400" },
              { key: 'air_quality', label: 'Air Quality', value: Math.round(deviceData.sensors.air_quality ?? 0), unit: '/100', icon: Wind, color: "from-green-400 to-emerald-400" },
              { key: 'sound', label: 'Sound', value: Math.round(deviceData.sensors.sound ?? 0), unit: 'dB', icon: Activity, color: "from-purple-400 to-pink-400" }
            ].map((sensor, index) => {
              const Icon = sensor.icon;
              return (
                <Card 
                  key={sensor.key}
                  className="p-5 group hover:shadow-wellness-md transition-all duration-300 cursor-pointer animate-fade-in hover:scale-105"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${sensor.color} flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-md`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground font-medium">{sensor.label}</p>
                      <div className="flex items-baseline gap-1">
                        <p className="text-2xl font-bold">{sensor.value}</p>
                        <p className="text-sm text-muted-foreground">{sensor.unit}</p>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {!deviceData && (
          <Card className="p-8 text-center animate-fade-in">
            <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-3 animate-pulse" />
            <p className="text-muted-foreground font-medium">No device data available</p>
          </Card>
        )}

        {/* Recommendations with Enhanced Animation */}
        {recommendations.length > 0 && (
          <Card className="p-6 animate-slide-in-left" style={{ animationDelay: '400ms' }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <h3 className="font-semibold text-lg">Recommendations for You</h3>
            </div>
            <div className="space-y-3">
              {recommendations.map((rec: string, index: number) => (
                <div 
                  key={index} 
                  className="p-4 bg-muted/50 rounded-xl flex items-start gap-3 group hover:bg-muted/70 transition-all duration-300 animate-fade-in hover:translate-x-2"
                  style={{ animationDelay: `${500 + index * 100}ms` }}
                >
                  <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-2 group-hover:scale-150 transition-transform duration-300" />
                  <p className="text-sm flex-1">{rec}</p>
                </div>
              ))}
            </div>
          </Card>
        )}

        {recommendations.length === 0 && deviceData && (
          <Card className="p-8 text-center animate-fade-in">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
            <p className="text-muted-foreground font-medium">No recommendations at this time.</p>
            <p className="text-sm text-muted-foreground mt-1">Your environment looks good!</p>
          </Card>
        )}

        {/* Navigation Cards with Enhanced Animations */}
        <div className="grid grid-cols-2 gap-4">
          <Card 
            className="p-6 cursor-pointer group hover:shadow-wellness-md transition-all duration-300 animate-fade-in hover:scale-105"
            style={{ animationDelay: '600ms' }} 
            onClick={() => navigate("/activities")}
          >
            <div className="text-center">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-400 to-emerald-400 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform duration-300 shadow-md">
                <Activity className="w-7 h-7 text-white" />
              </div>
              <h3 className="font-semibold mb-1 group-hover:text-primary transition-colors">Activities</h3>
              <p className="text-xs text-muted-foreground">What are you doing?</p>
            </div>
          </Card>
          
          <Card 
            className="p-6 cursor-pointer group hover:shadow-wellness-md transition-all duration-300 animate-fade-in hover:scale-105"
            style={{ animationDelay: '700ms' }} 
            onClick={() => navigate("/exercises")}
          >
            <div className="text-center">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform duration-300 shadow-md">
                <TrendingUp className="w-7 h-7 text-white" />
              </div>
              <h3 className="font-semibold mb-1 group-hover:text-primary transition-colors">Exercises</h3>
              <p className="text-xs text-muted-foreground">Start a session</p>
            </div>
          </Card>
        </div>

        <Button 
          variant="outline" 
          className="w-full h-14 rounded-xl font-semibold transition-all duration-300 animate-fade-in hover:scale-105 hover:shadow-wellness-md"
          style={{ animationDelay: '800ms' }}
          onClick={() => navigate("/history")}
        >
          View History
        </Button>
      </div>

      {/* Add custom animation keyframes to your global CSS */}
      <style>{`
        @keyframes slide-in-left {
          from {
            transform: translateX(-20px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-slide-in-left {
          animation: slide-in-left 0.5s ease-out;
        }
      `}</style>
    </div>
  );
};

export default Dashboard;