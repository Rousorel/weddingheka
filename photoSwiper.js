class PhotoSwiper {
    constructor(container) {
        this.container = container;
        this.cards = Array.from(container.querySelectorAll('.photo-card'));
        this.currentCard = null;
        this.startX = 0;
        this.currentX = 0;
        this.isDragging = false;

        this.init();
        this.setupGlobalEvents();
    }

    init() {
        // Configurar cada tarjeta con los eventos necesarios
        this.cards.forEach((card, index) => {
            this.setupCard(card, index);
        });

        // Actualizar las posiciones iniciales
        this.updateCardPositions();
    }

    setupGlobalEvents() {
        // Eventos globales para el movimiento y finalización
        document.addEventListener('mousemove', (e) => this.drag(e));
        document.addEventListener('touchmove', (e) => this.drag(e), { passive: false });
        document.addEventListener('mouseup', () => this.endDragging());
        document.addEventListener('touchend', () => this.endDragging());
        
        // Prevenir comportamiento por defecto en touch para mejor control
        this.container.addEventListener('touchstart', (e) => {
            if (e.target.closest('.photo-card:first-child')) {
                e.preventDefault();
            }
        }, { passive: false });
    }

    setupCard(card, index) {
        card.style.zIndex = this.cards.length - index;
        
        // Eventos táctiles y de mouse para inicio
        const setupEvents = () => {
            const isTopCard = card === this.cards[0];
            if (isTopCard) {
                card.style.pointerEvents = 'auto';
                card.style.cursor = 'grab';
            } else {
                card.style.pointerEvents = 'none';
                card.style.cursor = 'default';
            }
        };

        // Configuración inicial
        setupEvents();

        // Eventos para la tarjeta
        card.addEventListener('mousedown', (e) => {
            if (card === this.cards[0]) {
                e.preventDefault();
                this.startDragging(e);
            }
        });
        
        card.addEventListener('touchstart', (e) => {
            if (card === this.cards[0]) {
                this.startDragging(e);
            }
        });

        // Observador de mutaciones para detectar cambios en el DOM
        const observer = new MutationObserver(() => {
            setupEvents();
        });

        observer.observe(this.container, {
            childList: true,
            subtree: true
        });
    }

    createCard(imageSrc) {
        const card = document.createElement('div');
        card.className = 'photo-card';
        
        const img = document.createElement('img');
        img.src = imageSrc;
        card.appendChild(img);

        // Eventos táctiles y de mouse
        card.addEventListener('mousedown', e => this.startDragging(e));
        card.addEventListener('touchstart', e => this.startDragging(e));
        
        document.addEventListener('mousemove', e => this.drag(e));
        document.addEventListener('touchmove', e => this.drag(e));
        
        document.addEventListener('mouseup', () => this.endDragging());
        document.addEventListener('touchend', () => this.endDragging());

        return card;
    }

    startDragging(e) {
        if (this.isDragging) return;
        
        this.isDragging = true;
        this.currentCard = e.target.closest('.photo-card');
        if (!this.currentCard) return;

        this.currentCard.classList.add('swiping');
        this.startX = e.type === 'mousedown' ? e.clientX : e.touches[0].clientX;
        this.currentX = 0;
    }

    drag(e) {
        if (!this.isDragging || !this.currentCard) return;

        e.preventDefault();
        const currentX = e.type === 'mousemove' ? e.clientX : e.touches[0].clientX;
        this.currentX = currentX - this.startX;

        const rotate = this.currentX * 0.1;
        this.currentCard.style.transform = `translateX(${this.currentX}px) rotate(${rotate}deg)`;

        // Ajustar opacidad basada en la distancia
        const opacity = Math.max(1 - Math.abs(this.currentX) / 500, 0.5);
        this.currentCard.style.opacity = opacity;
    }

    endDragging() {
        if (!this.isDragging || !this.currentCard) return;

        this.isDragging = false;
        this.currentCard.classList.remove('swiping');

        // Umbral más bajo para móvil (más sensible al swipe)
        const threshold = window.innerWidth < 768 ? 50 : 100;
        
        if (Math.abs(this.currentX) > threshold) {
            // Deslizar a la izquierda o derecha
            const direction = this.currentX > 0 ? 'swipe-right' : 'swipe-left';
            this.currentCard.classList.add(direction);
            
            // Remover la tarjeta después de la animación
            setTimeout(() => {
                this.currentCard.remove();
                this.cards = Array.from(this.container.querySelectorAll('.photo-card')); // Actualizar array de tarjetas
                
                if (this.cards.length > 0) {
                    // Habilitar la siguiente tarjeta y actualizar posiciones
                    this.cards[0].style.pointerEvents = 'auto';
                    this.cards[0].style.cursor = 'grab';
                    this.updateCardPositions();
                } else {
                    // Recrear todas las tarjetas
                    this.recreateCards();
                }
            }, 300);
        } else {
            // Regresar a la posición original
            this.currentCard.style.transform = '';
            this.updateCardPositions();
        }
    }

    updateCardPositions() {
        this.cards.forEach((card, index) => {
            // Aplicar transforms basados en el index, pero permitir que CSS defina el estilo base
            const scale = Math.max(1 - (index * 0.08), 0.52);
            const translateY = index * 15;
            
            // Obtener la rotación actual del CSS y mantenerla
            let baseRotate = 0;
            if (index === 0) baseRotate = 4;
            else if (index === 1) baseRotate = -8;
            else if (index === 2) baseRotate = 12;
            else if (index === 3) baseRotate = -6;
            else baseRotate = 9;
            
            card.style.transform = `scale(${scale}) translateY(${translateY}px) rotateZ(${baseRotate}deg)`;
            card.style.zIndex = this.cards.length - index;
        });
    }

    resetCards() {
        // Recrear todas las tarjetas originales
        const images = Array.from(this.container.querySelectorAll('img[data-original]'));
        images.forEach(img => {
            const card = this.createCard(img.getAttribute('data-original'));
            this.cards.push(card);
            this.stackContainer.appendChild(card);
        });
        this.updateCardPositions();
    }

    recreateCards() {
        // Obtener el elemento .card-stack
        const stackContainer = this.container.querySelector('.card-stack');
        
        // Obtener todas las fuentes de imágenes originales
        const originalImages = Array.from(document.querySelectorAll('.historia-fotos img[data-original]'))
            .map(img => img.getAttribute('data-original'));

        if (originalImages.length === 0) {
            // Si no hay imágenes con data-original, usar las fuentes originales definidas en el HTML
            const originalSources = [
                'images/2016.jpg',
                'images/2016_2.JPG',
                'images/2017.jpg',
                'images/2017_2.jpg',
                'images/2017_3.jpg',
                'images/2017_4.jpg',
                'images/2018.jpg',
                'images/2018_2.jpg',
                'images/2018_3.jpg',
                'images/2019.jpg',
                'images/2019_2.jpg',
                'images/2019_3.jpg'
            ];
            
            // Crear nuevas tarjetas
            originalSources.forEach(src => {
                const card = document.createElement('div');
                card.className = 'photo-card';
                
                const img = document.createElement('img');
                img.src = src;
                card.appendChild(img);
                
                stackContainer.appendChild(card);
            });
        } else {
            // Crear tarjetas usando las imágenes data-original
            originalImages.forEach(src => {
                const card = document.createElement('div');
                card.className = 'photo-card';
                
                const img = document.createElement('img');
                img.src = src;
                card.appendChild(img);
                
                stackContainer.appendChild(card);
            });
        }

        // Actualizar el array de tarjetas y sus posiciones
        this.cards = Array.from(this.container.querySelectorAll('.photo-card'));
        this.updateCardPositions();
        
        // Configurar eventos para las nuevas tarjetas
        this.cards.forEach((card, index) => {
            this.setupCard(card, index);
        });
    }
}

// Inicializar el swiper cuando el documento esté listo
document.addEventListener('DOMContentLoaded', () => {
    const container = document.querySelector('.historia-fotos');
    if (container) {
        // Guardar las imágenes originales como datos
        const images = Array.from(container.querySelectorAll('img'));
        images.forEach(img => {
            img.setAttribute('data-original', img.src);
        });
        
        // Guardar las imágenes originales
        const originalImages = images.map(img => img.src);
        
        // Limpiar el contenedor
        container.innerHTML = '';
        
        // Crear elemento para el stack de tarjetas
        const stackContainer = document.createElement('div');
        stackContainer.className = 'card-stack';
        container.appendChild(stackContainer);
        
        // Crear las tarjetas con las imágenes
        originalImages.forEach(src => {
            const card = document.createElement('div');
            card.className = 'photo-card';
            
            const img = document.createElement('img');
            img.src = src;
            card.appendChild(img);
            
            stackContainer.appendChild(card);
        });
        
        // Inicializar el swiper
        new PhotoSwiper(container);
    }
});