from flask import Flask, request, jsonify
from flask_cors import CORS
from PyPDF2 import PdfReader
from docx import Document
import os
import requests
import json
import re
import logging
import traceback
from dotenv import load_dotenv
import uuid
from typing import Dict, List

# Load environment variables
load_dotenv()

# Setup logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__)
CORS(app)

# Load Groq API key
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
if not GROQ_API_KEY:
    raise ValueError("Missing GROQ_API_KEY in .env")

GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"

# Interview state storage (in-memory for simplicity, consider Redis in production)
interviews: Dict[str, Dict] = {}

# Helper: Extract text from PDF
def extract_text_from_pdf(file_storage):
    try:
        reader = PdfReader(file_storage)
        text = "\n".join(page.extract_text() for page in reader.pages if page.extract_text())
        if not text.strip():
            raise ValueError("No text could be extracted from the PDF.")
        return text
    except Exception as e:
        logger.error(f"PDF parsing error: {e}")
        raise

# Helper: Extract text from DOCX
def extract_text_from_docx(file_storage):
    try:
        doc = Document(file_storage)
        text = "\n".join(para.text for para in doc.paragraphs if para.text.strip())
        if not text.strip():
            raise ValueError("No text could be extracted from the DOCX.")
        return text
    except Exception as e:
        logger.error(f"DOCX parsing error: {e}")
        raise

# Route: Parse Resume
@app.route('/parse-resume', methods=['POST'])
def parse_resume():
    try:
        logger.info("Received request to parse resume")

        if 'resume' not in request.files:
            return jsonify({"error": "No resume file provided"}), 400

        resume_file = request.files['resume']
        filename = resume_file.filename.lower()

        # Determine file type
        if filename.endswith('.pdf'):
            resume_text = extract_text_from_pdf(resume_file)
        elif filename.endswith('.docx'):
            resume_text = extract_text_from_docx(resume_file)
        else:
            return jsonify({"error": "Unsupported file type. Only PDF and DOCX are allowed."}), 400

        if not resume_text.strip():
            return jsonify({"error": "No text could be extracted from the uploaded resume."}), 400

        # Truncate if too long
        max_text_length = 20000
        if len(resume_text) > max_text_length:
            logger.warning("Resume too long, truncating text.")
            resume_text = resume_text[:max_text_length]

        # Construct prompt to extract name along with other details
        prompt = f"""
Extract the following information from this resume text and return only the JSON object (no explanation, no markdown code blocks).

Keys: "name", "skills", "experience", and "projects".

Resume Text:
\"\"\"
{resume_text}
\"\"\"
"""

        headers = {
            "Authorization": f"Bearer {GROQ_API_KEY}",
            "Content-Type": "application/json"
        }

        data = {
            "model": "llama3-70b-8192",
            "messages": [
                {"role": "system", "content": "You are an expert at parsing resumes and returning structured JSON output with the candidate's name."},
                {"role": "user", "content": prompt}
            ],
            "temperature": 0.3
        }

        # Call Groq API
        response = requests.post(GROQ_API_URL, headers=headers, json=data)
        response.raise_for_status()
        result = response.json()

        if "choices" in result and len(result["choices"]) > 0:
            content = result["choices"][0]["message"]["content"]
            logger.debug(f"Raw model response: {content}")

            # Clean and parse the model output
            cleaned = re.sub(r"^```(?:json)?|```$", "", content.strip(), flags=re.MULTILINE)
            cleaned = re.sub(r'^.*?\{', '{', cleaned, flags=re.DOTALL)  # Keep only the JSON part from first {
            
            try:
                parsed = json.loads(cleaned)
                return jsonify(parsed)
            except json.JSONDecodeError as e:
                logger.error(f"JSON decoding error after cleanup: {e}")
                return jsonify({"error": "Failed to parse resume data as JSON."}), 500
        else:
            logger.error("Invalid response from Groq API.")
            return jsonify({"error": "Groq API did not return any results."}), 500

    except ValueError as e:
        logger.error(f"Validation error: {str(e)}")
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        logger.error(f"Unhandled exception: {e}")
        logger.error(traceback.format_exc())
        return jsonify({'error': 'An unexpected error occurred while processing your resume.'}), 500

