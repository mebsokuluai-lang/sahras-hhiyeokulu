import urllib.request
import xml.etree.ElementTree as ET
from html import unescape
import re
import gzip
import json
import os
import base64
from datetime import datetime, timedelta
from email.utils import parsedate_to_datetime
import time
from pymongo import MongoClient
from bson import ObjectId
from flask import Flask, jsonify, request, render_template, abort, send_from_directory, Response, redirect, url_for, session, flash, make_response
from flask_cors import CORS
from functools import wraps
from elevenlabs.client import ElevenLabs

# ============================================================================
# DEBUG MODE CONFIGURATION
# ============================================================================
DEBUG = True
VERSION = "4"

app = Flask(__name__)
app.secret_key = 'askeri_haberler_secret_key_2025_very_secure'
app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(days=30)
CORS(app)

# MongoDB Configuration
# DBNAME environment variable is used for multi-site deployment
# Each Vercel site sets its own DBNAME (e.g., okul1, okul2, okulmebs)
MONGO_CONNECTION_STRING = "mongodb+srv://aliaribas:aliaribas@airsoft1.q6eejuz.mongodb.net/?retryWrites=true&w=majority&appName=airsoft1"
MONGO_DB_NAME = os.environ.get('DBNAME', 'okulmebs')
MONGO_COLLECTION_NAME = "haberler"

mongo_client = None

# Initialize MongoDB connection
try:
    mongo_client = MongoClient(MONGO_CONNECTION_STRING)
    mongo_db = mongo_client[MONGO_DB_NAME]
    mongo_collection = mongo_db[MONGO_COLLECTION_NAME]
    # Additional collections
    mongo_filtre_tag = mongo_db["filtre_tag"]
    mongo_filtre_ornek = mongo_db["filtre_ornek_haberler"]
    mongo_filtre_translate = mongo_db["filtre_translate_keywords"]
    mongo_ziyaret_gecmisi = mongo_db["ziyaret_gecmisi"]
    mongo_users = mongo_db["users"]
    mongo_rss_sources = mongo_db["rss_sources"]
    mongo_keys = mongo_db["keys"]  # API keys collection (Gemini, ElevenLabs)
    print(f"MongoDB connection established successfully (DB: {MONGO_DB_NAME})")
except Exception as e:
    print(f"MongoDB connection failed: {e}")
    mongo_collection = None
    mongo_filtre_tag = None
    mongo_filtre_ornek = None
    mongo_filtre_translate = None
    mongo_ziyaret_gecmisi = None
    mongo_users = None
    mongo_rss_sources = None
    mongo_keys = None


# ============================================================================
# USER AUTHENTICATION FUNCTIONS (MongoDB-based)
# ============================================================================

def load_users():
    """Load all users from MongoDB"""
    if mongo_users is None:
        print("MongoDB users collection not available")
        return []
    try:
        users = list(mongo_users.find({}, {'_id': 0}))
        return users
    except Exception as e:
        print(f"Error loading users from MongoDB: {e}")
        return []


def get_user_by_username(username):
    """Get user by username from MongoDB"""
    if mongo_users is None:
        return None
    try:
        user = mongo_users.find_one({'username': username}, {'_id': 0})
        return user
    except Exception as e:
        print(f"Error getting user from MongoDB: {e}")
        return None


def authenticate_user(username, password):
    """Authenticate user with username and password"""
    user = get_user_by_username(username)
    if user and user['password'] == password:
        return user
    return None


def create_user(username, password, permissions, user_type='standard', selected_tags=None, selected_translate=None, selected_ornek=None):
    """Create a new user in MongoDB with optional starting filters"""
    if mongo_users is None:
        return False
    try:
        # Check if user already exists
        existing = mongo_users.find_one({'username': username})
        if existing:
            return False
        
        new_user = {
            'username': username,
            'password': password,
            'permissions': permissions,
            'user_type': user_type,
            'selected_tags': selected_tags or [],
            'selected_translate': selected_translate or [],
            'selected_ornek': selected_ornek or [],
            'active_rss_sources': [],  # Per-user RSS source preferences
            'elevenlabs_api_key': None,  # Per-user ElevenLabs API key
            'created_at': datetime.utcnow()
        }
        mongo_users.insert_one(new_user)
        return True
    except Exception as e:
        print(f"Error creating user in MongoDB: {e}")
        return False


def update_user_active_rss_sources(username, url, add=True):
    """Add or remove a URL from user's active RSS sources"""
    if mongo_users is None:
        return False
    try:
        if add:
            result = mongo_users.update_one(
                {'username': username},
                {'$addToSet': {'active_rss_sources': url}}
            )
        else:
            result = mongo_users.update_one(
                {'username': username},
                {'$pull': {'active_rss_sources': url}}
            )
        return result.modified_count > 0 or result.matched_count > 0
    except Exception as e:
        print(f"Error updating user active RSS sources: {e}")
        return False


def get_user_active_sources(user):
    """Get list of active RSS source URLs for a user.
    A source is active for a user if:
    - The user is the owner of the source, OR
    - The user has explicitly activated it (in their active_rss_sources list)
    """
    if user is None or mongo_rss_sources is None:
        return []
    
    username = user.get('username')
    user_active_sources = user.get('active_rss_sources', [])
    
    # Get all RSS sources
    all_sources = list(mongo_rss_sources.find({}, {'_id': 0}))
    
    active_urls = []
    for source in all_sources:
        # Source is active for user if they own it OR have explicitly activated it
        if source.get('owner') == username or source.get('url') in user_active_sources:
            active_urls.append(source.get('url'))
    
    return active_urls


def get_sources_with_user_status(user):
    """Get all RSS sources with user-specific active status"""
    if mongo_rss_sources is None:
        return []
    
    username = user.get('username') if user else None
    user_active_sources = user.get('active_rss_sources', []) if user else []
    
    all_sources = list(mongo_rss_sources.find({}, {'_id': 0}))
    
    sources_with_status = []
    for source in all_sources:
        source_copy = source.copy()
        # Source is active for user if they own it OR have explicitly activated it
        is_owner = source.get('owner') == username
        is_activated = source.get('url') in user_active_sources
        source_copy['user_active'] = is_owner or is_activated
        source_copy['is_owner'] = is_owner
        sources_with_status.append(source_copy)
    
    return sources_with_status


