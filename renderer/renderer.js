// Menü- und Back-Button
const menuButton = document.getElementById('menu-button');
const backButton = document.getElementById('back-button');
const dropdownMenu = document.getElementById('dropdown-menu');

// Menü anzeigen/ausblenden
menuButton.addEventListener('click', () => {
    dropdownMenu.style.display = dropdownMenu.style.display === 'block' ? 'none' : 'block';
    backButton.style.display = 'block';
});

// FIX: Stellt sicher, dass alle Buttons im Dropdown-Menü gleich aussehen
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('#dropdown-menu button').forEach(button => {
        button.style.width = '100%'; 
        button.style.textAlign = 'center'; 
        button.style.margin = '0'; 
        button.style.padding = '10px';
        button.style.boxSizing = 'border-box';  // FIX: Sorgt dafür, dass der Rahmen nicht verschoben wird
    });
});

backButton.addEventListener('click', () => {
    dropdownMenu.style.display = 'none';

    let selectedTopic = localStorage.getItem('selectedTopic');
    let selectedManualContent = localStorage.getItem('selectedManualContent');

    console.log("DEBUG: Vor Rückkehr zur Hauptseite");
    console.log("selectedTopic:", selectedTopic);
    console.log("selectedManualContent:", selectedManualContent);

    // ✅ Falls keine Inhalte aktiv sind, bleibt die Hauptseite leer
    if (!selectedTopic && !selectedManualContent) {
        console.log("DEBUG: Kein Inhalt aktiv – Hauptseite bleibt leer.");
        document.getElementById('learning-content').innerHTML = '';
        backButton.style.display = 'none';
        return;
    }

    // ✅ Falls manuelle Eingaben aktiv sind, werden sie geladen (Beispielthemen werden deaktiviert!)
    if (selectedManualContent) {
        console.log("DEBUG: Manuelle Inhalte geladen!");
        document.getElementById('learning-content').setAttribute("data-active", "true");
        localStorage.removeItem('selectedTopic');  // ⛔ Deaktiviert Beispielthemen
        displayTopicContent(JSON.parse(selectedManualContent));
        backButton.style.display = 'none';  // 🔥 Zurück-Button nur verstecken, wenn Hauptseite aktiv ist
        return;
    }

    // ✅ Falls ein Beispielthema aktiv ist, wird es geladen (Manuelle Inhalte werden deaktiviert!)
    if (selectedTopic) {
        fetch(`http://127.0.0.1:5000/search_topic?name=${selectedTopic}`)
            .then(response => response.json())
            .then(data => {
                if (data.content) {
                    localStorage.removeItem('selectedManualContent');  // ⛔ Deaktiviert manuelle Inhalte
                    document.getElementById('learning-content').setAttribute("data-active", "false");
                    document.getElementById('learning-content').innerHTML = `
                        <h2>${selectedTopic}</h2>
                        <p style="font-size: 20px; font-weight: bold; text-align: center;">${data.content}</p>
                    `;
                    backButton.style.display = 'none';  // 🔥 Zurück-Button verstecken
                } else {
                    document.getElementById('learning-content').innerHTML = `<p>Thema nicht gefunden.</p>`;
                }
            })
            .catch(error => console.error('Fehler beim Abrufen des Themas:', error));
    }
});



// Funktion: Thema suchen (inkl. feste Themen)
document.getElementById('search-topic').addEventListener('click', () => {
    document.getElementById('learning-content').innerHTML = `
        <h2>Thema suchen</h2>
        <input type="text" id="topic-input" placeholder="Geben Sie das Thema ein..." />
        <button id="search-button">Suchen</button>
        <div id="topic-result"></div>
        <div id="fixed-topics" style="display: flex; flex-direction: column; gap: 10px; margin-top: 20px;"></div>
    `;
    dropdownMenu.style.display = 'none';
    loadFixedTopics();
});

