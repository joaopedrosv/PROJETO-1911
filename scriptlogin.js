document.addEventListener('DOMContentLoaded', () => {
    const particlesContainer = document.querySelector('.particles');
    const particleCount = 100;

    function createParticle(x, y) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = `${x}px`;
        particle.style.top = `${y}px`;
        particlesContainer.appendChild(particle);
        
        // Animate particle
        setTimeout(() => {
            particle.style.transform = `translate(-50%, -50%) scale(0)`;
            particle.style.opacity = '0';
            setTimeout(() => {
                particlesContainer.removeChild(particle);
            }, 500); // Remove particle after animation
        }, 10);
    }

    document.addEventListener('mousemove', (event) => {
        createParticle(event.clientX, event.clientY);
    });
});
