export class ParticleSystem {
    constructor() {
        this.particles = [];
    }

    spawn(x, y, color, count, speedMult = 1, size = 3) {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = (Math.random() * 200 + 50) * speedMult;
            this.particles.push({
                x: x,
                y: y,
                dx: Math.cos(angle) * speed,
                dy: Math.sin(angle) * speed,
                color: color,
                size: Math.random() * size + 2,
                life: 1.0,
                decay: Math.random() * 1.5 + 0.5
            });
        }
    }

    update(dtSeconds) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            let particle = this.particles[i];
            particle.x += particle.dx * dtSeconds;
            particle.y += particle.dy * dtSeconds;
            particle.life -= particle.decay * dtSeconds;
            if (particle.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }

    draw(ctx) {
        for (let particle of this.particles) {
            ctx.globalAlpha = particle.life;
            ctx.fillStyle = particle.color;
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.closePath();
        }
        ctx.globalAlpha = 1.0;
    }
}
