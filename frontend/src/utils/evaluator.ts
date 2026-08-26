import { DiagnosticReport, ItemReport, PYQQuestion } from '../types';

export const evaluateQuizClient = (
  questions: PYQQuestion[],
  userAnswers: Record<string, number>
): DiagnosticReport => {
  const totalQuestions = questions.length;
  let correctCount = 0;
  let wrongCount = 0;
  let unattemptedCount = 0;
  let totalMarks = 0.0;

  const itemReports: ItemReport[] = [];

  for (const q of questions) {
    const qId = q.id;
    if (qId in userAnswers) {
      const userChoice = userAnswers[qId];
      if (userChoice === q.correct_index) {
        correctCount += 1;
        totalMarks += 2.0;
        itemReports.push({
          question_id: qId,
          question: q.question,
          user_choice: userChoice,
          correct_choice: q.correct_index,
          correct_option_text: q.options[q.correct_index],
          explanation: q.explanation,
          status: 'Correct'
        });
      } else {
        wrongCount += 1;
        totalMarks -= 0.66;
        itemReports.push({
          question_id: qId,
          question: q.question,
          user_choice: userChoice,
          correct_choice: q.correct_index,
          correct_option_text: q.options[q.correct_index],
          explanation: q.explanation,
          status: 'Wrong'
        });
      }
    } else {
      unattemptedCount += 1;
      itemReports.push({
        question_id: qId,
        question: q.question,
        user_choice: -1,
        correct_choice: q.correct_index,
        correct_option_text: q.options[q.correct_index],
        explanation: q.explanation,
        status: 'Unattempted'
      });
    }
  }

  const maxPossibleMarks = totalQuestions * 2.0;
  const accuracyPercentage = totalQuestions > 0 ? (correctCount / totalQuestions) * 100 : 0;
  const masteryAchieved = accuracyPercentage >= 80.0;

  let recommendation = '';
  let recommendationAction: 'CONTINUE' | 'REVIEW' | 'INVEST_TIME' = 'INVEST_TIME';

  if (masteryAchieved) {
    recommendation = '🎉 Outstanding! You have mastered these chapters. Brick added to Castle! You can advance to the next chapter.';
    recommendationAction = 'CONTINUE';
  } else if (accuracyPercentage >= 60.0) {
    recommendation = '⚠️ Good foundation! Review the weak PYQ explanations above, then re-take the test to unlock your Castle Brick.';
    recommendationAction = 'REVIEW';
  } else {
    recommendation = '🛑 High risk zone! Invest 15 more minutes scrolling through the ByteReel visual cards for these chapters before taking the quiz again.';
    recommendationAction = 'INVEST_TIME';
  }

  return {
    total_questions: totalQuestions,
    correct_count: correctCount,
    wrong_count: wrongCount,
    unattempted_count: unattemptedCount,
    total_marks: Math.round(totalMarks * 100) / 100,
    max_possible_marks: maxPossibleMarks,
    accuracy_percentage: Math.round(accuracyPercentage * 10) / 10,
    mastery_achieved: masteryAchieved,
    recommendation: recommendation,
    recommendation_action: recommendationAction,
    item_reports: itemReports
  };
};