// FIX: Beispielthemen verhalten sich jetzt identisch zu manuellen Einträgen (inkl. "Zurück"-Button verstecken)
function loadFixedTopics() {
    const topics = ["Datenbanken", "Vokabeln", "IT Security"];
    const topicContainer = document.getElementById('fixed-topics');
    topicContainer.innerHTML = '';

    topics.forEach(topicName => {
        const topicBox = document.createElement('div');
        topicBox.textContent = topicName;
        topicBox.classList.add('topic-block');
        topicBox.style.padding = "10px";
        topicBox.style.borderRadius = "5px";
        topicBox.style.textAlign = "center";
        topicBox.style.backgroundColor = "#5c4d7d";
        topicBox.style.cursor = "pointer";

        // Event für Klick auf ein Beispielthema
        topicBox.addEventListener('click', () => {
            localStorage.setItem('selectedTopic', topicName);

            fetch(`http://127.0.0.1:5000/search_topic?name=${topicName}`)
                .then(response => response.json())
                .then(data => {
                    if (data.content) {
                        localStorage.setItem('selectedManualContent', JSON.stringify([{ 1: data.content }]));

                        alert('Lerninhalt wird jetzt auf der Hauptseite angezeigt!');

                        // FIX: "Zurück"-Button verstecken, da wir jetzt auf der Hauptseite sind
                        document.getElementById('back-button').style.display = 'none';

                        // Direkt zur Hauptseite weiterleiten
                        document.getElementById('learning-content').innerHTML = `
                            <h2>${topicName}</h2>
                            <p style="font-size: 20px; font-weight: bold; text-align: center;">${data.content}</p>
                        `;

                        // Sicherstellen, dass die automatische Anzeige der Inhalte startet
                        displayTopicContent([{ 1: data.content }]);
                    } else {
                        alert('Thema nicht gefunden.');
                    }
                })
                .catch(error => console.error('Fehler beim Abrufen des Themas:', error));
        });

        topicContainer.appendChild(topicBox);
    });
}

// Funktion: Einstellungen-Bereich öffnen (Jetzt fix!)
document.getElementById('settings').addEventListener('click', () => {
    document.getElementById('learning-content').innerHTML = `
        <h2>Einstellungen</h2>
        <p>Hier können Sie zukünftige Funktionen konfigurieren.</p>
    `;
    dropdownMenu.style.display = 'none';
});

// Funktion: Konto öffnen (Bleibt unverändert)
document.getElementById('login').addEventListener('click', () => {
    document.getElementById('learning-content').innerHTML = `
        <h2>Konto</h2>
        <input type="text" id="username" placeholder="Benutzername" />
        <input type="password" id="password" placeholder="Passwort" />
        <button id="login-button">Anmelden</button>
    `;
    dropdownMenu.style.display = 'none';
});

// Funktion: Lerninhalt hinzufügen (NUR Hinzufügen)
document.getElementById('add-content').addEventListener('click', () => {
    document.getElementById('learning-content').innerHTML = `
        <h2>Lerninhalt hinzufügen</h2>
        <input type="text" id="content-input" placeholder="Geben Sie den Lerninhalt ein..." />
        <button id="save-content">Speichern</button>
    `;
    dropdownMenu.style.display = 'none';

    document.getElementById('save-content').addEventListener('click', () => {
        let userId = localStorage.getItem('user_id');  // Aktueller User
        let content = document.getElementById('content-input').value.trim();
    
        if (!userId || !content) {
            alert('Bitte eine Eingabe machen!');
            return;
        }

        fetch('http://localhost:5000/add_content', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: userId, content: content })
        })
        .then(response => response.json())
        .then(data => {
            alert(data.message);  // Erfolgsmeldung

            // **Eingabefeld automatisch leeren**
            document.getElementById('content-input').value = '';

            // **Neue Inhalte sofort in "Lerninhalt bearbeiten" anzeigen**
            loadContents();
        })
        .catch(error => {
            console.error('Fehler beim Speichern:', error);
            alert('Fehler beim Speichern!');
        });
    });    
});

// Funktion: Lerninhalte bearbeiten (Bearbeiten, Löschen, Anzeigen)
document.getElementById('edit-content').addEventListener('click', () => {
    loadContents();
});

// 🛠 Fix: Bearbeiten & Löschen – Verhindert, dass das Dropdown-Menü blockiert wird

