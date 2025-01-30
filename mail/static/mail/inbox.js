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
  // Hide other views, show email details
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#email-details').style.display = 'block';

  fetch(`/emails/${id}`)
    .then(response => response.json())
    .then(email => {
      const div = document.querySelector('#email-details');

      div.innerHTML = `
        <div class="border rounded p-3 shadow-sm">
          <p><b>From:</b> ${email.sender}</p>
          <p><b>To:</b> ${email.recipients.join(', ')}</p>
          <p><b>Subject:</b> ${email.subject}</p>
          <p><b>Timestamp:</b> ${email.timestamp}</p>
          <hr>
          <pre class="p-2 bg-light border rounded">${email.body}</pre>
          <div class="mt-3 d-flex gap-2"></div>
        </div>
      `;

      // Mark email as read if in inbox
      if (mailbox === 'inbox') {
        fetch(`/emails/${id}`, {
          method: 'PUT',
          body: JSON.stringify({ read: true })
        });
      }

      const buttonContainer = div.querySelector('.d-flex');

      // Archive/Unarchive Button (Not for Sent Mail)
      if (mailbox !== 'sent') {
        const archiveButton = document.createElement('button');
        archiveButton.className = 'btn btn-sm btn-outline-primary';
        archiveButton.innerHTML = email.archived ? 'Unarchive' : 'Archive';

        archiveButton.addEventListener('click', function() {
          fetch(`/emails/${id}`, {
            method: 'PUT',
            body: JSON.stringify({ archived: !email.archived })
          })
          .then(response => response.json())
          .then(() => load_mailbox('inbox')); // Reload after request completes
        });

        buttonContainer.append(archiveButton);
      }

      // Reply Button
      const replyButton = document.createElement('button');
      replyButton.className = 'btn btn-sm btn-outline-primary';
      replyButton.innerHTML = "Reply";
      replyButton.addEventListener('click', () => reply_email(email));

      buttonContainer.append(replyButton);
    });
}



function load_mailbox(mailbox) {
  
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#email-details').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `
    <h3 class="mb-3">${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>
  `;

  fetch(`/emails/${mailbox}`)
  .then(response => response.json())
  .then(emails => {

    if (emails.length === 0) {
      const div = document.createElement('div');
      div.className = 'alert alert-info my-3';
      div.innerHTML = '<h5>No Emails!</h5>';
      document.querySelector('#emails-view').append(div);
      return;
    }

    emails.forEach(email => {
      const div = document.createElement('div');
      
      div.className = 'list-group-item shadow-sm p-3 my-2 rounded d-flex justify-content-between align-items-center';
      div.style.backgroundColor = email.read ? "#f0f0f0" : "white"; 
      div.style.cursor = "pointer";  
      div.style.transition = "0.3s";

      div.innerHTML = `
        <div>
          <b>${email.sender}</b> 
          <span class="text-muted"> - ${email.subject.length > 50 ? email.subject.slice(0, 50) + "..." : email.subject}</span>
        </div>
        <div><small class="text-muted">${email.timestamp}</small></div>
      `;

      div.addEventListener('click', () => view_email(email.id, mailbox));

      document.querySelector('#emails-view').append(div);
    });

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

