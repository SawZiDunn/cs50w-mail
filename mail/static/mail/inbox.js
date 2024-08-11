document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  document.querySelector('#compose-form').addEventListener('submit', send_email);

  // By default, load the inbox
  load_mailbox('inbox');
});


function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';
  document.querySelector('#email-details').style.display = 'none';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
}


function reply_email(email) {

  compose_email();

  document.querySelector('#compose-recipients').value = email.sender;
  let subject = email.subject;
  if (!subject.startsWith("Re:")) {
    document.querySelector('#compose-subject').value = `Re: ${subject}`;
  } else {
    document.querySelector('#compose-subject').value = subject;
  }

  document.querySelector('#compose-body').value = `

----------------------------------------------
On ${email.timestamp} ${email.sender} wrote: 
${email.body}
  `;
}


function view_email(id, mailbox) {
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none ';
  document.querySelector('#email-details').style.display = 'block';

  fetch(`/emails/${id}`)
        .then(response => response.json())
        .then(email => {
          const div =  document.querySelector('#email-details');
            
          div.innerHTML = `

            <p><b>From:</b> ${email.sender}</p>
            <p><b>To: </b> ${email.recipients}</p>
            <p><b>Subject: </b> ${email.subject}</p>
            <p><b>Timestamp: </b> ${email.timestamp}</p>
            <hr>
            <div style="white-space: pre-line;">${email.body}</div>
            <br>
            `;
    
          if (mailbox === 'inbox') {

            fetch(`/emails/${id}`, {
              method: 'PUT',
              body: JSON.stringify({
                  read: true,
              })
            })

          }

          console.log(email.read);

          if (mailbox !== 'sent') {
            const button = document.createElement('button');
            button.className = 'btn btn-sm btn-outline-primary';
            button.innerHTML = email.archived? 'Unarchive' : 'Archive';
            button.addEventListener('click', function() {
              fetch(`/emails/${id}`, {
                method: 'PUT',
                body: JSON.stringify({archived: !email.archived,})
              })
              .then(() => load_mailbox('inbox'));
            })
        
            div.append(button);
          }
            
            
          const new_button = document.createElement("button");
          new_button.className = 'btn btn-sm btn-outline-primary mx-2';
          new_button.innerHTML = "Reply";
          new_button.addEventListener('click', () => reply_email(email));

          div.append(new_button);

      })
}


function load_mailbox(mailbox) {
  
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#email-details').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  fetch(`/emails/${mailbox}`)
  .then(response => response.json())
  .then(emails => {

    // console.log(Object.keys(emails).length);
    // console.log(emails.length);

    emails.forEach(email => {
      const div = document.createElement('div');
      
      div.className = 'list-group-item';
      div.style = `
        display: flex;
        justify-content: space-between; 
      `;

      div.style.backgroundColor = email.read? "grey" : "white";
      // div.classList.add('load_email');

      div.innerHTML = `
      <div><b>${email.sender}</b></div>
      <div><p>${email.subject}</p></div>
      <div><small>${email.timestamp}</small></div>
       `;

      div.addEventListener('click', () => view_email(email.id, mailbox));

      document.querySelector('#emails-view').append(div);
    });

    if (emails.length === 0) {
      const div = document.createElement('div');
      div.className = 'my-3';
      div.innerHTML = '<h5>No Email!</h5>';
      document.querySelector('#emails-view').append(div);
    }
  });
}


function send_email(event) {
  event.preventDefault();

  fetch('/emails', {

    method: 'POST',
    body: JSON.stringify({
        recipients: document.querySelector('#compose-recipients').value,
        subject: document.querySelector('#compose-subject').value,
        body: document.querySelector('#compose-body').value,
    })
    })
    .then(response => response.json())
    .then(result => load_mailbox('sent'));
}

