/**
 * Zedot.tech - Master v6 Application Logic
 */

document.addEventListener('DOMContentLoaded', () => {

    // --- 1. SVG ORGANIC PATH GENERATION (SMIL) ---
    function generateBlobPath(radius = 100, numPoints = 6, irregularity = 0.3) {
        const points = [];
        const angleStep = (2 * Math.PI) / numPoints;
        
        // Generate random points around a circle
        for (let i = 0; i < numPoints; i++) {
            const angle = i * angleStep;
            const r = radius * (1 + (Math.random() * 2 - 1) * irregularity);
            // Center is 400x400 for hero, but let's make it relative and scale later, 
            // actually we can just pass the center coordinates.
            // Wait, loader is 400x400, hero is 800x800.
            points.push([r, angle]);
        }
        
        return function(cx, cy) {
            const cartesian = points.map(p => {
                return [cx + p[0] * Math.cos(p[1]), cy + p[0] * Math.sin(p[1])];
            });
            
            let path = `M ${cartesian[0][0].toFixed(1)},${cartesian[0][1].toFixed(1)}`;
            const tension = 0.25;
            
            for (let i = 0; i < numPoints; i++) {
                const p0 = cartesian[(i - 1 + numPoints) % numPoints];
                const p1 = cartesian[i];
                const p2 = cartesian[(i + 1) % numPoints];
                const p3 = cartesian[(i + 2) % numPoints];
                
                const cp1x = p1[0] + (p2[0] - p0[0]) * tension;
                const cp1y = p1[1] + (p2[1] - p0[1]) * tension;
                const cp2x = p2[0] - (p3[0] - p1[0]) * tension;
                const cp2y = p2[1] - (p3[1] - p1[1]) * tension;
                
                path += ` C ${cp1x.toFixed(1)},${cp1y.toFixed(1)} ${cp2x.toFixed(1)},${cp2y.toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
            }
            return path + " Z";
        }
    }

    function generateSequence(numShapes, radius, cx, cy) {
        const shapes = [];
        for(let i=0; i<numShapes; i++) {
            shapes.push(generateBlobPath(radius, 6, 0.25)(cx, cy));
        }
        shapes.push(shapes[0]); // Loop back
        return shapes.join(";\n");
    }

    // Inject SVG Sequences
    const loaderAnim1 = document.getElementById('loaderAnim1');
    const loaderAnim2 = document.getElementById('loaderAnim2');
    if(loaderAnim1) loaderAnim1.setAttribute('values', generateSequence(10, 80, 200, 200));
    if(loaderAnim2) loaderAnim2.setAttribute('values', generateSequence(10, 60, 200, 200));

    const heroAnimOuter = document.getElementById('heroAnimOuter');
    const heroAnimMid = document.getElementById('heroAnimMid');
    const heroAnimInner = document.getElementById('heroAnimInner');
    
    if(heroAnimOuter) heroAnimOuter.setAttribute('values', generateSequence(10, 280, 400, 400));
    if(heroAnimMid) heroAnimMid.setAttribute('values', generateSequence(10, 220, 400, 400));
    if(heroAnimInner) heroAnimInner.setAttribute('values', generateSequence(10, 150, 400, 400));


    // --- 2. GLOBAL LOADER & SPA ROUTING ---
    const views = document.querySelectorAll('.spa-view');
    const navLinks = document.querySelectorAll('.nav-trigger');
    const globalLoader = document.getElementById('globalLoader');
    let isNavigating = false;

    function applyTextRipple() {
        const title = document.getElementById('heroTitle');
        if(!title) return;
        const words = title.querySelectorAll('.hero-title-word');
        words.forEach((word, wIdx) => {
            const text = word.innerText;
            word.innerHTML = '';
            text.split('').forEach((char, cIdx) => {
                const span = document.createElement('span');
                span.innerText = char;
                span.className = 'ripple-letter';
                // 40ms stagger per letter
                span.style.animationDelay = `${0.2 + (wIdx * 0.2) + (cIdx * 0.04)}s`;
                word.appendChild(span);
            });
            // Re-add space if not last word
            if(wIdx < words.length -1) word.innerHTML += '&nbsp;';
            word.style.opacity = 1;
        });
    }

    function switchView(targetId) {
        if (isNavigating) return;
        isNavigating = true;

        // Show Loader
        globalLoader.classList.add('active');
        
        // Mobile nav cleanup
        const navMenu = document.getElementById('navLinks');
        if (navMenu.classList.contains('active')) {
            navMenu.classList.remove('active');
        }

        setTimeout(() => {
            // Swap Views Behind Loader
            views.forEach(v => v.classList.remove('active'));
            const target = document.getElementById(targetId);
            if (target) {
                target.classList.add('active');
                window.scrollTo(0, 0);
                
                // Re-trigger animations in target view
                if(targetId === 'home') {
                    const block = document.getElementById('heroTextBlock');
                    block.style.animation = 'none';
                    block.offsetHeight; // trigger reflow
                    block.style.animation = null;
                    applyTextRipple();
                }
            }
            
            // Hide Loader radially (CSS handles opacity, we could do clip-path for true radial)
            globalLoader.classList.remove('active');
            isNavigating = false;

        }, 1500); // 1.5s morph cycle
    }

    function handleHashChange() {
        const hash = window.location.hash.substring(1) || 'home';
        switchView(hash);
    }

    window.addEventListener('hashchange', handleHashChange);
    
    // Initial Load Text Ripple
    if(window.location.hash === '' || window.location.hash === '#home') {
        applyTextRipple();
    } else {
        handleHashChange();
    }


    // --- 3. BACKGROUND CANVAS (PAYLOADS & ICONS) ---
    const bgCanvas = document.getElementById('bgCanvas');
    const bgCtx = bgCanvas.getContext('2d');
    let width, height;

    const payloads = [
        `{ "sensor": "temp-09", "value": 36.7, "unit": "°C", "ts": 1714982301 }`,
        `POST /api/v2/auth/token → 200 OK | latency: 42ms`,
        `SELECT * FROM sessions WHERE active = true AND region = 'af-south-1' LIMIT 50;`,
        `{ "threat": "SQL_INJECTION", "severity": "CRITICAL", "blocked": true }`,
        `kubectl rollout status deployment/zedot-api -n production`,
        `{ "model": "zd-inference-v2", "latency_ms": 118, "confidence": 0.97 }`,
        `git push origin main --force-with-lease && gh pr create`,
        `{ "uptime": "99.97%", "incidents": 0, "sla_met": true }`,
        `pip install zedot-core==2.1.4 && pytest --cov=src --cov-report=html`,
        `curl -X POST https://api.zedot.tech/v1/predict -H "Authorization: Bearer zd_***"`,
        `{ "pipeline": "etl-v3", "rows_processed": 142800, "duration_ms": 3401 }`,
        `firewall-cmd --add-rich-rule='rule family=ipv4 source address=10.0.0.0/8 accept'`,
        `terraform apply -auto-approve -var-file=prod.tfvars`,
        `{ "cve": "CVE-2024-3094", "patch_status": "applied", "verified": true }`,
        `docker build -t zedot/api:v2.1.4 . && docker push zedot/api:v2.1.4`
    ];

    const particles = [];
    function initCanvas() {
        width = window.innerWidth;
        height = window.innerHeight;
        bgCanvas.width = width;
        bgCanvas.height = height;
        particles.length = 0;
        
        // 40% more elements = ~30 payloads on screen
        for(let i=0; i<30; i++) {
            particles.push({
                text: payloads[Math.floor(Math.random() * payloads.length)],
                x: Math.random() * width,
                y: Math.random() * height,
                speedX: (Math.random() - 0.5) * 0.3,
                speedY: (Math.random() - 0.5) * 0.3,
                opacity: 0.03 + Math.random() * 0.05
            });
        }
    }

    function animateCanvas() {
        bgCtx.clearRect(0, 0, width, height);
        bgCtx.font = "12px 'JetBrains Mono', monospace";
        
        particles.forEach(p => {
            bgCtx.fillStyle = `rgba(240, 240, 242, ${p.opacity})`;
            bgCtx.fillText(p.text, p.x, p.y);
            p.x += p.speedX;
            p.y += p.speedY;
            
            if(p.x > width + 200) p.x = -200;
            if(p.x < -200) p.x = width + 200;
            if(p.y > height + 50) p.y = -50;
            if(p.y < -50) p.y = height + 50;
        });
        requestAnimationFrame(animateCanvas);
    }
    
    window.addEventListener('resize', initCanvas);
    initCanvas();
    animateCanvas();


    // --- 4. NAV & IDLE PULSE ---
    const nav = document.getElementById('mainNav');
    const dots = document.querySelectorAll('.logo-dot');
    let idleTimer;

    function resetIdle() {
        dots.forEach(d => d.classList.remove('idle'));
        clearTimeout(idleTimer);
        idleTimer = setTimeout(() => {
            dots.forEach(d => d.classList.add('idle'));
        }, 4000);
    }

    window.addEventListener('mousemove', resetIdle);
    window.addEventListener('scroll', () => {
        resetIdle();
        if(window.scrollY > 50) {
            nav.classList.add('scrolled');
        } else {
            nav.classList.remove('scrolled');
        }
    });
    resetIdle();


    // --- 5. EXPANDABLE CARDS (SERVICES/ETHOS) ---
    document.querySelectorAll('.expandable-card').forEach(card => {
        card.addEventListener('click', (e) => {
            if(e.target.tagName.toLowerCase() === 'a') return; // Don't trigger on CTA click
            card.classList.toggle('expanded');
        });
    });


    // --- 6. RESEARCH FILTERING ---
    const filterChips = document.querySelectorAll('.filter-chips .chip');
    const researchCards = document.querySelectorAll('.research-card');
    const searchInput = document.getElementById('researchSearch');

    function filterResearch() {
        const activeChip = document.querySelector('.filter-chips .active').getAttribute('data-filter');
        const query = searchInput.value.toLowerCase();

        researchCards.forEach(card => {
            const text = card.innerText.toLowerCase();
            const category = card.getAttribute('data-category');
            const matchesChip = activeChip === 'All' || category.includes(activeChip);
            const matchesQuery = text.includes(query);

            if(matchesChip && matchesQuery) {
                card.style.display = 'flex';
            } else {
                card.style.display = 'none';
            }
        });
    }

    filterChips.forEach(chip => {
        chip.addEventListener('click', () => {
            filterChips.forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            filterResearch();
        });
    });

    if(searchInput) searchInput.addEventListener('input', filterResearch);


    // --- 7. NEWSLETTER TO REACH OUT ROUTING ---
    const nlForm = document.getElementById('newsletterForm');
    if(nlForm) {
        nlForm.addEventListener('submit', (e) => {
            e.preventDefault();
            window.location.hash = '#contact';
            setTimeout(() => {
                const messageBox = document.getElementById('message');
                if(messageBox) messageBox.value = "Newsletter subscription request";
            }, 1600); // Wait for loader
        });
    }


    // --- 8. REACH OUT FORM SUBMIT ---
    const contactForms = [document.getElementById('contactForm'), document.getElementById('landingContactForm')];
    contactForms.forEach(form => {
        if(form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                const btn = form.querySelector('button');
                const origText = btn.innerText;
                btn.innerText = 'Sending...';
                
                setTimeout(() => {
                    form.reset();
                    btn.innerText = origText;
                    const toast = document.getElementById('successToast');
                    toast.classList.add('active');
                    setTimeout(() => toast.classList.remove('active'), 3000);
                }, 1000);
            });
        }
    });


    // --- 9. INTERSECTION OBSERVER FOR FADE-INS ---
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if(entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, { threshold: 0.15 });

    document.querySelectorAll('.fade-in-up').forEach(el => observer.observe(el));


    // --- 10. COOKIE CONSENT ---
    const cookieModal = document.getElementById('cookieModal');
    const cookieBar = document.getElementById('cookieBar');
    const cookieRipple = document.getElementById('cookieRipple');
    
    if(!localStorage.getItem('cookies_accepted')) {
        setTimeout(() => cookieModal.classList.add('active'), 1000);
    }

    document.getElementById('btnManageCookies')?.addEventListener('click', () => {
        cookieModal.classList.remove('active');
        cookieBar.classList.add('active');
    });

    function acceptCookies(e) {
        const rect = e.target.getBoundingClientRect();
        cookieRipple.style.left = `${rect.left + rect.width/2}px`;
        cookieRipple.style.top = `${rect.top + rect.height/2}px`;
        cookieRipple.style.animation = 'ripple-explode 1.2s ease-out forwards';
        
        cookieModal.classList.remove('active');
        cookieBar.classList.remove('active');
        localStorage.setItem('cookies_accepted', 'true');
        
        setTimeout(() => { cookieRipple.style.animation = 'none'; }, 1200);
    }

    document.getElementById('btnAcceptCookies')?.addEventListener('click', acceptCookies);
    document.getElementById('btnBarAccept')?.addEventListener('click', acceptCookies);


    // --- 11. DOTTY CHATBOT LOGIC ---
    const launcher = document.getElementById('dottyLauncher');
    const panel = document.getElementById('dottyPanel');
    const closeBtn = document.getElementById('dottyClose');
    const chatForm = document.getElementById('dottyForm');
    const chatInput = document.getElementById('dottyInput');
    const messagesBox = document.getElementById('dottyMessages');

    launcher.addEventListener('click', () => panel.classList.add('active'));
    closeBtn.addEventListener('click', () => panel.classList.remove('active'));

    const botBrain = {
        "services": "We offer Software Development, DevOps & Cloud, AI & Automation, Cybersecurity, Data Engineering, QA, and Research.",
        "price": "Our engagements vary depending on scope. For custom software or cloud migrations, drop us a line and we'll scope it out.",
        "cost": "Our engagements vary depending on scope. For custom software or cloud migrations, drop us a line and we'll scope it out.",
        "time": "We run 2-week agile sprints. MVP delivery usually takes between 6 to 12 weeks depending on complexity.",
        "ai": "Yes, we integrate ML models, build RAG pipelines, and automate workflows using AI. African-built AI is our focus.",
        "compliance": "We are compliant by design—adhering to NDPR, GDPR, ISO 27001, and SOC 2 frameworks. Security is baked in.",
        "hire": "We are always looking for top-tier African engineering talent. Check out our Reach Out page.",
        "portfolio": "We've built logistics platforms handling 10k concurrents, fintech APIs, and healthcare ML pipelines.",
        "who": "Zedot was founded by a team of 6 specialized engineers and researchers who believe African tech can lead globally.",
        "non-technical": "Absolutely. We translate your business requirements into technical reality. You don't need to write code to work with us.",
        "safe": "Your data is secured using zero-trust architecture, encryption in transit/rest, and regular penetration testing.",
        "industry": "We serve Fintech, Healthtech, Logistics, Energy, Retail, Public Sector, and Telecoms.",
        "mobile": "Yes, we build scalable cross-platform mobile applications using modern frameworks.",
        "contact": "You can reach us at support@zedot.tech or use the form on our Reach Out page."
    };

    chatForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const text = chatInput.value.trim();
        if(!text) return;

        // Add user message
        const uMsg = document.createElement('div');
        uMsg.className = 'chat-msg msg-user';
        uMsg.innerText = text;
        messagesBox.appendChild(uMsg);
        chatInput.value = '';

        // Determine bot response
        let reply = "I'm not quite sure I understand. Could you rephrase or ask about our services, team, or how to get in touch?";
        const lower = text.toLowerCase();
        for(let key in botBrain) {
            if(lower.includes(key)) {
                reply = botBrain[key];
                break;
            }
        }

        // Delay for realism
        setTimeout(() => {
            const bMsg = document.createElement('div');
            bMsg.className = 'chat-msg msg-bot';
            bMsg.innerText = reply;
            messagesBox.appendChild(bMsg);
            messagesBox.scrollTop = messagesBox.scrollHeight;
        }, 600);
    });

    // Mobile Hamburger Toggle
    const hamburger = document.getElementById('hamburgerBtn');
    const navMenu = document.getElementById('navLinks');
    if(hamburger) {
        hamburger.addEventListener('click', () => {
            navMenu.classList.toggle('active');
        });
    }

});
