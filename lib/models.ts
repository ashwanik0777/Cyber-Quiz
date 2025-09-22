export interface User {
  _id?: string
  name: string
  rollNo: string
  mobileNo: string
  email: string
  createdAt: Date
  updatedAt: Date
}

export interface QuizResult {
  _id?: string
  userId: string
  name: string
  rollNo: string
  mobileNo: string
  email: string
  score: number
  totalQuestions: number
  percentage: number
  answers: Array<{
    questionId: number
    selectedOption: string
    isCorrect: boolean
    timeTaken: number
  }>
  completedAt: Date
  isEligibleForReward: boolean
  rewardGiven: boolean
}

export interface AdminUser {
  username: string
  password: string
}