def update_user_selected_tags(username, selected_tags):
    """Update user's selected filter tags in MongoDB"""
    if mongo_users is None:
        return False
    try:
        result = mongo_users.update_one(
            {'username': username},
            {'$set': {'selected_tags': selected_tags}}
        )
        return result.modified_count > 0 or result.matched_count > 0
    except Exception as e:
        print(f"Error updating user selected tags: {e}")
        return False


def update_user_password(username, new_password):
    """Update user password in MongoDB"""
    if mongo_users is None:
        return False
    try:
        result = mongo_users.update_one(
            {'username': username},
            {'$set': {'password': new_password}}
        )
        return result.modified_count > 0
    except Exception as e:
        print(f"Error updating user password in MongoDB: {e}")
        return False


def update_user_api_key(username, api_key):
    """Update user's ElevenLabs API key in MongoDB"""
    if mongo_users is None:
        return False
    try:
        result = mongo_users.update_one(
            {'username': username},
            {'$set': {'elevenlabs_api_key': api_key}}
        )
        return result.modified_count > 0 or result.matched_count > 0
    except Exception as e:
        print(f"Error updating user API key in MongoDB: {e}")
        return False


def delete_user_api_key(username):
    """Delete user's ElevenLabs API key from MongoDB"""
    if mongo_users is None:
        return False
    try:
        result = mongo_users.update_one(
            {'username': username},
            {'$set': {'elevenlabs_api_key': None}}
        )
        return result.modified_count > 0 or result.matched_count > 0
    except Exception as e:
        print(f"Error deleting user API key from MongoDB: {e}")
        return False


# ============================================================================
# API KEYS MANAGEMENT FUNCTIONS (DB-level keys collection)
# ============================================================================

def get_all_api_keys(key_type=None):
    """Get all API keys from the keys collection, optionally filtered by type"""
    if mongo_keys is None:
        return []
    try:
        query = {}
        if key_type:
            query['type'] = key_type
        keys = list(mongo_keys.find(query, {'_id': 0}))
        return keys
    except Exception as e:
        print(f"Error loading API keys: {e}")
        return []


def get_random_api_key(key_type):
    """Get a random active API key of the specified type"""
    import random
    if mongo_keys is None:
        return None
    try:
        keys = list(mongo_keys.find({'type': key_type, 'active': True}))
        if keys:
            selected = random.choice(keys)
            return selected.get('api_key')
        return None
    except Exception as e:
        print(f"Error getting random API key: {e}")
        return None


def add_api_key(key_type, api_key, name, username):
    """Add a new API key to the keys collection"""
    if mongo_keys is None:
        return False
    try:
        # Check if key already exists
        existing = mongo_keys.find_one({'api_key': api_key})
        if existing:
            return False
        
        mongo_keys.insert_one({
            'type': key_type,
            'api_key': api_key,
            'name': name,
            'active': True,
            'created_at': datetime.utcnow(),
            'created_by': username
        })
        return True
    except Exception as e:
        print(f"Error adding API key: {e}")
        return False


def delete_api_key(api_key):
    """Delete an API key from the keys collection"""
    if mongo_keys is None:
        return False
    try:
        result = mongo_keys.delete_one({'api_key': api_key})
        return result.deleted_count > 0
    except Exception as e:
        print(f"Error deleting API key: {e}")
        return False


def toggle_api_key(api_key):
    """Toggle the active status of an API key"""
    if mongo_keys is None:
        return False
    try:
        key = mongo_keys.find_one({'api_key': api_key})
        if key:
            new_status = not key.get('active', True)
            mongo_keys.update_one(
                {'api_key': api_key},
                {'$set': {'active': new_status}}
            )
            return True
        return False
    except Exception as e:
        print(f"Error toggling API key: {e}")
        return False


def delete_user(username):
    """Delete a user from MongoDB"""
    if mongo_users is None:
        return False
    try:
        result = mongo_users.delete_one({'username': username})
        return result.deleted_count > 0
    except Exception as e:
        print(f"Error deleting user from MongoDB: {e}")
        return False


def get_current_user():
    """Get current logged in user from session"""
    if 'username' in session:
        return get_user_by_username(session['username'])
    return None


def has_permission(user, permission):
    """Check if user has a specific permission"""
    if user is None:
        return permission == 'user'  # Anonymous users have 'user' level access
    return permission in user.get('permissions', [])


def log_visit(username, action, extra_data=None):
    """Log user visit/action to MongoDB"""
    if mongo_ziyaret_gecmisi is None:
        return False
    try:
        log_entry = {
            "username": username or "anonymous",
            "ip_address": request.remote_addr,
            "datetime": datetime.utcnow(),
            "action": action,
            "user_agent": request.headers.get('User-Agent', 'Unknown'),
            "path": request.path
        }
        if extra_data:
            log_entry.update(extra_data)
        mongo_ziyaret_gecmisi.insert_one(log_entry)
        return True
    except Exception as e:
        print(f"Error logging visit: {e}")
        return False


# ============================================================================
# PERMISSION DECORATORS
# ============================================================================

def login_required(f):
    """Decorator to require login"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'username' not in session:
            flash('Bu sayfayı görüntülemek için giriş yapmalısınız.', 'warning')
            return redirect(url_for('login', next=request.url))
        return f(*args, **kwargs)
    return decorated_function


def admin_required(f):
    """Decorator to require admin permission"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        user = get_current_user()
        if not user or not has_permission(user, 'admin'):
            flash('Bu sayfayı görüntülemek için admin yetkisi gereklidir.', 'danger')
            return redirect(url_for('get_haberler'))
        return f(*args, **kwargs)
    return decorated_function


