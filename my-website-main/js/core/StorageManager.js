import { UserFactory } from './UserFactory.js';

export class StorageManager {
    static KEY = 'blog_users_data';

    static save(usersArray) {
        const data = usersArray.map(u => u.toJSON());
        localStorage.setItem(this.KEY, JSON.stringify(data));
    }

    static load() {
        const json = localStorage.getItem(this.KEY);
        if (!json) return [];
        
        const data = JSON.parse(json);

        return data.map(item => UserFactory.fromJSON(item));
    }
    
    static clear() {
        localStorage.removeItem(this.KEY);
    }
}