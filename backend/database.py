# backend/database.py
from pymongo import MongoClient
from pymongo.server_api import ServerApi
import os
from dotenv import load_dotenv
import logging
import atexit # Import atexit here
from bson import ObjectId
from datetime import datetime
import logging
# Setup logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# --- Globals for the single client and db instance ---
client = None
db = None
users_collection = None
resumes_collection = None
interviews_collection = None
chats_collection = None
# --- End Globals ---

# Get MongoDB connection string (keep this)
MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017/resumeparser") # Added default for safety

def connect_db():
    """Creates the single MongoDB client and db connection."""
    global client, db, users_collection, resumes_collection, interviews_collection, chats_collection

    if client: # Avoid reconnecting if already connected
        return client, db

    try:
        logger.info(f"Attempting to connect to MongoDB at {MONGODB_URI}...")
        # Extract database name from URI for later use
        db_name = MONGODB_URI.split('/')[-1]
        logger.info(f"Will use database: {db_name}")
        
        client = MongoClient(
            MONGODB_URI, 
            server_api=ServerApi('1'), 
            serverSelectionTimeoutMS=10000,
            connectTimeoutMS=10000,
            socketTimeoutMS=10000
        )
        
        # Log server selection info
        logger.info("Server selection starting...")
        client.admin.command('ping')
        logger.info("Successfully connected to MongoDB!")
        
        # Use database name from URI
        db = client[db_name]
        logger.info(f"Using database: {db_name}")

        # Assign collections AFTER successful connection
        users_collection = db.users
        resumes_collection = db.resumes
        interviews_collection = db.interviews
        chats_collection = db.chats
        logger.info("Collections initialized")

        return client, db
    except Exception as e:
        logger.error(f"Failed to connect to MongoDB: {e}")
        logger.error(f"Connection error details: {type(e).__name__}")
        client = None # Ensure client is None if connection failed
        db = None
        raise # Re-raise the exception to signal failure

def close_db_connection():
    """Closes the MongoDB connection."""
    global client
    if client:
        client.close()
        logger.info("MongoDB connection closed.")

# Register the close function to run on exit
atexit.register(close_db_connection)


# Ensure collections exist (Check if db exists first)
def ensure_collections_exist():
    """Create collections if they don't exist"""
    if not db:
        logger.error("Database not connected. Cannot ensure collections.")
        raise Exception("Database not connected")
    try:
        collections = ['users', 'resumes', 'interviews', 'chats']
        existing_collections = db.list_collection_names()

        for collection in collections:
            if collection not in existing_collections:
                db.create_collection(collection)
                logger.info(f"Created collection: {collection}")
    except Exception as e:
        logger.error(f"Error creating collections: {e}")
        raise

