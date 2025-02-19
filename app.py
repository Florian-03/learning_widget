from flask import Flask, request, jsonify
import sqlite3
import requests


app = Flask(__name__)

# Funktion zum Initialisieren der DB
def init_db():
    try:
        conn = sqlite3.connect('learning_widget.db')
        cursor = conn.cursor()
        
        # Tabelle für Benutzer
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL
            )
        ''')
        
        # Tabelle für Lerninhalte
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS learning_content (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                content TEXT NOT NULL,
                FOREIGN KEY (user_id) REFERENCES users (id)
            )
        ''')
        
        # Tabelle für Themen
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS topics (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                content TEXT NOT NULL
            )
        ''')

        conn.commit()
        print("Datenbank erfolgreich initialisiert.")
    except Exception as e:
        print(f"Fehler bei der Initialisierung der Datenbank: {e}")
    finally:
        conn.close()


# Datenbank initialisieren
init_db()

# Route zur Registrierung eines Benutzers
@app.route('/register', methods=['POST'])
def register():
    data = request.json
    username = data['username']
    password = data['password']

    conn = sqlite3.connect('learning_widget.db')
    cursor = conn.cursor()

    try:
        cursor.execute('INSERT INTO users (username, password) VALUES (?, ?)', (username, password))
        conn.commit()
        return jsonify({"message": "User registered successfully!"}), 201
    except sqlite3.IntegrityError:
        return jsonify({"message": "Username already exists!"}), 400
    finally:
        conn.close()

# Route zur Anmeldung eines Benutzers
@app.route('/login', methods=['POST'])
def login():
    data = request.json
    username = data['username']
    password = data['password']

    try:
        conn = sqlite3.connect('learning_widget.db')
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM users WHERE username = ? AND password = ?', (username, password))
        user = cursor.fetchone()

        if user:
            return jsonify({"message": "Login successful!", "user_id": user[0]}), 200
        else:
            return jsonify({"message": "Invalid username or password!"}), 401
    finally:
        conn.close()  # Verbindung wird hier korrekt geschlossen

# Route zum Hinzufügen von Lerninhalten
@app.route('/add_content', methods=['POST'])
def add_content():
    try:
        data = request.json
        user_id = data.get('user_id')
        content = data.get('content')

        # Prüfen, ob die notwendigen Daten da sind
        if not user_id or not content:
            return jsonify({'message': 'Fehlende Daten!'}), 400

        conn = sqlite3.connect('learning_widget.db')
        cursor = conn.cursor()

        # Speichern des Inhalts in der DB
        cursor.execute("""
            INSERT INTO content (user_id, title, content, difficulty, category)
            VALUES (?, ?, ?, ?, ?)
        """, (user_id, "Manueller Eintrag", content, 1, "Allgemein"))

        conn.commit()
        conn.close()

        return jsonify({'message': 'Lerninhalt erfolgreich gespeichert!'}), 201

    except Exception as e:
        return jsonify({'message': f'Fehler: {str(e)}'}), 500

# Route zum Bearbeiten
@app.route('/update_content/<int:content_id>', methods=['PUT'])
def update_content(content_id):
    data = request.json
    new_content = data['content']

    conn = sqlite3.connect('learning_widget.db')
    cursor = conn.cursor()
    cursor.execute('SELECT id FROM learning_content WHERE id = ?', (content_id,))
    if not cursor.fetchone():
        return jsonify({"message": "Content not found!"}), 404

    cursor.execute('UPDATE learning_content SET content = ? WHERE id = ?', (new_content, content_id))
    conn.commit()
    conn.close()

    print(f"Inhalt mit ID {content_id} wurde bearbeitet.")
    return jsonify({"message": "Content updated successfully!"}), 200

# Route zum Löschen
@app.route('/delete_content/<int:content_id>', methods=['DELETE'])
def delete_content(content_id):
    conn = sqlite3.connect('learning_widget.db')
    cursor = conn.cursor()
    cursor.execute('SELECT id FROM learning_content WHERE id = ?', (content_id,))
    if not cursor.fetchone():
        return jsonify({"message": "Content not found!"}), 404

    cursor.execute('DELETE FROM learning_content WHERE id = ?', (content_id,))
    conn.commit()
    conn.close()

    print(f"Inhalt mit ID {content_id} wurde gelöscht.")
    return jsonify({"message": "Content deleted successfully!"}), 200

# Route zum Abrufen der Lerninhalte eines Benutzers
@app.route('/get_contents/<int:user_id>', methods=['GET'])
def get_contents(user_id):
    conn = sqlite3.connect('learning_widget.db')
    cursor = conn.cursor()

    # ✅ Korrekte Query: NUR Inhalte des Users holen (KEINE öffentlichen Inhalte)
    cursor.execute("""
        SELECT content_id, title, content, difficulty, category, timestamp
        FROM content
        WHERE user_id = ?
    """, (user_id,))

    contents = cursor.fetchall()
    conn.close()

    return jsonify(contents)

@app.route('/search_topic', methods=['GET'])
def search_topic():
    topic_name = request.args.get('name', '').lower()
    conn = sqlite3.connect('learning_widget.db')
    cursor = conn.cursor()
    cursor.execute('SELECT content FROM topics WHERE LOWER(name) = LOWER(?)', (topic_name,))
    topic = cursor.fetchone()
    conn.close()

    if topic:
        return jsonify({"content": topic[0]}), 200
    else:
        return jsonify({"message": "Topic not found!"}), 404

@app.route('/search_topic_dynamic', methods=['GET'])
def search_topic_dynamic():
    topic_name = request.args.get('name', '').lower()
    conn = sqlite3.connect('learning_widget.db')
    cursor = conn.cursor()
    cursor.execute('SELECT content FROM topics WHERE LOWER(name) = ?', (topic_name,))
    topic = cursor.fetchone()
    conn.close()

    if topic:
        return jsonify({"content": topic[0]}), 200
    
    # Inhalte von Wikipedia abrufen
    response = requests.get(f"https://en.wikipedia.org/api/rest_v1/page/summary/{topic_name}")
    if response.status_code == 200:
        wiki_data = response.json()
        return jsonify({"content": wiki_data.get('extract', 'Kein Inhalt gefunden.')}), 200
    else:
        return jsonify({"message": "Thema nicht gefunden und keine externen Inhalte verfügbar."}), 404

import openai    
# Deinen OpenAI API-Key setzen
openai.api_key = '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'

# Route zur Generierung von Themeninhalten
@app.route('/generate_topic_content', methods=['GET'])
def generate_topic_content():
    topic_name = request.args.get('name', '').lower()
    try:
        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "Du bist ein hilfreicher Assistent."},
                {"role": "user", "content": f"Erstelle eine Liste von 10 Englisch-Vokabeln mit deutscher Übersetzung zum Thema '{topic_name}'."}
            ],
            max_tokens=300
        )
        result_content = response['choices'][0]['message']['content'].strip()
        return jsonify({"content": result_content}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/get_fixed_topics', methods=['GET'])
def get_fixed_topics():
    fixed_topics = [
        {"name": "Vokabeln", "description": "Englisch-Vokabeln mit deutscher Übersetzung."},
        {"name": "Datenbanken", "description": "Grundlagen und wichtige Punkte zu Datenbanksystemen."},
        {"name": "IT Security", "description": "Konzepte und Prinzipien der IT-Sicherheit."}
    ]
    return jsonify({"topics": fixed_topics}), 200


if __name__ == '__main__':
    app.run(debug=True)
