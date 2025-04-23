# from flask import Flask, request, jsonify
# from flask_cors import CORS
# from pymongo import MongoClient

# app = Flask(__name__)
# CORS(app)

# # Connect to local MongoDB
# client = MongoClient("mongodb://localhost:27017/")
# db = client["interviewApp"]
# interview_collection = db["interviews"]

# @app.route('/save-interview', methods=['POST'])
# def save_interview():
#     data = request.json
#     try:
#         interview_collection.insert_one(data)
#         return jsonify({"message": "Interview saved!"}), 200
#     except Exception as e:
#         return jsonify({"error": str(e)}), 500

# @app.route('/interviews', methods=['GET'])
# def get_all_interviews():
#     interviews = list(interview_collection.find({}, {"_id": 0}))
#     return jsonify(interviews)

# if __name__ == "__main__":
#     app.run(debug=True)



# app.py
from flask import Flask, request, jsonify
from flask_cors import CORS
from PyPDF2 import PdfReader
from docx import Document
import os
import json
import re
import logging
import traceback
from dotenv import load_dotenv
import uuid
from datetime import datetime, timezone # Use timezone-aware datetimes
import sys
import groq
from bson import ObjectId # Import ObjectId if needed for user IDs
import time
# Add below import statements
import socket
# Setup logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)
# Add below 'Load environment variables'
def check_mongodb_availability():
    """Simple check if MongoDB port is accessible"""
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    try:
        s.connect(("localhost", 27017))
        logger.info("MongoDB port 27017 is accessible")
        s.close()
        return True
    except socket.error:
        logger.error("Cannot connect to MongoDB port 27017. Is MongoDB running?")
        s.close()
        return False

# Call this before initializing the database
if not check_mongodb_availability():
    logger.critical("MongoDB server is not accessible. Please start MongoDB server first.")
    sys.exit(1)
# Import the specific functions needed from database.py
from database import (
    initialize_database, # Import the main initializer
    save_interview,
    get_interview,
    update_interview_status,
    save_chat_message,
    get_interview_chat,
    save_resume,
    get_user_interviews,
    get_user_resumes, # Added for potential future use
    create_user,
    get_user_by_email,
    # DO NOT import client, db, or collections directly here
)

# Load environment variables from .env file
load_dotenv()

# Setup logging
logging.basicConfig(level=logging.DEBUG, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__)
CORS(app) # Enable CORS for all routes

# --- Load Groq API key ---
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
if not GROQ_API_KEY:
    logger.error("Missing GROQ_API_KEY in environment variables. Please set it in .env file.")
    # Depending on deployment strategy, you might want to exit or raise an error here
    # sys.exit("Error: GROQ_API_KEY not configured.")
    # For now, we raise ValueError to prevent startup without the key
    raise ValueError("Missing GROQ_API_KEY in environment variables.")

try:
    groq_client = groq.Groq(api_key=GROQ_API_KEY)
    logger.info("Groq client initialized successfully.")
except Exception as e:
    logger.error(f"Failed to initialize Groq client: {e}", exc_info=True)
    raise

# --- In-memory storage for active interview states ---
# Note: This will be lost if the server restarts.
# For production, consider using a persistent store like Redis or the database itself.
interviews: dict[str, dict] = {}

# === Helper Functions ===

def get_utc_now():
    """Returns the current UTC datetime."""
    return datetime.now(timezone.utc)

def extract_text_from_pdf(file_storage):
    """Extracts text from a PDF file stream."""
    try:
        reader = PdfReader(file_storage)
        text = ""
        for page in reader.pages:
            page_text = page.extract_text()
            if page_text:
                text += page_text + "\n" # Add newline between pages
        if not text.strip():
            logger.warning(f"No text could be extracted from PDF: {file_storage.filename}")
        return text
    except Exception as e:
        logger.error(f"Error parsing PDF file {file_storage.filename}: {e}", exc_info=True)
        raise ValueError(f"Could not process PDF file: {e}") # Re-raise as ValueError

def extract_text_from_docx(file_storage):
    """Extracts text from a DOCX file stream."""
    try:
        doc = Document(file_storage)
        text = "\n".join(para.text for para in doc.paragraphs if para.text.strip())
        if not text.strip():
            logger.warning(f"No text could be extracted from DOCX: {file_storage.filename}")
        return text
    except Exception as e:
        logger.error(f"Error parsing DOCX file {file_storage.filename}: {e}", exc_info=True)
        raise ValueError(f"Could not process DOCX file: {e}") # Re-raise as ValueError

