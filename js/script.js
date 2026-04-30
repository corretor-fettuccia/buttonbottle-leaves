/* =========================================================
   BTN BOTTLE LEAVES PLUGIN — DECLARATIVE MODE v3.0.0
   Core Library
   Repositório: https://corretor-fettuccia.github.io/corretor-fettuccia/buttonbottle-leaves/js/script.js
   
   COMO USAR:
   1. Adicione o atributo "data-bottle-leaves" em qualquer <button>
   2. Configure com data-texto, data-folhas, etc.
   3. O plugin aplica automaticamente!
   
   ATRIBUTOS DISPONÍVEIS:
   - data-bottle-leaves  → obrigatório (ativa o plugin)
   - data-texto          → texto do botão
   - data-folhas         → quantidade de folhas (padrão: 95)
   - data-intensidade    → intensidade da animação (padrão: 1.15)
   - data-gravidade      → gravidade (padrão: 0.02)
   - data-herois         → proporção de folhas heroicas (padrão: 0.32)
   
   MÉTODOS PÚBLICOS:
   - BtnBottleLeaves.scan() → escaneia e ativa novos botões dinâmicos
========================================================= */

(function(global) {
  'use strict';
  
  /* Engine de folhas (física e animação) */
  class LeafEngine {
    constructor(button, bed, textSpan, config) {
      this.button = button;
      this.bed = bed;
      this.textSpan = textSpan;
      this.config = config;
      this.leaves = [];
      this.bounds = { width: 0, height: 0, bottomY: 0 };
      this.animationFrame = null;
      
      this.updateDimensions();
      this.createLeaves();
      
      // resize observer
      this.resizeObserver = new ResizeObserver(() => {
        this.updateDimensions();
        this.adjustLeavesToResize();
      });
      this.resizeObserver.observe(button);
    }
    
    updateDimensions() {
      if (!this.bed) return;
      this.bounds.width = this.bed.clientWidth;
      this.bounds.height = this.bed.clientHeight;
      this.bounds.bottomY = Math.max(12, this.bounds.height - 5);
    }
    
    createLeaves() {
      if (!this.bed) return;
      const existing = this.bed.querySelectorAll('.btn-bottle-leaves__leaf');
      existing.forEach(l => l.remove());
      this.leaves = [];
      
      const w = this.bounds.width;
      const h = this.bounds.height;
      if (w < 20) return;
      
      for (let i = 0; i < this.config.leafCount; i++) {
        const leafEl = document.createElement('div');
        leafEl.className = 'btn-bottle-leaves__leaf';
        const isHero = Math.random() < this.config.heroRatio;
        const baseLen = isHero ? 5 + Math.random() * 6 : 3.5 + Math.random() * 4.2;
        leafEl.style.width = `${baseLen}px`;
        leafEl.style.height = `${baseLen * 0.6}px`;
        
        this.leaves.push({
          el: leafEl,
          x: 6 + Math.random() * (w - 12),
          y: 4 + Math.random() * (h - 12),
          vx: (Math.random() - 0.5) * 0.5,
          vy: (Math.random() - 0.5) * 0.4,
          rot: Math.random() * 360,
          vr: (Math.random() - 0.5) * 2.6,
          wavePhase: Math.random() * Math.PI * 2,
          glowSeed: Math.random() * 100,
          isHero: isHero,
          restitution: 0.5 + Math.random() * 0.3
        });
        this.bed.appendChild(leafEl);
      }
    }
    
    adjustLeavesToResize() {
      if (!this.leaves.length) return;
      const newW = this.bounds.width;
      const oldW = this.bounds.prevWidth || newW;
      for (let leaf of this.leaves) {
        if (oldW > 0) leaf.x = (leaf.x / oldW) * newW;
        leaf.x = Math.min(newW - 5, Math.max(3, leaf.x));
      }
      this.bounds.prevWidth = newW;
    }
    
    splash(force = 1.0) {
      for (let leaf of this.leaves) {
        const delay = Math.random() * 70;
        setTimeout(() => {
          const power = (Math.random() * 2.4 + 1.2) * this.config.intensity * force;
          leaf.vy = -power * (0.7 + Math.random() * 0.9);
          leaf.vx += (Math.random() - 0.5) * 3.2 * force;
          leaf.vr += (Math.random() - 0.5) * 8 * force;
          if (leaf.isHero) leaf.vy -= 1.0;
        }, delay);
      }
    }
    
    start() {
      const animate = () => {
        this.updatePhysics();
        this.animationFrame = requestAnimationFrame(animate);
      };
      this.animationFrame = requestAnimationFrame(animate);
    }
    
    updatePhysics() {
      if (!this.bed) return;
      const w = this.bounds.width;
      const floorY = this.bounds.bottomY - 2;
      const now = Date.now();
      
      for (let leaf of this.leaves) {
        const buoyancy = Math.sin(now * 0.0055 + leaf.wavePhase) * 0.028;
        leaf.vy += this.config.gravity * this.config.intensity + buoyancy * 0.05;
        leaf.vx += (Math.random() - 0.5) * 0.045;
        leaf.vx *= 0.983;
        leaf.vy *= 0.983;
        leaf.x += leaf.vx;
        leaf.y += leaf.vy;
        leaf.rot += leaf.vr + Math.sin(now * 0.008 + leaf.wavePhase) * 0.55;
        
        if (leaf.x < 3) { leaf.x = 3; leaf.vx *= -0.48; }
        if (leaf.x > w - 5) { leaf.x = w - 5; leaf.vx *= -0.48; }
        if (leaf.y > floorY) { leaf.y = floorY; leaf.vy *= -leaf.restitution * 0.47; leaf.vx *= 0.96; }
        if (leaf.y < 3) { leaf.y = 3; leaf.vy *= -0.35; }
        
        const twinkle = (Math.sin(now * 0.011 + leaf.glowSeed) + 1) / 2;
        let glow = twinkle * 0.8;
        if (leaf.isHero) glow = twinkle * 1.2 + 0.25;
        
        leaf.el.style.filter = `brightness(${0.9 + glow * 0.95}) drop-shadow(0 0 ${3 + glow * 9}px rgba(255,200,55,${0.5 + glow * 0.5}))`;
        leaf.el.style.transform = `translate(${leaf.x}px, ${leaf.y}px) rotate(${leaf.rot}deg) scale(${0.85 + glow * 0.28})`;
        leaf.el.style.opacity = 0.8 + glow * 0.35;
      }
    }
    
    destroy() {
      if (this.animationFrame) cancelAnimationFrame(this.animationFrame);
      if (this.resizeObserver) this.resizeObserver.disconnect();
    }
  }
  
  /* Plugin Principal */
  class BtnBottleLeavesPlugin {
    constructor() {
      this.instances = new Map();
      this.init();
    }
    
    init() {
      this.scan();
      this.observeDOM();
    }
    
    scan() {
      const buttons = document.querySelectorAll('[data-bottle-leaves]');
      buttons.forEach(button => {
        if (this.instances.has(button)) return;
        
        const config = this.extractConfig(button);
        this.activateButton(button, config);
      });
    }
    
    extractConfig(button) {
      return {
        text: button.getAttribute('data-texto') || "RESPLANDOR",
        leafCount: parseInt(button.getAttribute('data-folhas')) || 95,
        intensity: parseFloat(button.getAttribute('data-intensidade')) || 1.15,
        gravity: parseFloat(button.getAttribute('data-gravidade')) || 0.02,
        heroRatio: parseFloat(button.getAttribute('data-herois')) || 0.32,
        width: button.style.width || null,
        height: button.style.height || null
      };
    }
    
    activateButton(button, config) {
      button.classList.add('btn-bottle-leaves');
      
      if (!button.querySelector('.btn-bottle-leaves__glass')) {
        button.innerHTML = `
          <div class="btn-bottle-leaves__glass"></div>
          <div class="btn-bottle-leaves__bed"></div>
          <div class="btn-bottle-leaves__text">${config.text}</div>
        `;
      } else {
        const textSpan = button.querySelector('.btn-bottle-leaves__text');
        if (textSpan) textSpan.textContent = config.text;
      }
      
      const bed = button.querySelector('.btn-bottle-leaves__bed');
      const textSpan = button.querySelector('.btn-bottle-leaves__text');
      
      if (!bed) return;
      
      const engine = new LeafEngine(button, bed, textSpan, config);
      this.instances.set(button, engine);
      engine.start();
      
      this.bindEvents(button, engine);
    }
    
    bindEvents(button, engine) {
      button.addEventListener('click', (e) => {
        e.preventDefault();
        engine.splash(1.2);
        
        const glass = button.querySelector('.btn-bottle-leaves__glass');
        if (glass) {
          glass.style.transition = 'box-shadow 0.12s';
          glass.style.boxShadow = `inset 0 0 0 2px rgba(255,215,0,0.85), inset 0 1px 3px rgba(255,245,150,0.9)`;
          setTimeout(() => {
            if (glass) glass.style.boxShadow = `inset 0 1px 2px rgba(255,245,180,0.7), inset 0 -2px 0 rgba(0,0,0,0.15), 0 20px 38px -14px rgba(0,0,0,0.8)`;
          }, 160);
        }
      });
    }
    
    observeDOM() {
      const observer = new MutationObserver((mutations) => {
        let shouldScan = false;
        mutations.forEach(mutation => {
          if (mutation.addedNodes.length > 0) {
            mutation.addedNodes.forEach(node => {
              if (node.nodeType === 1) {
                if (node.hasAttribute && node.hasAttribute('data-bottle-leaves')) {
                  shouldScan = true;
                }
                if (node.querySelectorAll) {
                  if (node.querySelectorAll('[data-bottle-leaves]').length > 0) {
                    shouldScan = true;
                  }
                }
              }
            });
          }
        });
        if (shouldScan) setTimeout(() => this.scan(), 50);
      });
      observer.observe(document.body, { childList: true, subtree: true });
    }
  }
  
  // Inicializa o plugin e expõe globalmente
  const plugin = new BtnBottleLeavesPlugin();
  global.BtnBottleLeaves = {
    scan: () => plugin.scan(),
    version: '3.0.0'
  };
  
})(window);
