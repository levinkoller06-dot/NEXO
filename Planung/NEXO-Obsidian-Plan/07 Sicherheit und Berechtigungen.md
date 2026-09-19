# Sicherheit und Berechtigungen

## Grundsatz

Eine KI mit PC-Zugriff wird wie ein neuer Benutzer mit eingeschränkten Rechten behandelt. NEXO erhält nur die Rechte, die eine konkrete Funktion benötigt.

## Pflichtfunktionen

- Sichtbarer Status für Mikrofon, Bildschirmzugriff und laufende Automationen
- Globales Tastenkürzel zum sofortigen Stoppen
- Freigabeliste für Programme, Ordner und Aktionen
- Bestätigung vor externen oder schwer rückgängig zu machenden Aktionen
- Vollständiges Aktionsprotokoll mit Zeitpunkt, Auslöser und Ergebnis
- Automatische Zeitbegrenzung für Sitzungen und Fernzugriff
- Verschlüsselte Verbindung zwischen Handy und PC
- Geräte-Paarung mit Widerrufsmöglichkeit
- Monatliches Kostenlimit für Telefonie und Cloud-Modelle

## Umgang mit Geheimnissen

- API-Schlüssel nie in Obsidian, Quelltext oder Chatverlauf speichern.
- Windows-Anmeldeinformationsverwaltung oder einen geeigneten Secret Store verwenden.
- OAuth-Tokens pro Dienst trennen und mit möglichst kleinen Rechten anfordern.
- Tokens bei Geräteverlust sofort widerrufen können.

## Bestätigungsmatrix

- Lesen eigener Daten: ohne Bestätigung, wenn die Quelle freigegeben ist
- Lokale harmlose Einstellung: direkte Ausführung mit kurzer Einblendung
- Erstellen oder Ändern externer Daten: einfache Bestätigung
- Löschen, Bezahlen, Kontoänderung: doppelte Bestätigung oder grundsätzlich sperren
- Nachricht an andere Person: Entwurf automatisch, Senden nur nach Bestätigung

## Schutz vor falschen Anweisungen

Texte in Webseiten, Dokumenten, E-Mails oder Kalenderbeschreibungen gelten als Daten, nicht als Befehle. Nur der angemeldete Nutzer oder eine vorher definierte Automation darf Aktionen auslösen.

## Aufzeichnung und Privatsphäre

- Standardmäßig keine dauerhafte Audiospeicherung
- Transkripte wahlweise gar nicht oder nur kurz speichern
- Bildschirmbilder nach Abschluss der Aufgabe löschen, sofern sie nicht ausdrücklich gebraucht werden
- Persönliches Langzeitgedächtnis muss einsehbar, korrigierbar und löschbar sein
