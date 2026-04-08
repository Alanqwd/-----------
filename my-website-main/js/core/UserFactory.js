import { User } from './User.js';
import { AdminUser } from './AdminUser.js';

export class UserFactory {
    static create(role, id, username, email) {
        switch (role) {
            case 'admin':
                return new AdminUser(id, username, email);
            case 'user':
            default:
                return new User(id, username, email);
        }
    }

  
    static fromJSON(data) {
        if (data.type === 'AdminUser') {
            return AdminUser.fromJSON(data);
        }
        return User.fromJSON(data);
    }
}