def super_admin_required(f):
    """Decorator to require super_admin permission"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        user = get_current_user()
        if not user or not has_permission(user, 'super_admin'):
            flash('Bu sayfayı görüntülemek için süper admin yetkisi gereklidir.', 'danger')
            return redirect(url_for('get_haberler'))
        return f(*args, **kwargs)
    return decorated_function


# ============================================================================
# CONTEXT PROCESSOR - Make user available in all templates
# ============================================================================

@app.context_processor
def inject_user():
    """Inject current user into all templates"""
    user = get_current_user()
    return {
        'current_user': user,
        'is_logged_in': user is not None,
        'is_admin': user is not None and has_permission(user, 'admin'),
        'is_super_admin': user is not None and has_permission(user, 'super_admin')
    }


# ============================================================================
# ROUTES
# ============================================================================

@app.route('/', methods=['GET'])
def home():
    """Redirect home page to haberler"""
    return redirect(url_for('get_haberler'))


@app.route('/api/news', methods=['GET', 'POST'])
def get_news():
    """API endpoint for getting news as JSON"""
    try:
        # Check database connection first
        if mongo_collection is None:
            return jsonify({
                'status': 'error',
                'message': 'Veritabanı bağlantısı yok'
            }), 500
        
        # Get query parameters with user preferences
        user = get_current_user()
        
        # Get settings from cookies or defaults
        default_min_score = 4
        default_limit = 100
        
        min_score = int(request.cookies.get('min_news_score', default_min_score))
        skip = int(request.args.get('skip', 0))
        limit = int(request.cookies.get('news_limit', default_limit))
        
        # Override with query params if provided
        if request.args.get('limit'):
            limit = int(request.args.get('limit'))
        if request.args.get('min_score'):
            min_score = int(request.args.get('min_score'))
        
        # Query MongoDB - sort by publication date (newest first)
        news = list(mongo_collection.find({"interest_score": {"$gt": min_score}}, 
                                        {'_id': 0})
                   .skip(skip)
                   .limit(limit).sort('date_english', -1))

        
        return jsonify({
            'status': 'success',
            'data': news,
            'count': len(news)
        })
    

    
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500
    




@app.route('/haberler', methods=['GET'])
def get_haberler():
    try:
        # Check database connection first
        if mongo_collection is None:
            return render_template('haberler.html', 
                                 haberler=[], 
                                 all_kategoriler=[],
                                 selected_kategoriler=[],
                                 all_tags=[],
                                 user_selected_tags=[],
                                 db_error="Veritabanı bağlantısı yok")
        
        user = get_current_user()
        
        # Get settings from cookies or defaults
        min_score = int(request.cookies.get('min_news_score', 4))
        news_limit = int(request.cookies.get('news_limit', 100))
        selected_kategoriler = request.cookies.get('selected_kategoriler', '')
        
        # Build query
        query = {"interest_score": {"$gt": min_score}}
        
        # Get all unique kategoriler first for comparison
        all_kategoriler = []
        if user and has_permission(user, 'admin'):
            all_kategoriler = mongo_collection.distinct('category') if mongo_collection is not None else []
        
        # Filter by kategoriler: Apply filter if ANY category is selected
        # If none selected (all deselected), show all news (no filter applied)
        if selected_kategoriler and user and has_permission(user, 'admin'):
            kategoriler_list = [k.strip() for k in selected_kategoriler.split(',') if k.strip()]
            # Apply filter if at least one kategori is selected
            if kategoriler_list and len(kategoriler_list) > 0:
                query['category'] = {'$in': kategoriler_list}
            # If none selected, don't apply kategori filter (show all news)
        
        # Filter by user's active RSS sources (for admins)
        if user and has_permission(user, 'admin'):
            active_source_urls = get_user_active_sources(user)
            if active_source_urls:
                # Get source names from URLs
                source_names = []
                if mongo_rss_sources is not None:
                    for url in active_source_urls:
                        source = mongo_rss_sources.find_one({'url': url})
                        if source:
                            source_names.append(source.get('name'))
                
                if source_names:
                    query['source'] = {'$in': source_names}
        
        # Query MongoDB - sort by publication date (newest first)
        haberler = list(mongo_collection.find(query, {'_id': 0})
                       .sort('date_english', -1)
                       .limit(news_limit))
        
        # Get filter data for admin
        all_tags = []
        user_selected_tags = []
        
        if user and has_permission(user, 'admin'):
            # Get all filter tags for admin
            all_tags = list(mongo_filtre_tag.find({}, {'_id': 0})) if mongo_filtre_tag is not None else []
            # Get user's selected tags from MongoDB
            user_selected_tags = user.get('selected_tags', [])
        
        # Log visit
        log_visit(session.get('username'), 'view_haberler')
        
        return render_template('haberler.html', 
                             haberler=haberler, 
                             all_kategoriler=all_kategoriler,
                             selected_kategoriler=selected_kategoriler.split(',') if selected_kategoriler else [],
                             all_tags=all_tags,
                             user_selected_tags=user_selected_tags)
        
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500
    

@app.route('/haberler/update_tags', methods=['POST'])
@login_required
@admin_required
def update_user_tags():
    """Update user's selected filter tags (saved to MongoDB)"""
    selected_tags = request.form.getlist('selected_tags')
    username = session.get('username')
    
    if update_user_selected_tags(username, selected_tags):
        log_visit(username, 'update_selected_tags', {'tags': selected_tags})
        flash('Filtre seçimleriniz kaydedildi.', 'success')
    else:
        flash('Filtre kaydetme sırasında hata oluştu.', 'danger')
    
    return redirect(url_for('get_haberler'))


