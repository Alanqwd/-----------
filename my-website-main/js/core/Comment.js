export class Comment {
    constructor(id, text, userId, postId) {
        this.id = id;
        this.text = text;
        this.userId = userId;
        this.postId = postId;
        this.createdAt = new Date();
    }
}
