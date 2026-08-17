#!/usr/bin/env python3
"""
Multi-DB News Processing Service
Categorizes, tags, summarizes, translates and filters news using Gemini AI
Processes all databases starting with 'okul' prefix
Each database uses its own API keys from the 'keys' collection
"""

import json
import time
import random
from datetime import datetime, timedelta
import google.generativeai as genai
from pymongo import MongoClient

# ============================================================================
# GLOBAL CONFIGURATION VARIABLES
# ============================================================================

# Gemini Model Configuration
GEMINI_MODEL = "gemini-2.5-flash"

# MongoDB Configuration
MONGODB_URI = "mongodb+srv://aliaribas:aliaribas@airsoft1.q6eejuz.mongodb.net/?retryWrites=true&w=majority&appName=airsoft1"
MONGODB_COLLECTION = "haberler"  # Main news collection
MONGODB_FILTRE_TAG = "filtre_tag"
MONGODB_FILTRE_ORNEK = "filtre_ornek_haberler"
MONGODB_FILTRE_TRANSLATE = "filtre_translate_keywords"
MONGODB_KEYS = "keys"  # API keys collection
DB_PREFIX = "okul"  # Will process all databases starting with this prefix

# Preferred topics (news related to these will be marked as preferred=true)
PREFERRED_TOPICS = [
    "electronic warfare",
    "communications",
    "cyber",
    "artificial intelligence",
    "AI"
]

# Unwanted topics (news about these will be marked as preferred=false)
UNWANTED_TOPICS = [
    "command and control"
]

# Additional filtering criteria
MIN_INTEREST_SCORE = 6  # Minimum interest score (1-10) for preferred news
MAX_RETRY_COUNT = 5  # Maximum retry attempts before marking as permanently failed
API_CALL_DELAY = 5  # Delay in seconds between API calls to avoid rate limiting

# Loop configuration
LOOP_ENABLED = False  # Set to False to run once
LOOP_SLEEP_MINUTES = 10  # Sleep time between loop iterations

# Global MongoDB client
mongo_client = None

# ============================================================================
# DATABASE FUNCTIONS
# ============================================================================

def get_mongo_client():
    """Get or create MongoDB client"""
    global mongo_client
    if mongo_client is None:
        try:
            mongo_client = MongoClient(MONGODB_URI, serverSelectionTimeoutMS=10000)
            mongo_client.server_info()  # Test connection
            print("MongoDB connection established successfully")
        except Exception as e:
            print(f"[ERROR] MongoDB connection failed: {type(e).__name__}: {e}")
            mongo_client = None
    return mongo_client


def get_all_okul_databases():
    """Get all database names starting with 'okul'"""
    client = get_mongo_client()
    if client is None:
        return []
    
    try:
        all_dbs = client.list_database_names()
        okul_dbs = [db for db in all_dbs if db.startswith(DB_PREFIX)]
        print(f"Found {len(okul_dbs)} databases with prefix '{DB_PREFIX}': {okul_dbs}")
        return okul_dbs
    except Exception as e:
        print(f"[ERROR] Failed to list databases: {e}")
        return []


def get_db_reference(db_name):
    """Get database reference for a specific database name"""
    client = get_mongo_client()
    if client is None:
        return None
    try:
        return client[db_name]
    except Exception as e:
        print(f"[ERROR] Error getting database {db_name}: {type(e).__name__}: {e}")
        return None


def get_random_gemini_key(db):
    """Get a random active Gemini API key from the database's keys collection"""
    if db is None:
        print("[WARNING] Database not available for key lookup")
        return None
    
    try:
        keys_collection = db[MONGODB_KEYS]
        active_keys = list(keys_collection.find({'type': 'gemini', 'active': True}))
        
        if not active_keys:
            print("[WARNING] No active Gemini API keys found in this database")
            return None
        
        selected_key = random.choice(active_keys)
        key_name = selected_key.get('name', 'Unknown')
        print(f"  Using Gemini key: {key_name}")
        return selected_key.get('api_key')
    except Exception as e:
        print(f"[ERROR] Error getting Gemini key: {type(e).__name__}: {e}")
        return None


def load_filter_tags(db):
    """Load filter tags from MongoDB with error handling"""
    if db is None:
        print("[WARNING] Database not available, skipping filter tags load")
        return []
    try:
        collection = db[MONGODB_FILTRE_TAG]
        tags = list(collection.find({}))
        # Validate tags structure
        valid_tags = []
        for tag in tags:
            if isinstance(tag, dict) and tag.get('tag'):
                valid_tags.append(tag)
        return valid_tags
    except Exception as e:
        print(f"[ERROR] Error loading filter tags: {type(e).__name__}: {e}")
        return []


