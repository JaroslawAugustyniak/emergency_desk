export type PasswordStrength = {
  score: number;
  label: string;
  color: string;
  suggestions: string[];
};

export function calculatePasswordStrength(password: string): PasswordStrength {
  let score = 0;
  const suggestions: string[] = [];

  if (password.length === 0) {
    return { score: 0, label: "", color: "", suggestions: [] };
  }

  // Length check
  if (password.length < 8) {
    suggestions.push("Use at least 8 characters");
  } else if (password.length >= 8) {
    score += 1;
  }
  if (password.length >= 12) {
    score += 1;
  }

  // Lowercase check
  if (!/[a-z]/.test(password)) {
    suggestions.push("Add lowercase letters");
  } else {
    score += 1;
  }

  // Uppercase check
  if (!/[A-Z]/.test(password)) {
    suggestions.push("Add uppercase letters");
  } else {
    score += 1;
  }

  // Number check
  if (!/[0-9]/.test(password)) {
    suggestions.push("Add numbers");
  } else {
    score += 1;
  }

  // Special character check
  if (!/[^A-Za-z0-9]/.test(password)) {
    suggestions.push("Add special characters (!@#$%^&*)");
  } else {
    score += 1;
  }

  // Determine strength label and color
  let label = "";
  let color = "";

  if (score <= 2) {
    label = "Weak";
    color = "bg-red-500";
  } else if (score <= 4) {
    label = "Medium";
    color = "bg-yellow-500";
  } else {
    label = "Strong";
    color = "bg-green-500";
  }

  return { score, label, color, suggestions };
}
