// Advanced Search Functionality with Fuzzy Matching
class AdvancedSearch {
    constructor() {
        this.products = this.extractProductData();
        this.searchInput = document.getElementById('searchInput');
        this.searchButton = document.getElementById('searchButton');
        this.searchSuggestions = document.getElementById('searchSuggestions');
        this.storeGrid = document.getElementById('storeGrid');
        this.highlightedIndex = -1;
        
        this.init();
    }
    
    extractProductData() {
        const cards = document.querySelectorAll('.flip-card');
        const products = [];
        
        cards.forEach(card => {
            const title = card.querySelector('.product-title').textContent;
            const description = card.querySelector('.product-description').textContent;
            const type = card.getAttribute('data-type');
            const id = card.querySelector('.explore-btn').getAttribute('href').replace('product', '').replace('.html', '');
            
            // Generate search tags based on content
            const tags = this.generateSearchTags(title, description, type);
            
            products.push({
                id,
                title,
                description,
                type,
                tags,
                element: card
            });
        });
        
        return products;
    }
    
    generateSearchTags(title, description, type) {
        const tags = new Set();
        
        // Add words from title and description
        const text = `${title} ${description}`.toLowerCase();
        const words = text.split(/\s+/).filter(word => word.length > 2);
        words.forEach(word => tags.add(word));
        
        // Add type-specific tags
        const typeTags = {
            pdf: ['document', 'guide', 'ebook', 'tutorial', 'pdf'],
            code: ['programming', 'developer', 'source code', 'github', 'repository'],
            zip: ['archive', 'package', 'bundle', 'collection', 'resources'],
            image: ['photo', 'picture', 'graphic', 'artwork', 'visual'],
            video: ['movie', 'tutorial', 'course', 'lesson', 'screencast'],
            music: ['audio', 'sound', 'track', 'melody', 'song']
        };
        
        (typeTags[type] || []).forEach(tag => tags.add(tag));
        
        // Add common variations and misspellings
        this.addCommonVariations(tags);
        
        return Array.from(tags);
    }
    
    addCommonVariations(tags) {
        const variations = {
            'developer': ['dev', 'develper', 'devaloper', 'devloper'],
            'javascript': ['js', 'javscript', 'javascrip'],
            'react': ['reakt', 'reac'],
            'component': ['componant', 'componnt'],
            'toolkit': ['tool kit', 'toolket', 'toolkt'],
            'digital': ['digetal', 'dijital'],
            'resource': ['resourse', 'resorces'],
            'template': ['templet', 'templat'],
            'guide': ['gide', 'guyde'],
            'course': ['corse', 'coarse']
        };
        
        tags.forEach(tag => {
            if (variations[tag]) {
                variations[tag].forEach(variation => tags.add(variation));
            }
        });
    }
    
    init() {
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        this.searchInput.addEventListener('input', () => {
            this.showSuggestions(this.searchInput.value);
        });
        
        this.searchInput.addEventListener('keyup', (e) => {
            if (e.key === 'Enter') {
                this.performSearch(this.searchInput.value);
                this.searchSuggestions.style.display = 'none';
            }
        });
        
        this.searchButton.addEventListener('click', () => {
            this.performSearch(this.searchInput.value);
            this.searchSuggestions.style.display = 'none';
        });
        
        // Keyboard navigation for suggestions
        this.searchInput.addEventListener('keydown', (e) => {
            const suggestions = this.searchSuggestions.querySelectorAll('.search-suggestion');
            
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                this.highlightedIndex = (this.highlightedIndex + 1) % suggestions.length;
                this.updateHighlightedSuggestion(suggestions);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                this.highlightedIndex = (this.highlightedIndex - 1 + suggestions.length) % suggestions.length;
                this.updateHighlightedSuggestion(suggestions);
            } else if (e.key === 'Enter' && this.highlightedIndex >= 0) {
                e.preventDefault();
                suggestions[this.highlightedIndex].click();
            }
        });
        
