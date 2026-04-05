export interface PasswordStrength {
  score: 0 | 1 | 2 | 3 | 4;
  feedback: string[];
  meetsMinimum: boolean;
}

export const validatePassword = (password: string): PasswordStrength => {
  const feedback: string[] = [];
  let score = 0;
  
  // Length checks
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  
  // Character type checks
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;
  
  // Generate feedback
  if (password.length < 8) feedback.push("Use at least 8 characters");
  if (!/[a-z]/.test(password)) feedback.push("Include lowercase letters");
  if (!/[A-Z]/.test(password)) feedback.push("Include uppercase letters");
  if (!/\d/.test(password)) feedback.push("Include numbers");
  if (!/[^a-zA-Z0-9]/.test(password)) feedback.push("Include special characters (!@#$%)");
  
  return {
    score: Math.min(score, 4) as PasswordStrength['score'],
    feedback,
    meetsMinimum: password.length >= 6
  };
};

export const getStrengthLabel = (score: number): string => {
  switch (score) {
    case 0: return "Very Weak";
    case 1: return "Weak";
    case 2: return "Fair";
    case 3: return "Good";
    case 4: return "Strong";
    default: return "Unknown";
  }
};

export const getStrengthColor = (score: number): string => {
  switch (score) {
    case 0: return "bg-destructive";
    case 1: return "bg-orange-500";
    case 2: return "bg-yellow-500";
    case 3: return "bg-blue-500";
    case 4: return "bg-green-500";
    default: return "bg-muted";
  }
};
