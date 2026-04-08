class Shape {
    constructor(color) {
        this.color = color;
    }
    area() {
        throw new Error("Метод area() должен быть реализован");
    }
    describe() {
        return `Фигура цвета ${this.color}, Площадь: ${this.area().toFixed(2)}`;
    }
}

class Circle extends Shape {
    constructor(radius, color) {
        super(color);
        this.radius = radius;
    }
    area() {
        return Math.PI * this.radius ** 2;
    }
}

class Rectangle extends Shape {
    constructor(width, height, color) {
        super(color);
        this.width = width;
        this.height = height;
    }
    area() {
        return this.width * this.height;
    }
}

class Triangle extends Shape {
    constructor(a, b, c, color) {
        super(color);
        this.a = a; this.b = b; this.c = c;
    }
    area() {
 
        const p = (this.a + this.b + this.c) / 2;
        return Math.sqrt(p * (p - this.a) * (p - this.b) * (p - this.c));
    }
}

export { Shape, Circle, Rectangle, Triangle };