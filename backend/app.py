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
import groq

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

groq_client=groq.Groq(api_key=GROQ_API_KEY)
# GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"

# Interview state storage
interviews: Dict[str, Dict] = {}

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

@app.route('/parse-resume', methods=['POST'])
def parse_resume():
    try:
        if 'resume' not in request.files:
            return jsonify({"error": "No resume file provided"}), 400

        resume_file = request.files['resume']
        filename = resume_file.filename.lower()

        if filename.endswith('.pdf'):
            resume_text = extract_text_from_pdf(resume_file)
        elif filename.endswith('.docx'):
            resume_text = extract_text_from_docx(resume_file)
        else:
            return jsonify({"error": "Unsupported file type. Only PDF and DOCX are allowed."}), 400

        if not resume_text.strip():
            return jsonify({"error": "No text could be extracted from the uploaded resume."}), 400

        max_text_length = 20000
        if len(resume_text) > max_text_length:
            resume_text = resume_text[:max_text_length]

        prompt = f"""
Extract the following information from this resume text and return only the JSON object:
Keys: "name", "skills", "experience", and "projects".

Resume Text:
\"\"\"
{resume_text}
\"\"\"
"""

        # headers = {
        #     "Authorization": f"Bearer {GROQ_API_KEY}",
        #     "Content-Type": "application/json"
        # }

        # data = {
        #     "model": "llama3-70b-8192",
        #     "messages": [
        #         {"role": "system", "content": "You are an expert at parsing resumes and returning structured JSON output."},
        #         {"role": "user", "content": prompt}
        #     ],
        #     "temperature": 0.3
        # }

        # response = requests.post(GROQ_API_URL, headers=headers, json=data)
        # response.raise_for_status()
        # result = response.json()

        # if "choices" in result and len(result["choices"]) > 0:
        #     content = result["choices"][0]["message"]["content"]
        #     cleaned = re.sub(r"^```(?:json)?|```$", "", content.strip(), flags=re.MULTILINE)
        #     cleaned = re.sub(r'^.*?\{', '{', cleaned, flags=re.DOTALL)
        # Replace direct API call with Groq SDK
        chat_completion = groq_client.chat.completions.create(
            model="llama3-70b-8192",
            messages=[
                {"role": "system", "content": "You are an expert at parsing resumes and returning structured JSON output."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.3
        )

        content = chat_completion.choices[0].message.content
        cleaned = re.sub(r"^```(?:json)?|```$", "", content.strip(), flags=re.MULTILINE)
        cleaned = re.sub(r'^.*?\{', '{', cleaned, flags=re.DOTALL)

        try:
                parsed = json.loads(cleaned)
                return jsonify(parsed)
        except json.JSONDecodeError as e:
                logger.error(f"JSON decoding error: {e}")
                return jsonify({"error": "Failed to parse resume data."}), 500
        else:
            return jsonify({"error": "API did not return results."}), 500

    except Exception as e:
        logger.error(f"Error: {e}\n{traceback.format_exc()}")
        return jsonify({'error': 'An unexpected error occurred.'}), 500

@app.route('/start-interview', methods=['POST'])
def start_interview():
    # Check if API key is configured
    if not GROQ_API_KEY:
        logger.error("GROQ_API_KEY is not set in environment variables.")
        return jsonify({"error": "API key configuration error on server"}), 500

    try:
        # Validate input data
        try:
            data = request.get_json()
            if not data:
                raise ValueError("Request body must be valid JSON.")
            resume_data = data.get('resumeData')
            if not resume_data or not isinstance(resume_data, dict):
                raise ValueError("Request JSON must include a valid 'resumeData' object.")
        except Exception as json_err:
            logger.error(f"JSON validation error: {json_err}")
            return jsonify({"error": str(json_err)}), 400

        # Generate interview ID
        interview_id = str(uuid.uuid4())

        # Create initial prompt for the interviewer
        system_prompt = f"""
You are a senior technical interviewer at a leading technology company. Your role is to conduct a thorough professional interview with {resume_data.get('name', 'the candidate')}.

Candidate Profile:
• Technical Skills: {', '.join(resume_data.get('skills', {}).get('skills', []))}
• Professional Experience: {len(resume_data.get('experience', []))} positions
• Project Portfolio: {len(resume_data.get('projects', []))} projects

Interview Protocol:
1. Begin with a professional introduction and establish rapport
2. Progress through these interview stages:
   - Technical competency assessment
   - Problem-solving capabilities
   - Project experience discussion
   - Behavioral scenarios
   - Leadership and collaboration
3. Evaluate responses on:
   - Technical accuracy (40%)
   - Communication clarity (30%)
   - Problem-solving approach (30%)
4. Provide a numerical score (1-10) after each response
5. Maintain professional demeanor and industry standards
6. Ask follow-up questions based on candidate responses
7. Focus on depth rather than breadth in technical discussions

Assessment Criteria:
- Score 9-10: Exceptional response with comprehensive understanding
- Score 7-8: Strong response with good technical depth
- Score 5-6: Adequate response with some areas for improvement
- Score 3-4: Below expectations, significant gaps identified
- Score 1-2: Major concerns in understanding or communication

Begin the interview professionally, following standard corporate protocol.
"""

        # headers = {
        #     "Authorization": f"Bearer {GROQ_API_KEY}",
        #     "Content-Type": "application/json"
        # }

        # data = {
        #     "model": "llama3-70b-8192",
        #     "messages": [
        #         {"role": "system", "content": system_prompt},
        #         {"role": "user", "content": "Please start the interview."}
        #     ],
        #     "temperature": 0.7
        # }

        # response = requests.post(GROQ_API_URL, headers=headers, json=data)
        # response.raise_for_status()
        # result = response.json()

        # if "choices" in result and len(result["choices"]) > 0:
        #     initial_message = result["choices"][0]["message"]["content"]
        # Replace direct API call with Groq SDK
        chat_completion = groq_client.chat.completions.create(
            model="llama3-70b-8192",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": "Please start the interview."}
            ],
            temperature=0.7
        )

        initial_message = chat_completion.choices[0].message.content    
            # Initialize interview state
        interviews[interview_id] = {
                'status': 'in_progress',
                'conversation_history': [{"role": "assistant", "content": initial_message}],
                'questions_asked': 1,
                'low_score_streak': 0
            }

        return jsonify({
                "message": initial_message,
                "interviewId": interview_id,
                "interviewStatus": "in_progress"
            })
        # else:
        #     return jsonify({"error": "Failed to start interview"}), 500

    except Exception as e:
        logger.error(f"Error in start_interview: {e}\n{traceback.format_exc()}")
        return jsonify({'error': 'Failed to start interview'}), 500

@app.route('/continue-interview', methods=['POST'])
def continue_interview():
    try:
        data = request.json
        interview_id = data.get('interviewId')
        user_response = data.get('userResponse')
        resume_data = data.get('resumeData')
        conversation_history = data.get('conversationHistory', [])
        
        if not interview_id or not user_response:
            return jsonify({"error": "Missing interview ID or response"}), 400
            
        interview = interviews.get(interview_id)
        if not interview:
            return jsonify({"error": "Invalid interview ID"}), 404
            
        system_content = f"""
You are conducting an ongoing technical interview with {resume_data.get('name', 'the candidate')}. 

Interview Context:
• Position Level: Senior Technical Role
• Interview Stage: Technical & Behavioral Assessment
• Areas of Focus: Technical Depth, Problem Solving, Leadership

Interview Guidelines:
1. Maintain professional corporate interview standards
2. Evaluate responses using established rubric:
   - Technical accuracy and depth
   - Problem-solving methodology
   - Communication effectiveness
   - Real-world application
3. Provide constructive follow-up questions
4. Assess both technical competency and soft skills
5. Consider candidate's background:
   - Technical expertise: {', '.join(resume_data.get('skills', {}).get('skills', []))}
   - Project experience: {len(resume_data.get('projects', []))} relevant projects
6. Score responses objectively (1-10)
7. Document specific strengths and areas for improvement

Previous Discussion Context:
{conversation_history}

Latest Response Analysis:
{user_response}

Proceed with appropriate follow-up maintaining professional interview standards.
"""

        messages = [
            {"role": "system", "content": system_content}
        ]
        
        for msg in conversation_history:
            if msg['type'] == 'interviewer':
                messages.append({"role": "assistant", "content": msg['content']})
            else:
                messages.append({"role": "user", "content": msg['content']})
        
        messages.append({"role": "user", "content": user_response})
        
        # headers = {
        #     "Authorization": f"Bearer {GROQ_API_KEY}",
        #     "Content-Type": "application/json"
        # }

        # data = {
        #     "model": "llama3-70b-8192",
        #     "messages": messages,
        #     "temperature": 0.7
        # }

        # response = requests.post(GROQ_API_URL, headers=headers, json=data)
        # response.raise_for_status()
        # result = response.json()
        chat_completion = groq_client.chat.completions.create(
            model="llama3-70b-8192",
            messages=messages,
            temperature=0.7
        )

        content = chat_completion.choices[0].message.content
        # if "choices" in result and len(result["choices"]) > 0:
        # content = result["choices"][0]["message"]["content"]
            
        score_match = re.search(r'Score:\s*(\d+)/10', content)
        score = int(score_match.group(1)) if score_match else None
            
        if score and score < 5:
                interview['low_score_streak'] += 1
        else:
                interview['low_score_streak'] = 0
            
        interview['conversation_history'].append({"role": "assistant", "content": content})
        interview['questions_asked'] += 1
            
        termination_reason = None
        if interview['questions_asked'] >= 25:
                interview['status'] = 'completed'
                termination_reason = "question_limit"
        elif interview['low_score_streak'] >= 3:
                interview['status'] = 'completed'
                termination_reason = "low_score_streak"
            
        if interview['status'] == 'completed':
                if not any(x in content.lower() for x in ['conclude', 'final', 'end']):
                    if termination_reason == "low_score_streak":
                        content += "\n\nI appreciate your time today. We'll wrap up here - thank you for the conversation!"
                    else:
                        content += "\n\nThank you for your time! This has been a great conversation."
            
        return jsonify({
                "interviewStatus": interview['status'],
                "message": content,
                "feedback": "Well done!" if score and score >= 7 else "Let's explore this further",
                "score": score,
                "lowScoreStreak": interview['low_score_streak']
            })
        # else:
        #     return jsonify({"error": "Failed to continue interview"}), 500

    except Exception as e:
        logger.error(f"Error: {e}\n{traceback.format_exc()}")
        return jsonify({'error': 'Failed to continue interview'}), 500

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({"status": "healthy", "version": "1.0.0"})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)