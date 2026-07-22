from flask import Flask, render_template, request, redirect, url_for, session,send_file, jsonify
from flask_sqlalchemy import SQLAlchemy
import hashlib
import base64
from Crypto.Cipher import AES
from Crypto.Util.Padding import pad,unpad
from datetime import timedelta
from models import db, User
from config import Config
from werkzeug.exceptions import RequestEntityTooLarge
from io import BytesIO
from Crypto.Hash import SHA256
from Crypto import Random
from PIL import Image, UnidentifiedImageError
# Initialize the Flask app
app = Flask(__name__, static_folder='static') 

# Configure the app using the Config class
app.config.from_object(Config)

# Make session permanent by default
app.permanent_session_lifetime = timedelta(days=365 * 5)  # 5 years


# Initialize the database
db.init_app(app)

# AES Encrypt/Decrypt functions
def aes_encrypt(key, data):
    key = hashlib.sha256(key.encode()).digest()
    cipher = AES.new(key, AES.MODE_CBC)
    ct_bytes = cipher.encrypt(pad(data.encode(), AES.block_size)) 
    iv = base64.b64encode(cipher.iv).decode('utf-8')
    ct = base64.b64encode(ct_bytes).decode('utf-8')
    return iv + ct

def aes_decrypt(key, data):
    try:
        iv = base64.b64decode(data[:24])
        ct = base64.b64decode(data[24:])
        key = hashlib.sha256(key.encode()).digest()
        cipher = AES.new(key, AES.MODE_CBC, iv)
        pt = unpad(cipher.decrypt(ct), AES.block_size).decode('utf-8')
        return pt
    except Exception:
        return None

# Home route (index page)
@app.route('/')
def index():
    if 'user' in session:
        return redirect('/mainmenu')
    return render_template('index.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']

        user = User.query.filter_by(username=username).first()
        if user and user.check_password(password):
            session.permanent = True  # Make the session permanent 
            session['user'] = username
            return redirect('/mainmenu')
        else:
            return render_template('login.html', error="Invalid credentials. Try again.")
    return render_template('login.html')

# Signup route
@app.route('/signup', methods=['GET', 'POST'])
def signup():
    if request.method == 'POST':
        username = request.form['username']
        password1 = request.form['password1']
        password2 = request.form['password2']

        if password1 != password2:
            return render_template('signup.html', error="Passwords do not match.")

        if User.query.filter_by(username=username).first():
            return render_template('signup.html', error="Username already exists. Please choose a different one.")

        hashed_password = User.hash_password(password1)
        new_user = User(username=username, password=hashed_password)
        db.session.add(new_user)
        db.session.commit()
        return redirect('/login')
    return render_template('signup.html')

# Main menu route
@app.route('/mainmenu', methods=['GET', 'POST'])
def mainmenu():
    if 'user' not in session:
        return redirect('/login')

    if request.method == 'POST':
        action = request.form.get('action')
        if action == 'encrypt_text':
            return redirect(url_for('dashboard1'))
        elif action == 'encrypt_file':
            return redirect(url_for('dashboard2'))
        elif action == 'encrypt_image':
            return redirect(url_for('dashboard3'))


    return render_template('mainmenu.html')

# Text dashboard
@app.route('/dashboard1')
def dashboard1():
    if 'user' not in session:
        return redirect('/login')
    return render_template('dashboard1.html')

# File dashboard
@app.route('/dashboard2')
def dashboard2():
    if 'user' not in session:
        return redirect('/login')
    return render_template('dashboard2.html')

# Image dashboard
@app.route('/dashboard3')
def dashboard3():
    if 'user' not in session:
        return redirect('/login')
    return render_template('dashboard3.html')

# Allowed file types for encryption
ALLOWED_EXTENSIONS = {'txt'}

# Function to check if the file extension is allowed (fallback server-side check)
def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# Set file size limit (10 MB)
app.config['MAX_CONTENT_LENGTH'] = 10 * 1024 * 1024  # 10 MB

# Handle file size error gracefully
@app.errorhandler(RequestEntityTooLarge)
def handle_file_size_error(error):
    return jsonify({'success': False, 'message': 'File size exceeds the 10MB limit. Please choose a smaller file.'}), 413

@app.route('/encrypt-file', methods=['POST'])
def encrypt_file():
    data = request.json
    content = data.get('content')
    key = data.get('key')

    if not content or not key:
        return jsonify({'success': False, 'message': 'Both file content and key are required!'})

    encrypted_content = aes_encrypt(key, content)
    return jsonify({'success': True, 'encrypted_content': encrypted_content})

