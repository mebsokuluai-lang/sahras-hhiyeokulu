#!/usr/bin/env python3
"""
Migration Script: askeri_haberler_projesi_debug_4 -> okulmebs
Copies all collections from source DB to target DB.
Source DB will NOT be deleted.
Run this script once before deploying multi-DB architecture.
"""

from pymongo import MongoClient
from datetime import datetime

# MongoDB Configuration
MONGO_CONNECTION_STRING = "mongodb+srv://aliaribas:aliaribas@airsoft1.q6eejuz.mongodb.net/?retryWrites=true&w=majority&appName=airsoft1"
SOURCE_DB_NAME = "askeri_haberler_projesi_debug_4"
TARGET_DB_NAME = "okulmebs"

def migrate_collection(source_db, target_db, collection_name):
    """Copy all documents from source collection to target collection"""
    source_collection = source_db[collection_name]
    target_collection = target_db[collection_name]
    
    # Get all documents from source
    documents = list(source_collection.find({}))
    
    if not documents:
        print(f"  - {collection_name}: No documents to copy (empty collection)")
        return 0
    
    # Check if target collection already has documents
    existing_count = target_collection.count_documents({})
    if existing_count > 0:
        print(f"  - {collection_name}: Target already has {existing_count} documents. Skipping to avoid duplicates.")
        return 0
    
    # Insert all documents into target
    result = target_collection.insert_many(documents)
    copied_count = len(result.inserted_ids)
    print(f"  - {collection_name}: Copied {copied_count} documents")
    return copied_count

def main():
    print("=" * 60)
    print("MIGRATION SCRIPT")
    print(f"Source: {SOURCE_DB_NAME}")
    print(f"Target: {TARGET_DB_NAME}")
    print("=" * 60)
    print(f"Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print()
    
    # Connect to MongoDB
    try:
        client = MongoClient(MONGO_CONNECTION_STRING, serverSelectionTimeoutMS=10000)
        client.server_info()  # Test connection
        print("MongoDB connection successful!")
    except Exception as e:
        print(f"ERROR: Failed to connect to MongoDB: {e}")
        return
    
    source_db = client[SOURCE_DB_NAME]
    target_db = client[TARGET_DB_NAME]
    
    # Get all collection names from source DB
    collection_names = source_db.list_collection_names()
    
    if not collection_names:
        print(f"WARNING: No collections found in {SOURCE_DB_NAME}")
        return
    
    print(f"\nFound {len(collection_names)} collections in source DB:")
    for name in collection_names:
        print(f"  - {name}")
    
    print("\nStarting migration...")
    print("-" * 40)
    
    total_copied = 0
    for collection_name in collection_names:
        try:
            copied = migrate_collection(source_db, target_db, collection_name)
            total_copied += copied
        except Exception as e:
            print(f"  - {collection_name}: ERROR - {e}")
    
    print("-" * 40)
    print(f"\nMigration complete!")
    print(f"Total documents copied: {total_copied}")
    print(f"Source DB ({SOURCE_DB_NAME}) preserved - NOT deleted")
    print(f"Finished at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 60)
    
    # Close connection
    client.close()

if __name__ == "__main__":
    main()

