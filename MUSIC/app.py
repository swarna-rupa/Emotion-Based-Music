from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
from deepface import DeepFace
import cv2
import base64
import numpy as np
import random
import sqlite3

app = Flask(__name__)
CORS(app)

DATABASE = 'songs.db'

def get_songs_from_db(emotion):
    conn = sqlite3.connect(DATABASE)
    cursor = conn.cursor()
    cursor.execute("SELECT song_url FROM songs WHERE emotion=?", (emotion,))
    songs = cursor.fetchall()
    conn.close()
    return [song[0] for song in songs] if songs else []

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/detect-emotion', methods=['POST'])
def detect_emotion():
    try:
        data = request.get_json()
        image_data = data['image'].split(",")[1]
        image_bytes = base64.b64decode(image_data)
        nparr = np.frombuffer(image_bytes, np.uint8)
        image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)


        result = DeepFace.analyze(image, actions=['emotion'], enforce_detection=False)

        if not result:
            return jsonify({"error": "No face detected."}), 400

        detected_emotion = result[0]['dominant_emotion']


        songs = get_songs_from_db(detected_emotion)
        if not songs:
            songs = get_songs_from_db("neutral")
            if not songs:
                return jsonify({"error": "No songs found for this emotion."}), 400

        song_url = random.choice(songs)


        return jsonify({
            "emotion": detected_emotion,
            "song_url": song_url,
            "song_type": "local",
            "start_time": 45
        })

    except Exception as e:
        print("Error:", e)
        return jsonify({"error": "Face not detected or an error occurred."}), 400

if __name__ == '__main__':
    app.run(debug=True)