# Apply schema validations (Check if db exists first)
def apply_schema_validations():
    """Apply schema validations to all collections"""
    if not db:
        logger.error("Database not connected. Cannot apply schemas.")
        raise Exception("Database not connected")
    try:
        # --- Users Collection (ensure it exists before collMod) ---
        if 'users' in db.list_collection_names():
            db.command({
                'collMod': 'users',
                'validator': { # Your user schema here
                   '$jsonSchema': {
                        'bsonType': 'object',
                        'required': ['email', 'username', 'password', 'createdAt', 'updatedAt'],
                        'properties': {
                            'email': {'bsonType': 'string'},
                            'username': {'bsonType': 'string'},
                            'password': {'bsonType': 'string'},
                            'createdAt': {'bsonType': 'date'},
                            'updatedAt': {'bsonType': 'date'}
                        }
                    }
                },
                # Optional: Set validationLevel if needed
                # 'validationLevel': 'moderate'
            })
        else:
             logger.warning("Collection 'users' not found, skipping schema validation.")


        # --- Resumes Collection (ensure it exists before collMod) ---
        if 'resumes' in db.list_collection_names():
            db.command({
                'collMod': 'resumes',
                'validator': { # Your resume schema here
                    '$jsonSchema': {
                        'bsonType': 'object',
                        'required': ['userId', 'fileName', 'fileUrl', 'parsedData', 'uploadedAt'],
                        'properties': {
                            'userId': {'bsonType': 'objectId'},
                            'fileName': {'bsonType': 'string'},
                            'fileUrl': {'bsonType': 'string'},
                            'parsedData': {
                                'bsonType': 'object',
                                'properties': {
                                    'skills': {'bsonType': 'array', 'items': {'bsonType': 'string'}},
                                    'experience': {'bsonType': 'array', 'items': {'bsonType': 'object'}},
                                    'projects': {'bsonType': 'array', 'items': {'bsonType': 'object'}},
                                    'education': {'bsonType': 'array', 'items': {'bsonType': 'object'}}
                                 }
                             },
                            'uploadedAt': {'bsonType': 'date'}
                        }
                    }
                }
            })
        else:
            logger.warning("Collection 'resumes' not found, skipping schema validation.")

        # --- Interviews Collection (ensure it exists before collMod) ---
        if 'interviews' in db.list_collection_names():
             db.command({
                'collMod': 'interviews',
                 'validator': { # Your interview schema here
                    '$jsonSchema': {
                        'bsonType': 'object',
                        'required': ['interviewId', 'userName', 'date', 'status', 'questions', 'conversationHistory'],
                        'properties': {
                            'interviewId': {'bsonType': 'string'},
                            'userName': {'bsonType': 'string'},
                            'date': {'bsonType': 'date'},
                            'finalScore': {'bsonType': ['int', 'null']}, # Allow null if not always present
                            'status': {'bsonType': 'string'},
                            'questions': {
                                'bsonType': 'array',
                                'items': {
                                    'bsonType': 'object',
                                    'required': ['question', 'answer', 'timestamp'],
                                    'properties': {
                                        'question': {'bsonType': 'string'},
                                        'answer': {'bsonType': 'string'},
                                        'score': {'bsonType': ['int', 'null']}, # Allow null
                                        'timestamp': {'bsonType': 'date'}
                                    }
                                }
                            },
                            'conversationHistory': {
                                'bsonType': 'array',
                                'items': {
                                    'bsonType': 'object',
                                    'required': ['type', 'content', 'timestamp'],
                                    'properties': {
                                        'type': {'bsonType': 'string'},
                                        'content': {'bsonType': 'string'},
                                        'timestamp': {'bsonType': 'date'},
                                        'score': {'bsonType': ['int', 'null']} # Allow null
                                    }
                                }
                            }
                         }
                     }
                 }
             })
        else:
             logger.warning("Collection 'interviews' not found, skipping schema validation.")

        # --- Chats Collection (ensure it exists before collMod) ---
        if 'chats' in db.list_collection_names():
            db.command({
                'collMod': 'chats',
                 'validator': { # Your chat schema here
                    '$jsonSchema': {
                        'bsonType': 'object',
                        'required': ['userId', 'interviewId', 'messages'],
                        'properties': {
                            'userId': {'bsonType': 'objectId'},
                            'interviewId': {'bsonType': ['objectId', 'string']}, # Allow string if interviewId might be string
                            'messages': {
                                'bsonType': 'array',
                                'items': {
                                    'bsonType': 'object',
                                    'required': ['sender', 'content', 'timestamp'],
                                    'properties': {
                                        'sender': {'bsonType': 'string'},
                                        'content': {'bsonType': 'string'},
                                        'timestamp': {'bsonType': 'date'}
                                    }
                                 }
                             }
                        }
                     }
                }
            })
        else:
             logger.warning("Collection 'chats' not found, skipping schema validation.")

        logger.info("Applied schema validations successfully (where applicable)!")
    except Exception as e:
        logger.error(f"Error applying schema validations: {e}")
        # Decide if you want to raise the error or just log it
        # raise

# --- Helper Functions --- 
# Adding the missing functions that app.py is trying to import

def save_interview(interview_data):
    """Save a new interview document to the database"""
    if not interviews_collection: 
        raise Exception("DB not initialized")
    try:
        return interviews_collection.insert_one(interview_data)
    except Exception as e:
        logger.error(f"Error saving interview: {e}")
        raise

def get_interview(interview_id):
    """Retrieve a single interview by ID"""
    if not interviews_collection:
        raise Exception("DB not initialized")
    try:
        # Handle both string and ObjectId types for interview_id
        if isinstance(interview_id, str) and len(interview_id) == 24:
            try:
                # Try to convert to ObjectId if it looks like one
                obj_id = ObjectId(interview_id)
                # First try to find by ObjectId
                result = interviews_collection.find_one({"_id": obj_id})
                if result:
                    return result
            except:
                pass
        
        # If above failed or id isn't ObjectId format, try as string interviewId
        return interviews_collection.find_one({"interviewId": interview_id})
    except Exception as e:
        logger.error(f"Error getting interview {interview_id}: {e}")
        raise

