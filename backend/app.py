"""
FastAPI Backend Server for UPSC ReelCastle
Serves API routes for ByteReel Cards, Chapter Selection, UPSC PYQs,
Testing Arena Evaluation & Diagnostic Reports.
"""

from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import os

from sample_data import CHAPTERS, BYTE_REEL_CARDS
from pyq_database import UPSC_PYQ_DATABASE
from llm_service import generate_byte_reel_cards, generate_with_openrouter

app = FastAPI(title="UPSC ReelCastle API", version="1.0.0")

# Enable CORS for Vite frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class TestSubmission(BaseModel):
    selected_chapters: List[str]
    user_answers: Dict[str, int]  # question_id -> chosen option index (0-3)

@app.get("/")
def read_root():
    return {"message": "UPSC ReelCastle API Online", "status": "active"}

@app.get("/api/chapters")
def get_chapters(subject: Optional[str] = None):
    """
    Returns available chapters filtered by subject ('Geography', 'Environment' or None for all)
    """
    if subject and subject.lower() != "combined":
        filtered = [c for c in CHAPTERS if c["subject"].lower() == subject.lower()]
        return {"chapters": filtered}
    return {"chapters": CHAPTERS}

@app.get("/api/reels")
def get_reels(
    chapter_ids: Optional[List[str]] = Query(None),
    subject: Optional[str] = "Combined"
):
    """
    Returns ByteReel visual cards.
    If chapter_ids are provided (max 2), returns reels for those chapters.
    Otherwise returns combined/subject feed.
    """
    cards = BYTE_REEL_CARDS.copy()

    if chapter_ids and len(chapter_ids) > 0:
        # Enforce max 2 chapters rule
        active_ids = chapter_ids[:2]
        cards = [c for c in cards if c["chapter_id"] in active_ids]

    elif subject and subject.lower() != "combined":
        cards = [c for c in cards if c["subject"].lower() == subject.lower()]

    return {
        "total": len(cards),
        "chapter_focus_active": len(chapter_ids) if chapter_ids else 0,
        "cards": cards
    }

@app.get("/api/pyqs")
def get_pyqs(chapter_ids: Optional[List[str]] = Query(None), subject: Optional[str] = "Combined"):
    """
    Returns authentic UPSC Prelims PYQs filtered by active 1-2 chapters or subject.
    """
    questions = UPSC_PYQ_DATABASE.copy()

    if chapter_ids and len(chapter_ids) > 0:
        active_ids = chapter_ids[:2]
        questions = [q for q in questions if q["chapter_id"] in active_ids]

    elif subject and subject.lower() != "combined":
        questions = [q for q in questions if q["subject"].lower() == subject.lower()]

    return {
        "total": len(questions),
        "questions": questions
    }

@app.post("/api/test-report")
def evaluate_test(submission: TestSubmission):
    """
    Evaluates test submission using UPSC Prelims scoring standard:
    +2.00 marks for correct answer, -0.66 for wrong answer, 0 for unattempted.
    Generates diagnostic report & chapter mastery decision.
    """
    questions = UPSC_PYQ_DATABASE
    if submission.selected_chapters:
        questions = [q for q in questions if q["chapter_id"] in submission.selected_chapters[:2]]

    total_questions = len(questions)
    if total_questions == 0:
        questions = UPSC_PYQ_DATABASE[:5]
        total_questions = len(questions)

    correct_count = 0
    wrong_count = 0
    unattempted_count = 0
    total_marks = 0.0

    item_reports = []

    for q in questions:
        q_id = q["id"]
        if q_id in submission.user_answers:
            user_choice = submission.user_answers[q_id]
            if user_choice == q["correct_index"]:
                correct_count += 1
                total_marks += 2.0
                status = "Correct"
            else:
                wrong_count += 1
                total_marks -= 0.66
                status = "Wrong"
        else:
            unattempted_count += 1
            status = "Unattempted"

        item_reports.append({
            "question_id": q_id,
            "question": q["question"],
            "user_choice": submission.user_answers.get(q_id, -1),
            "correct_choice": q["correct_index"],
            "correct_option_text": q["options"][q["correct_index"]],
            "explanation": q["explanation"],
            "status": status
        })

    max_possible_marks = total_questions * 2.0
    accuracy_percentage = (correct_count / total_questions) * 100 if total_questions > 0 else 0

    # Mastery & Recommendation Logic
    if accuracy_percentage >= 80.0:
        mastery_achieved = True
        recommendation = "🎉 Outstanding! You have mastered these chapters. Brick added to Castle! You can advance to the next chapter."
        recommendation_action = "CONTINUE"
    elif accuracy_percentage >= 60.0:
        mastery_achieved = False
        recommendation = "⚠️ Good foundation! Review the weak PYQ explanations above, then re-take the test to unlock your Castle Brick."
        recommendation_action = "REVIEW"
    else:
        mastery_achieved = False
        recommendation = "🛑 High risk zone! Invest 15 more minutes scrolling through the ByteReel visual cards for these chapters before taking the quiz again."
        recommendation_action = "INVEST_TIME"

    return {
        "total_questions": total_questions,
        "correct_count": correct_count,
        "wrong_count": wrong_count,
        "unattempted_count": unattempted_count,
        "total_marks": round(total_marks, 2),
        "max_possible_marks": max_possible_marks,
        "accuracy_percentage": round(accuracy_percentage, 1),
        "mastery_achieved": mastery_achieved,
        "recommendation": recommendation,
        "recommendation_action": recommendation_action,
        "item_reports": item_reports
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)