@app.route('/haberler/edit', methods=['POST'])
@login_required
@admin_required
def edit_news_field():
    """Edit a specific field of a news item"""
    try:
        data = request.get_json()
        link = data.get('link')
        field = data.get('field')
        value = data.get('value')
        
        if not link:
            return jsonify({'status': 'error', 'message': 'Link gerekli'}), 400
        
        # Only allow editing specific fields
        allowed_fields = ['title_turkish', 'summary_turkish', 'content_turkish']
        if field not in allowed_fields:
            return jsonify({'status': 'error', 'message': 'Bu alan düzenlenemez'}), 400
        
        if mongo_collection is not None:
            result = mongo_collection.update_one(
                {'link': link},
                {'$set': {field: value, 'edited_at': datetime.utcnow(), 'edited_by': session.get('username')}}
            )
            
            if result.matched_count > 0:
                log_visit(session.get('username'), 'edit_news', {'link': link[:50], 'field': field})
                return jsonify({'status': 'success', 'message': 'Değişiklik kaydedildi'})
            else:
                return jsonify({'status': 'error', 'message': 'Haber bulunamadı'}), 404
        else:
            return jsonify({'status': 'error', 'message': 'Veritabanı bağlantısı yok'}), 500
            
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500


@app.route('/haberler/add', methods=['POST'])
@login_required
@admin_required
def add_manual_news():
    """Add a news item manually for processing"""
    title = request.form.get('title', '').strip()
    content = request.form.get('content', '').strip()
    link = request.form.get('link', '').strip()
    source = request.form.get('source', '').strip()
    
    if not title or not content or not link or not source:
        flash('Başlık, içerik, link ve kaynak zorunludur.', 'danger')
        return redirect(url_for('get_haberler'))
    
    # Check if link already exists
    if mongo_collection is not None:
        existing = mongo_collection.find_one({'link': link})
        if existing:
            flash('Bu link zaten mevcut.', 'warning')
            return redirect(url_for('get_haberler'))
        
        # Create new news entry (will be processed by news_processor.py)
        new_entry = {
            'link': link,
            'source': source,
            'title_english': title,
            'content_english': content,
            'date_english': datetime.utcnow().isoformat(),
            'date_turkish': datetime.utcnow().isoformat(),
            'created_at': datetime.utcnow(),
            'processed': False,  # Will be processed by news_processor.py
            'manual_entry': True,
            'added_by': session.get('username')
        }
        
        mongo_collection.insert_one(new_entry)
        log_visit(session.get('username'), 'add_manual_news', {'title': title[:50]})
        flash('Haber eklendi. İşlenmek üzere sıraya alındı.', 'success')
    else:
        flash('Veritabanı bağlantısı yok.', 'danger')
    
    return redirect(url_for('get_haberler'))


# ============================================================================
# LOGIN / LOGOUT ROUTES
# ============================================================================

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form.get('username', '').strip()
        password = request.form.get('password', '').strip()
        remember_me = request.form.get('remember_me') == 'on'
        
        user = authenticate_user(username, password)
        
        if user:
            session.permanent = remember_me
            session['username'] = username
            
            # Log successful login
            log_visit(username, 'login', {'remember_me': remember_me})
            
            flash(f'Hoş geldiniz, {username}!', 'success')
            
            # Redirect to next page or haberler
            next_page = request.args.get('next', url_for('get_haberler'))
            return redirect(next_page)
        else:
            log_visit(username, 'failed_login')
            flash('Geçersiz kullanıcı adı veya şifre.', 'danger')
    
    return render_template('login.html')


@app.route('/logout')
def logout():
    username = session.get('username')
    if username:
        log_visit(username, 'logout')
    session.clear()
    flash('Başarıyla çıkış yaptınız.', 'info')
    return redirect(url_for('get_haberler'))


# ============================================================================
# SETTINGS ROUTE
# ============================================================================

@app.route('/settings', methods=['GET', 'POST'])
def settings():
    user = get_current_user()
    
    if request.method == 'POST':
        action = request.form.get('action')
        
        if action == 'update_preferences':
            # Update user preferences (stored in cookies)
            min_score = request.form.get('min_news_score', 4)
            news_limit = request.form.get('news_limit', 100)
            
            response = redirect(url_for('settings'))
            response.set_cookie('min_news_score', str(min_score), max_age=30*24*60*60)
            response.set_cookie('news_limit', str(news_limit), max_age=30*24*60*60)
            
            flash('Tercihleriniz kaydedildi.', 'success')
            return response
        
        elif action == 'change_password' and user:
            current_password = request.form.get('current_password', '')
            new_password = request.form.get('new_password', '')
            confirm_password = request.form.get('confirm_password', '')
            
            if user['password'] != current_password:
                flash('Mevcut şifre yanlış.', 'danger')
            elif new_password != confirm_password:
                flash('Yeni şifreler eşleşmiyor.', 'danger')
            elif len(new_password) < 6:
                flash('Yeni şifre en az 6 karakter olmalıdır.', 'danger')
            else:
                # Update password in MongoDB
                if update_user_password(user['username'], new_password):
                    log_visit(user['username'], 'password_changed')
                    flash('Şifreniz başarıyla değiştirildi.', 'success')
                else:
                    flash('Şifre değiştirme sırasında hata oluştu.', 'danger')
    
    # Get current preferences from cookies
    current_min_score = request.cookies.get('min_news_score', '4')
    current_news_limit = request.cookies.get('news_limit', '100')
    
    return render_template('settings.html',
                         current_min_score=current_min_score,
                         current_news_limit=current_news_limit)
    


# ============================================================================
# ADMIN ROUTES
# ============================================================================

@app.route('/admin', methods=['GET'])
@login_required
@admin_required
def admin_panel():
    user = get_current_user()
    
    # Get current keywords, translate keywords, and example news
    keywords = list(mongo_filtre_tag.find({}, {'_id': 0})) if mongo_filtre_tag is not None else []
    translate_keywords = list(mongo_filtre_translate.find({}, {'_id': 0})) if mongo_filtre_translate is not None else []
    ornek_haberler = list(mongo_filtre_ornek.find({}, {'_id': 0})) if mongo_filtre_ornek is not None else []
    
    # Get RSS sources with user-specific active status
    rss_sources = get_sources_with_user_status(user)
    
    # Get API keys (Gemini and ElevenLabs) from keys collection
    gemini_keys = get_all_api_keys('gemini')
    elevenlabs_keys = get_all_api_keys('elevenlabs')
    
    log_visit(session.get('username'), 'view_admin_panel')
    
    return render_template('admin.html',
                         keywords=keywords,
                         translate_keywords=translate_keywords,
                         ornek_haberler=ornek_haberler,
                         rss_sources=rss_sources,
                         gemini_keys=gemini_keys,
                         elevenlabs_keys=elevenlabs_keys,
                         db_name=MONGO_DB_NAME)