def get_user_interviews(user_id):
    """Retrieve all interviews for a specific user"""
    if not interviews_collection:
        raise Exception("DB not initialized")
    try:
        # Convert string ID to ObjectId if needed
        if isinstance(user_id, str):
            user_id = ObjectId(user_id)
        
        cursor = interviews_collection.find({"userId": user_id})
        return list(cursor)  # Convert cursor to list
    except Exception as e:
        logger.error(f"Error getting interviews for user {user_id}: {e}")
        raise

def update_interview_status(interview_id, status):
    """Update the status of an interview"""
    if not interviews_collection:
        raise Exception("DB not initialized")
    try:
        # Try to find by interviewId field first
        result = interviews_collection.update_one(
            {"interviewId": interview_id},
            {"$set": {"status": status, "updatedAt": datetime.now()}}
        )
        
        if result.matched_count == 0:
            # If no match by interviewId, try with _id if it looks like an ObjectId
            if len(interview_id) == 24:
                try:
                    obj_id = ObjectId(interview_id)
                    result = interviews_collection.update_one(
                        {"_id": obj_id},
                        {"$set": {"status": status, "updatedAt": datetime.now()}}
                    )
                except:
                    pass
        
        return result
    except Exception as e:
        logger.error(f"Error updating interview status for {interview_id}: {e}")
        raise

def save_resume(resume_data):
    """Save a resume document to the database"""
    if not resumes_collection:
        raise Exception("DB not initialized")
    try:
        return resumes_collection.insert_one(resume_data)
    except Exception as e:
        logger.error(f"Error saving resume: {e}")
        raise

def get_user_resumes(user_id):
    """Retrieve all resumes for a specific user"""
    if not resumes_collection:
        raise Exception("DB not initialized")
    try:
        # Convert string ID to ObjectId if needed
        if isinstance(user_id, str):
            user_id = ObjectId(user_id)
            
        cursor = resumes_collection.find({"userId": user_id})
        return list(cursor)  # Convert cursor to list
    except Exception as e:
        logger.error(f"Error getting resumes for user {user_id}: {e}")
        raise

def create_user(user_data):
    """Create a new user in the database"""
    if not users_collection:
        raise Exception("DB not initialized")
    
    # Ensure timestamps are added
    if 'createdAt' not in user_data:
        user_data['createdAt'] = datetime.now()
    if 'updatedAt' not in user_data:
        user_data['updatedAt'] = datetime.now()
        
    try:
        return users_collection.insert_one(user_data)
    except Exception as e:
        logger.error(f"Error creating user: {e}")
        raise

def get_user_by_email(email):
    """Retrieve a user by email address"""
    if not users_collection:
        raise Exception("DB not initialized")
    try:
        return users_collection.find_one({"email": email})
    except Exception as e:
        logger.error(f"Error getting user by email {email}: {e}")
        raise

def save_chat_message(chat_data):
    """Save chat message(s) to the database.
    This will either create a new chat document or update an existing one."""
    if not chats_collection:
        raise Exception("DB not initialized")
        
    try:
        # Check if a chat document already exists for this interview
        existing_chat = chats_collection.find_one({
            "userId": chat_data.get("userId"),
            "interviewId": chat_data.get("interviewId")
        })
        
        if existing_chat:
            # Update existing chat with new messages
            return chats_collection.update_one(
                {"_id": existing_chat["_id"]},
                {"$push": {"messages": {"$each": chat_data.get("messages", [])}}}
            )
        else:
            # Create new chat document
            return chats_collection.insert_one(chat_data)
    except Exception as e:
        logger.error(f"Error saving chat message: {e}")
        raise

def get_interview_chat(interview_id):
    """Retrieve the chat history for a specific interview"""
    if not chats_collection:
        raise Exception("DB not initialized")
    try:
        return chats_collection.find_one({"interviewId": interview_id})
    except Exception as e:
        logger.error(f"Error getting chat for interview {interview_id}: {e}")
        raise

# Update the main initialization function
def initialize_database():
    """Initialize database connection, collections, and schemas"""
    global db # Ensure we are modifying the global db
    try:
        # Connect and ping
        _, db = connect_db() # Updates global client and db
        if not db:
             raise Exception("Database connection failed during initialization")

        # Create collections if they don't exist
        ensure_collections_exist()

        # Apply schema validations
        apply_schema_validations()

        logger.info("Database initialized successfully!")
        return True
    except Exception as e:
        logger.error(f"Database initialization failed: {e}")
        # Close connection if initialization failed halfway
        close_db_connection()
        return False