def load_example_news(db):
    """Load example news for AI guidance with error handling"""
    if db is None:
        print("[WARNING] Database not available, skipping example news load")
        return []
    try:
        collection = db[MONGODB_FILTRE_ORNEK]
        examples = list(collection.find({}))
        # Validate examples structure
        valid_examples = []
        for ex in examples:
            if isinstance(ex, dict) and (ex.get('title') or ex.get('content')):
                valid_examples.append(ex)
        return valid_examples
    except Exception as e:
        print(f"[ERROR] Error loading example news: {type(e).__name__}: {e}")
        return []


def load_translation_keywords(db):
    """Load preferred translation keyword pairs with error handling"""
    if db is None:
        print("[WARNING] Database not available, skipping translation keywords load")
        return []
    try:
        collection = db[MONGODB_FILTRE_TRANSLATE]
        keywords = list(collection.find({}))
        # Validate keyword pairs
        valid_keywords = []
        for kw in keywords:
            if isinstance(kw, dict) and kw.get('english') and kw.get('turkish'):
                valid_keywords.append(kw)
        return valid_keywords
    except Exception as e:
        print(f"[ERROR] Error loading translation keywords: {type(e).__name__}: {e}")
        return []


def get_unprocessed_news(db):
    """Get news items that haven't been processed yet with error handling"""
    if db is None:
        print("[ERROR] Database not available, cannot get unprocessed news")
        return []
    try:
        collection = db[MONGODB_COLLECTION]
        # Find news without 'processed' field or processed=false
        unprocessed = list(collection.find({
            "$or": [
                {"processed": {"$exists": False}},
                {"processed": False}
            ]
        }))
        # Validate each news item
        valid_news = []
        for news in unprocessed:
            if isinstance(news, dict) and news.get('_id'):
                valid_news.append(news)
            else:
                print(f"[WARNING] Skipping invalid news item: {news}")
        return valid_news
    except Exception as e:
        print(f"[ERROR] Error getting unprocessed news: {type(e).__name__}: {e}")
        return []


def mark_news_as_processed(db, news_id, error_message=None):
    """Mark a news item as processed in MongoDB with optional error message"""
    if db is None:
        print("[ERROR] Database not available, cannot mark news as processed")
        return False
    if not news_id:
        print("[ERROR] No news_id provided for marking as processed")
        return False
    try:
        collection = db[MONGODB_COLLECTION]
        update_data = {
            "processed": True,
            "processed_at": datetime.utcnow()
        }
        if error_message:
            update_data["processing_error"] = error_message
        collection.update_one(
            {"_id": news_id},
            {"$set": update_data}
        )
        return True
    except Exception as e:
        print(f"[ERROR] Error marking news as processed: {type(e).__name__}: {e}")
        return False


def update_news_with_analysis(db, news_id, analysis_data):
    """Update news item with analysis results with error handling"""
    if db is None:
        print("[ERROR] Database not available, cannot update news")
        return False
    if not news_id:
        print("[ERROR] No news_id provided for update")
        return False
    if not analysis_data or not isinstance(analysis_data, dict):
        print("[ERROR] Invalid analysis_data provided for update")
        return False
    try:
        collection = db[MONGODB_COLLECTION]
        collection.update_one(
            {"_id": news_id},
            {"$set": analysis_data}
        )
        return True
    except Exception as e:
        print(f"[ERROR] Error updating news: {type(e).__name__}: {e}")
        return False


def translate_with_keywords(text, translation_keywords):
    """Apply preferred translation keywords to text with error handling"""
    if not text:
        return ''
    if not translation_keywords:
        return text
    
    try:
        import re
        translated_text = str(text)
        for keyword_pair in translation_keywords:
            try:
                english = keyword_pair.get('english', '')
                turkish = keyword_pair.get('turkish', '')
                if english and turkish:
                    # Replace whole word matches (case-insensitive)
                    pattern = r'\b' + re.escape(english) + r'\b'
                    translated_text = re.sub(pattern, turkish, translated_text, flags=re.IGNORECASE)
            except Exception as e:
                # Skip this keyword pair but continue with others
                continue
        return translated_text
    except Exception as e:
        print(f"[WARNING] Error in translate_with_keywords: {type(e).__name__}: {e}")
        return str(text) if text else ''


def contains_gemini_error(text):
    """Check if text contains Gemini API error patterns"""
    if not text or not isinstance(text, str):
        return False
    
    error_patterns = [
        "[Translation error:",
        "[Translation failed",
        "[Analysis failed",
        "ResourceExhausted",
        "429",
        "quota exceeded",
        "rate limit",
        "exceeded your current quota",
    ]
    
    text_lower = text.lower()
    for pattern in error_patterns:
        if pattern.lower() in text_lower:
            return True
    return False


