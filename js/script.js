// משתנים גלובליים
let scene, camera, renderer, controls;
let brain, particles = [];
let isManualControl = false;
let autoRotate = true;
let isLoading = true;
let mouseDown = false;
let mouseX = 0;
let mouseY = 0;
let targetRotationX = 0;
let targetRotationY = 0;
let windowHalfX = window.innerWidth / 2;
let windowHalfY = window.innerHeight / 2;
let clock = new THREE.Clock();

// אתחול
document.addEventListener('DOMContentLoaded', () => {
  initLoader();
  initThree();
  initEvents();
  initAnimations();
  
  // רישום Service Worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js')
      .then(reg => console.log('Service Worker registered', reg))
      .catch(err => console.error('Service Worker registration failed', err));
  }
});

// אתחול אנימציית טעינה
function initLoader() {
  const loader = document.getElementById('loader');
  const progressBar = document.getElementById('loader-progress');
  let progress = 0;
  
  const interval = setInterval(() => {
    progress += Math.random() * 10;
    if (progress > 100) progress = 100;
    
    progressBar.style.width = `${progress}%`;
    
    if (progress === 100) {
      clearInterval(interval);
      setTimeout(() => {
        loader.classList.add('hidden');
        isLoading = false;
        
        // הפעלת אנימציות כניסה
        const fadeElements = document.querySelectorAll('.fade-in');
        fadeElements.forEach((el, index) => {
          setTimeout(() => {
            el.classList.add('visible');
          }, 300 * index);
        });
      }, 500);
    }
  }, 200);
}

// אתחול Three.js
function initThree() {
  // יצירת סצנה
  scene = new THREE.Scene();
  
  // יצירת מצלמה
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.z = 5;
  
  // יצירת רנדרר
  renderer = new THREE.WebGLRenderer({
    canvas: document.getElementById('bg'),
    antialias: true,
    alpha: true
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  
  // הוספת תאורה
  addLights();
  
  // הוספת כוכבים
  addStars();
  
  // טעינת מודל המוח
  loadBrainModel();
  
  // הוספת חלקיקים
  createParticles();
  
  // התחלת לולאת האנימציה
  animate();
}

// הוספת תאורה
function addLights() {
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambientLight);
  
  const pointLight1 = new THREE.PointLight(0x00ffff, 2, 100);
  pointLight1.position.set(10, 10, 10);
  scene.add(pointLight1);
  
  const pointLight2 = new THREE.PointLight(0xff00ff, 2, 100);
  pointLight2.position.set(-10, -10, -10);
  scene.add(pointLight2);
}

// הוספת כוכבים
function addStars() {
  for (let i = 0; i < 1000; i++) {
    addStar();
  }
}

// הוספת כוכב בודד
function addStar() {
  const geometry = new THREE.SphereGeometry(0.1, 24, 24);
  const material = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: new THREE.Color(Math.random(), Math.random(), Math.random()),
    emissiveIntensity: Math.random() * 0.5 + 0.5
  });
  
  const star = new THREE.Mesh(geometry, material);
  
  const [x, y, z] = Array(3).fill().map(() => THREE.MathUtils.randFloatSpread(100));
  star.position.set(x, y, z);
  
  scene.add(star);
}

// טעינת מודל המוח
function loadBrainModel() {
  const loader = new THREE.GLTFLoader();
  
  loader.load(
    'models/brain.glb',
    (gltf) => {
      brain = gltf.scene;
      brain.scale.set(0.5, 0.5, 0.5);
      brain.position.set(0, 0, 0);
      
      // הוספת חומר זוהר למוח
      brain.traverse((child) => {
        if (child.isMesh) {
          child.material = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            emissive: 0x00ffff,
            emissiveIntensity: 0.5,
            metalness: 0.8,
            roughness: 0.2
          });
        }
      });
      
      scene.add(brain);
    },
    (xhr) => {
      console.log((xhr.loaded / xhr.total * 100) + '% loaded');
    },
    (error) => {
      console.error('Error loading model', error);
      // יצירת גיאומטריה חלופית אם הטעינה נכשלת
      createFallbackBrain();
    }
  );
}

// יצירת מוח חלופי אם הטעינה נכשלת
function createFallbackBrain() {
  const geometry = new THREE.IcosahedronGeometry(1.5, 1);
  const material = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0x00ffff,
    emissiveIntensity: 0.5,
    metalness: 0.8,
    roughness: 0.2,
    wireframe: true
  });
  
  brain = new THREE.Mesh(geometry, material);
  scene.add(brain);
}

