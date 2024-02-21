document.addEventListener('DOMContentLoaded', function() {
    
    var database = firebase.database();
  
    document.getElementById('contact-form').addEventListener('submit', submitForm);
  
    function submitForm(e){
      e.preventDefault();
      
      var name = getInputVal('name');
      var email = getInputVal('email');
      var message = getInputVal('message');
      
      saveMessage(name, email, message);
      
      document.getElementById('contact-form').reset();
    }
  
    function getInputVal(id){
      return document.getElementById(id).value;
    }
  
    function saveMessage(name, email, message){
      var newMessageRef = database.ref('messages').push();
      newMessageRef.set({
        name: name,
        email: email,
        message: message
      }).then(() => {
        alert('Your message has been sent successfully.');
      }).catch((error) => {
        alert('Error sending message, please try again later.');
        console.error('Error writing new message to Firebase Database', error);
      });
    }
  });
  