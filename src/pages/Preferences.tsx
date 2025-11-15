import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  Wind, 
  Sun, 
  Activity, 
  Heart,
  Brain,
  Zap,
  ArrowRight,
  Check,
  Loader2
} from "lucide-react";
import { toast } from "sonner";

interface Activity {
  activity_id: string;
  name: string;
  description: string;
  category: string;
  ideal_conditions: any;
}

const iconMap: Record<string, any> = {
  focus: Brain,
  work: Zap,
  relaxation: Heart,
  physical: Activity,
  creative: Sun,
  meditation: Wind
};

const colorMap: Record<string, string> = {
  focus: "from-purple-400 to-pink-400",
  work: "from-amber-400 to-orange-400",
  relaxation: "from-red-400 to-pink-400",
  physical: "from-orange-400 to-red-400",
  creative: "from-yellow-400 to-orange-400",
  meditation: "from-blue-400 to-cyan-400"
};

const Preferences = () => {
  const navigate = useNavigate();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const { recommendationsAPI } = await import("@/lib/api");
        const data = await recommendationsAPI.getActivities();
        setActivities(data.activities || []);
      } catch (error) {
        console.error("Failed to fetch activities:", error);
        toast.error("Failed to load activities");
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();
  }, []);

  const togglePreference = (activityName: string) => {
    setSelected(prev => 
      prev.includes(activityName) 
        ? prev.filter(item => item !== activityName)
        : [...prev, activityName]
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { userAPI } = await import("@/lib/api");
      
      // Build activity preferences object using activity names
      const activityPreferences: any = {};
      selected.forEach(activityName => {
        activityPreferences[activityName] = { 
          priority: "high",
          enabled: true
        };
      });

      await userAPI.updatePreferences({
        activity_preferences: activityPreferences,
        sensitivity_levels: {
          temperature: "medium",
          humidity: "medium",
          light: "medium",
          sound: "medium",
          air_quality: "high"
        },
        health_conditions: []
      });
      
      toast.success("Preferences saved successfully!");
      navigate("/dashboard");
    } catch (error) {
      console.error("Error saving preferences:", error);
      toast.error(error instanceof Error ? error.message : "Failed to save preferences");
    } finally {
      setSaving(false);
    }
  };

  const handleSkip = () => {
    navigate("/dashboard");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-wellness flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-wellness p-4 pb-24">
      <div className="max-w-2xl mx-auto pt-8">
        {/* Header */}
        <div className="text-center mb-8 animate-fade-in">
          <h1 className="text-3xl font-bold mb-2">Your Wellness Profile</h1>
          <p className="text-muted-foreground">
            Select activities that matter most to you
          </p>
        </div>

        {/* Activity Grid */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {activities.map((activity, index) => {
            const Icon = iconMap[activity.category] || Brain;
            const color = colorMap[activity.category] || "from-blue-400 to-cyan-400";
            const isSelected = selected.includes(activity.name);
            
            return (
              <Card
                key={activity.activity_id}
                onClick={() => togglePreference(activity.name)}
                className={`
                  relative p-6 cursor-pointer transition-all duration-300
                  hover:scale-105 hover:shadow-wellness-md
                  ${isSelected ? 'ring-2 ring-primary shadow-wellness-md' : 'hover:ring-1 hover:ring-border'}
                  animate-scale-in
                `}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {/* Selection Indicator */}
                {isSelected && (
                  <div className="absolute top-3 right-3 w-6 h-6 bg-primary rounded-full flex items-center justify-center animate-scale-in">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                )}

                {/* Icon with gradient */}
                <div className={`
                  w-12 h-12 rounded-2xl flex items-center justify-center mb-3
                  bg-gradient-to-br ${color}
                  ${isSelected ? 'shadow-glow' : ''}
                  transition-all duration-300
                `}>
                  <Icon className="w-6 h-6 text-white" />
                </div>

                {/* Text */}
                <h3 className="font-semibold mb-1 text-sm">{activity.name}</h3>
                <p className="text-xs text-muted-foreground">{activity.description}</p>
              </Card>
            );
          })}
        </div>

        {activities.length === 0 && !loading && (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">No activities available</p>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur-lg border-t border-border">
          <div className="max-w-2xl mx-auto flex gap-3">
            <Button
              variant="outline"
              onClick={handleSkip}
              disabled={saving}
              className="flex-1 h-12 rounded-xl"
            >
              Skip
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving || selected.length === 0}
              className="flex-1 h-12 rounded-xl bg-gradient-primary hover:opacity-90 transition-smooth"
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  Continue
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Preferences;