// יצירת חלקיקים
function createParticles() {
  const particlesContainer = document.getElementById('particles-container');
  
  for (let i = 0; i < 50; i++) {
    const particle = document.createElement('div');
    particle.classList.add('particle');
    
    // מיקום אקראי
    const x = Math.random() * 100;
    const y = Math.random() * 100;
    
    // גודל אקראי
    const size = Math.random() * 5 + 2;
    
    // מהירות אקראית
    const speedX = Math.random() * 0.5 - 0.25;
    const speedY = Math.random() * 0.5 - 0.25;
    
    // הגדרת סגנון
    particle.style.left = `${x}vw`;
    particle.style.top = `${y}vh`;
    particle.style.width = `${size}px`;
    particle.style.height = `${size}px`;
    
    // שמירת נתונים
    particles.push({
      element: particle,
      x,
      y,
      speedX,
      speedY
    });
    
    particlesContainer.appendChild(particle);
  }
  
  // התחלת אנימציית חלקיקים
  animateParticles();
}

// אנימציית חלקיקים
function animateParticles() {
  particles.forEach(particle => {
    // עדכון מיקום
    particle.x += particle.speedX;
    particle.y += particle.speedY;
    
    // בדיקת גבולות
    if (particle.x < 0) particle.x = 100;
    if (particle.x > 100) particle.x = 0;
    if (particle.y < 0) particle.y = 100;
    if (particle.y > 100) particle.y = 0;
    
    // עדכון סגנון
    particle.element.style.left = `${particle.x}vw`;
    particle.element.style.top = `${particle.y}vh`;
  });
  
  requestAnimationFrame(animateParticles);
}

// לולאת אנימציה
function animate() {
  requestAnimationFrame(animate);
  
  // סיבוב כוכבים
  scene.children.forEach(child => {
    if (child.type === 'Mesh' && child !== brain) {
      child.rotation.x += 0.001;
      child.rotation.y += 0.001;
    }
  });
  
  // סיבוב אוטומטי של המוח
  if (brain && autoRotate && !isManualControl) {
    brain.rotation.y += 0.005;
    brain.rotation.x = Math.sin(clock.getElapsedTime() * 0.5) * 0.2;
  }
  
  // סיבוב ידני של המוח
  if (brain && isManualControl) {
    brain.rotation.y += (targetRotationX - brain.rotation.y) * 0.1;
    brain.rotation.x += (targetRotationY - brain.rotation.x) * 0.1;
  }
  
  renderer.render(scene, camera);
}

// אתחול אירועים
function initEvents() {
  // התאמת גודל החלון
  window.addEventListener('resize', () => {
    windowHalfX = window.innerWidth / 2;
    windowHalfY = window.innerHeight / 2;
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
  
  // אירועי עכבר ומגע
  const canvas = document.getElementById('bg');
  
  // עכבר
  canvas.addEventListener('mousedown', onMouseDown);
  document.addEventListener('mousemove', onMouseMove);
  document.addEventListener('mouseup', onMouseUp);
  
  // מגע
  canvas.addEventListener('touchstart', onTouchStart);
  document.addEventListener('touchmove', onTouchMove);
  document.addEventListener('touchend', onTouchEnd);
  
  // כפתור חזרה למעלה
  const backToTopBtn = document.getElementById('back-to-top');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 300) {
      backToTopBtn.classList.add('visible');
    } else {
      backToTopBtn.classList.remove('visible');
    }
  });
  
  backToTopBtn.addEventListener('click', () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  });
  
  // טיפול בניווט
  const navLinks = document.querySelectorAll('nav a');
  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      const target = link.getAttribute('href');
      
      if (target !== '#') {
        e.preventDefault();
        
        document.querySelector(target).scrollIntoView({
          behavior: 'smooth'
        });
        
        // עדכון קישור פעיל
        navLinks.forEach(l => l.classList.remove('active'));
        link.classList.add('active');
      }
    });
  });
  
  // עדכון ניווט בעת גלילה
  window.addEventListener('scroll', () => {
    const sections = document.querySelectorAll('section');
    const scrollPosition = window.scrollY + 200;
    
    sections.forEach(section => {
      const sectionTop = section.offsetTop;
      const sectionHeight = section.offsetHeight;
      const sectionId = section.getAttribute('id');
      
      if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
        navLinks.forEach(link => {
          link.classList.remove('active');
          if (link.getAttribute('href') === `#${sectionId}`) {
            link.classList.add('active');
          }
        });
      }
    });
    
    // שינוי סגנון כותרת בעת גלילה
    const header = document.querySelector('header');
    if (scrollPosition > 100) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  });
  
  // טיפול בטכנולוגיות
  const techItems = document.querySelectorAll('.tech-item');
  const techDetails = document.querySelectorAll('.tech-detail');
  
  techItems.forEach(item => {
    item.addEventListener('click', () => {
      const position = item.getAttribute('data-position');
      
      // עדכון פריט פעיל
      techItems.forEach(i => i.classList.remove('active'));
      item.classList.add('active');
      
      // עדכון פרטים
      techDetails.forEach(detail => {
        detail.classList.remove('active');
        if (detail.getAttribute('data-tech') === position) {
          detail.classList.add('active');
        }
      });
    });
  });
  
  // טיפול בטופס יצירת קשר
  const contactForm = document.querySelector('.contact-form');
  contactForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    // כאן יש להוסיף קוד לשליחת הטופס
    alert('הטופס נשלח בהצלחה!');
    contactForm.reset();
  });
}

