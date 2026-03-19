import google.generativeai as genai
import os
from dotenv import load_dotenv

load_dotenv()

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
model = genai.GenerativeModel("gemini-1.5-flash")


def generate_document(topic: str, course_name: str, page_count: int = 2, notes: str = None) -> str:
    """
    Generate a structured study document using Gemini AI.
    
    Args:
        topic: The topic/title of the assignment
        course_name: The course this belongs to
        page_count: Approximate number of pages of content to generate
        notes: Optional existing notes to expand upon
    
    Returns:
        Formatted study document as a string
    """
    try:
        word_count = page_count * 500  # ~500 words per page

        if notes:
            prompt = f"""You are a study assistant. Based on these notes:
"{notes}"

Create a comprehensive study document for: "{topic}" in course: "{course_name}".
Target length: approximately {word_count} words ({page_count} pages).

Structure the document with:
## 1. Introduction
Brief overview of the topic and its importance.

## 2. Key Concepts
Core ideas, definitions, and principles — explained clearly.

## 3. Detailed Explanation
In-depth coverage with examples and illustrations.

## 4. Important Points to Remember
Bullet-point summary of must-know facts.

## 5. Practice Questions
3-5 self-test questions with answers.

## 6. Summary
Concise recap of the entire topic.

Use clear, student-friendly language. Include relevant examples where helpful.
"""
        else:
            prompt = f"""You are a study assistant.

Create a comprehensive study document for: "{topic}" in course: "{course_name}".
Target length: approximately {word_count} words ({page_count} pages).

Structure the document with:
## 1. Introduction
Brief overview of the topic and its importance.

## 2. Key Concepts
Core ideas, definitions, and principles — explained clearly.

## 3. Detailed Explanation
In-depth coverage with examples and illustrations.

## 4. Important Points to Remember
Bullet-point summary of must-know facts.

## 5. Practice Questions
3-5 self-test questions with answers.

## 6. Summary
Concise recap of the entire topic.

Use clear, student-friendly language. Include relevant examples where helpful.

Note: This is AI-generated study material. Students should verify content with their professor and textbooks.
"""

        response = model.generate_content(prompt)
        return response.text

    except Exception as e:
        print(f"[ERROR] Document generation failed: {e}")
        return None


if __name__ == "__main__":
    # Quick test
    result = generate_document("Operating Systems", "Computer Science", page_count=2)
    if result:
        print(result[:500])
        print(f"\n... ({len(result)} total characters)")
    else:
        print("Generation failed. Check your GEMINI_API_KEY.")
