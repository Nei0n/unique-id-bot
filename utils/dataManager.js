const fs = require('fs');
const path = require('path');
const DATA_FILE = path.join(__dirname, '..', 'memberData.json');

// Initialize file if it doesn't exist
if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify({}));
}

function loadMemberData() {
    try {
        const data = fs.readFileSync(DATA_FILE, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        console.error("Error reading data file:", err);
        return {};
    }
}

function saveMemberData(data) {
    try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
    } catch (err) {
        console.error("Error writing data file:", err);
    }
}

function findNextId(data) {
    let nextId = 1;
    const usedIds = new Set(Object.values(data).map(d => parseInt(d.assignedId, 10)));
    while (usedIds.has(nextId)) {
        nextId++;
    }
    return nextId.toString().padStart(3, '0');
}

module.exports = {
    loadMemberData,
    saveMemberData,
    findNextId
};