@app.route('/admin/keywords', methods=['POST'])
@login_required
@admin_required
def manage_keywords():
    action = request.form.get('action')
    username = session.get('username')
    
    if action == 'add':
        tag = request.form.get('tag', '').strip()
        preferred = request.form.get('preferred') == 'on'
        
        if tag and mongo_filtre_tag is not None:
            # Check if exists
            existing = mongo_filtre_tag.find_one({'tag': tag})
            if existing:
                flash(f'"{tag}" zaten mevcut.', 'warning')
            else:
                mongo_filtre_tag.insert_one({
                    'tag': tag, 
                    'preferred': preferred,
                    'owner': username,
                    'created_at': datetime.utcnow()
                })
                log_visit(username, 'add_keyword', {'tag': tag, 'preferred': preferred})
                flash(f'"{tag}" eklendi.', 'success')
    
    elif action == 'delete':
        tag = request.form.get('tag', '').strip()
        if tag and mongo_filtre_tag is not None:
            mongo_filtre_tag.delete_one({'tag': tag})
            log_visit(username, 'delete_keyword', {'tag': tag})
            flash(f'"{tag}" silindi.', 'success')
    
    return redirect(url_for('admin_panel'))


@app.route('/admin/translate', methods=['POST'])
@login_required
@admin_required
def manage_translate_keywords():
    action = request.form.get('action')
    username = session.get('username')
    
    if action == 'add':
        english = request.form.get('english', '').strip()
        turkish = request.form.get('turkish', '').strip()
        
        if english and turkish and mongo_filtre_translate is not None:
            existing = mongo_filtre_translate.find_one({'english': english})
            if existing:
                flash(f'"{english}" zaten mevcut.', 'warning')
            else:
                mongo_filtre_translate.insert_one({
                    'english': english, 
                    'turkish': turkish,
                    'owner': username,
                    'created_at': datetime.utcnow()
                })
                log_visit(username, 'add_translate_keyword', {'english': english, 'turkish': turkish})
                flash(f'"{english} -> {turkish}" eklendi.', 'success')
    
    elif action == 'delete':
        english = request.form.get('english', '').strip()
        if english and mongo_filtre_translate is not None:
            # Try to delete by 'english' field first, then by 'keyword_english' field
            result = mongo_filtre_translate.delete_one({'english': english})
            if result.deleted_count == 0:
                # Try with keyword_english field if not found
                result = mongo_filtre_translate.delete_one({'keyword_english': english})
            log_visit(username, 'delete_translate_keyword', {'english': english})
            flash(f'"{english}" silindi.', 'success')
    
    return redirect(url_for('admin_panel'))


@app.route('/admin/ornek', methods=['POST'])
@login_required
@admin_required
def manage_ornek_haberler():
    action = request.form.get('action')
    username = session.get('username')
    
    if action == 'add':
        title = request.form.get('title', '').strip()
        content = request.form.get('content', '').strip()
        preferred = request.form.get('preferred') == 'on'
        
        if title and mongo_filtre_ornek is not None:
            existing = mongo_filtre_ornek.find_one({'title': title})
            if existing:
                flash(f'"{title[:50]}..." zaten mevcut.', 'warning')
            else:
                mongo_filtre_ornek.insert_one({
                    'title': title, 
                    'content': content, 
                    'preferred': preferred,
                    'owner': username,
                    'created_at': datetime.utcnow()
                })
                log_visit(username, 'add_ornek_haber', {'title': title[:50], 'preferred': preferred})
                flash('Örnek haber eklendi.', 'success')
    
    elif action == 'delete':
        title = request.form.get('title', '').strip()
        if title and mongo_filtre_ornek is not None:
            mongo_filtre_ornek.delete_one({'title': title})
            log_visit(username, 'delete_ornek_haber', {'title': title[:50]})
            flash('Örnek haber silindi.', 'success')
    
    return redirect(url_for('admin_panel'))


@app.route('/admin/kategoriler', methods=['POST'])
@login_required
@admin_required
def update_kategoriler_filter():
    selected = request.form.getlist('kategoriler')
    
    response = redirect(url_for('get_haberler'))
    response.set_cookie('selected_kategoriler', ','.join(selected), max_age=30*24*60*60)
    
    flash('Kategori filtresi güncellendi.', 'success')
    return response


@app.route('/admin/rss_sources', methods=['POST'])
@login_required
@admin_required
def manage_rss_sources():
    """Manage RSS sources (add, delete, toggle active globally)"""
    action = request.form.get('action')
    username = session.get('username')
    
    if action == 'add':
        name = request.form.get('name', '').strip()
        url = request.form.get('url', '').strip()
        
        if name and url and mongo_rss_sources is not None:
            existing = mongo_rss_sources.find_one({'url': url})
            if existing:
                flash(f'Bu URL zaten mevcut.', 'warning')
            else:
                # Add source with global active=True (for rss_reader.py to fetch)
                mongo_rss_sources.insert_one({
                    'name': name,
                    'url': url,
                    'active': True,  # Global active flag for collection
                    'owner': username,
                    'created_at': datetime.utcnow()
                })
                log_visit(username, 'add_rss_source', {'name': name})
                flash(f'"{name}" RSS kaynağı eklendi.', 'success')
    
    elif action == 'delete':
        url = request.form.get('url', '').strip()
        if url and mongo_rss_sources is not None:
            # Any admin can delete any source
            source = mongo_rss_sources.find_one({'url': url})
            if source:
                mongo_rss_sources.delete_one({'url': url})
                log_visit(username, 'delete_rss_source', {'url': url[:50], 'owner': source.get('owner')})
                flash('RSS kaynağı silindi.', 'success')
            else:
                flash('RSS kaynağı bulunamadı.', 'warning')
    
    elif action == 'toggle':
        url = request.form.get('url', '').strip()
        if url and mongo_rss_sources is not None:
            source = mongo_rss_sources.find_one({'url': url})
            if source:
                # Toggle global active status
                is_currently_active = source.get('active', True)
                new_status = not is_currently_active
                
                mongo_rss_sources.update_one(
                    {'url': url},
                    {'$set': {'active': new_status}}
                )
                
                if new_status:
                    log_visit(username, 'activate_rss_source', {'url': url[:50]})
                    flash('RSS kaynağı aktif yapıldı.', 'success')
                else:
                    log_visit(username, 'deactivate_rss_source', {'url': url[:50]})
                    flash('RSS kaynağı pasif yapıldı.', 'success')
    
    return redirect(url_for('admin_panel'))