@app.route('/decrypt-file', methods=['POST'])
def decrypt_file():
    data = request.json
    encrypted_content = data.get('encrypted_content')
    key = data.get('key')

    if not encrypted_content or not key:
        return jsonify({'success': False, 'message': 'Both encrypted content and key are required!'})

    decrypted_content = aes_decrypt(key, encrypted_content)

    if decrypted_content is None:
        return jsonify({'success': False, 'message': 'Decryption failed: Invalid key or data!'})

    return jsonify({'success': True, 'decrypted_content': decrypted_content})
# Encrypt text
@app.route('/encrypt', methods=['POST'])
def encrypt_text():
    data = request.get_json()
    text = data.get('text')
    key = data.get('key')

    if not text or not key:
        return jsonify({'success': False, 'message': 'Both text and key are required!'})

    encrypted_text = aes_encrypt(key, text)
    return jsonify({'success': True, 'encrypted_text': encrypted_text})

# Decrypt text
@app.route('/decrypt', methods=['POST'])
def decrypt_text():
    data = request.get_json()
    encrypted_text = data.get('encrypted_text')
    key = data.get('key')

    if not encrypted_text or not key:
        return jsonify({'success': False, 'message': 'Both encrypted text and key are required!'})

    decrypted_text = aes_decrypt(key, encrypted_text)
    if decrypted_text is None:
        return jsonify({'success': False, 'message': 'Decryption failed. Invalid key or data.'})

    return jsonify({'success': True, 'decrypted_text': decrypted_text})


in_memory_data = {"data": None, "filename": None, "is_image": False}


def pad_key(key):
    return SHA256.new(key.encode("utf-8")).digest()


def encrypt_image(image_data, key):
    key = pad_key(key)
    iv = Random.new().read(AES.block_size)
    cipher = AES.new(key, AES.MODE_CFB, iv)
    return iv + cipher.encrypt(image_data)


def decrypt_image(encrypted_data, key):
    key = pad_key(key)
    iv = encrypted_data[:AES.block_size] 
    cipher = AES.new(key, AES.MODE_CFB, iv)
    return cipher.decrypt(encrypted_data[AES.block_size:])


def is_valid_image(data):
    try:
        Image.open(BytesIO(data)).verify()
        return True
    except UnidentifiedImageError:
        return False

# Change these lines to be specific to image encryption/decryption
@app.route("/encrypt-image", methods=["POST"])
def encrypt_image_route():
    file = request.files.get("file")
    key = request.form.get("key")

    if not file or not key:
        return jsonify({"status": "error", "message": "Both image and key are required."}), 400

    data = file.read()
    if not is_valid_image(data):
        return jsonify({"status": "error", "message": "Invalid image format."}), 400

    try:
        encrypted = encrypt_image(data, key)
        in_memory_data["data"] = encrypted
        in_memory_data["filename"] = f"encrypted_{file.filename}"
        in_memory_data["is_image"] = True  # Mark it as an image for download
        return jsonify({"status": "success"})
    except Exception:
        return jsonify({"status": "error", "message": "Encryption failed."}), 500


@app.route("/decrypt-image", methods=["POST"])
def decrypt_image_route():
    file = request.files.get("file")
    key = request.form.get("key")

    if not file or not key:
        return jsonify({"status": "error", "message": "Both encrypted image and key are required."}), 400

    data = file.read()
    try:
        decrypted = decrypt_image(data, key)
        if not is_valid_image(decrypted):
            raise ValueError("Invalid decrypted data.")
        in_memory_data["data"] = decrypted
        in_memory_data["filename"] = "decrypted_image.png"
        in_memory_data["is_image"] = True  # Mark it as an image for download
        return jsonify({"status": "success"})
    except Exception:
        return jsonify({"status": "error", "message": "Invalid encrypted image or key."}), 400

@app.route("/download", methods=["GET"])
def download():
    if in_memory_data["data"] is None:
        return jsonify({"status": "error", "message": "No result to download."}), 400

    mimetype = "image/png" if in_memory_data["is_image"] else "application/octet-stream"
    return send_file(
        BytesIO(in_memory_data["data"]),
        as_attachment=True,
        download_name=in_memory_data["filename"],
        mimetype=mimetype,
    )




# Logout route
@app.route('/logout')
def logout():
    session.pop('user', None)  # Remove the user from the session
    return redirect('/')  # Always redirect to the index page (home)

if __name__ == '__main__':
    app.run(debug=True)




















