// Lesson view functionality
document.addEventListener('DOMContentLoaded', function() {
    // Get lesson info from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const courseId = urlParams.get('course') || 'clean-reset';
    const lessonNumber = urlParams.get('lesson') || '1';

    // Update page title and breadcrumb
    updateLessonInfo(courseId, lessonNumber);

    // Render content conditionally: only Clean Reset - Lesson 1 has full content
    renderLessonContent(courseId, Number(lessonNumber));

    // Add scroll animations
    addScrollAnimations();

    // Add interactive elements
    addInteractiveElements();

    // Track reading progress
    trackReadingProgress();
});

// Update lesson information
function updateLessonInfo(courseId, lessonNumber) {
    const courseNames = {
        'clean-reset': 'Clean Reset',
        'powerfoods': 'PowerFoods',
        'de-juiste-balans': 'De Juiste Balans',
        '30-daagse-reset-journey': '30-Daagse Reset Journey',
        'everyday-nutrition': 'Everyday Nutrition',
        'mindful-energy': 'Mindful Energy'
    };

    const courseName = courseNames[courseId] || 'Clean Reset';
    document.querySelector('.lesson-breadcrumb').textContent = `${courseName} > Les ${lessonNumber}`;
    document.querySelector('.lesson-progress span').textContent = `Les ${lessonNumber} van 20`;
}

// Add scroll animations
function addScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);
    
    // Observe all sections for animation
    const sections = document.querySelectorAll('.lesson-section');
    sections.forEach((section, index) => {
        section.style.opacity = '0';
        section.style.transform = 'translateY(20px)';
        section.style.transition = `opacity 0.6s ease ${index * 0.1}s, transform 0.6s ease ${index * 0.1}s`;
        observer.observe(section);
    });
}

// Add interactive elements
function addInteractiveElements() {
    // Info cards hover effects
    const infoCards = document.querySelectorAll('.info-card');
    infoCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-4px)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(-2px)';
        });
    });

    // Source items hover effects
    const sourceItems = document.querySelectorAll('.source-item');
    sourceItems.forEach(item => {
        item.addEventListener('mouseenter', function() {
            this.style.transform = 'scale(1.02)';
        });
        
        item.addEventListener('mouseleave', function() {
            this.style.transform = 'scale(1)';
        });
    });

    // Problem cards hover effects
    const problemCards = document.querySelectorAll('.problem-card');
    problemCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-2px)';
            this.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.1)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
            this.style.boxShadow = 'none';
        });
    });

    // Glossary items hover effects
    const glossaryItems = document.querySelectorAll('.glossary-item');
    glossaryItems.forEach(item => {
        item.addEventListener('mouseenter', function() {
            this.style.backgroundColor = '#f8fafc';
            this.style.transform = 'scale(1.02)';
        });
        
        item.addEventListener('mouseleave', function() {
            this.style.backgroundColor = '#ffffff';
            this.style.transform = 'scale(1)';
        });
    });
}

// Track reading progress
function trackReadingProgress() {
    let progress = 0;
    const totalSections = document.querySelectorAll('.lesson-section').length;
    
    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                progress++;
                updateReadingProgress(progress, totalSections);
            }
        });
    }, { threshold: 0.5 });
    
    // Observe each section
    document.querySelectorAll('.lesson-section').forEach(section => {
        observer.observe(section);
    });
}

// Update reading progress
function updateReadingProgress(current, total) {
    const percentage = Math.min((current / total) * 100, 100);
    console.log(`Reading progress: ${percentage.toFixed(1)}%`);
    
    // You could add a progress indicator here
    // For now, we'll just log it
}

