export class Post {
    constructor(id, title, content, authorId) {
        this.id = id;
        this.title = title;
        this.content = content;
        this.authorId = authorId;
        this.comments = [];
        this.createdAt = new Date();
    }

    addComment(comment) {
        this.comments.push(comment);
    }
}