@app.route('/admin/api_keys', methods=['POST'])
@login_required
@admin_required
def manage_api_keys():
    """Manage API keys (Gemini, ElevenLabs) at DB level"""
    action = request.form.get('action')
    username = session.get('username')
    
    if action == 'add':
        key_type = request.form.get('key_type', '').strip()
        api_key = request.form.get('api_key', '').strip()
        key_name = request.form.get('key_name', '').strip()
        
        if not key_type or key_type not in ['gemini', 'elevenlabs']:
            flash('Geçersiz anahtar tipi.', 'danger')
        elif not api_key:
            flash('API anahtarı boş olamaz.', 'warning')
        elif not key_name:
            flash('Anahtar adı boş olamaz.', 'warning')
        else:
            if add_api_key(key_type, api_key, key_name, username):
                log_visit(username, 'add_api_key', {'type': key_type, 'name': key_name})
                flash(f'{key_type.capitalize()} API anahtarı eklendi.', 'success')
            else:
                flash('Bu API anahtarı zaten mevcut.', 'warning')
    
    elif action == 'delete':
        api_key = request.form.get('api_key', '').strip()
        if api_key:
            if delete_api_key(api_key):
                log_visit(username, 'delete_api_key')
                flash('API anahtarı silindi.', 'success')
            else:
                flash('API anahtarı silinemedi.', 'danger')
    
    elif action == 'toggle':
        api_key = request.form.get('api_key', '').strip()
        if api_key:
            if toggle_api_key(api_key):
                log_visit(username, 'toggle_api_key')
                flash('API anahtarı durumu değiştirildi.', 'success')
            else:
                flash('API anahtarı durumu değiştirilemedi.', 'danger')
    
    return redirect(url_for('admin_panel'))


# ============================================================================
# SUPER ADMIN ROUTES
# ============================================================================

@app.route('/super_admin', methods=['GET'])
@login_required
@super_admin_required
def super_admin_panel():
    # Get statistics
    stats = {}
    
    if mongo_collection is not None:
        stats['total_news'] = mongo_collection.count_documents({})
        stats['processed_news'] = mongo_collection.count_documents({'processed': True})
        stats['preferred_news'] = mongo_collection.count_documents({'preferred': True})
        stats['sent_news'] = mongo_collection.count_documents({'gonderildi': True})
        
        # Category counts
        pipeline = [
            {'$group': {'_id': '$category', 'count': {'$sum': 1}}},
            {'$sort': {'count': -1}}
        ]
        stats['kategoriler'] = list(mongo_collection.aggregate(pipeline))
        
        # Source counts
        pipeline = [
            {'$group': {'_id': '$source', 'count': {'$sum': 1}}},
            {'$sort': {'count': -1}}
        ]
        stats['sources'] = list(mongo_collection.aggregate(pipeline))
    
    # Get users
    users = load_users()
    
    # Get all available filters for user creation
    all_tags = list(mongo_filtre_tag.find({}, {'_id': 0})) if mongo_filtre_tag is not None else []
    all_translate = list(mongo_filtre_translate.find({}, {'_id': 0})) if mongo_filtre_translate is not None else []
    all_ornek = list(mongo_filtre_ornek.find({}, {'_id': 0})) if mongo_filtre_ornek is not None else []
    
    # Get visit history (last 100)
    visit_history = []
    if mongo_ziyaret_gecmisi is not None:
        visit_history = list(mongo_ziyaret_gecmisi.find({}, {'_id': 0})
                            .sort('datetime', -1)
                            .limit(100))
    
    log_visit(session.get('username'), 'view_super_admin_panel')
    
    return render_template('super_admin.html',
                         stats=stats,
                         users=users,
                         all_tags=all_tags,
                         all_translate=all_translate,
                         all_ornek=all_ornek,
                         visit_history=visit_history)