// Render dynamic lesson content (only full for Clean Reset - Les 1)
function renderLessonContent(courseId, lessonNumber) {
    const wrapper = document.getElementById('lesson-dynamic');
    if (!wrapper) return;

    const isFirstCleanReset = courseId === 'clean-reset' && lessonNumber === 1;
    if (isFirstCleanReset) {
        // leave the existing rich content on the page
        return;
    }

    // Superfoods & Specerijen (PowerFoods) – Les 1: volledige content
    const isFirstPowerfoods = courseId === 'powerfoods' && lessonNumber === 1;
    if (isFirstPowerfoods) {
        wrapper.innerHTML = `
            <section class="lesson-section">
                <div class="section-intro">
                    <h1>Wat zijn superfoods en specerijen?</h1>
                    <p>Superfoods en specerijen – je hoort deze termen steeds vaker. Ze klinken hip, gezond en misschien zelfs een beetje mysterieus. Maar wat betekenen ze nu eigenlijk? Zijn superfoods écht zo bijzonder, of is het vooral een slimme marketingterm? En hoe kunnen kruiden en specerijen meer doen dan alleen je eten op smaak brengen?</p>
                    <p>Laten we samen een duik nemen in de wereld van krachtige voedingsmiddelen, zonder te verdwalen in ingewikkelde termen of gezondheidsclaims. Eén ding is zeker: voeding speelt een enorme rol in hoe jij je elke dag voelt.</p>
                </div>
            </section>

            <section class="lesson-section">
                <h2>Superfoods: meer dan een hype?</h2>
                <p>Superfoods zijn voedingsmiddelen die van nature veel vitamines, mineralen, antioxidanten of andere waardevolle voedingsstoffen bevatten. Denk aan bessen, zaden, algen en bepaalde groenten. De term ‘superfood’ is geen officiële wetenschappelijke benaming, maar veel van deze ingrediënten worden al eeuwenlang gebruikt vanwege hun voedzame eigenschappen.</p>
                <p>Superfoods kunnen helpen bij:</p>
                <ul class="benefits-list">
                    <li><span class="checkmark icon-checkmark"></span> Het ondersteunen van je energie en vitaliteit</li>
                    <li><span class="checkmark icon-checkmark"></span> Het versterken van je immuunsysteem</li>
                    <li><span class="checkmark icon-checkmark"></span> Het bevorderen van een gezonde spijsvertering</li>
                    <li><span class="checkmark icon-checkmark"></span> Het beschermen tegen oxidatieve stress</li>
                </ul>
                <p>Je hoeft daarbij niet alleen te denken aan exotische bessen of dure poeders: ook alledaagse producten zoals broccoli, noten en havermout kunnen echte superfoods zijn.</p>
            </section>

            <section class="lesson-section">
                <h2>Specerijen: klein maar krachtig</h2>
                <p>Nóg een krachtige categorie zijn specerijen. Deze smaakmakers zijn niet alleen lekker, ze hebben vaak ook bijzondere eigenschappen. Kurkuma, kaneel, gember en zwarte peper worden in veel culturen al lang ingezet ter ondersteuning van de gezondheid.</p>
                <ul class="benefits-list">
                    <li><span class="icon-digestion" style="margin-right:8px; width:14px; height:14px; display:inline-block;"></span> Ondersteunen van je spijsvertering</li>
                    <li><span class="icon-refresh" style="margin-right:8px; width:14px; height:14px; display:inline-block;"></span> Werken vaak ontstekingsremmend</li>
                    <li><span class="icon-brain" style="margin-right:8px; width:14px; height:14px; display:inline-block;"></span> Kunnen mentale helderheid ondersteunen</li>
                    <li><span class="icon-shield" style="margin-right:8px; width:14px; height:14px; display:inline-block;"></span> Versterken je immuunsysteem</li>
                </ul>
                <p>Met kleine toevoegingen – bijvoorbeeld kaneel in je havermout of een beetje kurkuma in je thee – verrijk je je voeding zonder grote veranderingen.</p>
            </section>

            <section class="lesson-section">
                <h2>Waarom zijn superfoods en specerijen interessant?</h2>
                <p>Ze geven je voeding net dat beetje extra. Door vaker te kiezen voor ingrediënten met een hoge voedingswaarde help je je lichaam optimaal functioneren. Geen zorgen: je hoeft je keukenkastjes niet in één keer om te gooien. In deze cursus ontdek je stap voor stap hoe je superfoods en specerijen eenvoudig en effectief integreert in je dagelijkse leven.</p>
            </section>

            <section class="lesson-section">
                <h2>Wat kun je verwachten?</h2>
                <p>In de komende lessen gaan we dieper in op voordelen, toepassingen en verrassende effecten van superfoods en specerijen. Je leert welke het beste bij jouw behoeften passen, hoe je ze slim combineert en hoe je ze verwerkt in lekkere, praktische maaltijden.</p>
                <div class="info-card" style="margin-top:16px; padding:16px; border:1px solid #e5e7eb; border-radius:12px;">
                    <div style="display:flex; align-items:center; gap:10px;">
                        <span class="icon-nutrition" style="width:18px; height:18px; display:inline-block;"></span>
                        <strong>Klaar om te starten?</strong>
                    </div>
                    <p style="margin:8px 0 0 28px; color:#475569;">Ga door naar de volgende les om direct praktisch aan de slag te gaan.</p>
                </div>
            </section>
        `;
        return;
    }

    // Superfoods & Specerijen (PowerFoods) – Les 2: De impact van voeding op je gezondheid
    const isSecondPowerfoods = courseId === 'powerfoods' && lessonNumber === 2;
    if (isSecondPowerfoods) {
        wrapper.innerHTML = `
            <section class="lesson-section">
                <div class="section-intro">
                    <h1>De impact van voeding op je gezondheid</h1>
                    <p>Voeding is meer dan een manier om honger te stillen. Het beïnvloedt je energieniveau, mentale scherpte, immuunsysteem en zelfs je slaap. Wat je dagelijks eet, bepaalt hoe je je voelt, hoe goed je lichaam functioneert en hoe lang je gezond blijft.</p>
                    <h3 style="margin-top:16px;">In deze les ontdek je:</h3>
                    <ul class="benefits-list">
                        <li><span class="checkmark icon-checkmark"></span> Hoe voeding je lichaam op celniveau beïnvloedt</li>
                        <li><span class="checkmark icon-checkmark"></span> Waarom niet alle calorieën gelijk zijn</li>
                        <li><span class="checkmark icon-checkmark"></span> Hoe voeding je mentale gezondheid en stemming beïnvloedt</li>
                        <li><span class="checkmark icon-checkmark"></span> De invloed van voeding op je slaapkwaliteit</li>
                        <li><span class="checkmark icon-checkmark"></span> Praktische aanpassingen die je direct kunt toepassen</li>
                    </ul>
                </div>
            </section>

            <section class="lesson-section">
                <h2>Voeding op celniveau: de bouwstenen van je lichaam</h2>
                <p>Je lichaam vernieuwt zichzelf continu. Oude cellen maken plaats voor nieuwe. De kwaliteit van die cellen hangt direct af van wat je eet. Met de juiste voedingsstoffen functioneert je lichaam beter, herstel je sneller en voel je je energieker.</p>
                <h3 style="margin-top:12px;">Bouwstoffen en celherstel</h3>
                <ul class="benefits-list">
                    <li><strong>Eiwitten</strong>: nodig voor spieropbouw, enzymen en herstel. Bronnen: peulvruchten, noten, vis, vlees.</li>
                    <li><strong>Vetzuren (omega-3)</strong>: cruciaal voor celmembranen en hersenfunctie. Bronnen: vette vis, lijnzaad, walnoten.</li>
                    <li><strong>Mineralen en vitamines</strong>: essentieel voor energieproductie en herstel. Denk aan ijzer, magnesium en vitamine C.</li>
                </ul>
                <h3 style="margin-top:12px;">Bescherming tegen schade</h3>
                <p>Dagelijks worden cellen blootgesteld aan vrije radicalen. Antioxidanten uit onder meer bessen, groene thee en cacao helpen beschermen tegen deze schade.</p>
            </section>

            <section class="lesson-section">
                <h2>Niet alle calorieën zijn gelijk</h2>
                <p>De herkomst van calorieën doet ertoe. Je lichaam verwerkt 500 kcal uit bewerkte voeding anders dan 500 kcal uit volwaardige voeding.</p>
                <div class="info-card" style="margin-top:12px; padding:16px; border:1px solid #e5e7eb; border-radius:12px;">
                    <h3>Voorbeeld: frisdrank vs. noten</h3>
                    <ul>
                        <li><strong>Frisdrank</strong>: snelle suikers veroorzaken pieken en dalen in je bloedsuikerspiegel, met vermoeidheid en honger tot gevolg.</li>
                        <li><strong>Handje noten</strong>: gezonde vetten en eiwitten zorgen voor verzadiging en stabiele energie.</li>
                    </ul>
                    <h3 style="margin-top:12px;">Geraffineerd vs. volkoren</h3>
                    <ul>
                        <li><strong>Witte rijst/brood/pasta</strong>: snelle afbraak tot glucose, korte piek, snelle dip.</li>
                        <li><strong>Volkoren varianten</strong>: vezels vertragen afgifte van glucose, langer stabiele energie.</li>
                    </ul>
                </div>
            </section>

            <section class="lesson-section">
                <h2>Voeding en mentale gezondheid</h2>
                <p>Je darmen en hersenen communiceren intensief. Een groot deel van de serotonineproductie vindt in de darmen plaats. Wat je eet beïnvloedt dus je stemming, stress en focus.</p>
                <div class="grid" style="display:grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap:16px;">
                    <div class="info-card" style="padding:16px; border:1px solid #e5e7eb; border-radius:12px;">
                        <h3>Voeding die helpt</h3>
                        <ul>
                            <li><strong>Omega-3</strong> (vette vis, noten, lijnzaad): ondersteunt stemming en concentratie.</li>
                            <li><strong>Magnesium</strong> (bananen, cacao, spinazie): bevordert ontspanning.</li>
                            <li><strong>Probiotica</strong> (zuurkool, kefir, yoghurt): ondersteunt een gezonde darmflora.</li>
                        </ul>
                    </div>
                    <div class="problem-card" style="padding:16px; border:1px dashed #e5e7eb; border-radius:12px;">
                        <h3>Wat je beter beperkt</h3>
                        <ul>
                            <li><strong>Suiker en bewerkte koolhydraten</strong>: bevorderen schommelingen in stemming en energie.</li>
                            <li><strong>Transvetten</strong> (gefrituurd, bepaalde margarines): kunnen ontstekingen in de hersenen aanjagen.</li>
                        </ul>
                    </div>
                </div>
            </section>

            <section class="lesson-section">
                <h2>Voeding en slaap</h2>
                <p>Je eetpatroon heeft invloed op de nachtrust. Sommige stoffen verbeteren ontspanning en slaap, andere werken juist verstorend.</p>
                <div class="grid" style="display:grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap:16px;">
                    <div class="problem-card" style="padding:16px; border:1px dashed #e5e7eb; border-radius:12px;">
                        <h3>Vermijden in de avond</h3>
                        <ul>
                            <li><strong>Cafeïne</strong> (koffie, energie-/cola): werkt uren door en verstoort slaap.</li>
                            <li><strong>Snelle suikers</strong>: veroorzaken schommelingen en onrust in de nacht.</li>
                            <li><strong>Zware, vette maaltijden</strong>: belasten de spijsvertering.</li>
                        </ul>
                    </div>
                    <div class="info-card" style="padding:16px; border:1px solid #e5e7eb; border-radius:12px;">
                        <h3>Wat helpt</h3>
                        <ul>
                            <li><strong>Tryptofaanrijk</strong> (bananen, kalkoen, melk): ondersteunt melatonine-aanmaak.</li>
                            <li><strong>Magnesiumrijk</strong> (amandelen, spinazie, cacao): bevordert ontspanning.</li>
                            <li><strong>Kruidenthee</strong> (kamille, valeriaan, lavendel): kalmeert het zenuwstelsel.</li>
                        </ul>
                    </div>
                </div>
            </section>

            <section class="lesson-section">
                <h2>Hoe pas je dit toe in je dagelijks leven?</h2>
                <ul class="benefits-list">
                    <li><span class="checkmark icon-checkmark"></span> Kies vaker voor volwaardige voeding: groenten, fruit, noten, volkoren.</li>
                    <li><span class="checkmark icon-checkmark"></span> Beperk snelle suikers en sterk bewerkte producten.</li>
                    <li><span class="checkmark icon-checkmark"></span> Ondersteun je brein met omega-3, magnesium en probiotica.</li>
                    <li><span class="checkmark icon-checkmark"></span> Let op timing: regelmatige maaltijden helpen stabiele energie.</li>
                    <li><span class="checkmark icon-checkmark"></span> Voor betere slaap: vermijd cafeïne en zware maaltijden in de avond.</li>
                </ul>
            </section>

            <section class="lesson-section">
                <h2>Begrippenlijst</h2>
                <div class="glossary-item"><strong>Antioxidanten</strong> – Stoffen die cellen beschermen tegen schade door vrije radicalen.</div>
                <div class="glossary-item"><strong>Metabolisme</strong> – Het proces waarmee voeding wordt omgezet in energie.</div>
                <div class="glossary-item"><strong>Omega-3 vetzuren</strong> – Essentiële vetten voor hersenfunctie en ontstekingsremming.</div>
                <div class="glossary-item"><strong>Darmmicrobioom</strong> – Miljarden bacteriën in de darmen die spijsvertering en immuunsysteem ondersteunen.</div>
                <div class="glossary-item"><strong>Bloedsuikerspiegel</strong> – De hoeveelheid glucose in het bloed; beïnvloedt energie en stemming.</div>
            </section>

            <section class="lesson-section">
                <h2>Samenvatting</h2>
                <ul>
                    <li>Voeding beïnvloedt energie, hersenen, slaap en herstel.</li>
                    <li>Kwaliteit van calorieën is belangrijker dan kwantiteit.</li>
                    <li>Gezonde voeding kan stemmingswisselingen verminderen.</li>
                    <li>Je eetpatroon heeft directe invloed op je nachtrust.</li>
                </ul>
                <div class="info-card" style="margin-top:16px; padding:16px; border:1px solid #e5e7eb; border-radius:12px;">
                    <strong>Volgende les:</strong> Natuurlijke versus bewerkte voeding – wat is écht gezond?
                </div>
            </section>
        `;
        return;
    }

    // Replace with placeholder/empty state for other lessons/courses
    wrapper.innerHTML = `
        <section class="lesson-section">
            <div class="section-intro">
                <p class="intro-text">De inhoud van deze les wordt binnenkort toegevoegd.</p>
            </div>
        </section>
        <section class="lesson-section">
            <h2>Vooruitblik</h2>
            <p>Deze les is nog in voorbereiding. Binnenkort vind je hier de volledige uitleg, opdrachten en materialen.</p>
        </section>
    `;
}

