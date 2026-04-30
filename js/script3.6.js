/* =========================================================
   BTN BOTTLE LEAVES PLUGIN — DECLARATIVE MODE v3.6.0
   - Folhas NÃO pulam no hover (somente no clique)
   - Transição de texto mais lenta e suave
========================================================= */

(function(global) {
  'use strict';
  
  class LeafEngine {
    constructor(button, bed, textSpan, config) {
      this.button = button;
      this.bed = bed;
      this.textSpan = textSpan;
      this.config = config;
      this.leaves = [];
      this.bounds = { width: 0, height: 0, bottomY: 0, topY: 0 };
      this.animationFrame = null;
      
      this.transitionSpeed = config.transitionSpeed || 1200;
      this.transitionDuration = config.transitionDuration || 500;
      this.transitionStyle = config.transitionStyle || 'fade';
      
      this.texts = this.extractAllTexts(button);
      this.currentTextIndex = 0;
      this.textInterval = null;
      this.isHovering = false;
      
      this.updateDimensions();
      this.createLeaves();
      this.setupTextHover();
      
      this.resizeObserver = new ResizeObserver(() => {
        this.updateDimensions();
        this.adjustLeavesToResize();
      });
      this.resizeObserver.observe(button);
    }
    
    extractAllTexts(button) {
      const texts = [];
      let index = 0;
      
      const mainText = button.getAttribute('data-texto');
      if (mainText !== null) {
        texts.push(mainText);
        index = 1;
      }
      
      let hasMore = true;
      while (hasMore) {
        const textAttr = button.getAttribute(`data-texto${index}`);
        if (textAttr !== null) {
          texts.push(textAttr);
          index++;
        } else {
          hasMore = false;
        }
      }
      
      if (texts.length === 0) {
        texts.push(this.config.text || "RESPLANDOR");
      }
      
      return texts;
    }
    
    setupTextHover() {
      if (this.texts.length <= 1) return;
      
      let hoverTimeout = null;
      
      this.button.addEventListener('mouseenter', () => {
        this.isHovering = true;
        if (hoverTimeout) clearTimeout(hoverTimeout);
        this.startTextRotation();
      });
      
      this.button.addEventListener('mouseleave', () => {
        this.isHovering = false;
        
        if (this.textInterval) {
          clearInterval(this.textInterval);
          this.textInterval = null;
        }
        
        hoverTimeout = setTimeout(() => {
          if (this.textSpan && !this.isHovering) {
            this.animateTextChange(this.texts[0], true);
            this.currentTextIndex = 0;
          }
        }, 150);
      });
    }
    
    startTextRotation() {
      if (this.textInterval) clearInterval(this.textInterval);
      
      this.currentTextIndex = 0;
      
      if (this.textSpan && this.texts[0]) {
        this.textSpan.textContent = this.texts[0];
      }
      
      let nextIndex = 1;
      
      this.textInterval = setInterval(() => {
        if (!this.isHovering) return;
        
        if (nextIndex < this.texts.length) {
          this.animateTextChange(this.texts[nextIndex]);
          nextIndex++;
        } else {
          nextIndex = 0;
          this.animateTextChange(this.texts[nextIndex]);
          nextIndex = 1;
        }
      }, this.transitionSpeed);
    }
    
    animateTextChange(newText, isRestoring = false) {
      if (!this.textSpan) return;
      
      const style = this.transitionStyle;
      const duration = this.transitionDuration;
      
      this.textSpan.style.transition = `opacity ${duration}ms cubic-bezier(0.4, 0, 0.2, 1), transform ${duration}ms cubic-bezier(0.4, 0, 0.2, 1)`;
      
      if (style === 'fade') {
        this.textSpan.style.opacity = '0';
      } else if (style === 'slide') {
        this.textSpan.style.opacity = '0';
        this.textSpan.style.transform = 'translateY(8px)';
      } else if (style === 'scale') {
        this.textSpan.style.opacity = '0';
        this.textSpan.style.transform = 'scale(0.95)';
      }
      
      setTimeout(() => {
        if (this.textSpan) {
          this.textSpan.textContent = newText;
          
          if (style === 'fade') {
            this.textSpan.style.opacity = '1';
          } else if (style === 'slide') {
            this.textSpan.style.opacity = '1';
            this.textSpan.style.transform = 'translateY(0)';
          } else if (style === 'scale') {
            this.textSpan.style.opacity = '1';
            this.textSpan.style.transform = 'scale(1)';
          }
        }
      }, duration);
    }
    
    updateDimensions() {
      if (!this.bed) return;
      this.bounds.width = this.bed.clientWidth;
      this.bounds.height = this.bed.clientHeight;
      this.bounds.bottomY = Math.max(10, this.bounds.height - 6);
      this.bounds.topY = 4;
    }
    
    createLeaves() {
      if (!this.bed) return;
      const existing = this.bed.querySelectorAll('.btn-bottle-leaves__leaf');
      existing.forEach(l => l.remove());
      this.leaves = [];
      
      const w = this.bounds.width;
      const h = this.bounds.height;
      if (w < 30) return;
      
      for (let i = 0; i < this.config.leafCount; i++) {
        const leafEl = document.createElement('div');
        leafEl.className = 'btn-bottle-leaves__leaf';
        const isHero = Math.random() < this.config.heroRatio;
        const baseLen = isHero ? 5 + Math.random() * 5 : 3.5 + Math.random() * 3.5;
        leafEl.style.width = `${baseLen}px`;
        leafEl.style.height = `${baseLen * 0.55}px`;
        
        const margin = 8;
        this.leaves.push({
          el: leafEl,
          x: margin + Math.random() * (w - margin * 2),
          y: 4 + Math.random() * (h - 12),
          vx: (Math.random() - 0.5) * 0.4,
          vy: (Math.random() - 0.5) * 0.3,
          rot: Math.random() * 360,
          vr: (Math.random() - 0.5) * 2.2,
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
      const newH = this.bounds.height;
      const oldH = this.bounds.prevHeight || newH;
      
      for (let leaf of this.leaves) {
        if (oldW > 0) leaf.x = (leaf.x / oldW) * newW;
        if (oldH > 0) leaf.y = (leaf.y / oldH) * newH;
        leaf.x = Math.min(newW - 8, Math.max(5, leaf.x));
        leaf.y = Math.min(newH - 8, Math.max(3, leaf.y));
      }
      this.bounds.prevWidth = newW;
      this.bounds.prevHeight = newH;
    }
    
    // SPLASH - chamado APENAS no clique
    splash(force = 1.0) {
      for (let leaf of this.leaves) {
        const delay = Math.random() * 60;
        setTimeout(() => {
          const power = (Math.random() * 2 + 1) * this.config.intensity * force;
          leaf.vy = -power * (0.6 + Math.random() * 0.8);
          leaf.vx += (Math.random() - 0.5) * 2.5 * force;
          leaf.vr += (Math.random() - 0.5) * 6 * force;
          if (leaf.isHero) leaf.vy -= 0.8;
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
      const floorY = this.bounds.bottomY;
      const ceilingY = 4;
      const now = Date.now();
      
      for (let leaf of this.leaves) {
        const buoyancy = Math.sin(now * 0.005 + leaf.wavePhase) * 0.02;
        leaf.vy += this.config.gravity * this.config.intensity + buoyancy * 0.04;
        leaf.vx += (Math.random() - 0.5) * 0.035;
        leaf.vx *= 0.985;
        leaf.vy *= 0.985;
        
        leaf.x += leaf.vx;
        leaf.y += leaf.vy;
        leaf.rot += leaf.vr + Math.sin(now * 0.007 + leaf.wavePhase) * 0.5;
        
        if (leaf.x < 4) {
          leaf.x = 4;
          leaf.vx *= -0.45;
        }
        if (leaf.x > w - 7) {
          leaf.x = w - 7;
          leaf.vx *= -0.45;
        }
        
        if (leaf.y > floorY) {
          leaf.y = floorY;
          leaf.vy *= -leaf.restitution * 0.45;
          leaf.vx *= 0.96;
        }
        
        if (leaf.y < ceilingY) {
          leaf.y = ceilingY;
          leaf.vy *= -0.3;
        }
        
        const twinkle = (Math.sin(now * 0.01 + leaf.glowSeed) + 1) / 2;
        let glow = twinkle * 0.7;
        if (leaf.isHero) glow = twinkle * 1.1 + 0.2;
        
        const brightness = 0.9 + glow * 0.8;
        const shadowSize = 2 + glow * 7;
        
        leaf.el.style.filter = `brightness(${brightness}) drop-shadow(0 0 ${shadowSize}px rgba(255,200,55,${0.4 + glow * 0.5}))`;
        leaf.el.style.transform = `translate(${leaf.x}px, ${leaf.y}px) rotate(${leaf.rot}deg) scale(${0.85 + glow * 0.25})`;
        leaf.el.style.opacity = 0.8 + glow * 0.3;
      }
    }
    
    shake(force = 1.2) {
      this.splash(force);
    }
    
    destroy() {
      if (this.animationFrame) cancelAnimationFrame(this.animationFrame);
      if (this.resizeObserver) this.resizeObserver.disconnect();
      if (this.textInterval) clearInterval(this.textInterval);
    }
  }
  
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
        leafCount: parseInt(button.getAttribute('data-folhas')) || 90,
        intensity: parseFloat(button.getAttribute('data-intensidade')) || 1.1,
        gravity: parseFloat(button.getAttribute('data-gravidade')) || 0.018,
        heroRatio: parseFloat(button.getAttribute('data-herois')) || 0.3,
        transitionSpeed: parseInt(button.getAttribute('data-transicao-velocidade')) || 1200,
        transitionDuration: parseInt(button.getAttribute('data-transicao-suavidade')) || 500,
        transitionStyle: button.getAttribute('data-transicao-estilo') || 'fade'
      };
    }
    
    activateButton(button, config) {
      button.classList.add('btn-bottle-leaves');
      
      const firstText = button.getAttribute('data-texto') || "RESPLANDOR";
      
      if (!button.querySelector('.btn-bottle-leaves__glass')) {
        button.innerHTML = `
          <div class="btn-bottle-leaves__glass"></div>
          <div class="btn-bottle-leaves__bed"></div>
          <div class="btn-bottle-leaves__text">${firstText}</div>
        `;
      }
      
      const bed = button.querySelector('.btn-bottle-leaves__bed');
      const textSpan = button.querySelector('.btn-bottle-leaves__text');
      
      if (!bed) return;
      
      const engine = new LeafEngine(button, bed, textSpan, config);
      this.instances.set(button, engine);
      engine.start();
      
      // SOMENTE O CLIQUE - remove qualquer animação de folha no hover
      button.addEventListener('click', (e) => {
        e.preventDefault();
        engine.shake(1.3);
        
        const glass = button.querySelector('.btn-bottle-leaves__glass');
        if (glass) {
          glass.style.transition = 'box-shadow 0.12s';
          glass.style.boxShadow = `inset 0 0 0 2px rgba(255,215,0,0.8), inset 0 1px 3px rgba(255,245,150,0.8)`;
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
                if (node.hasAttribute && node.hasAttribute('data-bottle-leaves')) shouldScan = true;
                if (node.querySelectorAll && node.querySelectorAll('[data-bottle-leaves]').length > 0) shouldScan = true;
              }
            });
          }
        });
        if (shouldScan) setTimeout(() => this.scan(), 50);
      });
      observer.observe(document.body, { childList: true, subtree: true });
    }
  }
  
  const plugin = new BtnBottleLeavesPlugin();
  global.BtnBottleLeaves = {
    scan: () => plugin.scan(),
    version: '3.6.0'
  };
  
})(window);