@app.route('/super_admin/users', methods=['POST'])
@login_required
@super_admin_required
def manage_users():
    action = request.form.get('action')
    
    if action == 'create':
        username = request.form.get('username', '').strip()
        password = request.form.get('password', '').strip()
        permissions = request.form.getlist('permissions')
        user_type = request.form.get('user_type', 'standard')
        
        # Get selected starting filters
        selected_tags = request.form.getlist('selected_tags')
        selected_translate = request.form.getlist('selected_translate')
        selected_ornek = request.form.getlist('selected_ornek')
        
        # Get new filters to add
        new_tag = request.form.get('new_tag', '').strip()
        new_tag_preferred = request.form.get('new_tag_preferred') == 'on'
        new_translate_en = request.form.get('new_translate_en', '').strip()
        new_translate_tr = request.form.get('new_translate_tr', '').strip()
        new_ornek_title = request.form.get('new_ornek_title', '').strip()
        new_ornek_content = request.form.get('new_ornek_content', '').strip()
        new_ornek_preferred = request.form.get('new_ornek_preferred') == 'on'
        
        if not username or not password:
            flash('Kullanıcı adı ve şifre gereklidir.', 'danger')
        elif len(password) < 6:
            flash('Şifre en az 6 karakter olmalıdır.', 'danger')
        else:
            # Ensure 'user' permission is always included
            if 'user' not in permissions:
                permissions.append('user')
            
            # Add new filters if provided
            current_admin = session.get('username')
            
            if new_tag and mongo_filtre_tag is not None:
                if not mongo_filtre_tag.find_one({'tag': new_tag}):
                    mongo_filtre_tag.insert_one({
                        'tag': new_tag,
                        'preferred': new_tag_preferred,
                        'owner': current_admin,
                        'created_at': datetime.utcnow()
                    })
                    selected_tags.append(new_tag)
            
            if new_translate_en and new_translate_tr and mongo_filtre_translate is not None:
                if not mongo_filtre_translate.find_one({'english': new_translate_en}):
                    mongo_filtre_translate.insert_one({
                        'english': new_translate_en,
                        'turkish': new_translate_tr,
                        'owner': current_admin,
                        'created_at': datetime.utcnow()
                    })
                    selected_translate.append(new_translate_en)
            
            if new_ornek_title and mongo_filtre_ornek is not None:
                if not mongo_filtre_ornek.find_one({'title': new_ornek_title}):
                    mongo_filtre_ornek.insert_one({
                        'title': new_ornek_title,
                        'content': new_ornek_content,
                        'preferred': new_ornek_preferred,
                        'owner': current_admin,
                        'created_at': datetime.utcnow()
                    })
                    selected_ornek.append(new_ornek_title)
            
            # Create user in MongoDB with all settings
            if create_user(username, password, permissions, user_type, 
                          selected_tags, selected_translate, selected_ornek):
                log_visit(current_admin, 'create_user', {
                    'new_username': username, 
                    'permissions': permissions,
                    'user_type': user_type,
                    'selected_tags': selected_tags
                })
                flash(f'"{username}" kullanıcısı oluşturuldu.', 'success')
            else:
                # Check if user already exists
                if get_user_by_username(username):
                    flash(f'"{username}" kullanıcı adı zaten mevcut.', 'danger')
                else:
                    flash('Kullanıcı oluşturma sırasında hata oluştu.', 'danger')
    
    elif action == 'delete':
        username = request.form.get('username', '').strip()
        current_username = session.get('username')
        
        if username == current_username:
            flash('Kendinizi silemezsiniz.', 'danger')
        elif username:
            if delete_user(username):
                log_visit(session.get('username'), 'delete_user', {'deleted_username': username})
                flash(f'"{username}" kullanıcısı silindi.', 'success')
            else:
                flash('Kullanıcı silme sırasında hata oluştu.', 'danger')
    
    return redirect(url_for('super_admin_panel'))


# ============================================================================
# GONDERILDI ROUTE
# ============================================================================

@app.route('/gonderildi', methods=['POST'])
@login_required
@admin_required
def mark_as_sent():
    """Mark a news item as sent (gonderildi=True)"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({
                'status': 'error',
                'message': 'No JSON data received'
            }), 400
        
        link = data.get('link')
        if not link:
            return jsonify({
                'status': 'error',
                'message': 'Link is required'
            }), 400
        
        print(f"Received request to mark as sent: {link}")
        
        if mongo_collection is None:
            return jsonify({
                'status': 'error',
                'message': 'Database connection not available'
            }), 500
        
        # Update the document in MongoDB
        result = mongo_collection.update_one(
            {'link': link},
            {'$set': {'gonderildi': True}}
        )
        
        if result.matched_count > 0:
            if result.modified_count > 0:
                print(f"Successfully marked as sent: {link}")
                log_visit(session.get('username'), 'mark_as_sent', {'link': link[:50]})
                return jsonify({
                    'status': 'success',
                    'message': 'Haber gönderildi olarak işaretlendi.'
                }), 200
            else:
                print(f"Document was already marked as sent: {link}")
                return jsonify({
                    'status': 'info',
                    'message': 'Haber zaten gönderildi olarak işaretlenmiş.'
                }), 200
        else:
            print(f"No document found with link: {link}")
            return jsonify({
                'status': 'error',
                'message': 'Bu link ile eşleşen haber bulunamadı.'
            }), 404

    except Exception as e:
        print(f"Error updating document: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': f'Error updating document: {str(e)}'
        }), 500


# ============================================================================
# GONDERIM ONCESI ON IZLEME (PRE-SEND PREVIEW)
# ============================================================================

@app.route('/onizleme', methods=['GET'])
@login_required
@admin_required
def preview_news():
    """Show pre-send preview page for a news item"""
    link = request.args.get('link')
    if not link:
        flash('Link parametresi gerekli.', 'danger')
        return redirect(url_for('get_haberler'))
    
    if mongo_collection is None:
        flash('Veritabanı bağlantısı yok.', 'danger')
        return redirect(url_for('get_haberler'))
    
    # Find the news item (include _id for dinle link)
    haber = mongo_collection.find_one({'link': link})
    if not haber:
        flash('Haber bulunamadı.', 'danger')
        return redirect(url_for('get_haberler'))
    
    # Extract doc_id before removing _id for template
    doc_id = str(haber.get('_id', ''))
    
    # Check if there are any ElevenLabs API keys in the database
    elevenlabs_keys = get_all_api_keys('elevenlabs')
    has_api_key = len([k for k in elevenlabs_keys if k.get('active', False)]) > 0
    
    log_visit(session.get('username'), 'view_preview', {'link': link[:50]})
    
    return render_template('onizleme.html', haber=haber, has_api_key=has_api_key, doc_id=doc_id)


@app.route('/onizleme/save', methods=['POST'])
@login_required
@admin_required
def save_preview():
    """Save the pre-send preview data"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({
                'status': 'error',
                'message': 'No JSON data received'
            }), 400
        
        link = data.get('link')
        preview_data = data.get('preview_data')
        
        if not link:
            return jsonify({
                'status': 'error',
                'message': 'Link is required'
            }), 400
        
        if not preview_data:
            return jsonify({
                'status': 'error',
                'message': 'Preview data is required'
            }), 400
        
        if mongo_collection is None:
            return jsonify({
                'status': 'error',
                'message': 'Database connection not available'
            }), 500
        
        # Update the document with preview data
        result = mongo_collection.update_one(
            {'link': link},
            {'$set': {
                'gonderim_oncesi_onizleme': preview_data,
                'onizleme_updated_at': datetime.utcnow(),
                'onizleme_updated_by': session.get('username')
            }}
        )
        
        if result.matched_count > 0:
            log_visit(session.get('username'), 'save_preview', {'link': link[:50]})
            return jsonify({
                'status': 'success',
                'message': 'Ön izleme kaydedildi.'
            }), 200
        else:
            return jsonify({
                'status': 'error',
                'message': 'Haber bulunamadı.'
            }), 404
            
    except Exception as e:
        print(f"Error saving preview: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': f'Error: {str(e)}'
        }), 500