// אתחול אנימציות
function initAnimations() {
  // אנימציות גלילה
  window.addEventListener('scroll', () => {
    const fadeElements = document.querySelectorAll('.fade-in:not(.visible)');
    const slideElements = document.querySelectorAll('.slide-up:not(.visible)');
    
    const triggerBottom = window.innerHeight * 0.8;
    
    fadeElements.forEach(element => {
      const elementTop = element.getBoundingClientRect().top;
      if (elementTop < triggerBottom) {
        element.classList.add('visible');
      }
    });
    
    slideElements.forEach(element => {
      const elementTop = element.getBoundingClientRect().top;
      if (elementTop < triggerBottom) {
        element.classList.add('visible');
      }
    });
  });
  
  // הוספת קלאסים לאנימציות
  document.querySelectorAll('.card').forEach((card, index) => {
    card.classList.add('fade-in');
    card.style.transitionDelay = `${index * 0.1}s`;
  });
  
  document.querySelectorAll('.tech-item').forEach((item, index) => {
    item.classList.add('slide-up');
    item.style.transitionDelay = `${index * 0.1}s`;
  });
  
  document.querySelectorAll('.about-content > *').forEach((element, index) => {
    element.classList.add('fade-in');
    element.style.transitionDelay = `${index * 0.2}s`;
  });
  
  document.querySelectorAll('.contact-container > *').forEach((element, index) => {
    element.classList.add('slide-up');
    element.style.transitionDelay = `${index * 0.2}s`;
  });
}

// פונקציות לטיפול בסיבוב ידני של המוח
function onMouseDown(event) {
  event.preventDefault();
  
  isManualControl = true;
  mouseDown = true;
  
  mouseX = event.clientX - windowHalfX;
  mouseY = event.clientY - windowHalfY;
  
  if (brain) {
    targetRotationX = brain.rotation.y;
    targetRotationY = brain.rotation.x;
  }
}

function onMouseMove(event) {
  if (mouseDown) {
    const newMouseX = event.clientX - windowHalfX;
    const newMouseY = event.clientY - windowHalfY;
    
    targetRotationX += (newMouseX - mouseX) * 0.01;
    targetRotationY += (newMouseY - mouseY) * 0.01;
    
    mouseX = newMouseX;
    mouseY = newMouseY;
  }
}

function onMouseUp() {
  mouseDown = false;
}

function onTouchStart(event) {
  if (event.touches.length === 1) {
    event.preventDefault();
    
    isManualControl = true;
    mouseDown = true;
    
    mouseX = event.touches[0].pageX - windowHalfX;
    mouseY = event.touches[0].pageY - windowHalfY;
    
    if (brain) {
      targetRotationX = brain.rotation.y;
      targetRotationY = brain.rotation.x;
    }
  }
}

function onTouchMove(event) {
  if (mouseDown && event.touches.length === 1) {
    const newMouseX = event.touches[0].pageX - windowHalfX;
    const newMouseY = event.touches[0].pageY - windowHalfY;
    
    targetRotationX += (newMouseX - mouseX) * 0.01;
    targetRotationY += (newMouseY - mouseY) * 0.01;
    
    mouseX = newMouseX;
    mouseY = newMouseY;
  }
}

function onTouchEnd() {
  mouseDown = false;
}

// פונקציות נוספות לטיפול בסיבוב המוח
function toggleAutoRotate() {
  autoRotate = !autoRotate;
  if (autoRotate) {
    isManualControl = false;
  }
}

function stopRotation() {
  autoRotate = false;
  isManualControl = true;
}
