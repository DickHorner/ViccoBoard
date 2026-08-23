/**
 * A ready-to-edit CSV template for Cooper-test grading tables.
 *
 * Comment lines document the format and are intentionally kept because the
 * table import service ignores them. This makes the downloaded file both a
 * usable starting point and self-documenting after it is opened in Excel.
 */
export const COOPER_TABLE_CSV_TEMPLATE = `# ViccoBoard Cooper-Normen (Beispiel)
# Die erste Zeile mit Daten sind die Spaltennamen. Die letzte Spalte muss "value" heißen.
# Werte und Grenzen an die eigene Lerngruppe anpassen; Spaltenreihenfolge beibehalten.
min_meters,max_meters,value
3200,9999,1
2800,3199,2
2400,2799,3
2000,2399,4
1600,1999,5
0,1599,6
`;

export const COOPER_TABLE_TEMPLATE_FILE_NAME = 'viccoboard-cooper-normen-vorlage.csv';
