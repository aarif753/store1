        // Track product popularity and implement advanced features
        document.addEventListener('DOMContentLoaded', function() {
            const storeGrid = document.getElementById('storeGrid');
            const filterBtns = document.querySelectorAll('.filter-btn');
            const exploreBtns = document.querySelectorAll('.explore-btn');
            const flipCards = document.querySelectorAll('.flip-card');
            
            // Initialize popularity from localStorage or set to 0
            flipCards.forEach(card => {
                const id = card.querySelector('.explore-btn').getAttribute('href').replace('product', '').replace('.html', '');
                const popularity = localStorage.getItem(`product-${id}-popularity`) || 0;
                card.setAttribute('data-popularity', popularity);
            });
            
            // Filter functionality
            filterBtns.forEach(btn => {
                btn.addEventListener('click', () => {
                    // Remove active class from all buttons
                    filterBtns.forEach(b => b.classList.remove('active'));
                    // Add active class to clicked button
                    btn.classList.add('active');
                    
                    const filter = btn.getAttribute('data-filter');
                    
                    // Show all products if "all" filter is selected
                    if (filter === 'all') {
                        flipCards.forEach(card => {
                            card.style.display = 'block';
                        });
                    } else {
                        // Show only products with matching type
                        flipCards.forEach(card => {
                            if (card.getAttribute('data-type') === filter) {
                                card.style.display = 'block';
                            } else {
                                card.style.display = 'none';
                            }
                        });
                    }
                    
                    // Reorder products based on popularity
                    reorderProducts();
                });
            });
            
            // Explore button functionality
            exploreBtns.forEach(btn => {
                btn.addEventListener('click', function(e) {
                    const productId = this.getAttribute('href').replace('product', '').replace('.html', '');
                    
                    // Increase popularity count
                    const currentPopularity = parseInt(localStorage.getItem(`product-${productId}-popularity`) || 0);
                    localStorage.setItem(`product-${productId}-popularity`, currentPopularity + 1);
                    
                    // Update the card's popularity attribute
                    const card = this.closest('.flip-card');
                    card.setAttribute('data-popularity', currentPopularity + 1);
                    
                    // Reorder products based on new popularity
                    reorderProducts();
                });
            });
            
            // Function to reorder products based on popularity
            function reorderProducts() {
                const visibleCards = Array.from(flipCards).filter(card => 
                    card.style.display !== 'none'
                );
                
                // Sort by popularity (descending)
                visibleCards.sort((a, b) => {
                    return parseInt(b.getAttribute('data-popularity')) - parseInt(a.getAttribute('data-popularity'));
                });
                
                // Randomize position for products with same popularity (advanced feature)
                const groupedByPopularity = {};
                visibleCards.forEach(card => {
                    const popularity = card.getAttribute('data-popularity');
                    if (!groupedByPopularity[popularity]) {
                        groupedByPopularity[popularity] = [];
                    }
                    groupedByPopularity[popularity].push(card);
                });
                
                // Shuffle groups with same popularity
                for (const popularity in groupedByPopularity) {
                    if (groupedByPopularity[popularity].length > 1) {
                        shuffleArray(groupedByPopularity[popularity]);
                    }
                }
                
                // Flatten the array back
                const reorderedCards = [];
                for (const popularity in groupedByPopularity) {
                    reorderedCards.push(...groupedByPopularity[popularity]);
                }
                
                // Update the DOM
                reorderedCards.forEach(card => {
                    storeGrid.appendChild(card);
                });
                
                // Update popular badges
                updatePopularBadges();
            }
            
            // Function to shuffle array (Fisher-Yates algorithm)
            function shuffleArray(array) {
                for (let i = array.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [array[i], array[j]] = [array[j], array[i]];
                }
                return array;
            }
            
            // Function to update popular badges based on popularity
            function updatePopularBadges() {
                const allCards = Array.from(flipCards);
                
                // Remove all existing badges
                document.querySelectorAll('.popular-badge').forEach(badge => {
                    badge.remove();
                });
                
                // Sort by popularity
                allCards.sort((a, b) => {
                    return parseInt(b.getAttribute('data-popularity')) - parseInt(a.getAttribute('data-popularity'));
                });
                
                // Add badges to top 3 popular products
                for (let i = 0; i < Math.min(3, allCards.length); i++) {
                    const card = allCards[i];
                    const popularity = parseInt(card.getAttribute('data-popularity'));
                    
                    // Only add badge if product has been explored at least once
                    if (popularity > 0) {
                        const badge = document.createElement('div');
                        badge.className = 'popular-badge';
                        badge.textContent = 'Popular';
                        card.querySelector('.flip-card-front').prepend(badge);
                    }
                }
            }
            
            // Initial setup
            reorderProducts();
            
            // Randomize product positions occasionally (advanced feature)
            setInterval(() => {
                // 20% chance to shuffle products with same popularity
                if (Math.random() < 0.2) {
                    reorderProducts();
                }
            }, 10000); // Check every 10 seconds
        });