def translate_to_turkish(text, translation_keywords, gemini_api_key, max_retries=5):
    """Translate text to Turkish using Gemini API with retry logic and error handling"""
    import re
    
    if not text:
        return "[No text to translate]"
    
    if not gemini_api_key:
        return "[No Gemini API key available]"
    
    # Ensure text is a string
    if not isinstance(text, str):
        try:
            text = str(text)
        except Exception:
            return "[Invalid text format]"
    
    # Truncate very long texts
    max_text_length = 5000
    if len(text) > max_text_length:
        text = text[:max_text_length] + "..."
    
    for attempt in range(max_retries):
        try:
            # Configure Gemini with the provided API key
            genai.configure(api_key=gemini_api_key)
            model = genai.GenerativeModel(GEMINI_MODEL)
            
            # Prepare translation guidance with keywords
            keyword_guidance = ""
            if translation_keywords:
                try:
                    keyword_pairs = [f"{kw.get('english', '')} -> {kw.get('turkish', '')}" 
                                   for kw in translation_keywords[:20] if kw.get('english') and kw.get('turkish')]
                    if keyword_pairs:
                        keyword_guidance = f"\n\nPreferred technical translations:\n" + "\n".join(keyword_pairs)
                except Exception:
                    keyword_guidance = ""
            
            prompt = f"""Translate the following text to Turkish. Use professional military/defense terminology.{keyword_guidance}

Only return the translation, nothing else:

{text}"""
            
            response = model.generate_content(prompt)
            
            if response and response.text:
                translated = response.text.strip()
                # Post-process with keyword replacements for accuracy
                translated = translate_with_keywords(translated, translation_keywords)
                return translated
            else:
                print(f"[WARNING] Empty response from Gemini on translation attempt {attempt + 1}/{max_retries}")
                if attempt < max_retries - 1:
                    retry_delay = 5 * (attempt + 1)  # Exponential backoff: 5, 10, 15 seconds
                    print(f"  Retrying in {retry_delay} seconds...")
                    time.sleep(retry_delay)
                    continue
                return f"[Translation failed: Empty response]"
                
        except Exception as e:
            error_msg = str(e)
            error_type = type(e).__name__
            
            # Check if it's a quota/rate limit error (429)
            is_quota_error = "429" in error_msg or "quota" in error_msg.lower() or "rate limit" in error_msg.lower()
            
            print(f"[WARNING] Translation attempt {attempt + 1}/{max_retries} failed: {error_type}: {error_msg[:200]}")
            
            if attempt < max_retries - 1:
                # Try to extract retry delay from error message
                retry_delay = 5 * (attempt + 1)  # Default exponential backoff: 5, 10, 15 seconds
                
                if is_quota_error:
                    # Try to parse the suggested retry delay from the error message
                    # Example: "Please retry in 31.668191075s"
                    match = re.search(r'retry in (\d+(?:\.\d+)?)\s*s', error_msg, re.IGNORECASE)
                    if match:
                        suggested_delay = float(match.group(1))
                        retry_delay = max(retry_delay, int(suggested_delay) + 2)  # Use suggested delay + 2 seconds buffer
                    else:
                        retry_delay = 35  # Default to 35 seconds for quota errors if we can't parse the delay
                    # Add extra 15 seconds for quota errors
                    retry_delay += 15
                    print(f"  Quota exceeded. Waiting {retry_delay} seconds before retry...")
                else:
                    print(f"  Retrying in {retry_delay} seconds...")
                
                time.sleep(retry_delay)
                continue
            else:
                # Final attempt failed
                print(f"[ERROR] Translation failed after {max_retries} attempts. Marking as failed.")
                return f"[Translation error: {error_type}]"
    
    return "[Translation failed]"


