class Config:
    SQLALCHEMY_DATABASE_URI = 'sqlite:///users.db'  # SQLite database
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SECRET_KEY = 'your_secret_key'  # Change this to a secret key of your choice
