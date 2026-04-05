import { validatePassword, getStrengthLabel, getStrengthColor } from "@/utils/passwordValidation";

interface Props {
  password: string;
}

export const PasswordStrengthIndicator = ({ password }: Props) => {
  if (!password) return null;
  
  const { score, feedback } = validatePassword(password);
  const strengthLabel = getStrengthLabel(score);
  const strengthColor = getStrengthColor(score);
  
  return (
    <div className="space-y-2">
      <div className="flex gap-1">
        {[0, 1, 2, 3, 4].map((level) => (
          <div
            key={level}
            className={`h-1 flex-1 rounded-full transition-colors ${
              level <= score ? strengthColor : 'bg-muted'
            }`}
          />
        ))}
      </div>
      <div className="flex justify-between items-center text-xs">
        <span className="text-muted-foreground">
          Password Strength: <strong>{strengthLabel}</strong>
        </span>
      </div>
      {feedback.length > 0 && (
        <ul className="text-xs text-muted-foreground space-y-0.5">
          {feedback.map((item, i) => (
            <li key={i}>• {item}</li>
          ))}
        </ul>
      )}
    </div>
  );
};
