"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Clock, Shield, CheckCircle } from "lucide-react"
import { getRandomQuestions, type QuizQuestion } from "@/lib/quiz-data"
import { formatTime } from "@/lib/quiz-utils"

export default function QuizPage() {
  const router = useRouter()
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([])
  const [timeLeft, setTimeLeft] = useState(15)
  const [isAnswered, setIsAnswered] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Initialize quiz
  useEffect(() => {
    const userData = sessionStorage.getItem("currentUser")
    if (!userData) {
      router.push("/")
      return
    }

    const user = JSON.parse(userData)
    setCurrentUser(user)

    // Get 10 random questions
    const randomQuestions = getRandomQuestions(10)
    setQuestions(randomQuestions)
    setSelectedAnswers(new Array(10).fill(-1))
    setIsLoading(false)
  }, [router])

  // Timer effect
  useEffect(() => {
    if (isLoading || isAnswered) return

    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000)
      return () => clearTimeout(timer)
    } else {
      // Time's up, move to next question
      handleNextQuestion()
    }
  }, [timeLeft, isLoading, isAnswered])

  const handleAnswerSelect = (answerIndex: number) => {
    if (isAnswered) return

    // Record the answer
    const newAnswers = [...selectedAnswers]
    newAnswers[currentQuestionIndex] = answerIndex
    setSelectedAnswers(newAnswers)
    setIsAnswered(true)

    // Check if this is the last question
    if (currentQuestionIndex === questions.length - 1) {
      // Last question - finish quiz immediately with updated answers
      setTimeout(() => {
        finishQuiz(newAnswers)
      }, 500)
    } else {
      // Move to next question after a short delay
      setTimeout(() => {
        handleNextQuestion()
      }, 500)
    }
  }

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
      setTimeLeft(15)
      setIsAnswered(false)
    } else {
      // Quiz completed, navigate to results (this case shouldn't happen now)
      finishQuiz()
    }
  }

  const finishQuiz = async (finalAnswers?: number[]) => {
    // Use provided answers or fall back to state
    const answersToUse = finalAnswers || selectedAnswers
    
    let score = 0
    const answersWithDetails = questions.map((question, index) => {
      const selectedOption = answersToUse[index]
      const isCorrect = selectedOption === question.correctAnswer
      if (isCorrect) score++

      return {
        questionId: question.id,
        selectedOption: selectedOption >= 0 ? question.options[selectedOption] : "",
        isCorrect,
        timeTaken: 15, // We can enhance this later to track actual time
      }
    })

    try {
      const response = await fetch("/api/quiz/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: currentUser.userId,
          name: currentUser.name,
          rollNo: currentUser.rollNo,
          mobileNo: currentUser.mobileNo,
          email: currentUser.email,
          score,
          totalQuestions: questions.length,
          answers: answersWithDetails,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to submit quiz")
      }

      // Store results for display
      const quizData = {
        user: currentUser,
        questions: questions,
        answers: selectedAnswers,
        score,
        totalQuestions: questions.length,
        percentage: Math.round((score / questions.length) * 100),
        completedAt: new Date().toISOString(),
        resultId: result.resultId,
      }

      sessionStorage.setItem("quizResults", JSON.stringify(quizData))
      router.push("/results")
    } catch (error) {
      console.error("Error submitting quiz:", error)
      // Fallback to local storage if API fails
      const quizData = {
        user: currentUser,
        questions: questions,
        answers: selectedAnswers,
        score,
        totalQuestions: questions.length,
        percentage: Math.round((score / questions.length) * 100),
        completedAt: new Date().toISOString(),
        error: "Failed to save to database",
      }
      sessionStorage.setItem("quizResults", JSON.stringify(quizData))
      router.push("/results")
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading quiz...</p>
        </div>
      </div>
    )
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 flex items-center justify-center">
        <Card className="max-w-md mx-4">
          <CardContent className="text-center p-6">
            <p className="text-gray-600 mb-4">Unable to load quiz questions.</p>
            <Button onClick={() => router.push("/")} className="bg-blue-600 hover:bg-blue-700">
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const currentQuestion = questions[currentQuestionIndex]
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-blue-100 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500 rounded-lg">
                <Shield className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-gray-900">CyberVaani Quiz</h1>
                <p className="text-sm text-blue-600">
                  Question {currentQuestionIndex + 1} of {questions.length}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Welcome,</p>
              <p className="font-medium text-gray-900 truncate max-w-32">{currentUser?.name}</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 max-w-2xl">
        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">Progress</span>
            <span className="text-sm text-gray-600">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2 bg-blue-100" />
        </div>

        {/* Timer */}
        <div className="flex justify-center mb-6">
          <div
            className={`flex items-center gap-2 px-4 py-2 rounded-full ${
              timeLeft <= 5 ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"
            }`}
          >
            <Clock className="h-4 w-4" />
            <span className="font-mono text-lg font-bold">{formatTime(timeLeft)}</span>
          </div>
        </div>

        {/* Question Card */}
        <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm mb-6">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between mb-2">
              <Badge variant="secondary" className="bg-blue-100 text-blue-700 hover:bg-blue-100">
                {currentQuestion.category.replace("-", " ").toUpperCase()}
              </Badge>
              <span className="text-sm text-gray-500">Q{currentQuestionIndex + 1}</span>
            </div>
            <CardTitle className="text-lg leading-relaxed text-balance">{currentQuestion.question}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {currentQuestion.options.map((option, index) => {
                const isSelected = selectedAnswers[currentQuestionIndex] === index
                const isCorrect = index === currentQuestion.correctAnswer
                const showResult = isAnswered

                return (
                  <button
                    key={index}
                    onClick={() => handleAnswerSelect(index)}
                    disabled={isAnswered}
                    className={`w-full p-4 text-left rounded-lg border-2 transition-all duration-200 ${
                      showResult
                        ? isCorrect
                          ? "border-green-500 bg-green-50 text-green-800"
                          : isSelected
                            ? "border-red-500 bg-red-50 text-red-800"
                            : "border-gray-200 bg-gray-50 text-gray-600"
                        : isSelected
                          ? "border-blue-500 bg-blue-50 text-blue-800"
                          : "border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50 text-gray-800"
                    } ${isAnswered ? "cursor-not-allowed" : "cursor-pointer"}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-pretty leading-relaxed">{option}</span>
                      {showResult && isCorrect && <CheckCircle className="h-5 w-5 text-green-600" />}
                      {showResult && isSelected && !isCorrect && (
                        <div className="h-5 w-5 rounded-full bg-red-500 flex items-center justify-center">
                          <span className="text-white text-xs">✕</span>
                        </div>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Next Button (only shown when answered) */}
        {isAnswered && currentQuestionIndex < questions.length - 1 && (
          <div className="text-center">
            <Button onClick={handleNextQuestion} className="bg-blue-600 hover:bg-blue-700 text-white px-8">
              Next Question
            </Button>
          </div>
        )}

        {/* Finish Button (only shown on last question when answered) */}
        {isAnswered && currentQuestionIndex === questions.length - 1 && (
          <div className="text-center">
            <Button onClick={finishQuiz} className="bg-green-600 hover:bg-green-700 text-white px-8">
              Finish Quiz
            </Button>
          </div>
        )}

        {/* Question Counter */}
        <div className="mt-6 text-center">
          <div className="flex justify-center gap-2">
            {questions.map((_, index) => (
              <div
                key={index}
                className={`w-3 h-3 rounded-full ${
                  index < currentQuestionIndex
                    ? "bg-green-500"
                    : index === currentQuestionIndex
                      ? "bg-blue-500"
                      : "bg-gray-300"
                }`}
              />
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
