console.log("Сайт загружен");

document.addEventListener('DOMContentLoaded', function() {

    const navBar = document.querySelector('.nav-bar');

 
    if (navBar) {

        const navLinks = navBar.querySelectorAll('a');

  
        navLinks.forEach(link => {
          
            link.addEventListener('click', function(event) {
                
                event.preventDefault();

                
                const linkText = this.textContent.trim();

            
                console.log('Текст ссылки:', linkText);
            });
        });
    } else {
        console.error('Элемент навигации с классом "nav-bar" не найден.');
    }
});

document.addEventListener('DOMContentLoaded', function() {
    const header = document.querySelector('header'); 
    if (header) {
        header.style.backgroundColor = 'lightblue'; 
    }
});
document.addEventListener('DOMContentLoaded', function() {

    const dateElement = document.getElementById('current-date');

    if (dateElement) {
        const currentDate = new Date();
        const day = String(currentDate.getDate()).padStart(2, '0');
        const month = String(currentDate.getMonth() + 1).padStart(2, '0');
        const year = currentDate.getFullYear();

       
        const formattedDate = `${day}.${month}.${year}`;

        
        dateElement.textContent = formattedDate;
    }
});
