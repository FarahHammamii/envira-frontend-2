import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Search,
  Filter,
  Clock,
  TrendingUp,
  Heart,
  Zap,
  Brain,
  Wind,
  Flame
} from "lucide-react";

interface Exercise {
  id: string;
  name: string;
  duration: number;
  difficulty: "beginner" | "intermediate" | "advanced";
  category: string;
  benefits: string[];
  icon: any;
  color: string;
}

const Exercises = () => {
  const navigate = useNavigate();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("all");

  useEffect(() => {
    const fetchExercises = async () => {
      try {
        const { exerciseAPI } = await import("@/lib/api");
        const response = await exerciseAPI.getAll();
        
        const iconMap: any = {
          breathing: Wind,
          meditation: Brain,
          mindfulness: Brain,
          stretching: TrendingUp,
          focus: Zap,
          relaxation: Heart,
          movement: Flame,
          cardio: Flame,
          strength: TrendingUp
        };

        const colorMap: any = {
          breathing: "from-sky-400 to-blue-500",
          meditation: "from-purple-400 to-pink-500",
          mindfulness: "from-purple-400 to-pink-500",
          stretching: "from-green-400 to-emerald-500",
          focus: "from-amber-400 to-orange-500",
          relaxation: "from-red-400 to-pink-500",
          movement: "from-orange-400 to-red-500",
          cardio: "from-orange-400 to-red-500",
          strength: "from-green-400 to-emerald-500"
        };

        const exercises = response.exercises || response;
        const mapped = (Array.isArray(exercises) ? exercises : []).map((ex: any) => ({
          id: ex.exercise_id,
          name: ex.name,
          duration: Math.round(ex.total_duration_seconds / 60),
          difficulty: ex.difficulty,
          category: ex.category,
          benefits: ex.benefits || [],
          icon: iconMap[ex.category] || Wind,
          color: colorMap[ex.category] || "from-blue-400 to-cyan-400"
        }));

        setExercises(mapped);
      } catch (error) {
        console.error("Failed to fetch exercises:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchExercises();
  }, []);

  // Get unique categories and difficulties from actual data
  const categories = ["all", ...new Set(exercises.map(ex => ex.category))];
  const difficulties = ["all", ...new Set(exercises.map(ex => ex.difficulty))];

  const filteredExercises = exercises.filter(exercise => {
    const matchesSearch = exercise.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || exercise.category === selectedCategory;
    const matchesDifficulty = selectedDifficulty === "all" || exercise.difficulty === selectedDifficulty;
    return matchesSearch && matchesCategory && matchesDifficulty;
  });

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "beginner": return "bg-green-500 text-white";
      case "intermediate": return "bg-amber-500 text-white";
      case "advanced": return "bg-red-500 text-white";
      default: return "bg-gray-500 text-white";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-wellness flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-wellness pb-24">
      {/* Header */}
      <div className="bg-gradient-primary text-white p-4 shadow-wellness-lg sticky top-0 z-10">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/dashboard")}
              className="text-white hover:bg-white/20"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold">Exercise Library</h1>
              <p className="text-sm opacity-90">Choose your wellness activity</p>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/60" />
            <Input
              placeholder="Search exercises..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/60 h-11 rounded-xl"
            />
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-4">
        {/* Filters */}
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Filters</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="h-10 rounded-xl">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>
                    {category === "all" ? "All Categories" : category.charAt(0).toUpperCase() + category.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
              <SelectTrigger className="h-10 rounded-xl">
                <SelectValue placeholder="All Levels" />
              </SelectTrigger>
              <SelectContent>
                {difficulties.map(difficulty => (
                  <SelectItem key={difficulty} value={difficulty}>
                    {difficulty === "all" ? "All Levels" : difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </Card>

        {/* Exercise List */}
        <div className="space-y-3">
          {filteredExercises.map((exercise, index) => {
            const Icon = exercise.icon;
            return (
              <Card
                key={exercise.id}
                className="p-5 cursor-pointer hover:shadow-wellness-md transition-all duration-300 animate-fade-in"
                style={{ animationDelay: `${index * 50}ms` }}
                onClick={() => navigate(`/exercise/${exercise.id}`)}
              >
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className={`
                    w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0
                    bg-gradient-to-br ${exercise.color}
                  `}>
                    <Icon className="w-7 h-7 text-white" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="font-semibold text-base">{exercise.name}</h3>
                      <Badge className={getDifficultyColor(exercise.difficulty)}>
                        {exercise.difficulty}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                      <Clock className="h-4 w-4" />
                      <span>{exercise.duration} min</span>
                      <span>•</span>
                      <span className="capitalize">{exercise.category}</span>
                    </div>

                    {/* Benefits */}
                    <div className="flex flex-wrap gap-2">
                      {exercise.benefits.slice(0, 2).map((benefit, i) => (
                        <span
                          key={i}
                          className="text-xs px-2 py-1 bg-muted/50 rounded-lg"
                        >
                          {benefit}
                        </span>
                      ))}
                      {exercise.benefits.length > 2 && (
                        <span className="text-xs px-2 py-1 bg-muted/50 rounded-lg">
                          +{exercise.benefits.length - 2} more
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {filteredExercises.length === 0 && (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">No exercises match your filters</p>
            <Button
              variant="link"
              onClick={() => {
                setSearchTerm("");
                setSelectedCategory("all");
                setSelectedDifficulty("all");
              }}
              className="mt-2"
            >
              Clear filters
            </Button>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Exercises;