def parse_llm_json_response(llm_content: str, filename: str = "N/A") -> dict:
    """Attempts to parse JSON from LLM output, handling common formatting issues."""
    try:
        # Attempt direct parsing first (ideal case, especially with JSON mode)
        return json.loads(llm_content)
    except json.JSONDecodeError:
        logger.warning(f"Direct JSON parsing failed for response related to {filename}. Trying cleanup...")
        # Fallback: Clean common markdown code fences and retry
        cleaned = re.sub(r"^```(?:json)?\s*|\s*```$", "", llm_content.strip(), flags=re.MULTILINE | re.DOTALL)
        # Fallback: Find the first '{' and last '}' - use with caution
        start = cleaned.find('{')
        end = cleaned.rfind('}')
        if start != -1 and end != -1 and end > start:
            json_like_part = cleaned[start:end+1]
            try:
                return json.loads(json_like_part)
            except json.JSONDecodeError as e_fallback:
                logger.error(f"JSON parsing failed even after cleanup for {filename}. Error: {e_fallback}. Cleaned content: {json_like_part[:500]}...") # Log snippet
                raise ValueError("Failed to parse JSON data from LLM response.")
        else:
             logger.error(f"Could not find valid JSON structure after cleanup for {filename}. Cleaned content: {cleaned[:500]}...")
             raise ValueError("Could not find valid JSON structure in LLM response.")

# === API Routes ===

