const fs = require('fs');

// Load the HTML template and the content JSON
const template = fs.readFileSync('template.html', 'utf8');
const content = JSON.parse(fs.readFileSync('content.json', 'utf8'));

let finalHtml = template;

// Iterate over each entry in the content JSON
Object.entries(content).forEach(([key, value]) => {
    // Check if the value is an object (for nested properties like service details)
    if (typeof value === 'object' && !Array.isArray(value)) {
        // Handle nested properties for objects
        Object.entries(value).forEach(([nestedKey, nestedValue]) => {
            const nestedPlaceholder = `{{${key}_${nestedKey}}}`;
            finalHtml = finalHtml.replace(new RegExp(nestedPlaceholder, 'g'), nestedValue);
        });
    } else {
        // Directly replace the value for non-object entries
        const placeholder = `{{${key}}}`;
        finalHtml = finalHtml.replace(new RegExp(placeholder, 'g'), value);
    }
});

// Write the final HTML content to 'index.html'
fs.writeFileSync('index.html', finalHtml);

console.log('The index.html file has been generated successfully.');