# ============================================================================
# AUDIO TTS GENERATION
# ============================================================================

@app.route('/onizleme/audio', methods=['POST'])
@login_required
@admin_required
def generate_audio():
    """Generate TTS audio from summary text using ElevenLabs"""
    try:
        # Get a random active ElevenLabs API key from the database
        elevenlabs_api_key = get_random_api_key('elevenlabs')
        if not elevenlabs_api_key:
            return jsonify({
                'status': 'error',
                'message': 'ElevenLabs API anahtarı bulunamadı. Lütfen Admin Panel\'den API anahtarı ekleyin.',
                'api_key_missing': True
            }), 400
        
        data = request.get_json()
        if not data:
            return jsonify({
                'status': 'error',
                'message': 'No JSON data received'
            }), 400
        
        link = data.get('link')
        summary_text = data.get('summary_text', '').strip()
        
        if not link:
            return jsonify({
                'status': 'error',
                'message': 'Link is required'
            }), 400
        
        if not summary_text:
            return jsonify({
                'status': 'error',
                'message': 'Summary text is required'
            }), 400
        
        if mongo_collection is None:
            return jsonify({
                'status': 'error',
                'message': 'Database connection not available'
            }), 500
        
        print(f"Generating audio for summary: {summary_text[:100]}...")
        
        # Initialize ElevenLabs client with random API key from DB
        client_el = ElevenLabs(api_key=elevenlabs_api_key)
        
        # Generate audio using ElevenLabs TTS
        audio = client_el.text_to_speech.convert(
            text=summary_text,
            voice_id="JBFqnCBsd6RMkjVDRZzb",
            model_id="eleven_multilingual_v2",
            output_format="mp3_44100_128",
        )
        
        # Extract bytes from generator
        audio_data = b"".join(audio)
        print(f"Audio created: {len(audio_data)} bytes")
        
        # Encode to base64 for storage and transfer
        audio_base64 = base64.b64encode(audio_data).decode('utf-8')
        
        # Save audio to MongoDB document
        result = mongo_collection.update_one(
            {'link': link},
            {'$set': {
                'audio': audio_base64,
                'audio_generated_at': datetime.utcnow(),
                'audio_generated_by': session.get('username')
            }}
        )
        
        if result.matched_count > 0:
            log_visit(session.get('username'), 'generate_audio', {'link': link[:50]})
            return jsonify({
                'status': 'success',
                'message': 'Audio generated successfully',
                'audio_base64': audio_base64
            }), 200
        else:
            return jsonify({
                'status': 'error',
                'message': 'Haber bulunamadı.'
            }), 404
            
    except Exception as e:
        print(f"Error generating audio: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': f'Error: {str(e)}'
        }), 500


# ============================================================================
# PUBLIC AUDIO LISTENING PAGE
# ============================================================================

@app.route('/dinle/<doc_id>')
def dinle(doc_id):
    """Public audio listening page - no login required"""
    try:
        # Convert string to ObjectId
        obj_id = ObjectId(doc_id)
    except Exception:
        return render_template('404.html', message='Geçersiz ID formatı'), 404
    
    if mongo_collection is None:
        return render_template('404.html', message='Veritabanı bağlantısı yok'), 500
    
    # Find document
    haber = mongo_collection.find_one({'_id': obj_id})
    
    if not haber:
        return render_template('404.html', message='Haber bulunamadı'), 404
    
    # Calculate reading time and word count (avg 200 words/minute in Turkish)
    # Word count includes both summary and content
    content = haber.get('content_turkish', '') or haber.get('content_english', '') or ''
    summary = haber.get('summary_turkish', '') or ''
    combined_text = summary + ' ' + content
    word_count = len(combined_text.split())
    reading_time = max(1, round(word_count / 200))
    
    # View counter logic with cookie tracking
    # Cookie name is unique per news item - simple boolean "viewed" approach
    cookie_name = f'viewed_{doc_id}'
    already_viewed = request.cookies.get(cookie_name)
    
    # Only increment if user hasn't viewed this news before
    if not already_viewed:
        # Increment view count in database
        mongo_collection.update_one(
            {'_id': obj_id},
            {'$inc': {'view_count': 1}}
        )
        # Refresh haber to get updated view_count
        haber = mongo_collection.find_one({'_id': obj_id})
    
    # Get current view count (default to 0 if not set)
    view_count = haber.get('view_count', 0)
    
    # Create response with updated cookie
    response = make_response(render_template('dinle.html', 
                          haber=haber, 
                          doc_id=str(haber['_id']),
                          reading_time=reading_time,
                          word_count=word_count,
                          view_count=view_count))
    
    # Set cookie to mark this news as viewed by this user (1 year expiry)
    if not already_viewed:
        response.set_cookie(cookie_name, '1', max_age=365*24*60*60, samesite='Lax')
    
    return response


# ============================================================================
# LOCAL HOST RUNNER
# ============================================================================

# if __name__ == '__main__':
#     print("="*60)
#     print("ASKERI HABERLER WEB SERVER")
#     print("="*60)
#     print(f"Debug Mode: {DEBUG}")
#     print(f"Database: {MONGO_DB_NAME}")
#     print(f"Server: http://localhost:5041")
#     print(f"Server: http://localhost:5041/haberler")
#     print("="*60)
#     app.run(debug=DEBUG, host='0.0.0.0', port=5041)
