# Teacher Workbench → ViccoBoard: Prüfungsimport v1

ViccoBoard akzeptiert eine UTF-8-kodierte JSON-Datei. Die Version beschreibt eine **neue Prüfungsvorlage**, keine Korrektursitzung und keinen Notenschlüssel. Schüler-/Kandidatendaten werden nicht übertragen. Der vorhandene ViccoBoard-Korrekturimport verwendet ein anderes Format.

## JSON-Vertrag

```json
{
  "format": "viccoboard-exam",
  "version": 1,
  "title": "Prüfungstitel",
  "description": "Optionaler Prüfungsrahmen",
  "assessmentFormat": "test",
  "tasks": [
    {
      "title": "Aufgabe 1",
      "description": "Aufgabenstellung für Lernende",
      "criteria": [
        { "text": "Beobachtbares erwartetes Teilergebnis", "points": 2 },
        { "text": "Zweites bewertbares Teilergebnis", "points": 1.5 }
      ]
    },
    {
      "title": "Aufgabe 2",
      "description": "Übergreifender Arbeitsauftrag",
      "subtasks": [
        {
          "title": "Teilaufgabe a",
          "description": "Konkreter Teilauftrag",
          "criteria": [
            { "text": "Erwartetes Ergebnis der Teilaufgabe", "points": 2 }
          ]
        }
      ]
    }
  ]
}
```

- Pflicht: `format`, `version`, `title`, `assessmentFormat`, `tasks`. `description` ist auf Prüfungs- und Aufgabenebene optional.
- `assessmentFormat`: `klausur`, `test`, `mappenkorrektur`, `portfolio`, `referat`, `referatsrueckmeldung`, `facharbeit`, `muendliche-pruefung` oder `gruppenarbeit`.
- Jede Aufgabe besitzt einen nichtleeren `title` und **entweder** eine nichtleere `criteria`-Liste **oder** eine nichtleere `subtasks`-Liste. Beides gleichzeitig ist verboten. Maximal drei Hierarchieebenen.
- `description` auf Aufgabenebene enthält die **für Lernende sichtbare Aufgabenstellung**. `criteria[].text` enthält die **bewertbare Erwartung des Erwartungshorizonts**. Ein Kriterium entspricht einer konkreten Punktvergabe; keine pauschalen Niveau-Punkte zusätzlich vergeben.
- `criteria[].points` muss eine endliche, nichtnegative Zahl in 0,5er-Schritten sein. Jede bewertete Blattaufgabe muss insgesamt mehr als null Punkte haben. Elternknoten erhalten automatisch die Summe ihrer Teilaufgaben; Prüfungspunkte sind die Summe der Wurzelaufgaben.
- Maximal 100 Aufgaben inklusive Teilaufgaben, 1000 Kriterien und 10000 Gesamtpunkte. Titel maximal 500 Zeichen; Beschreibungen maximal 5000 Zeichen; Kriterientext maximal 2000 Zeichen. Unbekannte Felder oder Versionen werden abgelehnt statt stillschweigend verworfen.
- Es werden **keine IDs** mitgeliefert. ViccoBoard erzeugt beim Import IDs, Prüflingslisten und Korrekturwerte bleiben leer. Der Notenschlüssel wird zunächst mit dem vorhandenen ViccoBoard-Standard initialisiert; Notengrenzen sind im Prüfungseditor festzulegen.

## Übergabe

Teacher Workbench: Fertige Aufgaben und Erwartungshorizont prüfen; auf Anforderung „Für ViccoBoard exportieren“ die **gesamte JSON-Datei gemäß v1** erzeugen, ohne Schülerdaten und ohne Markdown-Hülle in der Datei.

ViccoBoard: `Prüfungen` → `Prüfung aus ChatGPT importieren` → Datei auswählen. Bei gültiger Datei entsteht eine neue Vorlage und der Prüfungseditor öffnet sich. Prüfungsaufgaben, Kriterien, Einzel-/Gesamtpunkte und Notenschlüssel vor dem Einsatz prüfen. Der Import erfordert keine Cloud-Kommunikation.