def analyze_news_with_gemini(news_item, filter_tags, example_news, translation_keywords, gemini_api_key, max_retries=5):
    """
    Use Gemini AI to analyze a news item with retry logic and comprehensive error handling.
    Returns:
    - category
    - relevant tags
    - summary (English)
    - summary (Turkish)
    - preferred status
    - interest score (influenced by filter_tags and example_news)
    """
    
    # Validate news_item
    if not news_item or not isinstance(news_item, dict):
        print("[ERROR] Invalid news_item provided for analysis")
        return None
    
    if not gemini_api_key:
        print("[ERROR] No Gemini API key provided for analysis")
        return None
    
    title = news_item.get('title_english', '') or ''
    content = news_item.get('content_english', '') or ''
    
    if not title and not content:
        print("[ERROR] News item has no title or content to analyze")
        return None
    
    response_text = ""
    
    for attempt in range(max_retries):
        try:
            # Configure Gemini with provided API key
            genai.configure(api_key=gemini_api_key)
            model = genai.GenerativeModel(GEMINI_MODEL)
            
            # Build tag guidance with explicit preferred field values (with error handling)
            tag_guidance = ""
            try:
                if filter_tags:
                    preferred_tags = [tag.get('tag', '') for tag in filter_tags if tag.get('preferred', False) and tag.get('tag')]
                    non_preferred_tags = [tag.get('tag', '') for tag in filter_tags if not tag.get('preferred', False) and tag.get('tag')]
                    
                    if preferred_tags:
                        tag_guidance += f"\n\n🔹 PREFERRED TAGS (preferred=true) - Articles with these tags should get HIGH interest_score (7-10):"
                        tag_guidance += f"\n   {', '.join(preferred_tags[:20])}"  # Limit to 20
                    if non_preferred_tags:
                        tag_guidance += f"\n\n🔸 NON-PREFERRED TAGS (preferred=false) - Articles with these tags should get LOW interest_score (1-5):"
                        tag_guidance += f"\n   {', '.join(non_preferred_tags[:20])}"  # Limit to 20
            except Exception as e:
                print(f"[WARNING] Error building tag guidance: {e}")
                tag_guidance = ""
            
            # Build example guidance with more context (with error handling)
            example_guidance = ""
            try:
                if example_news:
                    preferred_examples = [ex for ex in example_news if ex.get('preferred', False)][:5]
                    non_preferred_examples = [ex for ex in example_news if not ex.get('preferred', False)][:5]
                    
                    if preferred_examples:
                        example_guidance += "\n\n✅ PREFERRED NEWS EXAMPLES (preferred=true) - Give articles similar to these HIGH interest_score (7-10):"
                        for idx, ex in enumerate(preferred_examples, 1):
                            ex_title = str(ex.get('title', 'N/A'))[:120]
                            content_snippet = str(ex.get('content', ''))[:150]
                            example_guidance += f"\n   {idx}. Title: {ex_title}"
                            if content_snippet:
                                example_guidance += f"\n      Context: {content_snippet}..."
                    
                    if non_preferred_examples:
                        example_guidance += "\n\n❌ NON-PREFERRED NEWS EXAMPLES (preferred=false) - Give articles similar to these LOW interest_score (1-5):"
                        for idx, ex in enumerate(non_preferred_examples, 1):
                            ex_title = str(ex.get('title', 'N/A'))[:120]
                            content_snippet = str(ex.get('content', ''))[:150]
                            example_guidance += f"\n   {idx}. Title: {ex_title}"
                            if content_snippet:
                                example_guidance += f"\n      Context: {content_snippet}..."
            except Exception as e:
                print(f"[WARNING] Error building example guidance: {e}")
                example_guidance = ""
            
            # Truncate content if too long
            content_truncated = content[:3000] if content else ''
            
            # Prepare the prompt
            prompt = f"""
Analyze the following military/defense news article and provide a JSON response with the following fields:

1. "category": A single main category (e.g., "Electronic Warfare", "Cyber Security", "AI/Technology", "Aviation", "Naval", "Procurement", "Policy", etc.)
2. "tags": An array of 3-5 relevant tags/keywords
3. "summary_english": A concise 2-3 sentence summary in English
4. "interest_score": Rate the article's interest level from 1-10 (consider: technological innovation, strategic importance, uniqueness)
5. "relates_to_preferred_topics": true/false - Does this article relate to: {', '.join(PREFERRED_TOPICS)}?
6. "relates_to_unwanted_topics": true/false - Does this article relate to: {', '.join(UNWANTED_TOPICS)}?

=== SCORING GUIDANCE ===
Use the following filter data to determine the interest_score:
{tag_guidance}
{example_guidance}

=== ARTICLE TO ANALYZE ===
Title: {title}

Content: {content_truncated}

=== SCORING RULES ===
CRITICAL: You MUST use the preferred=true/false field values from the filter data above:

1. Compare article content/topic to PREFERRED TAGS (preferred=true):
   - If article strongly matches → interest_score = 8-10
   - If article somewhat matches → interest_score = 6-7
   
2. Compare article content/topic to NON-PREFERRED TAGS (preferred=false):
   - If article strongly matches → interest_score = 1-3
   - If article somewhat matches → interest_score = 4-5

3. Compare article similarity to PREFERRED NEWS EXAMPLES (preferred=true):
   - Very similar content/topic → interest_score = 8-10
   - Somewhat similar → interest_score = 6-7

4. Compare article similarity to NON-PREFERRED NEWS EXAMPLES (preferred=false):
   - Very similar content/topic → interest_score = 1-3
   - Somewhat similar → interest_score = 4-5

5. If article doesn't match any filter data → interest_score = 5-6 (neutral)

RESPOND ONLY WITH VALID JSON, NO ADDITIONAL TEXT.
"""
            
            # Generate response
            response = model.generate_content(prompt)
            
            if not response or not response.text:
                print(f"[WARNING] Empty response from Gemini on analysis attempt {attempt + 1}/{max_retries}")
                if attempt < max_retries - 1:
                    retry_delay = 5 * (attempt + 1)  # Exponential backoff: 5, 10, 15 seconds
                    print(f"  Retrying in {retry_delay} seconds...")
                    time.sleep(retry_delay)
                    continue
                return None
            
            response_text = response.text.strip()
            
            # Remove markdown code blocks if present
            if response_text.startswith('```json'):
                response_text = response_text[7:]
            if response_text.startswith('```'):
                response_text = response_text[3:]
            if response_text.endswith('```'):
                response_text = response_text[:-3]
            response_text = response_text.strip()
            
            # Parse JSON response
            try:
                analysis = json.loads(response_text)
            except json.JSONDecodeError as json_err:
                print(f"[WARNING] JSON parse error on attempt {attempt + 1}/{max_retries}: {json_err}")
                print(f"[DEBUG] Response was: {response_text[:300]}...")
                if attempt < max_retries - 1:
                    retry_delay = 5 * (attempt + 1)
                    print(f"  Retrying in {retry_delay} seconds...")
                    time.sleep(retry_delay)
                    continue
                return None
            
            # Validate analysis structure
            if not isinstance(analysis, dict):
                print(f"[WARNING] Analysis is not a dict on attempt {attempt + 1}/{max_retries}")
                if attempt < max_retries - 1:
                    retry_delay = 5 * (attempt + 1)
                    print(f"  Retrying in {retry_delay} seconds...")
                    time.sleep(retry_delay)
                    continue
                return None
            
            # Get base interest score with validation
            try:
                interest_score = int(analysis.get('interest_score', 5))
                interest_score = max(1, min(10, interest_score))  # Clamp between 1-10
            except (ValueError, TypeError):
                interest_score = 5
            
            # Adjust interest_score based on filter tags (with error handling)
            try:
                article_tags = analysis.get('tags', [])
                if isinstance(article_tags, list) and filter_tags:
                    for article_tag in article_tags:
                        if not isinstance(article_tag, str):
                            continue
                        for filter_tag in filter_tags:
                            filter_tag_name = filter_tag.get('tag', '')
                            if not filter_tag_name:
                                continue
                            if article_tag.lower() in filter_tag_name.lower() or \
                               filter_tag_name.lower() in article_tag.lower():
                                if filter_tag.get('preferred', False):
                                    interest_score = min(10, interest_score + 1)
                                else:
                                    interest_score = max(1, interest_score - 1)
            except Exception as e:
                print(f"[WARNING] Error adjusting interest score: {e}")
            
            # Determine if news is preferred (with safe access)
            relates_to_preferred = bool(analysis.get('relates_to_preferred_topics', False))
            relates_to_unwanted = bool(analysis.get('relates_to_unwanted_topics', False))
            
            is_preferred = (
                relates_to_preferred and 
                not relates_to_unwanted and 
                interest_score >= MIN_INTEREST_SCORE
            )
            
            # Translate summary to Turkish (with error handling)
            summary_english = analysis.get('summary_english', '') or ''
            try:
                summary_turkish = translate_to_turkish(summary_english, translation_keywords, gemini_api_key)
            except Exception as e:
                print(f"[WARNING] Error translating summary: {e}")
                summary_turkish = "[Translation failed]"
            
            # Ensure tags is a list
            tags = analysis.get('tags', [])
            if not isinstance(tags, list):
                tags = []
            
            return {
                'category': str(analysis.get('category', 'Uncategorized')),
                'tags': tags,
                'summary_english': summary_english,
                'summary_turkish': summary_turkish,
                'interest_score': interest_score,
                'preferred': is_preferred,
                'analysis_metadata': {
                    'relates_to_preferred_topics': relates_to_preferred,
                    'relates_to_unwanted_topics': relates_to_unwanted
                }
            }
            
        except json.JSONDecodeError as e:
            print(f"[ERROR] JSON decode error on attempt {attempt + 1}/{max_retries}: {e}")
            print(f"[DEBUG] Response was: {response_text[:300] if response_text else 'empty'}...")
            if attempt < max_retries - 1:
                retry_delay = 5 * (attempt + 1)
                print(f"  Retrying in {retry_delay} seconds...")
                time.sleep(retry_delay)
                continue
            return None
        except Exception as e:
            import re
            error_msg = str(e)
            error_type = type(e).__name__
            
            # Check if it's a quota/rate limit error (429)
            is_quota_error = "429" in error_msg or "quota" in error_msg.lower() or "rate limit" in error_msg.lower()
            
            print(f"[ERROR] Error analyzing news with Gemini on attempt {attempt + 1}/{max_retries}: {error_type}: {error_msg[:200]}")
            
            if attempt < max_retries - 1:
                # Try to extract retry delay from error message
                retry_delay = 5 * (attempt + 1)  # Default exponential backoff: 5, 10, 15 seconds
                
                if is_quota_error:
                    # Try to parse the suggested retry delay from the error message
                    match = re.search(r'retry in (\d+(?:\.\d+)?)\s*s', error_msg, re.IGNORECASE)
                    if match:
                        suggested_delay = float(match.group(1))
                        retry_delay = max(retry_delay, int(suggested_delay) + 2)  # Use suggested delay + 2 seconds buffer
                    else:
                        retry_delay = 35  # Default to 35 seconds for quota errors
                    # Add extra 15 seconds for quota errors
                    retry_delay += 15
                    print(f"  Quota exceeded. Waiting {retry_delay} seconds before retry...")
                else:
                    print(f"  Retrying in {retry_delay} seconds...")
                
                time.sleep(retry_delay)
                continue
            else:
                print(f"[ERROR] Analysis failed after {max_retries} attempts.")
                return None
    
    return None


