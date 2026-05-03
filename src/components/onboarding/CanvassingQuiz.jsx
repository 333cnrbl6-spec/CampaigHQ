import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, AlertCircle } from 'lucide-react';

const QUIZ_QUESTIONS = [
  {
    id: 1,
    question: "What's the most important first step when approaching a door?",
    options: [
      'Wait for them to speak first',
      'Introduce yourself and your campaign clearly',
      'Ask about their voting history',
      'Hand them a leaflet'
    ],
    correct: 1,
    explanation: 'Introducing yourself builds trust and context for the conversation.',
  },
  {
    id: 2,
    question: 'How should you record support levels in the system?',
    options: [
      'Only if they promise to vote for us',
      'Based on their stated position, not assumptions',
      'Whatever you think they believe',
      'Only strong supporters'
    ],
    correct: 1,
    explanation: 'Accurate data collection is essential for effective targeting and follow-up.',
  },
  {
    id: 3,
    question: 'What should you do if someone is rude or hostile?',
    options: [
      'Argue to convince them',
      'Leave immediately without recording',
      'Stay polite, log the interaction, and move on',
      'Tell other volunteers about them'
    ],
    correct: 2,
    explanation: 'Professionalism and data accuracy matter even in difficult interactions.',
  },
  {
    id: 4,
    question: "What's the purpose of a welfare check-in?",
    options: [
      'To collect more voter data',
      'To ensure volunteer safety and wellbeing',
      'To report suspicious activity',
      'To measure door knock rates'
    ],
    correct: 1,
    explanation: 'Volunteer safety is our top priority during all canvassing activities.',
  },
];

export default function CanvassingQuiz({ onComplete }) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [showResults, setShowResults] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState(null);

  const question = QUIZ_QUESTIONS[currentQuestion];
  const userAnswer = answers[question.id];
  const isCorrect = userAnswer === question.correct;

  const handleAnswerSelect = (optionIndex) => {
    setSelectedAnswer(optionIndex);
  };

  const handleNext = () => {
    if (selectedAnswer === null) {
      alert('Please select an answer');
      return;
    }

    setAnswers((prev) => ({
      ...prev,
      [question.id]: selectedAnswer,
    }));

    if (currentQuestion < QUIZ_QUESTIONS.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedAnswer(null);
    } else {
      setShowResults(true);
    }
  };

  const correctCount = Object.values(answers).filter(
    (ans, idx) => ans === QUIZ_QUESTIONS[idx].correct
  ).length;

  const passScore = Math.ceil((QUIZ_QUESTIONS.length * 3) / 4); // 75%

  if (showResults) {
    const passed = correctCount >= passScore;
    return (
      <Card className={passed ? 'border-green-200 bg-green-50' : 'border-amber-200 bg-amber-50'}>
        <CardContent className="pt-6 space-y-4">
          <div className="text-center space-y-2">
            {passed ? (
              <>
                <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto" />
                <h3 className="text-2xl font-bold text-green-900">Quiz Passed!</h3>
              </>
            ) : (
              <>
                <AlertCircle className="w-12 h-12 text-amber-600 mx-auto" />
                <h3 className="text-2xl font-bold text-amber-900">Try Again</h3>
              </>
            )}
            <p className="text-lg font-semibold">
              {correctCount} of {QUIZ_QUESTIONS.length} correct
            </p>
          </div>

          {/* Answer Review */}
          <div className="space-y-3">
            {QUIZ_QUESTIONS.map((q, idx) => {
              const answerIdx = answers[q.id];
              const correct = answerIdx === q.correct;
              return (
                <div
                  key={q.id}
                  className={`p-3 rounded-lg border ${
                    correct ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {correct ? (
                      <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <p className="font-medium text-sm">{q.question}</p>
                      <p className={`text-xs mt-1 ${correct ? 'text-green-700' : 'text-red-700'}`}>
                        {q.options[answerIdx]} {correct ? '✓' : '✗'}
                      </p>
                      {!correct && (
                        <p className="text-xs text-red-600 mt-1">
                          Correct: {q.options[q.correct]}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            {!passed && (
              <Button
                variant="outline"
                onClick={() => {
                  setCurrentQuestion(0);
                  setAnswers({});
                  setSelectedAnswer(null);
                  setShowResults(false);
                }}
                className="flex-1"
              >
                Retake Quiz
              </Button>
            )}
            {passed && (
              <Button onClick={onComplete} className="flex-1">
                Continue to Availability →
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between mb-2">
          <CardTitle>Canvassing Basics Quiz</CardTitle>
          <Badge variant="outline">
            {currentQuestion + 1} of {QUIZ_QUESTIONS.length}
          </Badge>
        </div>
        <div className="w-full bg-muted rounded-full h-2">
          <div
            className="bg-primary h-2 rounded-full transition-all"
            style={{ width: `${((currentQuestion + 1) / QUIZ_QUESTIONS.length) * 100}%` }}
          />
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Question */}
        <div>
          <h3 className="font-semibold text-lg mb-4">{question.question}</h3>

          {/* Options */}
          <div className="space-y-2">
            {question.options.map((option, idx) => (
              <label
                key={idx}
                className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                  selectedAnswer === idx
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <input
                  type="radio"
                  name="answer"
                  checked={selectedAnswer === idx}
                  onChange={() => handleAnswerSelect(idx)}
                  className="w-4 h-4"
                />
                <span className="text-sm">{option}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Next Button */}
        <Button
          onClick={handleNext}
          disabled={selectedAnswer === null}
          className="w-full"
        >
          {currentQuestion === QUIZ_QUESTIONS.length - 1
            ? 'See Results'
            : 'Next Question'}
        </Button>
      </CardContent>
    </Card>
  );
}