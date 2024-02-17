const fs = require('fs');

const template = fs.readFileSync('template.html', 'utf8');
const content = JSON.parse(fs.readFileSync('content.json', 'utf8'));

let finalHtml = template;
Object.entries(content).forEach(([key, value]) => {
    const placeholder = new RegExp(`{{${key}}}`, 'g');
    finalHtml = finalHtml.replace(placeholder, value);
});

fs.writeFileSync('index.html', finalHtml);
console.log('index.html has been generated successfully.');
