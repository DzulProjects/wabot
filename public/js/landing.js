// Landing Page JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Smooth scrolling for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Navbar scroll effect
    window.addEventListener('scroll', function() {
        const navbar = document.querySelector('.navbar');
        if (window.scrollY > 100) {
            navbar.style.background = 'rgba(10, 10, 15, 0.95)';
            navbar.style.borderBottomColor = 'rgba(255, 255, 255, 0.2)';
        } else {
            navbar.style.background = 'rgba(10, 10, 15, 0.8)';
            navbar.style.borderBottomColor = 'rgba(255, 255, 255, 0.1)';
        }
    });

    // Feature cards hover effects
    document.querySelectorAll('.feature-card').forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-10px) rotateX(5deg)';
            this.style.boxShadow = '0 30px 60px rgba(0, 255, 255, 0.3)';
        });

        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) rotateX(0deg)';
            this.style.boxShadow = '0 20px 40px rgba(0, 255, 255, 0.2)';
        });
    });

    // Status indicators animation
    function updateStatus() {
        const statusItems = document.querySelectorAll('.status-indicator');
        statusItems.forEach(indicator => {
            // Simulate status check
            const isOnline = Math.random() > 0.1; // 90% uptime simulation
            indicator.className = `status-indicator ${isOnline ? 'online' : 'offline'}`;
        });
    }

    // Update status every 5 seconds
    updateStatus();
    setInterval(updateStatus, 5000);

    // Parallax effect for hero section
    window.addEventListener('scroll', function() {
        const scrolled = window.pageYOffset;
        const rate = scrolled * -0.5;
        
        const hero = document.querySelector('.hero-visual');
        if (hero) {
            hero.style.transform = `translateY(${rate}px)`;
        }

        // Animate hologram rings based on scroll
        const rings = document.querySelectorAll('.hologram-ring');
        rings.forEach((ring, index) => {
            const rotateSpeed = (index + 1) * 0.1;
            ring.style.transform = `rotate(${scrolled * rotateSpeed}deg)`;
        });
    });

    // Add floating animation to particles
    function createFloatingParticles() {
        const particleContainer = document.querySelector('.floating-particles');
        if (!particleContainer) return;

        for (let i = 0; i < 20; i++) {
            const particle = document.createElement('div');
            particle.style.position = 'absolute';
            particle.style.width = Math.random() * 4 + 2 + 'px';
            particle.style.height = particle.style.width;
            particle.style.backgroundColor = ['#00ffff', '#ff00ff', '#ffff00'][Math.floor(Math.random() * 3)];
            particle.style.borderRadius = '50%';
            particle.style.left = Math.random() * 100 + '%';
            particle.style.top = Math.random() * 100 + '%';
            particle.style.opacity = Math.random() * 0.5 + 0.2;
            particle.style.animation = `float ${Math.random() * 10 + 10}s linear infinite`;
            particle.style.animationDelay = Math.random() * 10 + 's';
            
            particleContainer.appendChild(particle);
        }
    }

    createFloatingParticles();

    // Intersection Observer for animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
                
                // Special animations for specific elements
                if (entry.target.classList.contains('feature-card')) {
                    setTimeout(() => {
                        entry.target.style.opacity = '1';
                        entry.target.style.transform = 'translateY(0)';
                    }, Math.random() * 500);
                }
                
                if (entry.target.classList.contains('stat')) {
                    animateCounter(entry.target.querySelector('.stat-number'));
                }
            }
        });
    }, observerOptions);

    // Observe elements for scroll animations
    document.querySelectorAll('.feature-card, .stat, .status-item').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(50px)';
        el.style.transition = 'all 0.6s ease';
        observer.observe(el);
    });

    // Counter animation for stats
    function animateCounter(element) {
        const text = element.textContent;
        if (text === '24/7' || text === '∞' || text === '🚀') return;
        
        const finalNumber = parseInt(text) || 100;
        let currentNumber = 0;
        const increment = finalNumber / 50;
        const timer = setInterval(() => {
            currentNumber += increment;
            if (currentNumber >= finalNumber) {
                element.textContent = text;
                clearInterval(timer);
            } else {
                element.textContent = Math.floor(currentNumber);
            }
        }, 50);
    }

    // Button click effects
    document.querySelectorAll('.card-button').forEach(button => {
        button.addEventListener('click', function(e) {
            // Create ripple effect
            const ripple = document.createElement('span');
            const rect = this.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;
            
            ripple.style.width = ripple.style.height = size + 'px';
            ripple.style.left = x + 'px';
            ripple.style.top = y + 'px';
            ripple.classList.add('ripple');
            
            this.appendChild(ripple);
            
            setTimeout(() => {
                ripple.remove();
            }, 600);
        });
    });

    // Add CSS for ripple effect
    const style = document.createElement('style');
    style.textContent = `
        .ripple {
            position: absolute;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.4);
            transform: scale(0);
            animation: ripple-animation 0.6s linear;
            pointer-events: none;
        }
        
        @keyframes ripple-animation {
            to {
                transform: scale(4);
                opacity: 0;
            }
        }
        
        .animate-in {
            opacity: 1 !important;
            transform: translateY(0) !important;
        }
    `;
    document.head.appendChild(style);

    // Keyboard navigation enhancement
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Tab') {
            document.body.classList.add('keyboard-navigation');
        }
    });

    document.addEventListener('mousedown', function() {
        document.body.classList.remove('keyboard-navigation');
    });

    // Console welcome message
    console.log(`
    🤖 WABOT - AI-Powered WhatsApp Solutions
    ================================
    
    Welcome to the future of communication!
    
    Features:
    • AI Chatbot powered by Gemini
    • Message Broadcasting System
    • Real-time WhatsApp Integration
    
    Status: All systems operational ✅
    `);

    // Add loading animation removal
    window.addEventListener('load', function() {
        document.body.classList.add('loaded');
    });
});
