class Piece {
    public rotation = 0;

    constructor(
        public name: string,
        public edges: [number, number, number, number],
        public codes: Array<[number, number]>
    ) {
    }

    // Liefert die Kante mit Berücksichtigung der Rotation.
    public getEdge(edge: number): number {
        const idx = (edge + this.rotation) % 4;
        return this.edges[idx];
    }

    // Liefert die Codes, die in der aktuellen Roatation lesbar sind.
    public getCode(): [number, number] {
        return this.codes[this.rotation];
    }
}

const pieces = [
    new Piece("p1", [1, -1, -2, 3], [[0x66, 0x70], [0x41, 0x51], [0x72, 0x59], [0x4e, 0x6f]]),
    new Piece("p2", [4, -4, -3, 3], [[0x59, 0x59], [0x66, 0x68], [0x67, 0x54], [0x67, 0x53]]),
    new Piece("p3", [-4, 1, 4, -3], [[0x62, 0x72], [0x63, 0x72], [0x6e, 0x79], [0x61, 0x2e]]),
    new Piece("p4", [-2, 1, 1, -3], [[0x72, 0x7a], [0x21, 0x51], [0x49, 0x42], [0x52, 0x48]]),
    new Piece("p5", [4, -2, -2, 3], [[0x74, 0x72], [0x41, 0x51], [0x41, 0x62], [0x41, 0x72]]),
    new Piece("p6", [-2, 2, 3, -4], [[0x72, 0x65], [0x6e, 0x66], [0x47, 0x6e], [0x3a, 0x41]]),
    new Piece("p7", [4, -1, -3, 1], [[0x75, 0x21], [0x5a, 0x42], [0x51, 0x76], [0x54, 0x68]]),
    new Piece("p8", [2, -2, -4, 4], [[0x31, 0x35], [0x5a, 0x42], [0x6e, 0x70], [0x76, 0x61]]),
    new Piece("p9", [3, -1, -3, 2], [[0x76, 0x61], [0x61, 0x74], [0x75, 0x67], [0x56, 0x66]])
]

// Erzeugt alle Permutationen eines Array mit Hilfe des Heap
// Algorithmus (see https://en.wikipedia.org/wiki/Heap%27s_algorithm).
const permutate = (a: Array<number>, size: number, n: number, result: Array<Array<number>>): void => {
    if (size === 1) {
        result.push(Object.assign([], a));
    } else {
        permutate(a, size - 1, n, result);

        for (let i = 0; i < (size - 1); i++) {
            if (size % 2 === 1) {
                const temp = a[0];
                a[0] = a[size - 1];
                a[size - 1] = temp;
            } else {
                const temp = a[i];
                a[i] = a[size - 1];
                a[size - 1] = temp;
            }
            permutate(a, size - 1, n, result);
        }
    }
}

// Liefert true, wennn das Stück an Position "pos" zu den Teilen oberhalb und links davon passt.
const checkPosition = (a: Array<Piece>, pos: number): boolean => {
    if (pos === 0) {
        // Das Stück links oben passt immer
        return true;
    }

    const piece1 = a[pos];
    const row = Math.floor(pos / 3);
    const col = pos % 3;

    if (row > 0) {
        // prüfe obere Kante
        const piece2 = a[pos - 3];
        const ep1 = piece1.getEdge(0);
        const ep2 = piece2.getEdge(2);
        if (ep1 + ep2 !== 0) {
            return false;
        }
    }

    if (col > 0) {
        // prüfe linke Kante
        const piece2 = a[pos - 1];
        const ep1 = piece1.getEdge(3);
        const ep2 = piece2.getEdge(1);
        if (ep1 + ep2 !== 0) {
            return false;
        }
    }

    return true;
}

// Probiert alle vier Rotationen für das Stück an Position "pos" aus. Für alle passenden
// Rotationen wird wird beim nächsten Stück weitergemacht. Liefert den Wert true, wenn
// eine Lösung gefunden wurde, d.h. passende Rotationen für alle weiteren Teile gefunden
// wurden.
const rotateAndSolve = (a: Array<Piece>, pos = 0): boolean => {
    if (pos === a.length) {
        return true; // Wir sind alle Teile durch => eine Lösung wurde gefunden!!!
    }

    const piece = a[pos];
    for (let i = 0; i < 4; i++) {
        piece.rotation = i;
        const ok = checkPosition(a, pos);
        if (ok) {
            if (rotateAndSolve(a, pos + 1)) {
                return true;
            }
        }
    }
    return false;
}

const rot13 = (str: string): string => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
    return str.split('').map(c => {
        const lowercase = c.charCodeAt(0) > 'Z'.charCodeAt(0);
        const c2 = lowercase ? c.toUpperCase() : c;
        const pos = chars.indexOf(c2);
        const c3 = pos === -1 ? c : chars[(pos + 13) % chars.length];
        return lowercase ? c3.toLowerCase() : c3;
    }).join('');
}

const startTime = performance.now();

// Wir erstellen alle möglichen Permutationen der Puzzlestücke hinsichtlich
// der Position (aber nicht Rotation).
const a = [0, 1, 2, 3, 4, 5, 6, 7, 8];
const placements: Array<Array<number>> = [];
permutate(a, a.length, a.length, placements);

// Danach gehen wir alle Permutationen durch. Bei jeder Permutation drehen wir die
// Teile bis sie zusammenpassen. Dazu fangen wir mit dem Teil links oben an und
// untersuchen alle vier rotierte Varianten. Ausgehend vom ersten Teil drehen wird
// das Teil rechts davon so lange, bis es dazu passt. Das selbe mit dem Teil
// danach, usw. Passt ein Teil in keiner rotierten Variante, dann brechen wir ab, und
// es geht mit der nächsten Permutation weiter.
const constellation: Array<Piece> = Object.assign([], pieces);
for (let p = 0; p < placements.length; p++) {
    // Wir initalisieren "placement" mit der aktuelle Permutation und setzen die Rotation auf 0.
    const placement = placements[p];
    placement.forEach((p, idx) => {
        constellation[idx] = pieces[p];
        constellation[idx].rotation = 0;
    });

    if (rotateAndSolve(constellation)) {
        // Nür Lösungen beachten, bei denen der Pfeil des Stücks 2 nach oben zeigt.
        if (pieces[1].rotation === 1) {
            console.log('Puzzle Lösung:');
            constellation.forEach((piece) => {
                console.log(` Teil ${piece.name}, Rotation: ${piece.rotation}`);
            });

            // Dekodierung Schritt 1: ASCII Hex Codes in String umwandeln
            let codes: Array<number> = [];
            constellation.forEach((piece) => {
                codes = codes.concat(piece.getCode());
            });

            // Dekodierung Schritt 2: String per Rot13 dekodieren
            console.log(`\nCodes:\n ${codes.map(c => c.toString(16)).join(', ')}`);
            const codesStr = codes.map(c => String.fromCharCode(c)).join('');
            console.log(`\nZwischenlösung:\n ${codesStr}`);
            console.log(`\nEndlösung:\n ${rot13(codesStr)}`);
        }
    }
}

const endTime = performance.now()
console.log(`\nDauer: ${Math.round(endTime - startTime)} Millisekunden`)
