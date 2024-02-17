
// Content object to hold all website text
const siteContent = {
    title: "AAI IT Solutions",
    header: {
        mainHeading: "Welcome to AAI IT Solutions",
        subHeading: "Pioneering Advanced AI to Drive Business Forward",
    },
    services: {
        heading: "Our Services",
        service1: { title: "Service 1", description: "Description of Service 1." },
        service2: { title: "Service 2", description: "Description of Service 2." },
        service3: { title: "Service 3", description: "Description of Service 3." },
    },
    about: {
        heading: "About Us",
        text: "Information about AAI IT Solutions, its mission, vision, and the team.",
    },
    contact: {
        heading: "Contact Us",
        text: "Drop us a message and we'll get back to you as soon as possible.",
    },
};

// Function to render content
function renderSiteContent() {
    document.title = siteContent.title;
    document.getElementById('mainHeading').innerText = siteContent.header.mainHeading;
    document.getElementById('subHeading').innerText = siteContent.header.subHeading;
    document.getElementById('servicesHeading').innerText = siteContent.services.heading;
    // Repeat for each element you wish to dynamically fill in
}

// Call render function after the DOM is fully loaded
document.addEventListener('DOMContentLoaded', renderSiteContent);

console.log("Website loaded successfully");


document.getElementById('contactForm').addEventListener('submit', function(e) {
    e.preventDefault(); // Prevent the default form submission
    var formData = {
        name: document.getElementById('name').value,
        email: document.getElementById('email').value,
        message: document.getElementById('message').value,
    };
    fetch('YOUR_WEB_APP_URL', {
        method: 'POST',
        contentType: 'application/json',
        body: JSON.stringify(formData),
    })
    .then(response => response.json())
    .then(data => console.log(data))
    .catch(error => console.error('Error:', error));
});
