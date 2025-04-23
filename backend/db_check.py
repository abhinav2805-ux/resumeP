# db_check.py
# Simple script to test MongoDB connection independent of the main application

from pymongo import MongoClient
from pymongo.server_api import ServerApi
import os
from dotenv import load_dotenv
import sys
import time

# Load environment variables
load_dotenv()

# Get MongoDB connection string
MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017/resumeparser")

def test_mongodb_connection():
    """Test connection to MongoDB and print detailed diagnostics"""
    print(f"Attempting to connect to MongoDB at: {MONGODB_URI}")
    print(f"If using localhost, ensure MongoDB server is running.")
    
    try:
        # Create a new client and connect to the server
        client = MongoClient(
            MONGODB_URI,
            server_api=ServerApi('1'),
            serverSelectionTimeoutMS=5000,
            connectTimeoutMS=5000,
            socketTimeoutMS=5000
        )
        
        # Send a ping to confirm a successful connection
        client.admin.command('ping')
        
        # Get server info
        server_info = client.server_info()
        
        print("MongoDB connection successful!")
        print(f"MongoDB version: {server_info.get('version', 'Unknown')}")
        
        # List available databases
        databases = client.list_database_names()
        print(f"Available databases: {', '.join(databases)}")
        
        # Check for our specific database
        db_name = MONGODB_URI.split('/')[-1]  # Extract DB name from URI
        if db_name in databases:
            print(f"Target database '{db_name}' exists.")
            
            # Connect to our db and list collections
            db = client[db_name]
            collections = db.list_collection_names()
            print(f"Collections in '{db_name}': {', '.join(collections) if collections else 'No collections'}")
        else:
            print(f"Target database '{db_name}' does not exist yet. It will be created when needed.")
        
        client.close()
        return True
        
    except Exception as e:
        print(f"MongoDB connection failed: {e}")
        
        # Provide common troubleshooting advice
        if "localhost" in MONGODB_URI:
            print("\nTroubleshooting tips for localhost connection:")
            print("1. Ensure MongoDB service is running: 'mongod' or check system services")
            print("2. Check if MongoDB is listening on default port (27017)")
            print("3. Try connecting with MongoDB Compass to verify server is accessible")
        else:
            print("\nTroubleshooting tips for remote connection:")
            print("1. Check if IP address/hostname is correct")
            print("2. Verify network allows connection (firewalls, VPN settings)")
            print("3. Confirm username/password are correct if using authentication")
            print("4. Check if the MongoDB instance requires SSL/TLS connection")
        
        return False

if __name__ == "__main__":
    success = test_mongodb_connection()
    if not success:
        sys.exit(1)  # Exit with error code if connection failed