import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Play, Pause, RotateCcw, CheckCircle2, Sparkles, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import { exerciseAPI } from "@/lib/api";

const ExerciseDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [exercise, setExercise] = useState<any>(null);
  const [session, setSession] = useState<any>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchExercise = async () => {
      try {
        const data = await exerciseAPI.getById(id!);
        setExercise(data);
        setTimeRemaining(data.steps[0]?.duration_seconds || 0);
      } catch (error) {
        toast.error("Failed to load exercise");
        navigate("/exercises");
      } finally {
        setLoading(false);
      }
    };

    fetchExercise();
  }, [id, navigate]);

  useEffect(() => {
    if (!isActive || isPaused) return;

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          handleStepComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive, isPaused, currentStepIndex]);

  const handleStart = async () => {
    try {
      const sessionData = await exerciseAPI.startSession(id!);
      setSession(sessionData);
      setIsActive(true);
      setIsPaused(false);
      toast.success("Exercise started!");
    } catch (error) {
      toast.error("Failed to start exercise");
    }
  };

  const handlePause = () => {
    setIsPaused(true);
    toast.info("Exercise paused");
  };

  const handleResume = () => {
    setIsPaused(false);
    toast.success("Continuing...");
  };

  const handleReset = () => {
    setIsActive(false);
    setIsPaused(false);
    setCurrentStepIndex(0);
    setTimeRemaining(exercise.steps[0]?.duration_seconds || 0);
    setSession(null);
    toast.info("Exercise reset");
  };

  const handleStepComplete = async () => {
    const nextStepIndex = currentStepIndex + 1;
    
    if (nextStepIndex >= exercise.steps.length) {
      await handleComplete();
      return;
    }

    if (session) {
      try {
        await exerciseAPI.updateStep(session.session_id, nextStepIndex + 1);
      } catch (error) {
        console.error("Failed to update step:", error);
      }
    }

    setCurrentStepIndex(nextStepIndex);
    setTimeRemaining(exercise.steps[nextStepIndex].duration_seconds);
    toast.success("Step completed! Moving to next...");
  };

  const handleComplete = async () => {
    setIsActive(false);
    setIsPaused(false);

    if (session) {
      try {
        await exerciseAPI.completeSession(session.session_id);
      } catch (error) {
        console.error("Failed to complete session:", error);
      }
    }
    
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#10b981', '#34d399', '#6ee7b7']
    });

    toast.success("🎉 Amazing work! Exercise completed!", { duration: 5000 });

    setTimeout(() => {
      navigate("/exercises");
    }, 2000);
  };

  const handleNextStep = () => {
    handleStepComplete();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading || !exercise) {
    return (
      <div className="min-h-screen bg-gradient-wellness flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const currentStep = exercise.steps[currentStepIndex];
  const totalSteps = exercise.steps.length;
  const progress = ((currentStepIndex + 1) / totalSteps) * 100;

  return (
    <div className="min-h-screen bg-gradient-wellness pb-24">
      <div className="bg-gradient-primary text-white p-4 shadow-wellness-lg">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/exercises")} className="text-white hover:bg-white/20">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-bold">{exercise.name}</h1>
            <p className="text-sm opacity-90 capitalize">{exercise.category} • {Math.round(exercise.total_duration_seconds / 60)} min</p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-4">
        <Card className="p-4 animate-scale-in">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Step {currentStepIndex + 1} of {totalSteps}</span>
            <span className="text-sm text-muted-foreground">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </Card>

        {!isActive ? (
          <Card className="p-8 text-center animate-scale-in">
            <h2 className="text-2xl font-bold mb-4">{exercise.name}</h2>
            <p className="text-muted-foreground mb-6">{exercise.description}</p>
            <Button onClick={handleStart} size="lg" className="bg-gradient-primary hover:opacity-90 h-14 px-8 rounded-2xl">
              <Play className="mr-2 h-5 w-5" />
              Start Exercise
            </Button>
          </Card>
        ) : (
          <Card className="p-8 animate-scale-in">
            <h2 className="text-2xl font-bold mb-4 text-center">{currentStep.title}</h2>
            <div className={`text-6xl font-bold text-center mb-4 ${
  isPaused ? "text-muted-foreground" : "text-primary"
}`}>
              {formatTime(timeRemaining)}
            </div>
            <p className="text-center text-lg mb-6">{currentStep.description}</p>
            <div className="p-4 bg-muted/50 rounded-xl mb-6">
              <p className="text-sm text-muted-foreground">{currentStep.guidance}</p>
            </div>
            <div className="flex flex-wrap gap-2 justify-center mb-6">
              {currentStep.cues?.map((cue: string, i: number) => (
                <span key={i} className="text-xs px-3 py-1 bg-primary/10 text-primary rounded-lg font-medium">{cue}</span>
              ))}
            </div>
            <div className="flex gap-3 justify-center">
              {isPaused ? (
                <>
                  <Button onClick={handleResume} size="lg" className="bg-gradient-primary hover:opacity-90 h-14 px-8 rounded-2xl">
                    <Play className="mr-2 h-5 w-5" />
                    Resume
                  </Button>
                  <Button onClick={handleReset} variant="outline" size="lg" className="h-14 px-8 rounded-2xl">
                    <RotateCcw className="mr-2 h-5 w-5" />
                    Reset
                  </Button>
                </>
              ) : (
                <>
                  <Button onClick={handlePause} variant="outline" size="lg" className="h-14 px-8 rounded-2xl">
                    <Pause className="mr-2 h-5 w-5" />
                    Pause
                  </Button>
                  <Button onClick={handleNextStep} size="lg" className="bg-gradient-primary hover:opacity-90 h-14 px-8 rounded-2xl">
                    {currentStepIndex === totalSteps - 1 ? (
                      <>
                        <CheckCircle2 className="mr-2 h-5 w-5" />
                        Complete
                      </>
                    ) : (
                      <>
                        Next Step
                        <ArrowRight className="ml-2 h-5 w-5" />
                      </>
                    )}
                  </Button>
                </>
              )}
            </div>
          </Card>
        )}

        <Card className="p-6 animate-fade-in">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Benefits
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {exercise.benefits?.map((benefit: string, index: number) => (
              <div key={index} className="p-3 bg-muted/50 rounded-xl flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                <span className="text-sm">{benefit}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default ExerciseDetail;
