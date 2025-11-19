// components/ActivityPreferenceForm.tsx
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Activity } from "@/pages/Preferences";

interface ActivityPreference {
  preferred_temperature: number;
  light_preference: "dim" | "medium" | "bright";
  noise_tolerance: "low" | "medium" | "high";
  priority: "low" | "medium" | "high";
  notes?: string;
}

interface ActivityPreferenceFormProps {
  activity: Activity;
  initialPreferences?: ActivityPreference;
  onSave: (preferences: ActivityPreference) => void;
  onBack: () => void;
}

export const ActivityPreferenceForm: React.FC<ActivityPreferenceFormProps> = ({
  activity,
  initialPreferences,
  onSave,
  onBack
}) => {
  const [preferences, setPreferences] = useState<ActivityPreference>(
    initialPreferences || {
      preferred_temperature: activity.ideal_conditions?.temperature 
        ? Math.round((activity.ideal_conditions.temperature[0] + activity.ideal_conditions.temperature[1]) / 2)
        : 22,
      light_preference: "medium",
      noise_tolerance: "medium",
      priority: "high"
    }
  );

  const handleSave = () => {
    onSave(preferences);
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold">Configure {activity.name}</h2>
        <p className="text-muted-foreground">{activity.description}</p>
      </div>

      <Card className="p-6 space-y-6">
        {/* Temperature Preference */}
        <div className="space-y-4">
          <Label htmlFor="temperature" className="text-base">
            Preferred Temperature: {preferences.preferred_temperature}°C
          </Label>
          <div className="space-y-2">
            <Slider
              id="temperature"
              min={18}
              max={26}
              step={1}
              value={[preferences.preferred_temperature]}
              onValueChange={(value) => setPreferences({
                ...preferences,
                preferred_temperature: value[0]
              })}
              className="w-full"
            />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Cool (18°C)</span>
              <span>Warm (26°C)</span>
            </div>
          </div>
        </div>

        {/* Lighting Preference */}
        <div className="space-y-2">
          <Label htmlFor="lighting">Lighting Preference</Label>
          <Select
            value={preferences.light_preference}
            onValueChange={(value: "dim" | "medium" | "bright") => 
              setPreferences({ ...preferences, light_preference: value })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="dim">Dim Lighting</SelectItem>
              <SelectItem value="medium">Medium Lighting</SelectItem>
              <SelectItem value="bright">Bright Lighting</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Noise Tolerance */}
        <div className="space-y-2">
          <Label htmlFor="noise">Noise Tolerance</Label>
          <Select
            value={preferences.noise_tolerance}
            onValueChange={(value: "low" | "medium" | "high") => 
              setPreferences({ ...preferences, noise_tolerance: value })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Quiet Environment</SelectItem>
              <SelectItem value="medium">Moderate Noise OK</SelectItem>
              <SelectItem value="high">Noise Tolerant</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Priority */}
        <div className="space-y-2">
          <Label htmlFor="priority">Priority Level</Label>
          <Select
            value={preferences.priority}
            onValueChange={(value: "low" | "medium" | "high") => 
              setPreferences({ ...preferences, priority: value })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low Priority</SelectItem>
              <SelectItem value="medium">Medium Priority</SelectItem>
              <SelectItem value="high">High Priority</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Notes */}
        <div className="space-y-2">
          <Label htmlFor="notes">Additional Notes (Optional)</Label>
          <textarea
            id="notes"
            value={preferences.notes || ""}
            onChange={(e) => setPreferences({ ...preferences, notes: e.target.value })}
            placeholder="Any specific requirements or preferences..."
            className="w-full p-3 border rounded-lg resize-none"
            rows={3}
          />
        </div>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button variant="outline" onClick={onBack} className="flex-1">
          Back
        </Button>
        <Button onClick={handleSave} className="flex-1 bg-gradient-primary">
          Save Preferences
        </Button>
      </div>
    </div>
  );
};