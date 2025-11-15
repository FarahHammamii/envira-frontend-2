import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Brain, Code, BookOpen, Heart, Dumbbell, Palette, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { recommendationsAPI, deviceAPI } from "@/lib/api";

const activityIcons: any = {
  "studying/learning": Brain,
  "studying": Brain,
  "programming/coding": Code,
  "coding": Code,
  "reading": BookOpen,
  "relaxing/meditation": Heart,
  "relaxing": Heart,
  "physical exercise": Dumbbell,
  "exercising": Dumbbell,
  "creative work": Palette,
  "creative": Palette,
  "deep study session": Brain,
  "focus": Brain
};

const activityColors: any = {
  "studying/learning": "from-purple-400 to-pink-500",
  "studying": "from-purple-400 to-pink-500",
  "programming/coding": "from-amber-400 to-orange-500",
  "coding": "from-amber-400 to-orange-500",
  "reading": "from-green-400 to-emerald-500",
  "relaxing/meditation": "from-red-400 to-pink-500",
  "relaxing": "from-red-400 to-pink-500",
  "physical exercise": "from-orange-400 to-red-500",
  "exercising": "from-orange-400 to-red-500",
  "creative work": "from-yellow-400 to-orange-500",
  "creative": "from-yellow-400 to-orange-500",
  "deep study session": "from-purple-400 to-pink-500",
  "focus": "from-purple-400 to-pink-500"
};

const Activities = () => {
  const navigate = useNavigate();
  const [activities, setActivities] = useState<any[]>([]);
  const [selectedActivity, setSelectedActivity] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [recommendations, setRecommendations] = useState<any[]>([]);

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const response = await recommendationsAPI.getActivities();
        setActivities(response.activities || []);
      } catch (error) {
        toast.error("Failed to load activities");
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();
  }, []);

const handleActivitySelect = async (activityId: string) => {
  console.log("Selected activity ID:", activityId);
  console.log("Available activities:", activities);
  
  setSelectedActivity(activityId);
  setLoading(true);

  try {
    const selectedActivityObj = activities.find(activity => activity.activity_id === activityId);
    console.log("Found activity object:", selectedActivityObj);
    
    const activityIdForAPI = selectedActivityObj?.activity_id || activityId;
    console.log("Using activity ID for API:", activityIdForAPI);
    
    let deviceId = "esp32-001";
    try {
      const latestData = await deviceAPI.getLatest("esp32-001");
      deviceId = latestData?.device_id || latestData?.deviceId || deviceId;
    } catch (dErr) {
      console.warn("Could not fetch latest device data for recommendations, using default device_id:", dErr);
    }

    console.log("Making API call with:", { activityIdForAPI, deviceId });
    const response = await recommendationsAPI.getActivityRecommendations(activityIdForAPI, deviceId);
    console.log("API response:", response);
    
    // FIX: Properly extract recommendations from the response
    const recommendationsArray = response.recommendations || [];
    console.log("Extracted recommendations:", recommendationsArray);
    
    setRecommendations(recommendationsArray);
    toast.success("Activity recommendations generated!");
  } catch (error) {
    console.error("API error:", error);
    toast.error("Failed to generate recommendations");
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="min-h-screen bg-gradient-wellness pb-24">
      <div className="bg-gradient-primary text-white p-4 shadow-wellness-lg sticky top-0 z-10">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")} className="text-white hover:bg-white/20">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold">Current Activity</h1>
              <p className="text-sm opacity-90">What are you doing now?</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-4">
        <Card className="p-6">
          <h3 className="font-semibold mb-4">Select Your Activity</h3>
          <div className="grid grid-cols-2 gap-3">
            {activities.map((activity: any, index: number) => {
              const Icon = activityIcons[activity.name] || activityIcons[activity.activity_id] || Brain;
              const color = activityColors[activity.name] || activityColors[activity.activity_id] || "from-blue-400 to-cyan-400";
              const isSelected = selectedActivity === activity.activity_id;

              return (
                <Card
                  key={activity.activity_id}
                  onClick={() => handleActivitySelect(activity.activity_id)}
                  className={`p-5 cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-wellness-md ${isSelected ? 'ring-2 ring-primary shadow-wellness-md' : ''} animate-fade-in`}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-3 bg-gradient-to-br ${color} ${isSelected ? 'shadow-glow' : ''}`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-semibold text-sm mb-1">{activity.name}</h3>
                  <p className="text-xs text-muted-foreground line-clamp-2">{activity.description}</p>
                </Card>
              );
            })}
          </div>
        </Card>

        {selectedActivity && recommendations.length > 0 && (
  <Card className="p-6 animate-fade-in">
    <h3 className="font-semibold mb-4 flex items-center gap-2">
      <Sparkles className="h-5 w-5 text-primary" />
      Personalized Recommendations
    </h3>
    <div className="space-y-3">
      {recommendations.map((rec: string, index: number) => (
        <div key={index} className="p-4 bg-muted/50 rounded-xl flex items-start gap-3">
          <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-2" />
          <div className="flex-1">
            {/* Since rec is a string, display it directly */}
            <p className="text-sm text-muted-foreground">{rec}</p>
          </div>
        </div>
      ))}
    </div>
  </Card>

        )}

        {selectedActivity && recommendations.length === 0 && !loading && (
          <Card className="p-6 text-center">
            <p className="text-muted-foreground">No specific recommendations at this time. Your environment is well-suited for this activity!</p>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Activities;
