from flask import Flask, request, jsonify
from flask_cors import CORS
from question_generator import generate_questions
from doc_generator import generate_document
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app)


@app.route("/", methods=["GET"])
def health():
    return jsonify({"message": "EduGenie AI Service is running", "status": "ok"})


@app.route("/api/generate-questions", methods=["POST"])
def api_generate_questions():
    """
    Generate mock exam questions using Gemini AI.
    
    Body JSON:
        topic (str): Topic name (required)
        courseName (str): Course name (required)
        notes (str, optional): Study notes to base questions on
        count (int, optional): Number of questions (default 10)
    """
    try:
        data = request.get_json()

        topic = data.get("topic")
        course_name = data.get("courseName")
        notes = data.get("notes")
        count = data.get("count", 10)

        if not topic or not course_name:
            return jsonify({"success": False, "error": "topic and courseName are required"}), 400

        result = generate_questions(topic, course_name, notes=notes, count=count)

        if result:
            return jsonify({"success": True, "questions": result})
        else:
            return jsonify({"success": False, "error": "AI generation failed"}), 500

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/api/generate-document", methods=["POST"])
def api_generate_document():
    """
    Generate a structured study document using Gemini AI.
    
    Body JSON:
        topic (str): Topic name (required)
        courseName (str): Course name (required)
        pageCount (int, optional): Number of pages (default 2)
        notes (str, optional): Existing notes to expand upon
    """
    try:
        data = request.get_json()

        topic = data.get("topic")
        course_name = data.get("courseName")
        page_count = data.get("pageCount", 2)
        notes = data.get("notes")

        if not topic or not course_name:
            return jsonify({"success": False, "error": "topic and courseName are required"}), 400

        result = generate_document(topic, course_name, page_count=page_count, notes=notes)

        if result:
            return jsonify({"success": True, "document": result})
        else:
            return jsonify({"success": False, "error": "AI generation failed"}), 500

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


if __name__ == "__main__":
    print("EduGenie AI Service starting on port 5001...")
    app.run(host="0.0.0.0", port=5001, debug=True)
