from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash

# Initialize the database
db = SQLAlchemy()

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(150), unique=True, nullable=False)
    password = db.Column(db.String(150), nullable=False)

    @staticmethod
    def hash_password(password):
        return generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password, password)
