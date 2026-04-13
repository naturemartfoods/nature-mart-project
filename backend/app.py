from flask import Flask, send_from_directory
from flask_cors import CORS
from models import create_tables
from routes.cart import cart_bp
import os

# Import routes
from routes.users import users_bp
from routes.products import products_bp

app = Flask(__name__)
CORS(app)

# Create DB tables
create_tables()

# Register routes
app.register_blueprint(users_bp, url_prefix="/api")
app.register_blueprint(products_bp, url_prefix="/api")
app.register_blueprint(cart_bp, url_prefix="/api")

@app.route('/images/<path:filename>')
def get_image(filename):
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    image_folder = os.path.join(BASE_DIR, "images")
    return send_from_directory(image_folder, filename)

@app.route("/")
def home():
    return {"message": "Nature Mart API Running 🌿"}

if __name__ == "__main__":
    print("🚀 Starting Flask Server...")
    app.run(debug=True, use_reloader=False)