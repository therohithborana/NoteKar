
let dbPromise;

function initDB() {
    if (dbPromise) return dbPromise;

    dbPromise = new Promise((resolve, reject) => {
        const request = indexedDB.open('glassPaneNotesDB', 1);

        request.onupgradeneeded = event => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains('notes')) {
                db.createObjectStore('notes', { keyPath: 'domain' });
            }
        };

        request.onsuccess = event => {
            resolve(event.target.result);
        };

        request.onerror = event => {
            console.error('IndexedDB error:', event.target.error);
            reject(event.target.error);
        };
    });
    return dbPromise;
}

async function saveNoteData(data) {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['notes'], 'readwrite');
        const store = transaction.objectStore('notes');
        const request = store.put(data);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => {
            console.error('Save error:', request.error);
            reject(request.error);
        }
    });
}

async function getNoteData(domain) {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['notes'], 'readonly');
        const store = transaction.objectStore('notes');
        const request = store.get(domain);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => {
             console.error('Get error:', request.error);
            reject(request.error);
        }
    });
}
