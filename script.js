const canvas = document.getElementById('hero-canvas');
const context = canvas.getContext('2d', { alpha: false }); // Optimize: No transparency needed
const heroText = document.querySelector('.hero-text');
const container = document.querySelector('.hero-container');

// Configuration
const frameCount = 192; // ezgif-frame-001 to ezgif-frame-192
const getFramePath = index => `./ezgif-30fe7216b78d904b-jpg/ezgif-frame-${index.toString().padStart(3, '0')}.jpg`;

// State
let images = [];
let loadedImages = 0;
let isAnimating = false;
let currentImageIndex = 0;
let ticking = false; // For requestAnimationFrame

// Initialize sequence
function init() {
    preloadImages();
}

// Preload all frames into memory
function preloadImages() {
    for (let i = 1; i <= frameCount; i++) {
        const img = new Image();
        img.src = getFramePath(i);

        img.onload = () => {
            loadedImages++;
            if (loadedImages === 1) {
                // Render the first frame immediately for fast perceived load
                renderFrame(1);
            }
            if (loadedImages === frameCount) {
                // All frames loaded, safe to bind scroll safely
                setupScrollAnimation();
            }
        };
        images.push(img);
    }
}

// Draw the required frame
function renderFrame(index) {
    const imgObj = images[index - 1];
    if (imgObj && imgObj.complete) {

        // Match internal canvas resolution to the image's source resolution
        // This ensures crisp rendering, while CSS `object-fit: contain` scales it responsively
        if (canvas.width !== imgObj.width || canvas.height !== imgObj.height) {
            canvas.width = imgObj.width;
            canvas.height = imgObj.height;
        }

        // Clear and draw
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.drawImage(imgObj, 0, 0);

        currentImageIndex = index;
    }
}

// Bind scroll to progress
function setupScrollAnimation() {
    // Calculate initial state
    updateAnimation();

    window.addEventListener('scroll', () => {
        if (!ticking) {
            window.requestAnimationFrame(() => {
                updateAnimation();
                ticking = false;
            });
            ticking = true;
        }
    }, { passive: true });
}

// Main update loop
function updateAnimation() {
    // Compute scroll progress strictly within the `.hero-container`
    const containerTop = container.offsetTop;
    const containerHeight = container.offsetHeight;
    const viewportHeight = window.innerHeight;

    // Total distance the user has to scroll from the component hitting the top to the component hitting the bottom
    const scrollDistance = containerHeight - viewportHeight;
    const scrollY = window.scrollY - containerTop;

    // Normalize progress 0 -> 1
    let rawProgress = scrollY / scrollDistance;
    const progress = Math.max(0, Math.min(1, rawProgress));

    // Frame calculating
    // progress: 0.0 -> 1.0 => index: 1 -> 192
    const frameIndex = Math.min(
        frameCount,
        Math.max(1, Math.floor(progress * (frameCount - 1)) + 1)
    );

    // Only render if frame changed to avoid redundant canvas draw calls
    if (frameIndex !== currentImageIndex) {
        renderFrame(frameIndex);
    }

    // Typography appearance logic
    // Fade in when scroll progress reaches ~65%
    const textStartProgress = 0.65;
    const textEndProgress = 0.80; // Fade in over 15% scroll distance

    if (progress >= textStartProgress) {
        // Normalize between 0 and 1
        let textProgress = (progress - textStartProgress) / (textEndProgress - textStartProgress);
        textProgress = Math.min(1, Math.max(0, textProgress));

        // Apply easing curve (easeOutSine-like) for precise Apple-grade feel
        const ease = Math.sin((textProgress * Math.PI) / 2);

        // Translate upward: Start at +10px, ease down to 0px
        const yOffset = 10 * (1 - ease);

        heroText.style.opacity = ease.toFixed(3);
        heroText.style.transform = `translate(-50%, calc(-50% + ${yOffset.toFixed(2)}px))`;
    } else {
        // Reset state
        heroText.style.opacity = '0';
        heroText.style.transform = `translate(-50%, calc(-50% + 10px))`;
    }
}

// Kickoff
init();