def process_single_db(db_name):
    """Process one database - get unprocessed news and analyze them"""
    
    print(f"\n{'='*60}")
    print(f"Processing database: {db_name}")
    print(f"{'='*60}")
    
    # Get database reference
    db = get_db_reference(db_name)
    if db is None:
        print(f"[ERROR] Failed to get database reference for {db_name}")
        return 0
    
    # Get a random Gemini API key for this database
    gemini_api_key = get_random_gemini_key(db)
    if not gemini_api_key:
        print(f"[ERROR] No active Gemini API key found for {db_name}. Skipping.")
        return 0
    
    # Load filter data (with error handling)
    print(f"Loading filter data for {db_name}...")
    try:
        filter_tags = load_filter_tags(db)
    except Exception as e:
        print(f"[WARNING] Error loading filter tags: {e}")
        filter_tags = []
    
    try:
        example_news = load_example_news(db)
    except Exception as e:
        print(f"[WARNING] Error loading example news: {e}")
        example_news = []
    
    try:
        translation_keywords = load_translation_keywords(db)
    except Exception as e:
        print(f"[WARNING] Error loading translation keywords: {e}")
        translation_keywords = []
    
    print(f"  - Filter tags: {len(filter_tags)}")
    print(f"  - Example news: {len(example_news)}")
    print(f"  - Translation keywords: {len(translation_keywords)}")
    
    # Get unprocessed news
    try:
        unprocessed_news = get_unprocessed_news(db)
    except Exception as e:
        print(f"[ERROR] Error getting unprocessed news: {type(e).__name__}: {e}")
        return 0
    
    if not unprocessed_news:
        print(f"[{db_name}] No unprocessed news found.")
        return 0
    
    print(f"\n[{db_name}] Found {len(unprocessed_news)} unprocessed news items.")
    print("\nProcessing news items...\n")
    
    processed_count = 0
    preferred_count = 0
    failed_count = 0
    
    # Process each news item
    for idx, news_item in enumerate(unprocessed_news, 1):
        try:
            # Validate news_item
            if not isinstance(news_item, dict):
                print(f"[{idx}/{len(unprocessed_news)}] [ERROR] Invalid news item (not a dict), skipping")
                failed_count += 1
                continue
            
            news_id = news_item.get('_id')
            if not news_id:
                print(f"[{idx}/{len(unprocessed_news)}] [ERROR] News item has no _id, skipping")
                failed_count += 1
                continue
            
            title = news_item.get('title_english', '') or 'Untitled'
            title_display = title[:60] if len(title) > 60 else title
            print(f"[{idx}/{len(unprocessed_news)}] Processing: {title_display}...")
            
            # Translate title if not already translated
            if not news_item.get('title_turkish'):
                print("  - Translating title...")
                try:
                    news_item['title_turkish'] = translate_to_turkish(
                        news_item.get('title_english', ''), 
                        translation_keywords,
                        gemini_api_key
                    )
                    time.sleep(API_CALL_DELAY)  # Delay between API calls
                except Exception as e:
                    print(f"  [WARNING] Error translating title: {e}")
                    news_item['title_turkish'] = "[Translation failed]"
            
            # Translate content if not already translated
            if not news_item.get('content_turkish'):
                print("  - Translating content...")
                try:
                    news_item['content_turkish'] = translate_to_turkish(
                        news_item.get('content_english', ''), 
                        translation_keywords,
                        gemini_api_key
                    )
                    time.sleep(API_CALL_DELAY)  # Delay between API calls
                except Exception as e:
                    print(f"  [WARNING] Error translating content: {e}")
                    news_item['content_turkish'] = "[Translation failed]"
            
            # Analyze with Gemini
            print("  - Analyzing with AI...")
            try:
                analysis = analyze_news_with_gemini(
                    news_item, 
                    filter_tags, 
                    example_news, 
                    translation_keywords,
                    gemini_api_key
                )
            except Exception as e:
                print(f"  [ERROR] Exception during analysis: {type(e).__name__}: {e}")
                analysis = None
            
            if analysis:
                # Check for Gemini errors in translations/analysis
                has_gemini_error = (
                    contains_gemini_error(news_item.get('title_turkish', '')) or
                    contains_gemini_error(news_item.get('content_turkish', '')) or
                    contains_gemini_error(analysis.get('summary_turkish', ''))
                )
                
                if has_gemini_error:
                    # Treat as failed due to Gemini API error, increment retry count
                    print(f"  ✗ Gemini API error detected in translation/analysis results")
                    failed_count += 1
                    retry_count = news_item.get('retry_count', 0) + 1
                    if retry_count >= MAX_RETRY_COUNT:
                        mark_news_as_processed(db, news_id, error_message=f"Gemini API error after {MAX_RETRY_COUNT} retries")
                        print(f"  ✗ Max retries ({MAX_RETRY_COUNT}) reached, marked as permanently failed")
                    else:
                        update_news_with_analysis(db, news_id, {
                            "retry_count": retry_count,
                            "last_error": "Gemini API error in translation/analysis",
                            "last_error_at": datetime.utcnow()
                        })
                        print(f"  ✗ Will retry later (attempt {retry_count}/{MAX_RETRY_COUNT})")
                else:
                    # Prepare update data
                    try:
                        update_data = {
                            'title_turkish': news_item.get('title_turkish', '[Translation failed]'),
                            'content_turkish': news_item.get('content_turkish', '[Translation failed]'),
                            'category': analysis.get('category', 'Uncategorized'),
                            'tags': analysis.get('tags', []),
                            'summary_english': analysis.get('summary_english', ''),
                            'summary_turkish': analysis.get('summary_turkish', ''),
                            'interest_score': analysis.get('interest_score', 5),
                            'preferred': analysis.get('preferred', False),
                            'analysis_metadata': analysis.get('analysis_metadata', {}),
                            'processed': True,
                            'processed_at': datetime.utcnow()
                        }
                        
                        # Update in MongoDB
                        if update_news_with_analysis(db, news_id, update_data):
                            processed_count += 1
                            tags_display = ', '.join(analysis.get('tags', [])[:3]) if analysis.get('tags') else 'No tags'
                            if analysis.get('preferred'):
                                preferred_count += 1
                                print(f"  ✓ Category: {analysis.get('category', 'N/A')} | Tags: {tags_display} | Interest: {analysis.get('interest_score', 0)}/10 | PREFERRED")
                            else:
                                print(f"  ✓ Category: {analysis.get('category', 'N/A')} | Tags: {tags_display} | Interest: {analysis.get('interest_score', 0)}/10")
                        else:
                            print(f"  ✗ Failed to update in database")
                            failed_count += 1
                    except Exception as e:
                        print(f"  [ERROR] Error preparing/updating data: {type(e).__name__}: {e}")
                        failed_count += 1
                        # Still mark as processed to avoid infinite retry loops
                        mark_news_as_processed(db, news_id, error_message=str(e))
            else:
                print(f"  ✗ Failed to analyze")
                failed_count += 1
                retry_count = news_item.get('retry_count', 0) + 1
                if retry_count >= MAX_RETRY_COUNT:
                    # Max retries reached, mark as permanently failed
                    mark_news_as_processed(db, news_id, error_message=f"Analysis failed after {MAX_RETRY_COUNT} retries")
                    print(f"  ✗ Max retries ({MAX_RETRY_COUNT}) reached, marked as permanently failed")
                else:
                    # Leave for retry, just update retry count
                    update_news_with_analysis(db, news_id, {
                        "retry_count": retry_count,
                        "last_error": "Analysis failed",
                        "last_error_at": datetime.utcnow()
                    })
                    print(f"  ✗ Will retry later (attempt {retry_count}/{MAX_RETRY_COUNT})")
            
            print()
            
        except Exception as e:
            # Catch-all for any unexpected errors processing this news item
            print(f"[{idx}/{len(unprocessed_news)}] [ERROR] Unexpected error: {type(e).__name__}: {e}")
            failed_count += 1
            # Apply retry logic for unexpected errors too
            try:
                if news_item and news_item.get('_id'):
                    retry_count = news_item.get('retry_count', 0) + 1
                    if retry_count >= MAX_RETRY_COUNT:
                        mark_news_as_processed(db, news_item['_id'], error_message=f"Unexpected error after {MAX_RETRY_COUNT} retries: {str(e)}")
                        print(f"  ✗ Max retries ({MAX_RETRY_COUNT}) reached, marked as permanently failed")
                    else:
                        update_news_with_analysis(db, news_item['_id'], {
                            "retry_count": retry_count,
                            "last_error": f"Unexpected error: {str(e)}",
                            "last_error_at": datetime.utcnow()
                        })
                        print(f"  ✗ Will retry later (attempt {retry_count}/{MAX_RETRY_COUNT})")
            except Exception:
                pass
            continue  # Continue to next news item
    
    # Summary
    print("="*60)
    print(f"[{db_name}] Processing complete!")
    print(f"  ✓ Successfully processed: {processed_count}/{len(unprocessed_news)}")
    print(f"  ⭐ Preferred news: {preferred_count}")
    print(f"  📰 Non-preferred news: {processed_count - preferred_count}")
    print(f"  ✗ Failed: {failed_count}")
    print("="*60 + "\n")
    
    return processed_count