@app.route('/start-interview', methods=['POST'])
def start_interview():
    try:
        data = request.json
        resume_data = data.get('resumeData')
        
        if not resume_data:
            return jsonify({"error": "No resume data provided"}), 400
        
        # Get candidate name (default to "Candidate" if not found)
        candidate_name = resume_data.get('name', 'Candidate')
        if isinstance(candidate_name, list):
            candidate_name = candidate_name[0] if candidate_name else 'Candidate'
        elif not isinstance(candidate_name, str):
            candidate_name = 'Candidate'
        
        # Generate interview ID
        interview_id = str(uuid.uuid4())
        
        # Construct initial prompt with personalized greeting
        prompt = f"""
You are a professional interviewer conducting a technical and behavioral interview. 
Start with a friendly greeting addressing the candidate by name ("Hello {candidate_name}") and then ask the first question. 
Ask relevant questions one at a time, starting with an introduction and then moving to technical questions 
based on the candidate's skills and experience, followed by behavioral questions.

Resume Summary:
Name: {candidate_name}
Skills: {resume_data.get('skills', {}).get('skills', [])[:10]}
Experience: {[exp.get('title', '') for exp in resume_data.get('experience', [])][:3]}
Projects: {[proj.get('title', '') for proj in resume_data.get('projects', [])][:3]}

Keep questions concise and one at a time. Address the candidate by name when appropriate.
"""
        
        headers = {
            "Authorization": f"Bearer {GROQ_API_KEY}",
            "Content-Type": "application/json"
        }

        data = {
            "model": "llama3-70b-8192",
            "messages": [
                {"role": "system", "content": f"""You are a professional technical interviewer conducting an interview with {candidate_name}. 
Address them by name when appropriate unless they prefer otherwise. 
Ask relevant questions based on the resume, one at a time. 
After each answer, provide brief feedback and a score from 1-10 based on answer quality."""},
                {"role": "user", "content": prompt}
            ],
            "temperature": 0.7
        }

        # Call Groq API
        response = requests.post(GROQ_API_URL, headers=headers, json=data)
        response.raise_for_status()
        result = response.json()

        if "choices" in result and len(result["choices"]) > 0:
            content = result["choices"][0]["message"]["content"]
            
            # Store interview state with candidate name
            interviews[interview_id] = {
                "resume_data": resume_data,
                "candidate_name": candidate_name,
                "conversation_history": [
                    {"role": "assistant", "content": content}
                ],
                "status": "in_progress",
                "current_score": None,
                "questions_asked": 0
            }
            
            return jsonify({
                "interviewId": interview_id,
                "interviewStatus": "in_progress",
                "message": content,
                "feedback": "Let's begin the interview!",
                "score": None
            })
        else:
            logger.error("Invalid response from Groq API when starting interview.")
            return jsonify({"error": "Failed to start interview"}), 500

    except Exception as e:
        logger.error(f"Error starting interview: {e}")
        logger.error(traceback.format_exc())
        return jsonify({'error': 'Failed to start interview'}), 500

@app.route('/continue-interview', methods=['POST'])
def continue_interview():
    try:
        data = request.json
        interview_id = data.get('interviewId')
        user_response = data.get('userResponse')
        
        if not interview_id or not user_response:
            return jsonify({"error": "Missing interview ID or user response"}), 400
            
        # Get interview state
        interview = interviews.get(interview_id)
        if not interview:
            return jsonify({"error": "Invalid interview ID"}), 404
            
        resume_data = interview['resume_data']
        candidate_name = interview.get('candidate_name', 'Candidate')
        
        # Prepare conversation history for LLM
        messages = [
            {"role": "system", "content": f"""
You are conducting an interview with {candidate_name} based on this resume:
Skills: {resume_data.get('skills', [])}
Experience: {resume_data.get('experience', [])}
Projects: {resume_data.get('projects', [])}

Address the candidate by name when appropriate (e.g., "That's a good point, {candidate_name}"). 
Ask relevant follow-up questions one at a time. After each answer:
1. Provide brief constructive feedback
2. Rate the answer from 1-10 based on:
   - Technical accuracy (for technical questions)
   - Clarity and structure
   - Relevance to question
   - Demonstration of skills/experience
3. Then ask the next question
"""}
        ]
        
        # Add previous conversation
        for msg in interview['conversation_history']:
            messages.append({"role": msg["role"], "content": msg["content"]})
        
        # Add current response
        messages.append({"role": "user", "content": user_response})
        
        # Call Groq API
        headers = {
            "Authorization": f"Bearer {GROQ_API_KEY}",
            "Content-Type": "application/json"
        }

        data = {
            "model": "llama3-70b-8192",
            "messages": messages,
            "temperature": 0.7
        }

        response = requests.post(GROQ_API_URL, headers=headers, json=data)
        response.raise_for_status()
        result = response.json()

        if "choices" in result and len(result["choices"]) > 0:
            content = result["choices"][0]["message"]["content"]
            
            # Extract score from response
            score_match = re.search(r'Score:\s*(\d+)/10', content)
            score = int(score_match.group(1)) if score_match else None
            
            # Update interview state
            interview['conversation_history'].append({"role": "assistant", "content": content})
            interview['questions_asked'] += 1
            
            # End interview after 5 questions
            if interview['questions_asked'] >= 5:
                interview['status'] = 'completed'
                content += f"\n\nThank you for your time, {candidate_name}! This concludes our interview."
            
            return jsonify({
                "interviewStatus": interview['status'],
                "message": content,
                "feedback": "Good answer!" if score and score >= 7 else "Needs improvement",
                "score": score
            })
        else:
            logger.error("Invalid response from Groq API when continuing interview.")
            return jsonify({"error": "Failed to continue interview"}), 500

    except Exception as e:
        logger.error(f"Error continuing interview: {e}")
        logger.error(traceback.format_exc())
        return jsonify({'error': 'Failed to continue interview'}), 500

# Health check endpoint
@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({"status": "healthy", "version": "1.0.0"})

# Run the app
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)