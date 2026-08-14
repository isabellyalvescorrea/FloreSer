/* ==========================================================================
   FLORESER — Consultoria de Imagem & Posicionamento Estratégico
   Scripts da página
   --------------------------------------------------------------------------
   01. Animação de entrada
   02. Menu mobile (abrir / fechar / acessibilidade)
   03. Destaque do link da seção ativa
   04. Diferenciais — realce que acompanha a rolagem
   05. Estado do header ao rolar a página
   06. Scroll suave e navegação
   ========================================================================== */

(function () {
  'use strict';

  /* ----------------------------------------------------------------------
     Elementos e constantes
     ---------------------------------------------------------------------- */
  var body       = document.body;
  var header     = document.getElementById('header');
  var burger     = document.getElementById('burger');
  var mobileMenu = document.getElementById('mobile-menu');
  var navLinks   = document.querySelectorAll('.nav__link, .mobile-menu__link');
  var sections   = document.querySelectorAll('main section[id]');
  var mainEl     = document.querySelector('main');

  var MOBILE_BREAKPOINT = 980;   // deve espelhar o breakpoint do CSS
  var SCROLLED_OFFSET   = 24;    // px de rolagem para ativar o fundo do header


  /* ======================================================================
     01. ANIMAÇÃO DE ENTRADA
     Ativa as transições dos elementos .reveal no primeiro paint.
     ====================================================================== */
  requestAnimationFrame(function () {
    requestAnimationFrame(function () {
      body.classList.add('is-ready');
    });
  });


  /* ======================================================================
     02. MENU MOBILE
     ====================================================================== */

  /**
   * Abre ou fecha a gaveta de navegação mobile.
   * @param {boolean} open - true para abrir, false para fechar.
   */
  function toggleMenu(open) {
    if (!burger || !mobileMenu) { return; }

    if (open) {
      // `hidden` é removido antes da animação para o elemento poder transicionar
      mobileMenu.hidden = false;
      requestAnimationFrame(function () {
        mobileMenu.classList.add('is-open');
      });
    } else {
      mobileMenu.classList.remove('is-open');
    }

    burger.classList.toggle('is-open', open);
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Fechar menu de navegação' : 'Abrir menu de navegação');
    body.classList.toggle('is-locked', open);

    // Tira o conteúdo de trás da gaveta da navegação por teclado/leitor de tela
    if (mainEl && 'inert' in HTMLElement.prototype) {
      mainEl.inert = open;
    }

    // Leva o foco para o primeiro link ao abrir (navegação por teclado)
    if (open) {
      var first = mobileMenu.querySelector('.mobile-menu__link');
      if (first) { first.focus({ preventScroll: true }); }
    }
  }

  function isMenuOpen() {
    return !!mobileMenu && mobileMenu.classList.contains('is-open');
  }

  if (burger && mobileMenu) {
    // Devolve o atributo `hidden` só depois que a animação de saída termina
    mobileMenu.addEventListener('transitionend', function (e) {
      if (e.target === mobileMenu && !mobileMenu.classList.contains('is-open')) {
        mobileMenu.hidden = true;
      }
    });

    burger.addEventListener('click', function () {
      toggleMenu(!isMenuOpen());
    });

    // Clique no fundo da gaveta (fora dos links) fecha o menu
    mobileMenu.addEventListener('click', function (e) {
      if (e.target === mobileMenu) { toggleMenu(false); }
    });

    // Tecla ESC fecha o menu e devolve o foco ao botão
    document.addEventListener('keydown', function (e) {
      if ((e.key === 'Escape' || e.key === 'Esc') && isMenuOpen()) {
        toggleMenu(false);
        burger.focus();
      }
    });

    // Ao voltar para o desktop, garante que a gaveta não fique presa aberta
    window.addEventListener('resize', function () {
      if (window.innerWidth > MOBILE_BREAKPOINT && isMenuOpen()) {
        toggleMenu(false);
      }
    });
  }


  /* ======================================================================
     03. DESTAQUE DO LINK DA SEÇÃO ATIVA
     ====================================================================== */

  /**
   * Marca como ativo todo link (desktop e mobile) que aponta para o id dado.
   * @param {string} id - id da seção visível.
   */
  function setActiveLink(id) {
    for (var i = 0; i < navLinks.length; i++) {
      var link = navLinks[i];
      link.classList.toggle('is-active', link.getAttribute('href') === '#' + id);
    }
  }

  /**
   * Descobre a seção corrente pela posição do scroll: é a última cujo topo
   * já passou pela linha do header. Mais previsível que comparar áreas
   * visíveis, porque não depende da altura de cada seção.
   */
  function updateActiveSection() {
    if (!sections.length) { return; }

    var line = (header ? header.offsetHeight : 0) + 24;
    var current = sections[0].id;

    for (var i = 0; i < sections.length; i++) {
      if (sections[i].getBoundingClientRect().top <= line) {
        current = sections[i].id;
      }
    }

    // No fim da página, destaca sempre a última seção (ela pode ser curta
    // demais para alcançar a linha do header).
    var atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;
    if (atBottom) { current = sections[sections.length - 1].id; }

    setActiveLink(current);
  }


  /* ======================================================================
     04. DIFERENCIAIS — realce que acompanha a rolagem
     Em telas de toque não existe :hover, então o item mais próximo do
     centro da tela recebe o mesmo destaque que o mouse daria no desktop.
     ====================================================================== */
  var edgeItems = document.querySelectorAll('.edge-item');
  var edgeTouch = window.matchMedia('(max-width: 980px)');

  function clearEdgeSpotlight() {
    for (var k = 0; k < edgeItems.length; k++) {
      edgeItems[k].classList.remove('is-active');
    }
  }

  function setEdgeSpotlight(alvo) {
    for (var k = 0; k < edgeItems.length; k++) {
      edgeItems[k].classList.toggle('is-active', edgeItems[k] === alvo);
    }
  }

  if (edgeItems.length && 'IntersectionObserver' in window) {
    /* rootMargin monta uma faixa fina na altura de leitura (45% da tela).
       O item que cruza essa faixa recebe o destaque. Uso IntersectionObserver
       em vez do handler de scroll porque ele não depende de
       requestAnimationFrame e não roda código a cada pixel rolado. */
    var edgeObserver = new IntersectionObserver(function (entries) {
      if (!edgeTouch.matches) { return; }   // no desktop quem manda é o :hover

      for (var i = 0; i < entries.length; i++) {
        if (entries[i].isIntersecting) {
          setEdgeSpotlight(entries[i].target);
          return;
        }
      }
      /* Quando nenhum item cruza a faixa (o vão entre dois itens), o último
         destacado permanece — sem isso o realce piscaria entre um e outro. */
    }, { rootMargin: '-45% 0px -55% 0px', threshold: 0 });

    for (var e = 0; e < edgeItems.length; e++) {
      edgeObserver.observe(edgeItems[e]);
    }

    // Ao cruzar o breakpoint, limpa o realce que só vale no mobile
    var onEdgeBreakpoint = function () {
      if (!edgeTouch.matches) { clearEdgeSpotlight(); }
    };
    if (edgeTouch.addEventListener) {
      edgeTouch.addEventListener('change', onEdgeBreakpoint);
    } else if (edgeTouch.addListener) {
      edgeTouch.addListener(onEdgeBreakpoint);   // Safari antigo
    }
  }


  /* ======================================================================
     05. ESTADO DO HEADER AO ROLAR
     Aplica fundo translúcido + fio dourado depois do topo da página.
     ====================================================================== */
  var ticking = false;

  function onScrollFrame() {
    if (header) {
      header.classList.toggle('is-scrolled', window.scrollY > SCROLLED_OFFSET);
    }
    updateActiveSection();
    ticking = false;
  }

  function requestScrollFrame() {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(onScrollFrame);
    }
  }

  window.addEventListener('scroll', requestScrollFrame, { passive: true });
  window.addEventListener('resize', requestScrollFrame);

  onScrollFrame(); // estado inicial (ex.: reload no meio da página)


  /* ======================================================================
     06. SCROLL SUAVE E NAVEGAÇÃO
     ====================================================================== */
  var supportsSmooth = 'scrollBehavior' in document.documentElement.style;
  var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  for (var n = 0; n < navLinks.length; n++) {
    navLinks[n].addEventListener('click', function (e) {
      var href   = this.getAttribute('href') || '';
      var target = href.charAt(0) === '#' ? document.querySelector(href) : null;

      // Fecha a gaveta antes de rolar (destrava o scroll do body)
      if (isMenuOpen()) { toggleMenu(false); }

      if (!target) { return; }

      // Fallback manual para navegadores sem scroll-behavior nativo
      if (!supportsSmooth) {
        e.preventDefault();
        var headerH = header ? header.offsetHeight : 0;
        var top = target.getBoundingClientRect().top + window.pageYOffset - headerH;

        window.scrollTo({
          top: top,
          behavior: prefersReduced ? 'auto' : 'smooth'
        });

        // Mantém o hash na URL sem provocar o "pulo" padrão do navegador
        if (history.pushState) { history.pushState(null, '', href); }
      }

      setActiveLink(target.id);
    });
  }

})();
