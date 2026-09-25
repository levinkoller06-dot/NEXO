# Schritt 036 – Jev-Entscheidungs-Anzeige im HUD

Stand: 25.09.2026

Ausgangspunkt: [[035 2026-09-25 Jev-Integration ueber OpenRouter fuer click_by_name]]

## Auftrag

Nutzer will eine Anzeige sehen, welche Entscheidungen Jev nach einem Auftrag trifft – ausdrücklich mit der Anforderung, dass die Anzeige **wahr sein muss und nichts halluziniert wird**.

## Wie die Wahrheitsgarantie technisch sichergestellt ist

Die Anzeige liest ausschließlich Felder aus, die direkt aus der echten Jev-API-Antwort (oder dem dokumentierten Fallback ohne Jev) stammen – an keiner Stelle beschreibt das Gemini-Gesprächsmodell diese Entscheidung nochmal in eigenen Worten. Die Kette ist:

1. `desktop.js` (`clickByName`) speichert nach einer Jev-Entscheidung `jevDecision = { candidates, chosen, confidence }` unverändert im Rückgabewert des Werkzeugs – exakt das, was `jev.chooseCandidate()` von der echten API zurückbekommen hat (oder `confidence: null` beim dokumentierten Fallback ohne Jev-Zugriff).
2. `agent.js` übernimmt dieses Feld unverändert in den `toolLog`-Eintrag (kein Textfeld, keine Zusammenfassung durch das Sprachmodell).
3. `server.js` hängt diesen Log-Eintrag an `state.log` (bereits vorhandener Mechanismus, wurde aber bisher nirgends im Frontend angezeigt) und liefert ihn über das bestehende `/api/status`-Polling aus.
4. `conversation.js` rendert daraus direkt DOM-Elemente per `textContent` (kein `innerHTML`, keine Interpretation) – reine Anzeige der Rohdaten.

Damit kann NEXOs Gesprächsmodell diese Anzeige nicht verfälschen oder sich eine Entscheidung ausdenken, die Jev nie getroffen hat – es hat gar keinen Einfluss auf diesen Datenpfad.

## Änderungen

- **`App/index.html`**: neues Panel "JEV-ENTSCHEIDUNGEN" in der rechten Seitenleiste (Liste + Zähler + Leer-Hinweis).
- **`App/style.css`**: kleine Darstellung für die Liste (Konfidenz-Badge, Kandidatenzeile).
- **`App/conversation.js`**: `renderJevLog()` liest `data.log` (aus `/api/status`, bereits vorhanden) und rendert `click_by_name`-Einträge mit `jevDecision` als Liste – Auftragsgrund, gewähltes Element, Konfidenz in %, vollständige Kandidatenliste. Zeigt "Fallback" statt Prozent, wenn Jev nicht erreichbar war.
- **`Server/desktop.js`**: `clickByName` gibt jetzt `jevDecision` im Ergebnis zurück (nur wenn tatsächlich mehrere Kandidaten vorlagen).

## Ehrliche Einordnung

- Die Anzeige zeigt bisher nur `click_by_name`-Entscheidungen (die einzige aktuell bestehende Jev-Integration aus Schritt 035). Sobald Jev an weiteren Stellen eingebaut wird, muss dort ebenfalls ein `jevDecision`-Feld im Werkzeug-Ergebnis gesetzt werden, damit es hier erscheint.
- Kein echter Browser-Test (Projektregel/aktuelle Session ohne laufendes HUD). Getestet ist der Datenpfad bis `toolLog` (Unit-Tests); dass die Anzeige im echten Browser korrekt rendert, muss der Nutzer bestätigen.
- Zeigt nur die letzten 8 Entscheidungen der laufenden Sitzung, nicht sitzungsübergreifend gespeichert.

## Prüfung

- `node --test Code/Tests/*.test.js`: 63 Tests erfolgreich (2 bestehende Jev-Tests um eine Prüfung des `jevDecision`-Rückgabewerts ergänzt).

## Betroffene Dateien

`Code/App/index.html`, `Code/App/style.css`, `Code/App/conversation.js`, `Code/Server/desktop.js`, `Code/Tests/regression.test.js`.

## Nächster Schritt

Im echten HUD prüfen: Panel erscheint, füllt sich nach einer mehrdeutigen `click_by_name`-Aktion mit der echten Jev-Antwort. Danach ggf. weitere Jev-Integrationspunkte (Browser-Klicks) angehen, die dann ebenfalls in diesem Panel erscheinen würden.