@app.route('/parse-resume', methods=['POST'])
def parse_resume():
    """
    Parses an uploaded resume file (PDF or DOCX) using Groq LLM
    and returns structured data (name, skills, experience, projects).
    """
    if 'resume' not in request.files:
        logger.warning("'/parse-resume' request missing 'resume' file part.")
        return jsonify({"error": "No resume file provided in the 'resume' form field."}), 400

    resume_file = request.files['resume']
    filename = resume_file.filename
    if not filename:
        logger.warning("'/parse-resume' request received file with no filename.")
        return jsonify({"error": "Resume file has no filename."}), 400

    logger.info(f"Received resume file: {filename}")
    filename_lower = filename.lower()
    resume_text = ""

    try:
        if filename_lower.endswith('.pdf'):
            resume_text = extract_text_from_pdf(resume_file)
        elif filename_lower.endswith(('.docx')): # Allow .docx
            resume_text = extract_text_from_docx(resume_file)
        else:
            logger.warning(f"Unsupported file type received: {filename}")
            return jsonify({"error": "Unsupported file type. Only PDF and DOCX are allowed."}), 400

        if not resume_text or not resume_text.strip():
             logger.warning(f"Resume '{filename}' resulted in empty text after extraction.")
             # Return an empty structure consistent with successful parsing
             return jsonify({"name": "", "skills": [], "experience": [], "projects": []})

        # Truncate if necessary (adjust length as needed)
        max_text_length = 25000 # Increased limit slightly
        if len(resume_text) > max_text_length:
            logger.warning(f"Resume text for '{filename}' truncated to {max_text_length} characters.")
            resume_text = resume_text[:max_text_length]

        # Prepare prompt for LLM
        prompt = f"""
        **Task:** Extract key information from the following resume text.
        **Output Format:** Return ONLY a valid JSON object with these exact keys: "name" (string), "skills" (list of strings), "experience" (list of objects, each representing a job), and "projects" (list of objects, each representing a project). If information for a key isn't found, use an empty string or empty list as appropriate.

        **Resume Text:**
        ```
        {resume_text}
        ```

        **JSON Output:**
        """

        # Call Groq API
        logger.debug(f"Sending resume text for '{filename}' to Groq API for parsing.")
        chat_completion = groq_client.chat.completions.create(
            model="llama3-70b-8192", # Or consider llama3-8b-8192 for faster, possibly less accurate results
            messages=[
                {"role": "system", "content": "You are an expert resume parser. Your sole task is to extract information and return it as a valid JSON object according to the user's specified format. Respond ONLY with the JSON object."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.1, # Very low temperature for deterministic extraction
            response_format={"type": "json_object"} # Use JSON mode
        )

        llm_content = chat_completion.choices[0].message.content
        logger.debug(f"Received Groq API response for '{filename}'.")

        # Parse the JSON response
        parsed_data = parse_llm_json_response(llm_content, filename)

        # Optional: Basic validation of the parsed structure
        required_keys = {"name", "skills", "experience", "projects"}
        if not required_keys.issubset(parsed_data.keys()):
            logger.warning(f"Parsed data for '{filename}' is missing required keys. Found: {parsed_data.keys()}")
            # Decide how to handle - return error or fill missing keys? Filling is safer.
            for key in required_keys:
                if key not in parsed_data:
                    parsed_data[key] = [] if key in ["skills", "experience", "projects"] else ""

        logger.info(f"Successfully parsed resume: {filename}")
        return jsonify(parsed_data)

    except ValueError as ve: # Catch specific ValueErrors raised by helpers or parser
         logger.error(f"Value error during resume parsing for {filename}: {ve}")
         return jsonify({'error': str(ve)}), 400 # Return specific error message
    except Exception as e:
        logger.error(f"Unexpected error during /parse-resume for {filename}: {e}\n{traceback.format_exc()}")
        return jsonify({'error': 'An unexpected error occurred during resume parsing.'}), 500


@app.route('/start-interview', methods=['POST'])
def start_interview():
    """
    Starts a new interview based on parsed resume data.
    Initializes interview state and gets the first question from the LLM.
    """
    global interviews # Access the global in-memory dictionary

    try:
        data = request.get_json()
        if not data:
            logger.warning("'/start-interview' request missing JSON body.")
            return jsonify({"error": "Request body must be valid JSON."}), 400
        resume_data = data.get('resumeData')
        user_id = data.get('userId') # Get userId to associate with the interview state

        if not resume_data or not isinstance(resume_data, dict):
             logger.warning("'/start-interview' request JSON missing 'resumeData' object.")
             return jsonify({"error": "Request JSON must include a valid 'resumeData' object."}), 400
        # if not user_id: # Optional: Make userId mandatory to start
        #     logger.warning("'/start-interview' request JSON missing 'userId'.")
        #     return jsonify({"error": "Request JSON must include 'userId'."}), 400

        interview_id = str(uuid.uuid4()) # Generate a unique ID for this interview session

        # Prepare context for the interviewer LLM
        candidate_name = resume_data.get('name', 'the candidate')
        skills_list = resume_data.get('skills', [])
        experience_list = resume_data.get('experience', []) # List of job objects
        projects_list = resume_data.get('projects', []) # List of project objects

        # Create a concise summary for the prompt
        skills_summary = ', '.join(skills_list[:10]) + ('...' if len(skills_list) > 10 else '') if skills_list else 'Not specified'
        experience_summary = f"{len(experience_list)} positions mentioned"
        projects_summary = f"{len(projects_list)} projects mentioned"

        system_prompt = f"""
        **Role:** You are 'AI Interviewer', a friendly yet professional senior technical interviewer.
        **Candidate:** {candidate_name}
        **Candidate Profile Summary:**
        - Key Skills: {skills_summary}
        - Experience: {experience_summary}
        - Projects: {projects_summary}

        **Interview Protocol:**
        1.  **Begin:** Start with a brief, professional introduction and ask your first question immediately.
        2.  **Questioning:** Ask around 5-7 insightful questions covering:
            -   Technical skills (related to the profile summary).
            -   Problem-solving approaches.
            -   Specific experiences or projects from their resume (if details were provided).
            -   Behavioral scenarios (e.g., teamwork, handling challenges).
        3.  **Interaction:** After *each* candidate answer:
            -   Provide brief, constructive feedback (1-2 sentences).
            -   Provide a numerical score for their answer (1-10).
            -   **Format:** Respond *only* in this format: `[Your next question or follow-up]\n\n**Feedback:** [Your feedback text]. **Score:** [Number]/10`
        4.  **Adapt:** Ask relevant follow-up questions based on their responses.
        5.  **Conclude:** After sufficient questions (~5-7), politely conclude the interview.

        **Tone:** Maintain a positive, encouraging, and professional tone throughout.

        **Action:** Start the interview now by introducing yourself briefly and asking the first relevant question based on the candidate's profile.
        """

        # Call Groq API to get the initial greeting and first question
        logger.debug(f"Starting interview {interview_id}. Sending initial prompt to Groq.")
        chat_completion = groq_client.chat.completions.create(
            model="llama3-70b-8192",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": "Start the interview now."} # Simple trigger
            ],
            temperature=0.7 # Moderate temperature for variability in questions
        )

        initial_message = chat_completion.choices[0].message.content

        # Store initial state in the in-memory dictionary
        interviews[interview_id] = {
            'userId': user_id, # Store the user ID
            'userName': candidate_name, # Store the candidate name
            'status': 'in_progress',
            'system_prompt': system_prompt, # Store for context in subsequent calls
            'conversation_history': [
                {"role": "assistant", "content": initial_message, "timestamp": get_utc_now()}
            ],
            'scores': [], # To store numerical scores extracted from AI responses
            'startTime': get_utc_now()
        }

        logger.info(f"Started interview {interview_id} for user {user_id} ({candidate_name}).")
        return jsonify({
            "message": initial_message,
            "interviewId": interview_id,
            "interviewStatus": "in_progress"
        }), 201 # 201 Created status code might be appropriate

    except Exception as e:
        logger.error(f"Error during /start-interview: {e}\n{traceback.format_exc()}")
        return jsonify({'error': 'Failed to start interview due to an internal error.'}), 500


@app.route('/continue-interview', methods=['POST'])
def continue_interview():
    """
    Continues an ongoing interview. Sends user response to LLM, gets AI response,
    extracts feedback/score, and updates interview state.
    """
    global interviews # Access the global in-memory store

    try:
        data = request.json
        if not data:
            logger.warning("'/continue-interview' request missing JSON body.")
            return jsonify({"error": "Request body must be valid JSON."}), 400

        interview_id = data.get('interviewId')
        user_response = data.get('userResponse')

        if not interview_id or interview_id not in interviews:
            logger.warning(f"'/continue-interview' request for invalid/unknown interview ID: {interview_id}")
            return jsonify({"error": "Interview not found or invalid ID."}), 404
        if not user_response:
             logger.warning(f"'/continue-interview' request for {interview_id} missing 'userResponse'.")
             return jsonify({"error": "userResponse is required."}), 400

        interview_state = interviews[interview_id]

        if interview_state['status'] != 'in_progress':
             logger.warning(f"Attempt to continue interview {interview_id} which has status: {interview_state['status']}")
             return jsonify({"error": f"Interview cannot be continued, status is: {interview_state['status']}"}), 400

        # Append user response to history
        interview_state['conversation_history'].append({
            "role": "user",
            "content": user_response,
            "timestamp": get_utc_now()
        })

        # Prepare messages for Groq (include system prompt + full history)
        messages_for_api = [
            {"role": "system", "content": interview_state['system_prompt']}
        ]
        # Add conversation history, ensuring correct role mapping if needed
        for msg in interview_state['conversation_history']:
            messages_for_api.append({"role": msg["role"], "content": msg["content"]})

        # Call Groq API
        logger.debug(f"Continuing interview {interview_id}. Sending history (length {len(messages_for_api)}) to Groq.")
        chat_completion = groq_client.chat.completions.create(
            model="llama3-70b-8192",
            messages=messages_for_api,
            temperature=0.6 # Slightly lower temp for more focused follow-ups
        )

        ai_response_content = chat_completion.choices[0].message.content
        logger.debug(f"Received Groq response for interview {interview_id}.")

        # --- Extract Feedback and Score using Regex ---
        feedback = "Feedback not provided." # Default
        score = None # Default
        score_extracted_for_log = "N/A"

        # Regex to find the feedback and score, allowing for variations in spacing/casing
        # Looks for "**Feedback:**" followed by text, until "**Score:**" or end of string
        # Then looks for "**Score:**" followed by number/10
        match = re.search(
            r"\*\*Feedback:\*\*\s*(.*?)(?:\s*\*\*Score:\*\*|\Z).*\*\*Score:\*\*\s*(\d{1,2})\s*/\s*10",
            ai_response_content,
            re.IGNORECASE | re.DOTALL
        )

        if match:
            feedback = match.group(1).strip()
            try:
                score = int(match.group(2))
                interview_state['scores'].append(score) # Store the valid score
                score_extracted_for_log = str(score)
                logger.info(f"Interview {interview_id}: Extracted Feedback and Score={score}")
            except ValueError:
                logger.warning(f"Interview {interview_id}: Could not parse score from matched group '{match.group(2)}'")
                feedback = "Feedback provided, but score extraction failed." # Update feedback if score fails
        else:
            # Try finding score separately if the combined pattern failed
            score_match = re.search(r"\*\*Score:\*\*\s*(\d{1,2})\s*/\s*10", ai_response_content, re.IGNORECASE)
            if score_match:
                 try:
                     score = int(score_match.group(1))
                     interview_state['scores'].append(score)
                     score_extracted_for_log = str(score)
                     logger.info(f"Interview {interview_id}: Extracted Score={score} (Feedback pattern not matched)")
                 except ValueError:
                     logger.warning(f"Interview {interview_id}: Could not parse score from group '{score_match.group(1)}' (Feedback pattern not matched)")
            else:
                logger.warning(f"Interview {interview_id}: Feedback/Score pattern not found in response: {ai_response_content[:100]}...")


        # Append AI response to history (store raw response and extracted score)
        interview_state['conversation_history'].append({
            "role": "assistant",
            "content": ai_response_content, # Store the full raw response
            "timestamp": get_utc_now(),
            "score_extracted": score # Store the extracted score (or None)
        })

        # --- Check for Interview End Condition ---
        # Example: End after ~7 questions (1 system + 7 user + 7 AI = 15 messages)
        MAX_MESSAGES = 15
        if len(interview_state['conversation_history']) >= MAX_MESSAGES:
             interview_state['status'] = 'ending' # Signal to frontend
             ai_response_content += "\n\nOkay, I believe that covers the main areas I wanted to discuss. Thank you for answering my questions." # Append concluding remark
             logger.info(f"Interview {interview_id} reached message limit ({MAX_MESSAGES}), signaling end.")

        # --- (Optional) Persist intermediate chat message ---
        # Consider the performance impact of writing to DB on every turn.
        # It might be better to save only at the end.
        # if interview_state.get('userId'):
        #     try:
        #         # Save the last two messages (user + AI)
        #         messages_to_save = interview_state['conversation_history'][-2:]
        #         # Prepare for DB (map roles, convert user ID)
        #         db_messages = [
        #             {'sender': msg['role'], 'content': msg['content'], 'timestamp': msg['timestamp']}
        #             for msg in messages_to_save
        #         ]
        #         user_object_id = ObjectId(interview_state['userId']) # Assuming conversion needed
        #         chat_data = {
        #             'interviewId': interview_id, # Assuming interviewId is string in chats too
        #             'userId': user_object_id,
        #             'messages': db_messages
        #         }
        #         # This assumes save_chat_message handles updates or appends correctly
        #         # save_chat_message(chat_data)
        #     except Exception as db_err:
        #         logger.error(f"Failed to save intermediate chat message for interview {interview_id}: {db_err}")

        # --- Return response to frontend ---
        return jsonify({
            "interviewStatus": interview_state['status'], # Let frontend know if it should prepare to end
            "message": ai_response_content, # Full AI response including question/feedback/score
            "feedback": feedback, # Extracted feedback text
            "score": score # Extracted numerical score
        })

    except Exception as e:
        logger.error(f"Error during /continue-interview for ID {interview_id if 'interview_id' in locals() else 'N/A'}: {e}\n{traceback.format_exc()}")
        return jsonify({'error': 'Failed to continue interview due to an internal error.'}), 500

@app.route('/end-interview', methods=['POST'])
def end_interview():
    """
    Ends an interview, calculates final score, saves the complete interview
    and chat history to the database, and cleans up the in-memory state.
    """
    global interviews # Access the global in-memory store

    interview_id = None # Initialize for error logging
    try:
        data = request.json
        if not data:
            logger.warning("'/end-interview' request missing JSON body.")
            return jsonify({"error": "Request body must be valid JSON."}), 400

        interview_id = data.get('interviewId')

        if not interview_id or interview_id not in interviews:
            logger.warning(f"'/end-interview' request for invalid/unknown interview ID: {interview_id}")
            # If ID exists but not in memory, maybe it was already ended? Check DB?
            # For now, assume it's an error if not in memory.
            return jsonify({"error": "Interview not found or invalid ID. It might have already ended or failed to start."}), 404

        interview_state = interviews[interview_id]
        user_id = interview_state.get('userId')
        user_name = interview_state.get('userName', 'Unknown Candidate')

        if not user_id:
             logger.error(f"Interview {interview_id} cannot be saved because userId is missing from its state.")
             # Clean up memory anyway
             del interviews[interview_id]
             return jsonify({"error": "Cannot save interview: User ID was not associated during start."}), 400

        logger.info(f"Ending interview {interview_id} for user {user_id}.")

        # --- Calculate final score ---
        final_score = None
        if interview_state.get('scores'):
            valid_scores = [s for s in interview_state['scores'] if isinstance(s, (int, float))]
            if valid_scores:
                final_score = round(sum(valid_scores) / len(valid_scores))
                logger.info(f"Calculated final score for interview {interview_id}: {final_score}")
            else:
                logger.warning(f"No valid scores found for interview {interview_id} to calculate final score.")
        else:
            logger.warning(f"Score list empty for interview {interview_id}. Cannot calculate final score.")


        # --- Process history for Database ---
        conversation_history_db = []
        qa_pairs = []
        current_question_info = None

        for msg in interview_state['conversation_history']:
            # Map roles for DB consistency ('assistant' -> 'interviewer')
            msg_type = 'interviewer' if msg['role'] == 'assistant' else 'user'
            db_entry = {
                'type': msg_type,
                'content': msg['content'],
                'timestamp': msg.get('timestamp', get_utc_now()),
                'score': msg.get('score_extracted') # Include score extracted during conversation
            }
            conversation_history_db.append(db_entry)

            # Attempt to structure Q&A pairs
            if msg_type == 'interviewer':
                # If a previous question was pending an answer, finalize it (maybe as unanswered)
                if current_question_info and 'answer' not in current_question_info:
                    logger.warning(f"Interview {interview_id}: Found unanswered interviewer message before the next.")
                    current_question_info['answer'] = "[No specific user answer recorded before next question]"
                    qa_pairs.append(current_question_info)

                # Start a new potential Q&A pair
                current_question_info = {
                    'question': msg['content'],
                    'answer': None, # Placeholder for the user's answer
                    'score': msg.get('score_extracted'), # Score associated with the *question's* feedback
                    'timestamp': msg.get('timestamp', get_utc_now())
                }
            elif msg_type == 'user' and current_question_info:
                # Assign the user's message as the answer to the pending question
                current_question_info['answer'] = msg['content']
                qa_pairs.append(current_question_info)
                current_question_info = None # Reset, waiting for the next question

        # Handle case where the last message was a question without a final user answer
        if current_question_info and 'answer' not in current_question_info:
             current_question_info['answer'] = "[Interview ended before answer]"
             qa_pairs.append(current_question_info)
             logger.info(f"Interview {interview_id}: Last message was a question, marked as ended before answer.")

        # --- Prepare final interview document for saving ---
        user_object_id = None
        try:
            # Convert userId string to ObjectId for DB reference if needed
            # Adjust this based on whether your 'users' collection uses ObjectIds
            # and whether 'interviews' schema expects ObjectId for userId
            user_object_id = ObjectId(user_id)
        except Exception as e:
            logger.error(f"Invalid userId format '{user_id}' for interview {interview_id}. Cannot convert to ObjectId. Error: {e}")
            # Clean up memory anyway
            del interviews[interview_id]
            return jsonify({'error': 'Invalid user ID format, cannot save interview.'}), 400

        interview_data = {
            'interviewId': interview_id, # Use the string UUID as the primary identifier maybe? Or use DB ObjectId? Check schema.
            'userId': user_object_id, # Reference to the user document
            'userName': user_name,
            'date': interview_state.get('startTime', get_utc_now()), # Use start time if available
            'endDate': get_utc_now(), # Add end time
            'finalScore': final_score,
            'status': 'completed',
            'questions': qa_pairs, # Structured Q&A
            'conversationHistory': conversation_history_db # Full history for reference
        }

        # --- Save to Database ---
        logger.debug(f"Attempting to save interview {interview_id} data to database.")
        save_interview(interview_data) # Assumes this handles insert correctly

        # Optionally save chat history separately if needed, or rely on conversationHistory in interview doc
        # logger.debug(f"Attempting to save chat history for interview {interview_id}.")
        # chat_data = {
        #     'interviewId': interview_id, # Or ObjectId if schema requires
        #     'userId': user_object_id,
        #     'messages': conversation_history_db # Re-map fields if chat schema is different
        # }
        # save_chat_message(chat_data)

        # --- Clean up in-memory state ---
        del interviews[interview_id]
        logger.info(f"Interview {interview_id} ended successfully and saved. Final score: {final_score}. In-memory state cleaned.")

        return jsonify({
            'message': 'Interview ended and saved successfully.',
            'interviewId': interview_id,
            'finalScore': final_score
        }), 200

    except Exception as e:
        logger.error(f"Error during /end-interview for ID {interview_id}: {e}\n{traceback.format_exc()}")
        # Attempt to clean up memory even if DB save failed
        if interview_id and interview_id in interviews:
            try:
                del interviews[interview_id]
                logger.info(f"Cleaned up in-memory state for interview {interview_id} after error during ending process.")
            except Exception as cleanup_err:
                 logger.error(f"Error cleaning up memory for interview {interview_id} after end error: {cleanup_err}")
        return jsonify({'error': 'An unexpected error occurred while ending the interview.'}), 500


@app.route('/health', methods=['GET'])
def health_check():
    """Provides a basic health check endpoint."""
    # Consider adding a quick DB ping here for a more comprehensive check
    # from database import client as db_client # Import client temporarily
    db_status = "unknown"
    # try:
    #    if db_client:
    #        db_client.admin.command('ping')
    #        db_status = "connected"
    #    else:
    #        db_status = "client_not_initialized"
    # except Exception as e:
    #    logger.warning(f"Health check DB ping failed: {e}")
    #    db_status = "disconnected"

    logger.debug("Health check endpoint '/health' accessed.")
    return jsonify({
        "status": "healthy",
        "version": "1.0.0", # Consider updating version automatically
        # "database_status": db_status,
        "timestamp": get_utc_now().isoformat()
        })

# === Main Execution Block ===

# Add this at the bottom of app.py, replacing the current if __name__ == '__main__':

if __name__ == '__main__':
    try:
        # Initialize database connection and schemas ONCE at startup
        logger.info("Application starting up. Initializing database...")
        
        # Add more robust error handling and retry logic for database connection
        max_retries = 3
        retry_count = 0
        db_initialized = False
        
        while retry_count < max_retries and not db_initialized:
            try:
                if initialize_database():
                    db_initialized = True
                    logger.info("Database successfully initialized!")
                else:
                    retry_count += 1
                    logger.warning(f"Database initialization failed. Retry {retry_count}/{max_retries}...")
                    time.sleep(2)  # Wait 2 seconds before retry
            except Exception as db_error:
                retry_count += 1
                logger.error(f"Database initialization error: {db_error}. Retry {retry_count}/{max_retries}...")
                time.sleep(2)  # Wait 2 seconds before retry
        
        if not db_initialized:
            logger.critical("CRITICAL: Database initialization failed after multiple attempts. Please check MongoDB connection and configuration in .env and database.py. Application cannot start.")
            sys.exit(1)  # Exit if DB connection fails

        # Start Flask development server
        port = int(os.getenv("PORT", 5000))  # Allow port configuration via environment variable
        debug_mode = os.getenv("FLASK_DEBUG", "True").lower() == "true"  # Allow debug mode config

        logger.info(f"Starting Flask application on host 0.0.0.0 port {port} (Debug: {debug_mode})...")
        app.run(
            host='0.0.0.0',    # Listen on all available network interfaces
            port=port,
            debug=debug_mode,  # Enable debug mode (includes auto-reloader)
            use_reloader=debug_mode  # Disable reloader in production
        )
    except ValueError as ve:  # Catch specific startup errors like missing keys
        logger.critical(f"Configuration error during startup: {ve}", exc_info=True)
        sys.exit(1)
    except Exception as e:
        logger.critical(f"Application failed to start: {e}", exc_info=True)
        sys.exit(1)