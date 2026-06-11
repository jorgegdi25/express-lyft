const fs = require('fs');
const content = fs.readFileSync('app/admin/page.tsx', 'utf-8');
const lines = content.split('\n');
const stack = [];
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  for (let j = 0; j < line.length; j++) {
    const char = line[j];
    if (char === '{' || char === '(' || char === '[') {
      stack.push({ char, line: i + 1, col: j + 1 });
    } else if (char === '}' || char === ')' || char === ']') {
      if (stack.length === 0) {
        console.log(`Unmatched closing ${char} at line ${i + 1}`);
      } else {
        const last = stack.pop();
        if ((char === '}' && last.char !== '{') || (char === ')' && last.char !== '(') || (char === ']' && last.char !== '[')) {
          console.log(`Mismatched bracket at line ${i + 1}, col ${j + 1}: expected closing for ${last.char} from line ${last.line}, but found ${char}`);
        }
      }
    }
  }
}
if (stack.length > 0) {
  console.log('Unclosed brackets:');
  console.log(stack.slice(-5));
} else {
  console.log('All brackets balanced.');
}
