export class User {
    constructor(id, username, email) {
        this.id = id;
        this.username = username;
        this.email = email;
        this.role = 'user';
        this.isBanned = false;
    }

    hasRole(role) {
        return this.role === role;
    }

    getInfo() {
        return `${this.username} (${this.role})`;
    }

    toJSON() {
        return {
            type: 'User', 
            id: this.id,
            username: this.username,
            email: this.email,
            role: this.role,
            isBanned: this.isBanned
        };
    }

   
    static fromJSON(data) {
        const user = new User(data.id, data.username, data.email);
        user.isBanned = data.isBanned || false;
        return user;
    }
}