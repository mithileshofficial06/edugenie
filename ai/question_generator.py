from ai_provider import generate_content


def generate_questions(topic: str, course_name: str, notes: str = None, count: int = 10) -> str:
    """
    Generate mock exam questions with answers using Gemini AI.
    
    Args:
        topic: The topic/title of the quiz or assignment
        course_name: The course this belongs to
        notes: Optional study notes to base questions on
        count: Number of questions to generate (default 10)
    
    Returns:
        Formatted string of questions and answers
    """
    try:
        if notes:
            prompt = f"""You are an exam preparation assistant. Based on these notes:
"{notes}"

Generate {count} mock questions with detailed answers for topic: "{topic}" in course: "{course_name}".

Format:
Q1. [Question]
Answer: [Detailed answer]

Q2. [Question]
Answer: [Detailed answer]

... and so on.

Include a mix of:
- Multiple choice questions (with options A, B, C, D)
- Short answer questions
- Conceptual questions
"""
        else:
            prompt = f"""You are an exam preparation assistant.

Generate {count} mock questions with detailed answers for topic: "{topic}" in course: "{course_name}".

Format:
Q1. [Question]
Answer: [Detailed answer]

Q2. [Question]
Answer: [Detailed answer]

... and so on.

Include a mix of:
- Multiple choice questions (with options A, B, C, D)
- Short answer questions  
- Conceptual questions

Note: These are AI-generated practice questions. Students should verify answers with their professor.
"""

        response = generate_content(prompt)
        return response

    except Exception as e:
        print(f"[ERROR] Question generation failed: {e}")
        return None


if __name__ == "__main__":
    # Quick test
    result = generate_questions("Data Structures", "Computer Science")
    if result:
        print(result[:500])
        print(f"\n... ({len(result)} total characters)")
    else:
        print("Generation failed. Check your GEMINI_API_KEY.")
