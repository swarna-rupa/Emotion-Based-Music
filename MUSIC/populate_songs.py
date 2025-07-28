import sqlite3
import os

# Name of the SQLite database file
DATABASE = 'songs.db'

# Folder containing emotion subfolders with mp3s
SONG_FOLDER = 'static/songs'

def create_database():
    # Connect and create table if it doesn't exist
    conn = sqlite3.connect(DATABASE)
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS songs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            emotion TEXT NOT NULL,
            song_name TEXT NOT NULL,
            song_url TEXT NOT NULL
        )
    ''')
    conn.commit()
    conn.close()

def insert_songs():
    conn = sqlite3.connect(DATABASE)
    cursor = conn.cursor()

    emotions = ['angry', 'happy', 'sad', 'fear', 'neutral']

    for emotion in emotions:
        folder_path = os.path.join(SONG_FOLDER, emotion)
        if not os.path.exists(folder_path):
            print(f"❌ Folder not found: {folder_path}")
            continue

        for file in os.listdir(folder_path):
            if file.endswith('.mp3'):
                song_name = os.path.splitext(file)[0]
                song_url = os.path.join("static/songs", emotion, file).replace("\\", "/")
                cursor.execute("INSERT INTO songs (emotion, song_name, song_url) VALUES (?, ?, ?)",
                               (emotion, song_name, song_url))

    conn.commit()
    conn.close()
    print("✅ All songs inserted into the database!")

if __name__ == '__main__':
    create_database()
    insert_songs()
