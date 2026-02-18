function highlightActiveLink() {
  const currentUrl = window.location.href;
  console.log(`Текущий url: ${currentUrl}`);


  const path = window.location.pathname;
  const page = path.substring(path.lastIndexOf('/') + 1);

 
  const navLinks = document.querySelectorAll('nav a');

  navLinks.forEach(link => {
    link.classList.remove('active');
    const href = link.getAttribute('href');
    if (href === page) {
      link.classList.add('active');
    }
  });
}

document.addEventListener('DOMContentLoaded', highlightActiveLink);
