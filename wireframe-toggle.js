// Wireframe Background Toggle
// Uncomment the line below to enable the animated version
// document.getElementById('wireframe-bg').classList.add('animated');

// Function to toggle between static and animated
function toggleWireframeAnimation() {
    const wireframeBg = document.getElementById('wireframe-bg');
    if (wireframeBg.classList.contains('animated')) {
        wireframeBg.classList.remove('animated');
        console.log('Wireframe: Static mode');
    } else {
        wireframeBg.classList.add('animated');
        console.log('Wireframe: Animated mode');
    }
}

// Auto-enable animation after 3 seconds (optional)
// setTimeout(() => {
//     document.getElementById('wireframe-bg').classList.add('animated');
// }, 3000);

// Export for use in other scripts
window.toggleWireframeAnimation = toggleWireframeAnimation;
