export interface RatingLevel {
  emoji: string;
  label: string;
  color: string;
}

export interface ImprovementTip {
  icon: string;
  title: string;
  description: string;
  points: string | number;
}

export const getRatingLevel = (rating: number): RatingLevel => {
  if (rating >= 80) return { emoji: "🌟", label: "Superstar", color: "#FFD700" };
  if (rating >= 60) return { emoji: "🔥", label: "Popular", color: "#FF6B35" };
  if (rating >= 40) return { emoji: "⚡", label: "Rising", color: "#4ECDC4" };
  if (rating >= 20) return { emoji: "🌱", label: "Growing", color: "#95E1A3" };
  return { emoji: "🆕", label: "Fresh", color: "#A8E6CF" };
};

export const getRatingMessage = (rating: number): string => {
  if (rating >= 80) return "You're one of the most popular users! ✨";
  if (rating >= 60) return "You're well-known in the community! 🎉";
  if (rating >= 40) return "You're gaining popularity! Keep it up! 📈";
  if (rating >= 20) return "You're off to a great start! 🚀";
  return "Welcome! Complete your profile to boost your rating! 👋";
};

export const getImprovementTips = (currentRating: number): ImprovementTip[] => {
  return [
    {
      icon: "📸",
      title: "Add a Profile Picture",
      description: "A great photo makes you more attractive to others",
      points: 20
    },
    {
      icon: "✍️",
      title: "Write Your Bio",
      description: "Tell others about yourself and your interests (20+ characters)",
      points: 10
    },
    {
      icon: "⚥",
      title: "Set Gender & Preferences",
      description: "Complete your gender and sexual preferences",
      points: 10
    },
    {
      icon: "📍",
      title: "Set Your Location",
      description: "Help others find you nearby",
      points: 10
    },
    {
      icon: "📷",
      title: "Add More Photos",
      description: "Upload at least 3 photos for a bonus",
      points: 5
    },
    {
      icon: "❤️",
      title: "Get More Likes",
      description: "Be active and engaging to receive more likes",
      points: "4 each"
    },
    {
      icon: "👀",
      title: "Get Profile Visits",
      description: "Attract visitors to your profile",
      points: "1 per 2 visits"
    }
  ];
};