def process_all_databases():
    """Process all okul* databases"""
    
    print("\n" + "#"*80)
    print("MULTI-DB NEWS PROCESSOR")
    print(f"Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("#"*80)
    
    # Get all okul* databases
    okul_dbs = get_all_okul_databases()
    
    if not okul_dbs:
        print("[WARNING] No databases found with 'okul' prefix")
        return 0
    
    total_processed = 0
    db_results = {}
    
    # Process each database
    for db_name in okul_dbs:
        try:
            processed = process_single_db(db_name)
            db_results[db_name] = processed
            total_processed += processed
        except Exception as e:
            print(f"[ERROR] Failed to process {db_name}: {type(e).__name__}: {e}")
            db_results[db_name] = -1  # Error indicator
            continue
    
    # Final summary
    print("\n" + "="*80)
    print("MULTI-DB PROCESSING COMPLETE")
    print("="*80)
    for db, count in db_results.items():
        status = f"{count} news processed" if count >= 0 else "ERROR"
        print(f"  {db}: {status}")
    print(f"\nTotal news processed across all databases: {total_processed}")
    print("="*80)
    
    return total_processed


def main():
    """Main function - runs in loop if LOOP_ENABLED is True, processing all okul* databases"""
    print("="*80)
    print("MULTI-DB NEWS PROCESSING SERVICE")
    print("="*80)
    print(f"\nConfiguration:")
    print(f"  MongoDB URI: {MONGODB_URI[:50]}...")
    print(f"  Database prefix: {DB_PREFIX}*")
    print(f"  Preferred topics: {', '.join(PREFERRED_TOPICS)}")
    print(f"  Unwanted topics: {', '.join(UNWANTED_TOPICS)}")
    print(f"  Minimum interest score: {MIN_INTEREST_SCORE}")
    print(f"  Loop enabled: {LOOP_ENABLED}")
    if LOOP_ENABLED:
        print(f"  Loop sleep time: {LOOP_SLEEP_MINUTES} minutes ({LOOP_SLEEP_MINUTES * 60} seconds)")
    
    # List available databases
    okul_dbs = get_all_okul_databases()
    if okul_dbs:
        print(f"\nDatabases to process ({len(okul_dbs)}):")
        for db in okul_dbs:
            print(f"  - {db}")
    
    print("\n" + "="*80 + "\n")
    
    iteration = 0
    
    try:
        if LOOP_ENABLED:
            print("Starting continuous processing loop...")
            print("Press Ctrl+C to stop.\n")
            
            iteration += 1
            print(f"\n{'='*80}")
            print(f"ITERATION #{iteration} - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
            print(f"{'='*80}\n")
            
            # Process all databases with error handling
            try:
                processed = process_all_databases()
            except Exception as e:
                print(f"[ERROR] Error in process_all_databases: {type(e).__name__}: {e}")
                import traceback
                traceback.print_exc()
                processed = 0
                print("\n[INFO] Continuing to next iteration despite error...")
            
            # Sleep before next iteration
            sleep_seconds = LOOP_SLEEP_MINUTES * 60
            next_check = datetime.now().replace(microsecond=0) + timedelta(seconds=sleep_seconds)
            if processed == 0:
                print(f"No items processed. Sleeping for {sleep_seconds:.1f} seconds...")
            else:
                print(f"Sleeping for {sleep_seconds:.1f} seconds before next iteration...")
            print(f"Current time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
            print(f"Next check at: {next_check.strftime('%Y-%m-%d %H:%M:%S')}")
            
        else:
            # Run once
            print("Running single iteration for all databases...\n")
            try:
                process_all_databases()
            except Exception as e:
                print(f"[ERROR] Error in process_all_databases: {type(e).__name__}: {e}")
                import traceback
                traceback.print_exc()
            print("\nSingle iteration complete.")
        
    except KeyboardInterrupt:
        print("\n\n" + "="*80)
        print("Processing stopped by user.")
        print(f"Total iterations completed: {iteration}")
        print("="*80)
    except Exception as e:
        print(f"\n[ERROR] Unexpected error in main: {type(e).__name__}: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    while True:
        try:
            main()
        except Exception as e:
            print(f"Error in main: {e}")
            print(f"news processor stopped at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        
        print(f"news processor stopped at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

        print("Restarting news processor  in 10 minutes...")
        time.sleep(600)
        print(f"news processor restarted at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print("="*80)
        print(f"news processor restarted at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")