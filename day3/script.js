let notes = [
  { id: 1, text: "Buy milk and bread", category: "personal" },
  { id: 2, text: "Finish the Day 3 assignment", category: "study" },
  { id: 3, text: "Email the project report to Grace", category: "work" },
  { id: 4, text: "Revise JavaScript arrays", category: "study" },
  { id: 5, text: "Call mum", category: "personal" },
];

function searchNotes(word) {
    return notes.filter((note)=>
        note.text.toLowerCase().includes(word.toLowerCase())
    );
}

function longestNote() {
    if (notes.length === 0) {
        return null;
    }
    let longest = notes[0];

    for(const note of notes){
        if(note.text.length > longest.text.length){
            longest = note;
        }
    }
    return longest;
}


function countByCategory() {
  const counts = {};

  for (const note of notes) {
    const category = note.category;

    if (counts[category] === undefined) {
      counts[category] = 0;
    }

    counts[category] += 1;
  }

  return counts;
}



function getSummary(){
    const counts = countByCategory();
    const total = notes.length;
    const label = total === 1 ? "note" : "notes";

    return `${total} ${label}: ${counts.personal || 0} personal, ${counts.work || 0} work, ${counts.study || 0} study.`;
}


function isDuplicate(text){
    const normalizedText = text.trim().toLowerCase();

    return notes.some(
        (note) => note.text.trim().toLowerCase() === normalizedText
    );
}


function addNote(text, category){
    const trimmedText = text.trim();

    if(trimmedText.length < 1 || trimmedText.length > 200){
        console.log("Not Added: Text must be between 1 and 200 characters.");
        return false;
    }

    if(isDuplicate(trimmedText)){
        console.log("Not Added: This note already exists.");
        return false;
    }

    const allowedCategories = ["personal", "work", "study"];

    if(!allowedCategories.includes(category)){
        console.log("Not Added: Category must be work, personal, or study.");
        return false;
    }

    let nextId = 1;

    for(const note of notes){
        if(note.id >= nextId){
            nextId = note.id +1;
        }
    }

    notes.push({
        id: nextId,
        text: trimmedText,
        category: category,
    });

    console.log("Note Added.");
    return true;
}


//searchNotes tests
console.log(searchNotes("MILK"));
// Expected: [{ id: 1, text: "Buy milk and bread", category: "personal" }]

console.log(searchNotes("football"));
// Expected: []



//longestNote tests
console.log(longestNote());
// Expected: { id: 3, text: "Email the project report to Grace", category: "work" }

const savedNotes = notes;
notes = [];

console.log(longestNote());
// Expected: null

notes = savedNotes;



// countByCategory tests
console.log(countByCategory());
// Expected: { personal: 2, study: 2, work: 1 }

notes = [];

console.log(countByCategory());
// Expected: {}

notes = savedNotes;


// getSummary tests
console.log(getSummary());
// Expected: "5 notes: 2 personal, 1 work, 2 study."

notes = [savedNotes[0]];

console.log(getSummary());
// Expected: "1 note: 1 personal, 0 work, 0 study."

notes = [];

console.log(getSummary());
// Expected: "0 notes: 0 personal, 0 work, 0 study."

notes = savedNotes;


// isDuplicate tests
console.log(isDuplicate("  BUY MILK AND BREAD  "));
// Expected: true

console.log(isDuplicate("Book a dentist appointment"));
// Expected: false


// addNote tests
console.log(addNote("Book a dentist appointment", "personal"));
// Expected: logs "Note Added.", then true

console.log(addNote("  BOOK A DENTIST APPOINTMENT  ", "personal"));
// Expected: logs "Not Added: This note already exists.", then false

console.log(addNote("   ", "study"));
// Expected: logs "Not Added: Text must be between 1 and 200 characters.", then false

console.log(addNote("a".repeat(201), "study"));
// Expected: logs "Not Added: Text must be between 1 and 200 characters.", then false

console.log(addNote("Plan the weekend", "other"));
// Expected: logs "Not Added: Category must be work, personal, or study.", then false