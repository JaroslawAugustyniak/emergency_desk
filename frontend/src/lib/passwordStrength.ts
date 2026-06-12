export type PasswordStrength = {
  score: number;
  labelKey: string;
  color: string;
  suggestionKeys: string[];
};

export function calculatePasswordStrength(password: string): PasswordStrength {
  let score = 0;
  const suggestionKeys: string[] = [];

  if (password.length === 0) {
    return { score: 0, labelKey: "", color: "", suggestionKeys: [] };
  }

  // Length check
  if (password.length < 8) {
    suggestionKeys.push("passwordStrength.minLength");
  } else if (password.length >= 8) {
    score += 1;
  }
  if (password.length >= 12) {
    score += 1;
  }

  // Lowercase check
  if (!/[a-z]/.test(password)) {
    suggestionKeys.push("passwordStrength.addLowercase");
  } else {
    score += 1;
  }

  // Uppercase check
  if (!/[A-Z]/.test(password)) {
    suggestionKeys.push("passwordStrength.addUppercase");
  } else {
    score += 1;
  }

  // Number check
  if (!/[0-9]/.test(password)) {
    suggestionKeys.push("passwordStrength.addNumbers");
  } else {
    score += 1;
  }

  // Special character check
  if (!/[^A-Za-z0-9]/.test(password)) {
    suggestionKeys.push("passwordStrength.addSpecialChars");
  } else {
    score += 1;
  }

  // Determine strength label and color
  let labelKey = "";
  let color = "";

  if (score <= 2) {
    labelKey = "passwordStrength.weak";
    color = "bg-red-500";
  } else if (score <= 4) {
    labelKey = "passwordStrength.medium";
    color = "bg-yellow-500";
  } else {
    labelKey = "passwordStrength.strong";
    color = "bg-green-500";
  }

  return { score, labelKey, color, suggestionKeys };
}