// Complete lesson function
function completeLesson() {
    const urlParams = new URLSearchParams(window.location.search);
    const courseId = urlParams.get('course') || 'clean-reset';
    const lessonNumber = parseInt(urlParams.get('lesson') || '1');
    
    // Save lesson completion
    saveLessonCompletion(courseId, lessonNumber);
    
    // Show completion message
    showCompletionMessage();
    
    // Navigate to next lesson or back to course
    setTimeout(() => {
        if (lessonNumber < 20) {
            // Go to next lesson
            window.location.href = `lesson-view.html?course=${courseId}&lesson=${lessonNumber + 1}`;
        } else {
            // Course completed, go back to lessons list
            window.location.href = `course-lessons.html?course=${courseId}`;
        }
    }, 2000);
}

// Save lesson completion
function saveLessonCompletion(courseId, lessonNumber) {
    const progress = JSON.parse(localStorage.getItem('lessonProgress') || '{}');
    if (!progress[courseId]) {
        progress[courseId] = [];
    }
    
    if (!progress[courseId].includes(lessonNumber)) {
        progress[courseId].push(lessonNumber);
        localStorage.setItem('lessonProgress', JSON.stringify(progress));
    }
    
    // Also update course progress
    const courseProgress = JSON.parse(localStorage.getItem('courseProgress') || '{}');
    courseProgress[courseId] = Math.max(courseProgress[courseId] || 0, lessonNumber);
    localStorage.setItem('courseProgress', JSON.stringify(courseProgress));
}

