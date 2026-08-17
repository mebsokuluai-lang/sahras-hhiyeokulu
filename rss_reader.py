#!/usr/bin/env python3
"""
Multi-DB RSS Feed Reader
Processes RSS feeds for all databases starting with 'okul'
Each database has its own RSS sources and news collection
"""

import urllib.request
import urllib.error
import xml.etree.ElementTree as ET
from html import unescape
import re
import gzip
import json
import os
import ssl
from datetime import datetime, timedelta
from email.utils import parsedate_to_datetime
import time
from pymongo import MongoClient

# ============================================================================
# CONFIGURATION
# ============================================================================
NUMBER_OF_ITEMS = 5
JSON_FILE = "news_data.json"
SLEEP_MINUTES = 10  # Sleep between iterations

# MongoDB Configuration
MONGO_CONNECTION_STRING = "mongodb+srv://aliaribas:aliaribas@airsoft1.q6eejuz.mongodb.net/?retryWrites=true&w=majority&appName=airsoft1"
MONGO_COLLECTION_NAME = "haberler"
DB_PREFIX = "okul"  # Will process all databases starting with this prefix

# Global MongoDB client
mongo_client = None

def get_mongo_client():
    """Get or create MongoDB client"""
    global mongo_client
    if mongo_client is None:
        try:
            mongo_client = MongoClient(MONGO_CONNECTION_STRING, serverSelectionTimeoutMS=10000)
            mongo_client.server_info()  # Test connection
            print("MongoDB connection established successfully")
        except Exception as e:
            print(f"MongoDB connection failed: {e}")
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


def get_db_collections(db_name):
    """Get collection references for a specific database"""
    client = get_mongo_client()
    if client is None:
        return None, None
    
    try:
        db = client[db_name]
        return db[MONGO_COLLECTION_NAME], db["rss_sources"]
    except Exception as e:
        print(f"[ERROR] Failed to get collections for {db_name}: {e}")
        return None, None


def load_rss_sources(rss_sources_collection):
    """Load active RSS sources from MongoDB with validation"""
    if rss_sources_collection is None:
        print("[ERROR] RSS sources collection not available")
        return []
    
    try:
        # Get only active sources
        sources = list(rss_sources_collection.find({'active': True}, {'_id': 0}))
        if not sources:
            print("[WARNING] No active RSS sources found. Please add sources via Admin Panel.")
            return []
        
        # Validate and filter sources
        valid_sources = []
        for source in sources:
            if not isinstance(source, dict):
                print(f"[WARNING] Invalid source format (not a dict): {source}")
                continue
            if not source.get('name'):
                print(f"[WARNING] Source missing 'name' field: {source}")
                continue
            if not source.get('url'):
                print(f"[WARNING] Source '{source.get('name', 'Unknown')}' missing 'url' field")
                continue
            valid_sources.append(source)
        
        print(f"Loaded {len(valid_sources)} valid active RSS sources (out of {len(sources)} total)")
        return valid_sources
        
    except Exception as e:
        print(f"[ERROR] Error loading RSS sources: {type(e).__name__}: {e}")
        return []


