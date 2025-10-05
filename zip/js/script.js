       document.addEventListener('DOMContentLoaded', function() {
            const downloadBtns = document.querySelectorAll('.download-btn');
            const productImages = document.querySelectorAll('.product-image img');
            
            // Image loading animation
            productImages.forEach(img => {
                img.addEventListener('load', function() {
                    this.style.opacity = '1';
                    this.parentElement.classList.remove('image-loading');
                });
                
                // Add loading class if image hasn't loaded yet
                if (!img.complete) {
                    img.parentElement.classList.add('image-loading');
                    img.style.opacity = '0';
                }
            });
            
            // Download button functionality
            downloadBtns.forEach(btn => {
                btn.addEventListener('click', function() {
                    const fileName = this.getAttribute('data-file');
                    
                    // Create a temporary element to trigger download
                    const tempLink = document.createElement('a');
                    tempLink.href = `download/${fileName}`;
                    tempLink.download = fileName;
                    document.body.appendChild(tempLink);
                    tempLink.click();
                    document.body.removeChild(tempLink);
                                        
                    // Add animation effect to button
                    const originalHTML = this.innerHTML;
                    this.innerHTML = '<i class="fas fa-check"></i> Downloaded!';
                    this.style.background = 'var(--success)';
                    
                    // Reset button after 2 seconds
                    setTimeout(() => {
                        this.innerHTML = originalHTML;
                        this.style.background = '';
                    }, 2000);
                });
            });
            
            // Add hover effect for cards
            const productCards = document.querySelectorAll('.product-card');
            productCards.forEach(card => {
                card.addEventListener('mouseenter', function() {
                    this.style.animation = 'fadeIn 0.6s ease forwards, float 3s ease-in-out infinite';
                });
                
                card.addEventListener('mouseleave', function() {
                    this.style.animation = 'fadeIn 0.6s ease forwards, float 6s ease-in-out infinite';
                });
            });
        });
