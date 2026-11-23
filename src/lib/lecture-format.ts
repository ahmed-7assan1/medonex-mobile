/** Same title casing as the website's lecture titles. Arabic is unchanged. */
export function lectureTitleCase(title:string){return title.split(/\s+/).map(word=>{if(!word||!/[A-Za-z]/.test(word))return word;if(word.length<=4&&word===word.toUpperCase()&&/^[A-Z]+$/.test(word))return word;return word[0].toUpperCase()+word.slice(1).toLowerCase()}).join(' ')}
