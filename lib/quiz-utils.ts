// Utility functions for quiz functionality
export function calculateScore(answers: number[], correctAnswers: number[]): number {
  let correct = 0
  for (let i = 0; i < answers.length; i++) {
    if (answers[i] === correctAnswers[i]) {
      correct++
    }
  }
  return Math.round((correct / answers.length) * 100)
}

export function formatTime(seconds: number): string {
  return seconds.toString().padStart(2, "0")
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function validateMobile(mobile: string): boolean {
  const mobileRegex = /^[6-9]\d{9}$/ // Indian mobile number format
  return mobileRegex.test(mobile)
}

export function validateRollNo(rollNo: string): boolean {
  const rollNoRegex = /^\d{3}[A-Z]{3}\d{3}$/ // Format: 235UCS001
  return rollNoRegex.test(rollNo.trim())
}

export function getScoreColor(score: number): string {
  if (score >= 80) return "text-green-600"
  if (score >= 60) return "text-yellow-600"
  return "text-red-600"
}

export function getScoreMessage(score: number): string {
  if (score >= 90) return "Excellent! Outstanding performance!"
  if (score >= 80) return "Great job! You have good cyber awareness!"
  if (score >= 70) return "Good work! Keep learning about cybersecurity!"
  if (score >= 60) return "Fair performance. Consider improving your cyber knowledge!"
  return "Needs improvement. Please study more about cybersecurity!"
}
