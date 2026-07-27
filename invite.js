const inviteWrapper = document.querySelector('.invite-envelope-wrapper');
const rsvpBtn = document.querySelector('.invite-rsvp-btn');
const inviteImg = document.querySelector('.invite-card-img');

// Modal Elements
const modal = document.getElementById('imageModal');
const expandedImg = document.getElementById('expandedImg');
const closeBtn = document.querySelector('.close-btn');

// Toggle the envelope open and closed on click
inviteWrapper.addEventListener('click', () => {
    inviteWrapper.classList.toggle('open');
});

// Prevent envelope from closing when guest clicks RSVP link
rsvpBtn.addEventListener('click', (e) => {
    e.stopPropagation();
});

// Open modal when the invitation image is clicked
inviteImg.addEventListener('click', (e) => {
    e.stopPropagation(); // Prevents envelope from closing
    modal.classList.add('show');
    expandedImg.src = inviteImg.src; // Copies the image into the modal
});

// Close modal when clicking the 'X' button
closeBtn.addEventListener('click', () => {
    modal.classList.remove('show');
});

// Close modal when clicking anywhere on the dark background
modal.addEventListener('click', (e) => {
    if (e.target === modal) {
        modal.classList.remove('show');
    }
});