def load_existing_data():
    """Load existing news data from JSON file"""
    if os.path.exists(JSON_FILE):
        try:
            with open(JSON_FILE, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception as e:
            print(f"Error loading JSON file: {e}")
            return []
    return []


def save_to_json(data):
    """Save news data to JSON file"""
    try:
        with open(JSON_FILE, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        print(f"\nData saved to {JSON_FILE}")
    except Exception as e:
        print(f"Error saving to JSON: {e}")


def convert_date_to_utc3_mongo(date_str):
    """Convert RSS date string to MongoDB datetime format in UTC+3"""
    try:
        # Parse the RSS date (e.g., "Wed, 22 Oct 2025 02:06:12 +0000")
        dt = parsedate_to_datetime(date_str)
        # Convert to UTC+3
        utc3_dt = dt + timedelta(hours=3)
        # Return in ISO 8601 format (MongoDB compatible)
        return utc3_dt.isoformat()
    except Exception as e:
        return date_str  # Return original if parsing fails


def link_exists(existing_data, link):
    """Check if a link already exists in the data"""
    return any(item.get('link') == link for item in existing_data)


def link_exists_in_mongodb(news_collection, link):
    """Check if a link already exists in MongoDB with error handling"""
    if not link:
        print("[WARNING] Empty link provided for MongoDB check")
        return False
    
    print(f"Checking link: {link[:80]}..." if len(link) > 80 else f"Checking link: {link}")
    
    if news_collection is None:
        print("[WARNING] MongoDB not available, skipping link check")
        return False
    
    try:
        x = news_collection.find_one({"link": link}, {"link": 1})  # Only fetch link field for efficiency
        if x is not None:
            print(f"  -> Found in database (duplicate)")
            return True
        else:
            print(f"  -> Not found in database (new)")
            return False
    except Exception as e:
        print(f"[ERROR] Error checking MongoDB: {type(e).__name__}: {e}")
        return False  # Return False to allow processing to continue


def save_to_mongodb(news_collection, data_entry):
    """Save a single news entry to MongoDB with error handling"""
    if news_collection is None:
        print("[WARNING] MongoDB not available, skipping save to database")
        return False
    
    if not data_entry:
        print("[ERROR] Empty data entry provided for MongoDB save")
        return False
    
    if not data_entry.get('link'):
        print("[ERROR] Data entry has no link, skipping MongoDB save")
        return False
    
    try:
        result = news_collection.insert_one(data_entry)
        print(f"✓ Saved to MongoDB with ID: {result.inserted_id}")
        return True
    except Exception as e:
        print(f"[ERROR] Error saving to MongoDB: {type(e).__name__}: {e}")
        return False


def strip_html(html_text):
    """Remove HTML tags and decode HTML entities with error handling"""
    if not html_text:
        return ''
    
    try:
        # Ensure we're working with a string
        if not isinstance(html_text, str):
            html_text = str(html_text)
        
        # Remove HTML tags
        text = re.sub(r'<[^>]+>', '', html_text)
        # Decode HTML entities
        text = unescape(text)
        # Clean up extra whitespace
        text = re.sub(r'\s+', ' ', text).strip()
        return text
    except Exception as e:
        # If any error occurs, return the original text or empty string
        print(f"[WARNING] Error stripping HTML: {e}")
        return str(html_text) if html_text else ''


def fetch_rss_feed(url):
    """Fetch RSS feed from URL with comprehensive error handling"""
    try:
        # Validate URL format
        if not url or not isinstance(url, str):
            print(f"    [ERROR] Invalid URL: {url}")
            return None
        
        if not url.startswith(('http://', 'https://')):
            print(f"    [ERROR] URL must start with http:// or https://: {url}")
            return None
        
        # Add multiple headers to mimic a real browser request
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'application/rss+xml, application/xml, text/xml, */*',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'Referer': 'https://www.google.com/'
        }
        req = urllib.request.Request(url, headers=headers)
        
        # Create SSL context that doesn't verify certificates (for sites with SSL issues)
        ssl_context = ssl.create_default_context()
        ssl_context.check_hostname = False
        ssl_context.verify_mode = ssl.CERT_NONE
        
        with urllib.request.urlopen(req, timeout=15, context=ssl_context) as response:
            # Check response status
            if response.status != 200:
                print(f"    [ERROR] HTTP status {response.status} from {url}")
                return None
            
            data = response.read()
            
            if not data:
                print(f"    [ERROR] Empty response from {url}")
                return None
            
            # Try to decompress if it's gzip compressed
            # Check for gzip magic number (1f 8b) at the start
            if data[:2] == b'\x1f\x8b':
                try:
                    data = gzip.decompress(data)
                except gzip.BadGzipFile as e:
                    print(f"    [ERROR] Failed to decompress gzip data: {e}")
                    return None
            
            return data
            
    except urllib.error.HTTPError as e:
        print(f"    [ERROR] HTTP Error {e.code}: {e.reason} - URL: {url}")
        return None
    except urllib.error.URLError as e:
        print(f"    [ERROR] URL Error (connection failed): {e.reason} - URL: {url}")
        return None
    except TimeoutError:
        print(f"    [ERROR] Connection timed out - URL: {url}")
        return None
    except Exception as e:
        print(f"    [ERROR] Unexpected error fetching RSS feed: {type(e).__name__}: {e}")
        return None


def parse_rss_feed(xml_data, source_name="Unknown"):
    """Parse RSS feed XML data with comprehensive error handling"""

    global NUMBER_OF_ITEMS
    
    if not xml_data:
        print(f"    [ERROR] No XML data to parse for {source_name}")
        return []
    
    try:
        # Try to decode if bytes
        if isinstance(xml_data, bytes):
            try:
                xml_data = xml_data.decode('utf-8')
            except UnicodeDecodeError:
                try:
                    xml_data = xml_data.decode('latin-1')
                except UnicodeDecodeError as e:
                    print(f"    [ERROR] Failed to decode XML data for {source_name}: {e}")
                    return []
        
        # Basic validation - check if it looks like XML/RSS
        xml_data_stripped = xml_data.strip()
        if not xml_data_stripped.startswith('<?xml') and not xml_data_stripped.startswith('<rss') and not xml_data_stripped.startswith('<feed'):
            print(f"    [ERROR] Data does not appear to be valid RSS/XML for {source_name}")
            print(f"    [DEBUG] First 200 chars: {xml_data_stripped[:200]}")
            return []
        
        try:
            root = ET.fromstring(xml_data)
        except ET.ParseError as e:
            print(f"    [ERROR] XML parsing error for {source_name}: {e}")
            return []
        
        items = []
        
        # Find all item elements in the RSS feed (also check for 'entry' for Atom feeds)
        feed_items = root.findall('.//item')
        if not feed_items:
            feed_items = root.findall('.//{http://www.w3.org/2005/Atom}entry')  # Atom format
        
        if not feed_items:
            print(f"    [WARNING] No items found in RSS feed for {source_name}")
            return []
        
        # Get only first N items
        for idx, item in enumerate(feed_items[:NUMBER_OF_ITEMS]):
            try:
                # Handle both RSS and Atom formats - use explicit None checks (not truthiness)
                title = item.find('title')
                if title is None:
                    title = item.find('{http://www.w3.org/2005/Atom}title')
                
                # Find link element - check multiple possible locations
                link = item.find('link')
                if link is None:
                    link = item.find('{http://www.w3.org/2005/Atom}link')
                
                pub_date = item.find('pubDate')
                if pub_date is None:
                    pub_date = item.find('{http://www.w3.org/2005/Atom}published')
                if pub_date is None:
                    pub_date = item.find('{http://www.w3.org/2005/Atom}updated')
                
                description = item.find('description')
                if description is None:
                    description = item.find('{http://www.w3.org/2005/Atom}summary')
                
                content = item.find('{http://purl.org/rss/1.0/modules/content/}encoded')
                if content is None:
                    content = item.find('{http://www.w3.org/2005/Atom}content')
                
                # Get link value - try multiple methods
                link_value = ''
                
                # Method 1: Standard RSS <link>text</link>
                if link is not None and link.text and link.text.strip():
                    link_value = link.text.strip()
                
                # Method 2: Atom style <link href="..."/>
                if not link_value and link is not None:
                    href = link.get('href', '')
                    if href:
                        link_value = href.strip()
                
                # Method 3: Check <guid> element (often contains permalink)
                if not link_value:
                    guid = item.find('guid')
                    if guid is not None and guid.text and guid.text.strip():
                        guid_text = guid.text.strip()
                        # Only use guid if it looks like a URL
                        if guid_text.startswith(('http://', 'https://')):
                            link_value = guid_text
                
                # Method 4: Check for <url> element
                if not link_value:
                    url_elem = item.find('url')
                    if url_elem is not None and url_elem.text and url_elem.text.strip():
                        link_value = url_elem.text.strip()
                
                # Skip items without a valid link
                if not link_value:
                    print(f"    [WARNING] Skipping item #{idx+1} in {source_name}: No valid link found")
                    continue
                
                # Safely extract text with error handling
                try:
                    title_text = title.text if title is not None and title.text else 'No title'
                except Exception:
                    title_text = 'No title'
                
                try:
                    pub_date_text = pub_date.text if pub_date is not None and pub_date.text else ''
                except Exception:
                    pub_date_text = ''
                
                try:
                    description_text = strip_html(description.text) if description is not None and description.text else ''
                except Exception as e:
                    print(f"    [WARNING] Error processing description for item #{idx+1}: {e}")
                    description_text = ''
                
                try:
                    content_text = strip_html(content.text) if content is not None and content.text else ''
                except Exception as e:
                    print(f"    [WARNING] Error processing content for item #{idx+1}: {e}")
                    content_text = ''
                
                news_item = {
                    'title': title_text,
                    'link': link_value,
                    'pub_date': pub_date_text,
                    'description': description_text,
                    'content': content_text,
                    'source': source_name
                }
                items.append(news_item)
                
            except Exception as e:
                print(f"    [WARNING] Error processing item #{idx+1} in {source_name}: {type(e).__name__}: {e}")
                continue  # Skip this item but continue with others
        
        return items
        
    except Exception as e:
        print(f"    [ERROR] Unexpected error parsing RSS feed for {source_name}: {type(e).__name__}: {e}")
        return []


def display_news(news_items, news_collection, db_name):
    """Display news items and save to specified DB collection"""
    if not news_items:
        print("No news items found.")
        return 0
    
    print("=" * 80)
    print(f"PROCESSING NEWS FOR DATABASE: {db_name}")
    print("=" * 80)
    print()
    
    new_items_added = 0
    items_processed = 0
    items_skipped = 0
    items_errored = 0
    
    for idx, item in enumerate(news_items, 1):
        try:
            print(f"\n{'='*80}")
            print(f"Item #{idx}")
            print(f"{'='*80}")
            
            # Validate item structure
            if not isinstance(item, dict):
                print(f"[ERROR] Invalid item structure (not a dict), skipping")
                items_errored += 1
                continue
            
            # Get link - required field
            item_link = item.get('link', '')
            if not item_link:
                print(f"[ERROR] Item has no link, skipping")
                items_errored += 1
                continue
            
            # Get full content (not truncated for JSON) with safe access
            try:
                full_content = item.get('content', '') or item.get('description', '') or ''
            except Exception:
                full_content = ''
            
            # Truncated content for display
            try:
                display_content = full_content[:1000] + "... (truncated)" if len(full_content) > 1000 else full_content
            except Exception:
                display_content = str(full_content)[:1000] if full_content else ''
            
            # Display English version (truncated) with safe access
            print(f"\nSource: {item.get('source', 'Unknown')}")
            print(f"Title - English: {item.get('title', 'No title')}")
            print(f"Date - English: {item.get('pub_date', 'No date')}")
            print(f"Link - English: {item_link}")
            print(f"\nContent - English:")
            print("-" * 80)
            print(display_content if display_content else "(No content)")
            
            # Check if link already exists in MongoDB
            try:
                if link_exists_in_mongodb(news_collection, item_link):
                    print(f"\n[Note: This article already exists in {db_name}, skipping save]")
                    items_skipped += 1
                    continue
            except Exception as e:
                print(f"[WARNING] Error checking MongoDB for existing link: {e}")
                # Continue anyway - better to potentially duplicate than to miss
            
            print(f"\n[Saving to {db_name} - will be processed by news_processor.py]")
            
            # Convert dates to UTC+3 MongoDB format
            try:
                date_utc3 = convert_date_to_utc3_mongo(item.get('pub_date', ''))
            except Exception as e:
                print(f"[WARNING] Error converting date: {e}")
                date_utc3 = item.get('pub_date', '')
            
            # Create new entry for MongoDB (without translations - will be done by news_processor.py)
            new_entry = {
                "link": item_link,
                "source": item.get('source', 'Unknown'),
                "date_english": date_utc3,
                "date_turkish": date_utc3,
                "title_english": item.get('title', 'No title'),
                "content_english": full_content,  # Full content
                "created_at": datetime.utcnow(),  # MongoDB UTC Timestamp (BSON Date)
                "processed": False  # Will be processed by news_processor.py
            }
            
            # Save to MongoDB
            try:
                if save_to_mongodb(news_collection, new_entry):
                    new_items_added += 1
            except Exception as e:
                print(f"[ERROR] Failed to save item to MongoDB: {e}")
                items_errored += 1
            
            items_processed += 1
            print()
            
        except Exception as e:
            # Catch-all for any unexpected errors processing this item
            print(f"[ERROR] Unexpected error processing item #{idx}: {type(e).__name__}: {e}")
            items_errored += 1
            continue  # Continue to next item
    
    # Summary
    print(f"\n[{db_name}] SUMMARY: {items_processed} processed, {new_items_added} added, {items_skipped} skipped, {items_errored} errors")
    return new_items_added


def fetch_and_process_for_db(db_name):
    """Fetch and process RSS feeds for a specific database"""
    
    print("\n" + "="*80)
    print(f"[{db_name}] Fetching RSS feeds... [{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}]")
    print("="*80)
    
    # Get collections for this database
    news_collection, rss_sources_collection = get_db_collections(db_name)
    
    if news_collection is None or rss_sources_collection is None:
        print(f"[ERROR] Failed to get collections for {db_name}")
        return 0
    
    # Load RSS sources from this DB
    try:
        rss_feeds = load_rss_sources(rss_sources_collection)
    except Exception as e:
        print(f"[ERROR] Failed to load RSS sources for {db_name}: {type(e).__name__}: {e}")
        return 0
    
    if not rss_feeds:
        print(f"[WARNING] No RSS feeds configured for {db_name}")
        return 0
    
    all_news_items = []
    successful_feeds = 0
    failed_feeds = 0
    
    # Fetch from all RSS feed sources
    for feed in rss_feeds:
        try:
            # Validate feed structure
            if not isinstance(feed, dict):
                print(f"\n[ERROR] Invalid feed configuration (not a dict): {feed}")
                failed_feeds += 1
                continue
            
            feed_name = feed.get('name', 'Unknown')
            feed_url = feed.get('url', '')
            
            if not feed_url:
                print(f"\n[ERROR] Feed '{feed_name}' has no URL configured")
                failed_feeds += 1
                continue
            
            print(f"\n>>> Fetching from: {feed_name}")
            print(f"    URL: {feed_url}")
            
            try:
                xml_data = fetch_rss_feed(feed_url)
            except Exception as e:
                print(f"    [ERROR] Exception during fetch for {feed_name}: {type(e).__name__}: {e}")
                failed_feeds += 1
                continue
            
            if xml_data:
                print(f"    Parsing RSS feed from {feed_name}...")
                try:
                    news_items = parse_rss_feed(xml_data, source_name=feed_name)
                    if news_items:
                        all_news_items.extend(news_items)
                        print(f"    ✓ Found {len(news_items)} items from {feed_name}")
                        successful_feeds += 1
                    else:
                        print(f"    [WARNING] No valid items parsed from {feed_name}")
                        failed_feeds += 1
                except Exception as e:
                    print(f"    [ERROR] Exception during parsing for {feed_name}: {type(e).__name__}: {e}")
                    failed_feeds += 1
            else:
                print(f"    ✗ Failed to fetch RSS feed from {feed_name}")
                failed_feeds += 1
                
        except Exception as e:
            # Catch-all for any unexpected errors processing this feed
            print(f"\n[ERROR] Unexpected error processing feed: {type(e).__name__}: {e}")
            failed_feeds += 1
            continue  # Continue to next feed
    
    # Summary
    print(f"\n{'='*80}")
    print(f"[{db_name}] FETCH SUMMARY: {successful_feeds} successful, {failed_feeds} failed, {len(all_news_items)} total items")
    print(f"{'='*80}")
    
    # Process and save all collected news items
    total_added = 0
    if all_news_items:
        try:
            total_added = display_news(all_news_items, news_collection, db_name)
        except Exception as e:
            print(f"[ERROR] Error processing news for {db_name}: {type(e).__name__}: {e}")
    else:
        print(f"\n[{db_name}] No news items found from any source.")
    
    return total_added


def fetch_and_process_all_dbs():
    """Fetch and process RSS feeds for all okul* databases"""
    
    print("\n" + "#"*80)
    print(f"MULTI-DB RSS READER - Processing all databases")
    print(f"Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("#"*80)
    
    # Get all okul* databases
    okul_dbs = get_all_okul_databases()
    
    if not okul_dbs:
        print("[WARNING] No databases found with 'okul' prefix")
        return
    
    total_added_all = 0
    db_results = {}
    
    # Process each database
    for db_name in okul_dbs:
        try:
            print(f"\n{'#'*80}")
            print(f"Processing database: {db_name}")
            print(f"{'#'*80}")
            
            added = fetch_and_process_for_db(db_name)
            db_results[db_name] = added
            total_added_all += added
            
        except Exception as e:
            print(f"[ERROR] Failed to process {db_name}: {type(e).__name__}: {e}")
            db_results[db_name] = -1  # Error indicator
            continue
    
    # Final summary
    print("\n" + "="*80)
    print("MULTI-DB PROCESSING COMPLETE")
    print("="*80)
    for db, count in db_results.items():
        status = f"{count} items added" if count >= 0 else "ERROR"
        print(f"  {db}: {status}")
    print(f"\nTotal items added across all databases: {total_added_all}")
    print("="*80)


def main():
    """Main function - runs continuously, processing all okul* databases"""
    print("="*80)
    print("MULTI-DB RSS FEED READER - CONTINUOUS MODE")
    print("="*80)
    
    # Get and display all okul* databases
    okul_dbs = get_all_okul_databases()
    
    if not okul_dbs:
        print("\n⚠️  WARNING: No databases found with 'okul' prefix!")
        print("   Please create at least one database starting with 'okul'")
        print("="*80)
    else:
        print(f"\nMonitoring {len(okul_dbs)} databases:")
        for db in okul_dbs:
            print(f"  ✓ {db}")
    
    print(f"\nChecking for new articles every {SLEEP_MINUTES} minutes ({SLEEP_MINUTES * 60} seconds)")
    print("Press Ctrl+C to stop")
    print("="*80)
    
    iteration = 0
    
    try:
        iteration += 1
        print(f"\n\n{'#'*80}")
        print(f"ITERATION #{iteration}")
        print(f"{'#'*80}")
        
        try:
            fetch_and_process_all_dbs()
        except Exception as e:
            print(f"\nError in fetch_and_process_all_dbs: {e}")
            print("Continuing to next iteration...")
        
        # Sleep for specified minutes
        sleep_seconds = SLEEP_MINUTES * 60
        next_check = datetime.now().replace(microsecond=0) + timedelta(seconds=sleep_seconds)
        print(f"\n{'='*80}")
        print(f"Sleeping for {SLEEP_MINUTES} minutes ({sleep_seconds} seconds)...")
        print(f"Current time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print(f"Next check at: {next_check}")
        print(f"{'='*80}")
            
    except KeyboardInterrupt:
        print("\n\n" + "="*80)
        print("Program stopped by user (Ctrl+C)")
        print(f"Total iterations completed: {iteration}")
        print("="*80)
        
        # Close MongoDB connection
        if mongo_client is not None:
            mongo_client.close()
            print("MongoDB connection closed")


if __name__ == "__main__":
    while True:
        try:
            main()
        except Exception as e:
            print(f"Error in main: {e}")
            print("RSS reader stopped at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        
        print(f"RSS reader stopped at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

        print("Restarting RSS reader in 10 minutes...")
        time.sleep(600)
        print("RSS reader restarted at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print("="*80)
        print("RSS reader restarted at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")