// Show completion message
function showCompletionMessage() {
    // Create completion overlay
    const overlay = document.createElement('div');
    overlay.className = 'completion-overlay';
    overlay.innerHTML = `
        <div class="completion-content">
            <div class="completion-icon">🎉</div>
            <h2>Les Voltooid!</h2>
            <p>Geweldig werk! Je hebt deze les succesvol afgerond.</p>
            <div class="completion-progress">
                <div class="progress-bar">
                    <div class="progress-fill" style="width: 5%"></div>
                </div>
                <span>5% van de cursus voltooid</span>
            </div>
        </div>
    `;
    
    // Add styles
    const styles = document.createElement('style');
    styles.textContent = `
        .completion-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-color: rgba(0, 0, 0, 0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
            animation: fadeIn 0.3s ease;
        }
        
        .completion-content {
            background-color: white;
            padding: 40px;
            border-radius: 16px;
            text-align: center;
            max-width: 400px;
            animation: slideUp 0.3s ease;
        }
        
        .completion-icon {
            font-size: 48px;
            margin-bottom: 16px;
        }
        
        .completion-content h2 {
            color: #1e3a8a;
            margin-bottom: 12px;
        }
        
        .completion-content p {
            color: #6b7280;
            margin-bottom: 24px;
        }
        
        .completion-progress {
            text-align: center;
        }
        
        .progress-bar {
            width: 100%;
            height: 8px;
            background-color: #e5e7eb;
            border-radius: 4px;
            overflow: hidden;
            margin-bottom: 8px;
        }
        
        .progress-fill {
            height: 100%;
            background: linear-gradient(90deg, #10b981 0%, #3b82f6 100%);
            border-radius: 4px;
            transition: width 0.3s ease;
        }
        
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        
        @keyframes slideUp {
            from { transform: translateY(20px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
        }
    `;
    
    document.head.appendChild(styles);
    document.body.appendChild(overlay);
    
    // Remove overlay after animation
    setTimeout(() => {
        document.body.removeChild(overlay);
    }, 2000);
}

// Add smooth scrolling for internal links
document.addEventListener('click', function(e) {
    if (e.target.tagName === 'A' && e.target.getAttribute('href').startsWith('#')) {
        e.preventDefault();
        const targetId = e.target.getAttribute('href').substring(1);
        const targetElement = document.getElementById(targetId);
        
        if (targetElement) {
            targetElement.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    }
});

// Add keyboard navigation
document.addEventListener('keydown', function(e) {
    if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        completeLesson();
    }
    
    if (e.key === 'ArrowLeft') {
        e.preventDefault();
        const urlParams = new URLSearchParams(window.location.search);
        const courseId = urlParams.get('course') || 'clean-reset';
        const lessonNumber = parseInt(urlParams.get('lesson') || '1');
        
        if (lessonNumber > 1) {
            window.location.href = `lesson-view.html?course=${courseId}&lesson=${lessonNumber - 1}`;
        }
    }
});
