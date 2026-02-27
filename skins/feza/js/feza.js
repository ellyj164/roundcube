/**
 * FEZA Enterprise Mail - Custom UI interactions
 * Supplements (does not replace) Roundcube's existing jQuery-based UI
 */
(function () {
  'use strict';

  // Run after DOM is ready
  document.addEventListener('DOMContentLoaded', function () {
    FEZA.init();
  });

  var FEZA = {

    /**
     * Initialize all FEZA UI enhancements
     */
    init: function () {
      this.initSenderAvatars();
      this.initSidebarCollapse();
      this.initSearchPlaceholder();
      this.initToastObserver();
      this.initDarkModeToggle();
      this.initKeyboardShortcutsHint();
    },

    /**
     * Generate initials-based avatar circles for message senders
     */
    initSenderAvatars: function () {
      var photos = document.querySelectorAll('.contact-photo:not([src])');
      photos.forEach(function (el) {
        var name = el.getAttribute('data-name') || el.getAttribute('title') || '?';
        var initials = FEZA.getInitials(name);
        var color = FEZA.colorFromString(name);
        el.style.display = 'none';
        var avatar = document.createElement('span');
        avatar.className = 'feza-avatar';
        avatar.textContent = initials;
        avatar.style.cssText = [
          'display:inline-flex',
          'align-items:center',
          'justify-content:center',
          'width:40px',
          'height:40px',
          'border-radius:50%',
          'background:' + color,
          'color:#fff',
          'font-weight:700',
          'font-size:0.9rem',
          'flex-shrink:0',
          'font-family:inherit'
        ].join(';');
        if (el.parentNode) {
          el.parentNode.insertBefore(avatar, el.nextSibling);
        }
      });
    },

    /**
     * Get 1-2 character initials from a name or email address
     */
    getInitials: function (name) {
      name = name.replace(/<.*?>/, '').trim();
      if (!name || name === '?') return '?';
      // Handle email addresses
      if (name.indexOf('@') !== -1) {
        name = name.split('@')[0];
      }
      var parts = name.split(/[\s._-]+/).filter(Boolean);
      if (parts.length >= 2) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
      }
      return name.substring(0, 2).toUpperCase();
    },

    /**
     * Generate a consistent color from a string (for avatars)
     */
    colorFromString: function (str) {
      var colors = [
        '#0a4da3', '#2ec27e', '#e67e22', '#9b59b6',
        '#1abc9c', '#e74c3c', '#3498db', '#f39c12',
        '#16a085', '#8e44ad', '#27ae60', '#2980b9'
      ];
      var hash = 0;
      for (var i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
      }
      return colors[Math.abs(hash) % colors.length];
    },

    /**
     * Collapsible sidebar toggle for mobile
     */
    initSidebarCollapse: function () {
      var sidebar = document.getElementById('layout-sidebar');
      var toggleBtn = document.querySelector('.back-list-button, .back-sidebar-button');
      if (!sidebar || !toggleBtn) return;

      toggleBtn.addEventListener('click', function (e) {
        var isCollapsed = sidebar.classList.contains('feza-collapsed');
        if (isCollapsed) {
          sidebar.classList.remove('feza-collapsed');
          sidebar.style.width = '';
        } else {
          sidebar.classList.add('feza-collapsed');
          sidebar.style.width = '0';
          sidebar.style.minWidth = '0';
          sidebar.style.overflow = 'hidden';
        }
      });
    },

    /**
     * Set branded placeholder text in the search bar
     */
    initSearchPlaceholder: function () {
      var searchInput = document.querySelector('#mailsearchform input[type="text"], #mailsearchform input[type="search"]');
      if (searchInput && !searchInput.placeholder) {
        searchInput.placeholder = 'Search conversations...';
      }
    },

    /**
     * Enhance toast notifications with FEZA styling
     */
    initToastObserver: function () {
      var stack = document.getElementById('messagestack');
      if (!stack) return;

      var observer = new MutationObserver(function (mutations) {
        mutations.forEach(function (mutation) {
          mutation.addedNodes.forEach(function (node) {
            if (node.nodeType === 1) {
              node.style.borderRadius = '8px';
              node.style.boxShadow = '0 4px 16px rgba(0,0,0,0.12)';
            }
          });
        });
      });

      observer.observe(stack, { childList: true });
    },

    /**
     * Sync dark mode toggle with FEZA CSS variables
     */
    initDarkModeToggle: function () {
      var themeBtn = document.querySelector('#taskmenu .theme');
      if (!themeBtn) return;

      themeBtn.addEventListener('click', function () {
        // Dark mode class is toggled by Roundcube's UI.js
        // FEZA CSS handles the rest via html.dark-mode selectors
        setTimeout(function () {
          var isDark = document.documentElement.classList.contains('dark-mode');
          document.documentElement.setAttribute('data-feza-theme', isDark ? 'dark' : 'light');
        }, 50);
      });
    },

    /**
     * Show keyboard shortcut hint on '?' key (non-input context)
     */
    initKeyboardShortcutsHint: function () {
      document.addEventListener('keydown', function (e) {
        if (e.key === '?' && !FEZA.isInputFocused()) {
          FEZA.showShortcutsOverlay();
        }
        if (e.key === 'Escape') {
          FEZA.hideShortcutsOverlay();
        }
      });
    },

    /**
     * Check if the active element is an input/textarea/contenteditable
     */
    isInputFocused: function () {
      var el = document.activeElement;
      if (!el) return false;
      var tag = el.tagName.toLowerCase();
      return tag === 'input' || tag === 'textarea' || tag === 'select' || el.isContentEditable;
    },

    /**
     * Show a simple keyboard shortcuts overlay
     */
    showShortcutsOverlay: function () {
      if (document.getElementById('feza-shortcuts-overlay')) return;

      var overlay = document.createElement('div');
      overlay.id = 'feza-shortcuts-overlay';
      overlay.style.cssText = [
        'position:fixed', 'inset:0', 'z-index:9999',
        'background:rgba(7,26,47,0.7)',
        'display:flex', 'align-items:center', 'justify-content:center'
      ].join(';');

      var shortcuts = [
        ['C', 'Compose new message'],
        ['R', 'Reply'],
        ['F', 'Forward'],
        ['D', 'Delete'],
        ['U', 'Mark as unread'],
        ['/', 'Search'],
        ['?', 'Show shortcuts']
      ];

      var rows = shortcuts.map(function (s) {
        return '<tr><td style="padding:6px 16px;font-weight:700;color:#0a4da3">' + s[0] + '</td>' +
               '<td style="padding:6px 8px;color:#1a1a2e">' + s[1] + '</td></tr>';
      }).join('');

      overlay.innerHTML = '<div style="background:#fff;border-radius:12px;padding:32px 40px;' +
        'max-width:400px;width:90%;box-shadow:0 8px 32px rgba(0,0,0,0.24)">' +
        '<h3 style="margin:0 0 16px;color:#071a2f;font-family:\'Segoe UI\',Arial,sans-serif">Keyboard Shortcuts</h3>' +
        '<table style="border-collapse:collapse;width:100%">' + rows + '</table>' +
        '<p style="margin:16px 0 0;font-size:0.8rem;color:#6c757d;text-align:center">Press <strong>Esc</strong> or click to close</p>' +
        '</div>';

      overlay.addEventListener('click', FEZA.hideShortcutsOverlay);
      document.body.appendChild(overlay);
    },

    /**
     * Remove the keyboard shortcuts overlay
     */
    hideShortcutsOverlay: function () {
      var overlay = document.getElementById('feza-shortcuts-overlay');
      if (overlay) overlay.parentNode.removeChild(overlay);
    }

  };

  // Expose FEZA globally for debug and extension
  window.FEZA = FEZA;

}());
