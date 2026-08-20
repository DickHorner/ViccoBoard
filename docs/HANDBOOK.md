# The 21st Century Coder's Handbook

## Ein Manifest für Coder mit Respekt vor der Maschine

Version: 0.4  
Stand: 7.7.2026

Dieses Dokument ist die einzige Engineering-Policy-Quelle für ViccoBoard. Andere Instruktions-, Agenten-, Review- und Qualitätsdokumente dürfen diese Regeln nur anwenden, aber nicht neu definieren.

## Grundformel

AI gibt Tempo. Das Repo gibt Form. Die Maschine gibt Grenzen. Der Beweis gibt Freigabe.

AI darf Code schreiben, suchen und mechanische Arbeit beschleunigen. Verantwortlich bleibt der Mensch, der die Änderung liest, versteht, begrenzt und beweist.

## Grundhaltung

Generierter Code ist nicht automatisch entwickelter Code. Eine Änderung darf erst bleiben, wenn sie repo-nativ, idiomatisch, klein, prüfbar und kostenbewusst ist.

Der Maßstab ist nicht Outputmenge. Der Maßstab ist Code, dessen Form im Repo belegbar ist, dessen Kontrollfluss zur Sprache passt und dessen Verhalten unter Fehlern, Last und Wartungsdruck nachvollziehbar bleibt.

## Die zwölf Gelöbnisse

1. Ich lese, was ich shippe.
2. Ich kann erklären, was ich committe.
3. Ich beginne im Repo, nicht im Prompt.
4. Ich suche vor jeder Änderung zwei bis drei ähnliche Stellen.
5. Ich ändere nur die kleinste notwendige Codefläche.
6. Ich baue keine Architektur für hypothetische Zukunft.
7. Ich modelliere Daten, Invarianten und Fehlergrenzen zuerst.
8. Ich mache Spezialfälle nach Möglichkeit zum Normalfall.
9. Ich bezahle jede Abstraktion mit einem echten Bedarf.
10. Ich behandle Security, Ressourcen und Fehlerpfade als Teil des Designs.
11. Ich beweise Verhalten durch Tests, Checks oder reproduzierbare Läufe.
12. Ich höre auf, wenn der Slice erfüllt ist.

## Anti-Bloat-Gesetze

Keine neue Schicht ohne klaren zweiten Nutzen. Kein generischer Helper für später. Keine Option, kein Flag und kein Pluginpunkt ohne echte aktuelle Anforderung. Keine neue Dependency ohne zwingenden Grund und Kostenprüfung. Keine Formatierungswelle im Feature-Patch. Keine stillen Fehler. Keine semantische Doppelspur. Keine zwei Quellen der Wahrheit. Keine Kommentare, die nur unklaren Code entschuldigen. Keine Performancebehauptung ohne Messung oder nachvollziehbare Kostenanalyse. Keine Securitybehauptung ohne geprüfte Boundary. Kein DONE ohne Nachweis.

## Repo-first

Vor jeder Änderung werden zwei bis drei ähnliche Stellen im Repo geprüft. Der Patch folgt vorhandener Dateiplatzierung, Benennung, Syntaxform, Kontrollfluss, Validierung, Fehlerbehandlung, Tests, Imports, Exports und Tooling.

Repo-native ist kein Gefühl, sondern ein Nachweis. Wenn es kein passendes Vorbild gibt, bleibt das neue Muster klein, lokal und begründet. Wenn ein vorhandenes Muster unsicher, falsch oder veraltet ist, wird das benannt und nicht still reproduziert.

## Sprach- und Idiom-Gate

Kämpfe nicht gegen die Sprache. Nutze natürliche Syntax und Kontrollflussformen des Ökosystems und des Repos.

Fragile Fortsetzungssyntax, fremde Formatierungsregeln, gemischte Entscheidungslogik für denselben Fall und Helper, die nur generierten Code strukturierter aussehen lassen, sind Gerüche. Nach jedem Patch folgt ein Idiom-Pass: vereinfachen oder konkret begründen.

## Agenten-Workflow

Jeder technische Eingriff folgt dieser Reihenfolge:

1. Context: Repo-Struktur prüfen und zwei bis drei ähnliche Stellen lesen.
2. Idiom: lokale Syntax- und Kontrollflussform ableiten.
3. Slice: Ziel, Nicht-Ziele und Stop-Bedingung eng definieren.
4. Shape: Datenform, Invarianten, Fehlerpfade, Trust Boundaries und Maschinenkosten klären.
5. Patch: kleinste repo-native Änderung umsetzen.
6. Delete: Weirdness, spekulative Helfer, unnötige Optionen und künstliche Nähte entfernen.
7. Prove: stärkste machbare Syntax-, Typ-, Build-, Test-, Dry-Run-, Security- und Ressourcenkontrolle ausführen.
8. Report: Ergebnis mit DONE, NOT DONE, CHECKS, READY FOR NEXT STEP berichten.
9. Stop: nicht organisch weiterbauen.

## Maschinenrespekt praktisch

Relevante Änderungen müssen klären, ob Arbeit pro Request, Render, Element oder Datei läuft; ob Daten unnötig kopiert oder mehrfach geparst werden; ob Parallelität, Timeouts, Abbruch und Backpressure kontrolliert sind; ob Zustand dupliziert wird; ob die Public API größer als nötig ist; ob Spezialfälle durch bessere Datenform verschwinden können; und ob der Slice rollbackfähig bleibt.

## ViccoBoard-spezifische harte Grenzen

ViccoBoard ist web-only, lokal-first und auf iPadOS Safari ausgerichtet. Runtime-Server sind kein Standardbetrieb. Export läuft über Download, Import über Dateiauswahl. Online-Integrationen bleiben optional und standardmäßig aus.

Die Architekturgrenze bleibt `apps -> modules -> packages`. Fachlogik gehört in `modules/*`; geteilte Contracts gehören in `packages/core`; Storage-Adapter gehören in `packages/storage`; die UI nutzt Bridges und Use-Cases statt direkter Speicherpfade.

`Plan.md` ist die Produkt- und Feature-Scope-Quelle. `HANDBOOK.md` ist die Engineering-Policy-Quelle. Beide dürfen nicht vermischt werden.

## Definition of Done

Eine Änderung ist nur fertig, wenn der Scope eingehalten wurde, konkrete Repo-Präzedenz genannt werden kann, Syntax und Kontrollfluss idiomatisch sind, Invarianten und Fehlerpfade klar sind, Security-relevante Grenzen geprüft wurden, Ressourcen- und Laufzeitkosten verstanden sind, keine unnötige Abstraktion oder Dependency eingeführt wurde und die Änderung durch passende Checks bewiesen oder ausdrücklich als nicht verifiziert markiert ist.

## Integrationskarte

Dieses Handbook vereint drei frühere Schichten: Manifest als dauerhafte Haltung, Handwriting Rules als Patch-Disziplin und Motherlode als Risiko- und Nachweissystem. Die stabile Reihenfolge lautet:

1. Manifest gibt Richtung.
2. Repo gibt Form.
3. Handwriting gibt Patch-Disziplin.
4. Motherlode gibt Risiko- und Nachweisgrenzen.
5. Tests und Checks geben Freigabe.

## Schlussformel

Der Coder des 21. Jahrhunderts schreibt nicht mehr jede Zeile selbst. Aber er bleibt verantwortlich für jede Zeile.