function loadContents() {
    fetch('http://localhost:5000/get_contents/1')
        .then(response => response.json())
        .then(contents => {
            let contentHTML = `
                <h2>Lerninhalt bearbeiten</h2>
                <button id="show-content">Anzeigen</button> 
                <ul id="content-list">`;

            if (contents.length === 0) {
                contentHTML += `<p>Keine Lerninhalte gefunden.</p>`;
            } else {
                contents.forEach(content => {
                    contentHTML += `
                        <li data-id="${content[0]}">
                            <span class="editable">${content[1]}</span> 
                            <button class="edit-btn" title="Bearbeiten">✏️</button>
                            <button class="delete-btn" title="Löschen">🗑️</button>
                        </li>`;
                });
            }
            contentHTML += `</ul>`;
            document.getElementById('learning-content').innerHTML = contentHTML;
            dropdownMenu.style.display = 'none';

            // 🛠 Fehlerbehebung: Prüfe, ob `.edit-btn` existiert
            let editButtons = document.querySelectorAll('.edit-btn');
            if (editButtons.length > 0) {
                editButtons.forEach(button => {
                    button.addEventListener('click', function (event) {
                        let listItem = event.target.closest('li');
                        let contentId = listItem.dataset.id;
                        let span = listItem.querySelector('.editable');
                        let oldText = span.textContent;

                        let input = document.createElement('input');
                        input.type = 'text';
                        input.value = oldText;
                        input.classList.add('edit-input');
                        span.replaceWith(input);
                        input.focus();

                        input.addEventListener('blur', () => saveEdit(input, listItem, contentId));
                        input.addEventListener('keypress', (event) => {
                            if (event.key === 'Enter') saveEdit(input, listItem, contentId);
                        });
                    });
                });
            }

            function saveEdit(input, listItem, contentId) {
                let newText = input.value.trim();
                let span = document.createElement('span');
                span.classList.add('editable');
                span.textContent = newText;
                input.replaceWith(span);

                fetch(`http://localhost:5000/update_content/${contentId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ content: newText })
                })
                .then(response => response.json())
                .then(() => {
                    alert('Lerninhalt aktualisiert!');
                    span.addEventListener('click', function () {
                        let input = document.createElement('input');
                        input.type = 'text';
                        input.value = this.textContent;
                        input.classList.add('edit-input');
                        this.replaceWith(input);
                        input.focus();
                        input.addEventListener('blur', () => saveEdit(input, listItem, contentId));
                        input.addEventListener('keypress', (event) => {
                            if (event.key === 'Enter') saveEdit(input, listItem, contentId);
                        });
                    });
                });
            }

            // 🛠 Fehlerbehebung: Prüfe, ob `.delete-btn` existiert
            let deleteButtons = document.querySelectorAll('.delete-btn');
            if (deleteButtons.length > 0) {
                deleteButtons.forEach(button => {
                    button.addEventListener('click', function (event) {
                        let listItem = event.target.closest('li');
                        let contentId = listItem.dataset.id;

                        if (confirm('Möchtest du diesen Inhalt wirklich löschen?')) {
                            fetch(`http://localhost:5000/delete_content/${contentId}`, {
                                method: 'DELETE'
                            })
                            .then(response => response.json())
                            .then(() => {
                                listItem.remove(); // Sofort aus der Liste entfernen
                            })
                            .catch(error => console.error('Fehler beim Löschen:', error));
                        }
                    });
                });
            }
        })
        .catch(error => console.error('Fehler beim Laden der Inhalte:', error));
}

// ✅ FIX 2: "Anzeigen"-Button setzt den Inhalt korrekt
document.addEventListener('click', (event) => {
    if (event.target && event.target.id === 'show-content') {
        fetch('http://localhost:5000/get_contents/1')
            .then(response => response.json())
            .then(contents => {
                if (contents.length > 0) {
                    localStorage.setItem('selectedManualContent', JSON.stringify(contents));
                    displayTopicContent(contents);
                    alert('Lerninhalt wird jetzt auf der Hauptseite angezeigt!');

                    // ✅ WICHTIG: Back-Button verstecken, weil wir auf der Hauptseite sind!
                    backButton.style.display = 'none';

                } else {
                    alert('Keine Inhalte zum Anzeigen.');
                }
            });
    }
});

// ✅ FIX 3: Lerninhalt nur auf der Hauptseite wechseln + Zurück-Button korrekt handhaben
function displayTopicContent(contents) {
    if (!contents || contents.length === 0) {
        document.getElementById('back-button').style.display = 'none';
        return;
    }

    let index = 0;

    // ✅ Back-Button verstecken, wenn Hauptseite aktiv ist
    document.getElementById('back-button').style.display = 'none';

    function showNextContent() {
        if (document.getElementById('learning-content').getAttribute("data-active") === "true") {
            let contentHTML = `
                <h2>Gespeicherter Lerninhalt</h2>
                <p style="font-size: 20px; font-weight: bold; text-align: center;">${contents[index][1]}</p>
            `;
            document.getElementById('learning-content').innerHTML = contentHTML;

            index = (index + 1) % contents.length;
            setTimeout(showNextContent, 10000);
        }
    }

    document.getElementById('learning-content').setAttribute("data-active", "true");
    showNextContent();
}
 

// ✅ FIX 4: Automatische Anzeige wird gestoppt, wenn ein anderer Bereich gewählt wird
function stopAutoDisplay() {
    document.getElementById('learning-content').setAttribute("data-active", "false");
}

// ✅ Event-Listener für alle Bereiche, die die Anzeige stoppen sollen
document.getElementById('add-content').addEventListener('click', stopAutoDisplay);
document.getElementById('edit-content').addEventListener('click', stopAutoDisplay);
document.getElementById('search-topic').addEventListener('click', stopAutoDisplay);
document.getElementById('login').addEventListener('click', stopAutoDisplay);
document.getElementById('settings').addEventListener('click', stopAutoDisplay);