        // Close suggestions when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.search-container')) {
                this.searchSuggestions.style.display = 'none';
                this.highlightedIndex = -1;
            }
        });
    }
    
    performSearch(query) {
        if (!query.trim()) {
            this.showAllProducts();
            this.hideSearchResultsInfo();
            return;
        }
        
        const searchResults = this.products.map(product => {
            const score = this.calculateRelevanceScore(product, query);
            const matches = this.findMatches(product, query);
            return { ...product, score, matches };
        }).filter(result => result.score > 0)
          .sort((a, b) => b.score - a.score);
        
        this.updateProductDisplay(searchResults, query);
        this.showSearchResultsInfo(searchResults.length, query);
    }
    
    calculateRelevanceScore(product, query) {
        const searchTerms = query.toLowerCase().split(/\s+/).filter(term => term.length > 0);
        let score = 0;
        
        // Exact matches get highest scores
        searchTerms.forEach(term => {
            // Title matches (highest weight)
            const titleScore = this.calculateTermScore(product.title, term, 10);
            score += titleScore;
            
            // Description matches (medium weight)
            const descScore = this.calculateTermScore(product.description, term, 5);
            score += descScore;
            
            // Tag matches (high weight)
            const tagScore = product.tags.reduce((sum, tag) => {
                return sum + this.calculateTermScore(tag, term, 7);
            }, 0);
            score += tagScore;
            
            // Type matches (low weight)
            const typeScore = this.calculateTermScore(product.type, term, 3);
            score += typeScore;
        });
        
        // Bonus for complete phrase matches
        const completePhraseScore = this.calculatePhraseScore(product, query);
        score += completePhraseScore;
        
        return score;
    }
    
    calculateTermScore(text, term, baseWeight) {
        const lowerText = text.toLowerCase();
        const lowerTerm = term.toLowerCase();
        
        // Exact match
        if (lowerText.includes(lowerTerm)) {
            return baseWeight;
        }
        
        // Fuzzy match with Levenshtein distance
        const fuzzyScore = this.calculateFuzzyMatchScore(lowerText, lowerTerm);
        return fuzzyScore * baseWeight * 0.8;
    }
    
    calculateFuzzyMatchScore(text, term) {
        // Simple fuzzy matching that handles common misspellings
        if (term.length < 3) return 0;
        
        // Check for character transpositions and missing letters
        let matchCount = 0;
        let termIndex = 0;
        
        for (let i = 0; i < text.length && termIndex < term.length; i++) {
            if (text[i] === term[termIndex]) {
                matchCount++;
                termIndex++;
            } else if (termIndex > 0 && text[i] === term[termIndex - 1]) {
                // Handle double letters
                matchCount += 0.5;
            } else if (i > 0 && text[i - 1] === term[termIndex] && text[i] === term[termIndex - 1]) {
                // Handle transposed letters
                matchCount += 0.8;
                termIndex += 2;
            }
        }
        
        const similarity = matchCount / term.length;
        return similarity > 0.6 ? similarity : 0;
    }
    
    calculatePhraseScore(product, query) {
        const phrases = [
            product.title.toLowerCase(),
            product.description.toLowerCase()
        ];
        
        const lowerQuery = query.toLowerCase();
        let maxScore = 0;
        
        phrases.forEach(phrase => {
            // Check if query appears as continuous phrase
            if (phrase.includes(lowerQuery)) {
                maxScore = Math.max(maxScore, 15);
            }
            
            // Check for phrase with minor variations
            const words = lowerQuery.split(/\s+/);
            if (words.length > 1) {
                let phraseMatch = true;
                let currentIndex = 0;
                
                for (const word of words) {
                    const wordIndex = phrase.indexOf(word, currentIndex);
                    if (wordIndex === -1) {
                        phraseMatch = false;
                        break;
                    }
                    currentIndex = wordIndex + word.length;
                }
                
                if (phraseMatch) {
                    maxScore = Math.max(maxScore, 12);
                }
            }
        });
        
        return maxScore;
    }
    
    findMatches(product, query) {
        const matches = {
            title: [],
            description: [],
            tags: []
        };
        
        const searchTerms = query.toLowerCase().split(/\s+/);
        
        searchTerms.forEach(term => {
            // Find matches in title
            if (this.hasMatch(product.title, term)) {
                matches.title.push(term);
            }
            
            // Find matches in description
            if (this.hasMatch(product.description, term)) {
                matches.description.push(term);
            }
            
            // Find matches in tags
            product.tags.forEach(tag => {
                if (this.hasMatch(tag, term)) {
                    matches.tags.push(term);
                }
            });
        });
        
        return matches;
    }
    
    hasMatch(text, term) {
        const lowerText = text.toLowerCase();
        const lowerTerm = term.toLowerCase();
        
        // Exact match
        if (lowerText.includes(lowerTerm)) {
            return true;
        }
        
        // Fuzzy match for longer terms
        if (term.length >= 3) {
            return this.calculateFuzzyMatchScore(lowerText, lowerTerm) > 0.7;
        }
        
        return false;
    }
    
    updateProductDisplay(searchResults, query) {
        // Hide all products first
        this.products.forEach(product => {
            product.element.style.display = 'none';
            product.element.style.order = '';
        });
        
        // Show and reorder matching products
        searchResults.forEach((result, index) => {
            result.element.style.display = 'block';
            result.element.style.order = index;
            
            // Highlight matching text (optional visual enhancement)
            this.highlightMatches(result, query);
        });
        
        // Update the grid to reflect new order
        if (this.storeGrid) {
            const visibleCards = Array.from(this.storeGrid.querySelectorAll('.flip-card[style*="display: block"]'));
            visibleCards.sort((a, b) => {
                return parseInt(a.style.order) - parseInt(b.style.order);
            });
            
            visibleCards.forEach(card => {
                this.storeGrid.appendChild(card);
            });
        }
    }
    
    highlightMatches(product, query) {
        // This is a simplified version - you could implement more sophisticated highlighting
        const searchTerms = query.toLowerCase().split(/\s+/);
        
        // You could add CSS classes to highlight matching terms in title/description
        // For now, we'll just reorder based on relevance
    }
    
    showSuggestions(query) {
        if (!query.trim()) {
            this.searchSuggestions.style.display = 'none';
            this.highlightedIndex = -1;
            return;
        }
        
        const suggestions = this.products
            .map(product => {
                const score = this.calculateRelevanceScore(product, query);
                return { ...product, score };
            })
            .filter(result => result.score > 0)
            .sort((a, b) => b.score - a.score)
            .slice(0, 5);
        
        this.displaySuggestions(suggestions, query);
    }
    
    displaySuggestions(suggestions, query) {
        if (suggestions.length === 0) {
            this.searchSuggestions.innerHTML = `
                <div class="no-results">
                    <i class="fas fa-search"></i>
                    <p>No matching resources found for "${query}"</p>
                </div>
            `;
            this.searchSuggestions.style.display = 'block';
            return;
        }
        
        this.searchSuggestions.innerHTML = '';
        suggestions.forEach((product, index) => {
            const suggestion = document.createElement('div');
            suggestion.className = 'search-suggestion';
            suggestion.innerHTML = `
                <i class="fas fa-${this.getIconForType(product.type)}"></i>
                <div>
                    <strong>${this.highlightText(product.title, query)}</strong>
                    <div style="font-size: 0.8rem; color: #636e72;">
                        ${this.highlightText(product.description, query)}
                    </div>
                    <div style="font-size: 0.7rem; color: #74b9ff; margin-top: 4px;">
                        Relevance: ${Math.round(product.score)}%
                    </div>
                </div>
            `;
            suggestion.addEventListener('click', () => {
                this.searchInput.value = product.title;
                this.performSearch(product.title);
                this.searchSuggestions.style.display = 'none';
            });
            this.searchSuggestions.appendChild(suggestion);
        });
        
        this.searchSuggestions.style.display = 'block';
        this.highlightedIndex = -1;
    }
    
    highlightText(text, query) {
        const searchTerms = query.toLowerCase().split(/\s+/);
        let highlightedText = text;
        
        searchTerms.forEach(term => {
            if (term.length < 2) return;
            
            const regex = new RegExp(`(${this.escapeRegex(term)})`, 'gi');
            highlightedText = highlightedText.replace(regex, '<span class="search-match-highlight">$1</span>');
        });
        
        return highlightedText;
    }
    
    escapeRegex(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
    
    getIconForType(type) {
        const icons = {
            pdf: 'file-pdf',
            code: 'file-code',
            zip: 'file-archive',
            image: 'file-image',
            video: 'file-video',
            music: 'file-audio'
        };
        return icons[type] || 'file';
    }
    
    updateHighlightedSuggestion(suggestions) {
        suggestions.forEach((suggestion, index) => {
            suggestion.classList.toggle('highlight', index === this.highlightedIndex);
        });
    }
    
    showAllProducts() {
        this.products.forEach(product => {
            product.element.style.display = 'block';
            product.element.style.order = '';
        });
    }
    
    showSearchResultsInfo(count, query) {
        let resultsInfo = document.getElementById('searchResultsInfo');
        if (!resultsInfo) {
            resultsInfo = document.createElement('div');
            resultsInfo.id = 'searchResultsInfo';
            resultsInfo.className = 'search-results-info';
            document.querySelector('.search-container').parentNode.insertBefore(resultsInfo, document.querySelector('.filter-bar'));
        }
        
        if (count === 0) {
            resultsInfo.innerHTML = `No results found for "<strong>${query}</strong>"`;
        } else {
            resultsInfo.innerHTML = `Showing ${count} most relevant result${count !== 1 ? 's' : ''} for "<strong>${query}</strong>"`;
        }
    }
    
    hideSearchResultsInfo() {
        const resultsInfo = document.getElementById('searchResultsInfo');
        if (resultsInfo) {
            resultsInfo.remove();
        }
    }
}

// Initialize search when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    new AdvancedSearch();
});