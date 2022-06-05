document.addEventListener("DOMContentLoaded", function () {
  // Use buttons to toggle between views
  document
    .querySelector("#inbox")
    .addEventListener("click", () => load_mailbox("inbox"));
  document
    .querySelector("#sent")
    .addEventListener("click", () => load_mailbox("sent"));
  document
    .querySelector("#archived")
    .addEventListener("click", () => load_mailbox("archive"));
  document.querySelector("#compose").addEventListener("click", compose_email);
  // Send mail by pressing submit button
  document
    .querySelector("#compose-form")
    .addEventListener("submit", send_email);

  // By default, load the inbox
  load_mailbox("inbox");
});

function compose_email() {
  // Show compose view and hide other views
  document.querySelector("#emails-view").style.display = "none";
  document.querySelector("#compose-view").style.display = "block";
  document.querySelector("#single-email-view").style.display = "none";

  // Clear out composition fields
  document.querySelector("#compose-recipients").value = "";
  document.querySelector("#compose-subject").value = "";
  document.querySelector("#compose-body").value = "";
}

function send_email(event) {
  // Prevent page from refreshing
  event.preventDefault();

  // Sends the mail using the values from the form inputs
  fetch("/emails", {
    method: "POST",
    body: JSON.stringify({
      recipients: document.querySelector("#compose-recipients").value,
      subject: document.querySelector("#compose-subject").value,
      body: document.querySelector("#compose-body").value,
    }),
  })
    .then((response) => response.json())
    .then((result) => {
      // Load the user's sent mailbox
      load_mailbox("sent");
    });
}

function load_mailbox(mailbox) {
  // Show the mailbox and hide other views
  document.querySelector("#emails-view").style.display = "block";
  document.querySelector("#compose-view").style.display = "none";
  document.querySelector("#single-email-view").style.display = "none";

  // Show the mailbox name
  document.querySelector("#emails-view").innerHTML = `<h3>${
    mailbox.charAt(0).toUpperCase() + mailbox.slice(1)
  }</h3>`;

  fetch(`/emails/${mailbox}`)
    .then((response) => response.json())
    .then((emails) => {
      emails.forEach((email) => {
        // Create the div for the email
        const emailDiv = document.createElement("div");

        // emailDiv.id = `email${email.id}`;
        emailDiv.style.cssText =
          "display: flex; border-style: solid; border-width: 0.1em; padding: 0.2em;";

        // Add the sender, subject and timestamp to the content of the div
        emailDiv.innerHTML = `
        <span style="font-weight: bold;">${email.sender}</span>
        <span style="margin-left: 1em;">${email.subject}</span>
        <span style="margin-left: auto;">${email.timestamp}</span>
        `;

        // If email is read, set bg color of the div to gray, else set it to white
        email.read
          ? (emailDiv.style.backgroundColor = "gray")
          : (emailDiv.style.backgroundColor = "white");

        emailDiv.addEventListener("click", () => view_mail(email.id));

        document.querySelector("#emails-view").append(emailDiv);
      });
    });
}

function view_mail(id) {
  // Show the mail and hide other views
  document.querySelector("#emails-view").style.display = "none";
  document.querySelector("#compose-view").style.display = "none";
  document.querySelector("#single-email-view").style.display = "block";

  // Check the mailbox the user is in
  const mailbox = document.querySelector("#emails-view h3").innerHTML;

  // Clear previously shown email
  document.querySelector("#single-email-view").innerHTML = "";

  fetch(`/emails/${id}`)
    .then((response) => response.json())
    .then((email) => {
      // Create the div containing the sender
      const senderDiv = document.createElement("div");
      senderDiv.innerHTML = `
      <span style="font-weight: bold;">From: </span>
      <span>${email.sender}</span>
      `;

      // Create the div containing the recipients
      const recipientsDiv = document.createElement("div");
      recipientsDiv.innerHTML = '<span style="font-weight: bold;">To: </span>';

      // Add each recipients email to the div
      email.recipients.forEach((recipient) => {
        recipientsDiv.innerHTML += `<span>${recipient} </span>`;
      });

      // Create the div containing the subject
      const subjectDiv = document.createElement("div");
      subjectDiv.innerHTML =
        '<span style="font-weight: bold;">Subject: </span>';

      // If the subject is empty, notify the user, otherwise print it
      email.subject === ""
        ? (subjectDiv.innerHTML +=
            "<span>This email does not have a subject</span>")
        : (subjectDiv.innerHTML += `<span>${email.subject} </span>`);

      // Create the div containing the recipients
      const timeDiv = document.createElement("div");
      timeDiv.innerHTML = `
      <span style="font-weight: bold;">Timestamp: </span>
      <span>${email.timestamp}</span>
      `;

      // Create the reply button
      const replyBtn = document.createElement("button");
      replyBtn.classList.add("btn", "btn-sm", "btn-outline-primary");
      replyBtn.innerHTML = "Reply";
      replyBtn.addEventListener("click", () => {
        compose_email();
        document.querySelector("#compose-recipients").value = email.sender;

        // If the subject starts with Re:, just print the subject name, else add an Re: to the front of the subject
        email.subject.slice(0, 3) == "Re:"
          ? (document.querySelector("#compose-subject").value = email.subject)
          : (document.querySelector("#compose-subject").value =
              "Re: " + email.subject);
        document.querySelector("#compose-body").value =
          "On " +
          email.timestamp +
          " " +
          email.sender +
          " wrote: " +
          email.body;
      });

      // Add all created elements to the single email view
      document
        .querySelector("#single-email-view")
        .append(senderDiv, recipientsDiv, subjectDiv, timeDiv, replyBtn);

      if (mailbox == "Inbox") {
        // If viewing an inbox email, create an archive button
        const archiveBtn = document.createElement("button");
        archiveBtn.classList.add("btn", "btn-sm", "btn-outline-primary");
        archiveBtn.innerHTML = "Archive";

        archiveBtn.addEventListener("click", () => {
          fetch(`/emails/${id}`, {
            method: "PUT",
            body: JSON.stringify({
              archived: true,
            }),
          })
            .then((response) => console.log(response.json()))
            .then((result) => {
              load_mailbox("inbox");
            });
        });
        document.querySelector("#single-email-view").append(archiveBtn);
      } else if (mailbox == "Archive") {
        // If viewing an archived email, create an unarchive button
        const unarchiveBtn = document.createElement("button");
        unarchiveBtn.classList.add("btn", "btn-sm", "btn-outline-primary");
        unarchiveBtn.innerHTML = "Unarchive";

        unarchiveBtn.addEventListener("click", () => {
          fetch(`/emails/${id}`, {
            method: "PUT",
            body: JSON.stringify({
              archived: false,
            }),
          })
            .then((response) => console.log(response.json()))
            .then((result) => {
              load_mailbox("inbox");
            });
        });
        document.querySelector("#single-email-view").append(unarchiveBtn);
      }

      // Create a hr tag and a span tag for email body
      const hr = document.createElement("hr");
      const emailBody = document.createElement("span");

      // If the body is empty, notify the user, otherwise print it
      email.body === ""
        ? (emailBody.innerHTML = "This email does not have a body.")
        : (emailBody.innerHTML = `${email.body}`);

      document.querySelector("#single-email-view").append(hr, emailBody);
    });

  // Set email as read
  fetch(`/emails/${id}`, {
    method: "PUT",
    body: JSON.stringify({
      read: true,
    }),
  });
}
