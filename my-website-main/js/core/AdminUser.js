import { User } from './User.js';


function checkPermission(target, name, descriptor) {
    const originalMethod = descriptor.value;
    descriptor.value = function (...args) {
    
        if (!this.hasPermission('manage_users')) {
            console.error(`[Безопасность] Отказано в доступе: У ${this.username} нет права 'manage_users'`);
            return null;
        }
        return originalMethod.apply(this, args);
    };
    return descriptor;
}

export class AdminUser extends User {
 
    static MAX_PERMISSIONS = 5;
    static BASE_PERMS = ['read', 'write']; 

    constructor(id, username, email) {
        super(id, username, email);
        this.role = 'admin';
        
      
        this.#permissions = new Set([...AdminUser.BASE_PERMS]);
        this.#logs = [];
    }

    #permissions; 
    #logs;        

    
    #logAction(action, details) {
        const entry = {
            time: new Date().toLocaleTimeString(),
            admin: this.username,
            action,
            details
        };
        this.#logs.push(entry);
        console.log(`[Журнал админа] ${entry.time} - ${action}:`, details);
    }

  
    grantPermission(permission) {
        
        if (permission === 'super_admin') {
            throw new Error("Нельзя выдать право 'super_admin' через этот метод.");
        }

  
        if (this.#permissions.size >= AdminUser.MAX_PERMISSIONS) {
            console.warn(`Лимит прав исчерпан (макс. ${AdminUser.MAX_PERMISSIONS}).`);
            return false;
        }

        if (!this.#permissions.has(permission)) {
            this.#permissions.add(permission);
            this.#logAction('GRANT', { permission });
            return true;
        }
        return false;
    }


    revokePermission(permission) {

        if (AdminUser.BASE_PERMS.includes(permission)) {
            console.warn(`Нельзя отозвать базовое право: ${permission}`);
            return false;
        }

        if (this.#permissions.has(permission)) {
            this.#permissions.delete(permission);
            this.#logAction('REVOKE', { permission });
            return true;
        }
        return false;
    }

    hasPermission(permission) {
        return this.#permissions.has(permission);
    }


    hasRole(role) {
        if (role === 'admin') return true;
        if (role === 'user') return true; 
        return super.hasRole(role);
    }

   
    getPermissions() {
        return Array.from(this.#permissions);
    }


    canManageUsers() {
        return this.hasPermission('manage_users');
    }

 
    banUser(user, reason) {
   
        if (!this.canManageUsers()) {
            console.error(`[Безопасность] Админ ${this.username} попытался заблокировать пользователя без прав.`);
            return false;
        }

        if (!(user instanceof User)) {
            throw new Error("Объект не является пользователем");
        }

        user.isBanned = true;
        this.#logAction('BAN_USER', { userId: user.id, username: user.username, reason });
        console.log(`Пользователь ${user.username} заблокирован. Причина: ${reason}`);
        return true;
    }


    toJSON() {
        const base = super.toJSON();
        return {
            ...base,
            type: 'AdminUser',
            permissions: this.getPermissions()
        };
    }


    static fromJSON(data) {
        const admin = new AdminUser(data.id, data.username, data.email);
        if (data.permissions) {
            data.permissions.forEach(p => admin.#permissions.add(p));
        }
        admin.isBanned = data.isBanned || false;
        return admin;
    }
}