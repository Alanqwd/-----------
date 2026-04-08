import { User } from './core/User.js';
import { AdminUser } from './core/AdminUser.js';
import { StorageManager } from './core/StorageManager.js';
import { Circle, Rectangle, Triangle } from './practices/Shapes.js';
import { Subject, LoggerObserver } from './practices/Observer.js';

document.addEventListener('DOMContentLoaded', () => {
    const btn = document.getElementById('demo-btn');
    const output = document.getElementById('output');

   
    const print = (text) => {
        const line = document.createElement('div');
        line.textContent = text;
        output.appendChild(line);
    };

    if (btn) {
        btn.addEventListener('click', () => {
            output.innerHTML = ''; 
            print("--- ДЕМОНСТРАЦИЯ НАСЛЕДОВАНИЯ И АДМИНКИ ---");

            
            const user1 = new User(1, 'ivan', 'ivan@mail.ru');
            const admin1 = new AdminUser(2, 'alex_admin', 'alex@admin.ru');

            print(`1. Создан пользователь: ${user1.getInfo()}`);
            print(`2. Создан админ: ${admin1.getInfo()}`);
            print(`   Админ имеет роль 'user'? ${admin1.hasRole('user')}`);

           
            print("\n--- Управление правами ---");
            print(`Начальные права админа: ${admin1.getPermissions().join(', ')}`);
            
            admin1.grantPermission('manage_users');
            admin1.grantPermission('delete_posts');
            print(`После выдачи: ${admin1.getPermissions().join(', ')}`);
            
         
            admin1.grantPermission('perm3');
            admin1.grantPermission('perm4');
            admin1.grantPermission('perm5'); 
            
            print(`Попытка добавить лишние права (лимит 5): результат виден в консоли warnings.`);
            print(`Текущие права: ${admin1.getPermissions().join(', ')}`);

        
            print("\n--- Безопасность и Бан ---");
            print(`Может управлять пользователями? ${admin1.canManageUsers()}`);
            
            print(`Статус ivan до бана: ${user1.isBanned ? 'Заблокирован' : 'Активен'}`);
            admin1.banUser(user1, 'Нарушение правил');
            print(`Статус ivan после бана: ${user1.isBanned ? 'Заблокирован' : 'Активен'}`);

          
            print("\n--- LocalStorage ---");
            StorageManager.save([user1, admin1]);
            print("Данные сохранены в LocalStorage.");

            const loadedUsers = StorageManager.load();
            const loadedAdmin = loadedUsers.find(u => u.role === 'admin');
            print(`Загружен админ: ${loadedAdmin.username}`);
            print(`Его права восстановлены: ${loadedAdmin.getPermissions().join(', ')}`);

           
            print("\n--- Практика: Фигуры ---");
            const shapes = [
                new Circle(10, 'Красный'),
                new Rectangle(5, 20, 'Синий'),
                new Triangle(3, 4, 5, 'Зеленый')
            ];
            shapes.forEach(s => print(s.describe()));

           
            print("\n--- Практика: Наблюдатель ---");
            const bus = new Subject();
            const logger = new LoggerObserver();
            bus.subscribe(logger);
            bus.notify({ event: 'TEST_EVENT', payload: 123 });
            print("Событие отправлено (см. консоль F12)");
        });
    }
});

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
