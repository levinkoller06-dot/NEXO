# Technikauswahl

## Empfohlener Start-Stack

- Kern: Python und FastAPI
- Lokale Modelle: Ollama
- Lokale Sprache zu Text: faster-whisper oder whisper.cpp
- Lokale Sprachausgabe: Piper
- Datenspeicher: SQLite und Obsidian-Markdown
- Desktop-App: zuerst lokale Weboberfläche, später Tauri
- Handy-App: zuerst installierbare Web-App, später Flutter
- Verbindung: privates Gerätenetz für den Prototyp
- Kalender: offizielle Google- oder Microsoft-Schnittstelle
- Telefonie: Twilio als leicht dokumentierter Startpunkt; vor Produktivbetrieb Anbieter und Landespreise vergleichen

## Lokales Modell nach Hardware auswählen

Die genaue Empfehlung folgt erst nach Erfassung der GPU. Als Orientierung:

- Wenig oder kein VRAM: kleines 3B- bis 4B-Modell, kurze Kontexte, hauptsächlich Befehle
- Etwa 8 GB VRAM: quantisiertes 7B- bis 9B-Modell für Chat und Werkzeugauswahl
- Etwa 12 bis 16 GB VRAM: stärkere 14B- bis 20B-Klasse, abhängig von Quantisierung und Kontext
- 24 GB oder mehr: größere lokale Modelle und längere Kontexte werden praktikabler

Ein Modell muss Werkzeugaufrufe zuverlässig als strukturierte Daten erzeugen können. Reine Chatqualität reicht nicht.

## Kandidaten für lokale Tests

- Qwen-Familie in einer zur GPU passenden Größe
- Gemma-Familie in einer zur GPU passenden Größe
- gpt-oss 20B, wenn Speicher und Geschwindigkeit ausreichen

Die Modellnamen und Quantisierungen ändern sich schnell. Deshalb werden zwei Kandidaten mit denselben 20 Testbefehlen verglichen, statt früh einen Anbieter fest einzubauen.

## Wann ein Cloud-Modell sinnvoll ist

- Komplexe Planung, die das lokale Modell nicht zuverlässig schafft
- Live-Sprachqualität, die lokal nicht zufriedenstellt
- Betrieb, während der Gaming-PC ausgeschaltet ist
- Verarbeitung auf dem Handy ohne Zugriff auf den PC

## Wechselbarkeit

Jeder Modellanbieter implementiert dieselben internen Funktionen: Chat, strukturierter Werkzeugaufruf, optional Spracheingabe und Sprachausgabe. Anbieter-spezifische Logik bleibt außerhalb der Apps. So kann NEXO später den günstigsten geeigneten Anbieter wählen.
