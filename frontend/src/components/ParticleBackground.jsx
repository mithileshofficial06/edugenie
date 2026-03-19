import { useEffect, useRef } from 'react';

const PARTICLE_COUNT = 80;
const CONNECTION_DISTANCE = 120;
const COLORS = ['#00ffff', '#8b5cf6', '#ffffff'];

class Particle {
  constructor(width, height) {
    this.x = Math.random() * width;
    this.y = Math.random() * height;
    const speed = 0.3 + Math.random() * 0.5;
    const angle = Math.random() * Math.PI * 2;
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.size = 2;
    this.opacity = 0.4 + Math.random() * 0.3;

    // 10% chance white, rest split between cyan and purple
    const roll = Math.random();
    this.color = roll < 0.1 ? COLORS[2] : roll < 0.55 ? COLORS[0] : COLORS[1];
  }

  update(width, height) {
    this.x += this.vx;
    this.y += this.vy;

    if (this.x < 0 || this.x > width) this.vx *= -1;
    if (this.y < 0 || this.y > height) this.vy *= -1;

    // Clamp to bounds
    this.x = Math.max(0, Math.min(width, this.x));
    this.y = Math.max(0, Math.min(height, this.y));
  }

  draw(ctx) {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fillStyle = this.color.replace(')', `, ${this.opacity})`).replace('#', '');
    // Convert hex to rgba
    const r = parseInt(this.color.slice(1, 3), 16);
    const g = parseInt(this.color.slice(3, 5), 16);
    const b = parseInt(this.color.slice(5, 7), 16);
    ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${this.opacity})`;
    ctx.fill();
  }
}

export default function ParticleBackground() {
  const canvasRef = useRef(null);
  const particlesRef = useRef([]);
  const animationRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    const initParticles = () => {
      particlesRef.current = [];
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        particlesRef.current.push(new Particle(canvas.width, canvas.height));
      }
    };

    const drawConnections = () => {
      const particles = particlesRef.current;
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < CONNECTION_DISTANCE) {
            const opacity = 0.05 + 0.25 * (1 - dist / CONNECTION_DISTANCE);
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(0, 255, 255, ${opacity})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }
    };

    const animate = () => {
      if (document.visibilityState === 'hidden') {
        animationRef.current = requestAnimationFrame(animate);
        return;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const particles = particlesRef.current;

      // Update positions
      particles.forEach(p => p.update(canvas.width, canvas.height));

      // Draw connections first (below particles)
      drawConnections();

      // Draw particles on top
      particles.forEach(p => p.draw(ctx));

      animationRef.current = requestAnimationFrame(animate);
    };

    resize();
    initParticles();
    animate();

    window.addEventListener('resize', () => {
      resize();
      // Reinitialize particles on resize for proper bounds
      initParticles();
    });

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 0,
        pointerEvents: 'none',
      }}
    />
  );
}
