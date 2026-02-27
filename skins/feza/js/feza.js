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
      this.initSearchChips();
      this.initToastObserver();
      this.initDarkModeToggle();
      this.initKeyboardShortcutsHint();
      this.initSmartSuggestions();
      this.initAttachmentReminder();
      this.initMobileBar();
      this.initFab();
      this.initMessageHoverActions();
      this.initExpandLongMessages();
      this.initPriorityIndicators();
      this.initSwipeGestures();
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
      var tmp = document.createElement('span');
      tmp.textContent = name;
      name = tmp.textContent.trim();
      if (!name || name === '?') return '?';
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
     * Expand (un-collapse) the sidebar panel.
     * Shared by initSidebarCollapse and swipe-right gesture.
     */
    expandSidebar: function () {
      var sidebar = document.getElementById('layout-sidebar');
      if (!sidebar) return;
      sidebar.classList.remove('feza-collapsed');
      sidebar.style.width = '';
      sidebar.style.minWidth = '';
      sidebar.style.overflow = '';
    },

    /**
     * Collapsible sidebar toggle for mobile/tablet
     */
    initSidebarCollapse: function () {
      var sidebar = document.getElementById('layout-sidebar');
      var toggleBtn = document.querySelector('.back-list-button, .back-sidebar-button');
      if (!sidebar || !toggleBtn) return;

      toggleBtn.addEventListener('click', function () {
        var isCollapsed = sidebar.classList.contains('feza-collapsed');
        if (isCollapsed) {
          FEZA.expandSidebar();
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
      var searchInput = document.querySelector(
        '#mailsearchform input[type="text"], #mailsearchform input[type="search"]'
      );
      if (searchInput && !searchInput.placeholder) {
        searchInput.placeholder = 'Search conversations…';
      }
    },

    /**
     * Inject search filter chips (From, Attachment, Date, Subject)
     * These chips toggle a visual class and append filter tokens to the
     * search input; Roundcube's own search handler picks them up.
     */
    initSearchChips: function () {
      var searchForm = document.getElementById('mailsearchform');
      if (!searchForm) return;

      /* Chips definition — label + search scope value */
      var chips = [
        { label: 'From',       scope: 'from'    },
        { label: 'Subject',    scope: 'subject' },
        { label: 'Attachment', scope: 'attachment' },
        { label: 'Date',       scope: 'date',   isDate: true }
      ];

      var container = document.createElement('div');
      container.id = 'feza-search-chips';

      chips.forEach(function (chip) {
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'feza-chip';
        btn.textContent = chip.label;
        btn.dataset.scope = chip.scope;

        btn.addEventListener('click', function () {
          var wasActive = btn.classList.contains('active');
          /* Deactivate all chips first */
          container.querySelectorAll('.feza-chip').forEach(function (c) {
            c.classList.remove('active');
          });
          if (!wasActive) {
            btn.classList.add('active');
            /* Set Roundcube's scope selector if it exists */
            var scopeSelect = searchForm.querySelector('select[name="searchscope"], #search-scope');
            if (scopeSelect) {
              scopeSelect.value = chip.scope;
            }
            /* For date chip, focus the search input so user can type a date */
            if (chip.isDate) {
              var searchInput = searchForm.querySelector('input[type="text"], input[type="search"]');
              if (searchInput) {
                searchInput.focus();
                searchInput.placeholder = 'e.g. 2024-01-15 or "last week"';
              }
            }
          }
        });

        container.appendChild(btn);
      });

      searchForm.parentNode.insertBefore(container, searchForm.nextSibling);
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
          FEZA.hideSnoozePopup();
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
     * Show a simple keyboard shortcuts overlay.
     * NOTE: shortcuts array is entirely static — no user data used.
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
        ['S', 'Snooze email'],
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
    },

    /* ---------------------------------------------------------
       SMART SUGGESTIONS — reply quick-buttons in reading pane
       --------------------------------------------------------- */

    /**
     * Inject quick-reply suggestion buttons when a message is loaded.
     * Roundcube fires a custom event 'afterload' or updates a known
     * DOM node — we watch for the message body container appearing.
     */
    initSmartSuggestions: function () {
      var observer = new MutationObserver(function () {
        var msgBody = document.getElementById('messagebody') ||
                      document.querySelector('.message-part.text, .message-part.html');
        if (!msgBody || document.getElementById('feza-suggestions')) return;

        var replies = ['✔ Received', '✔ Approved', '✔ Noted', '✔ Will review', '📅 Schedule meeting'];

        var panel = document.createElement('div');
        panel.id = 'feza-suggestions';

        /* Icon + body wrapper — built with textContent / createElement only */
        var icon = document.createElement('span');
        icon.className = 'feza-suggestion-icon';
        icon.textContent = '💡';

        var body = document.createElement('div');
        body.className = 'feza-suggestion-body';

        var title = document.createElement('div');
        title.className = 'feza-suggestion-title';
        title.textContent = 'Quick reply:';

        var actions = document.createElement('div');
        actions.className = 'feza-suggestion-actions';

        replies.forEach(function (label) {
          var btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'feza-quick-reply';
          btn.textContent = label;
          btn.addEventListener('click', function () {
            FEZA.triggerQuickReply(label);
          });
          actions.appendChild(btn);
        });

        body.appendChild(title);
        body.appendChild(actions);
        panel.appendChild(icon);
        panel.appendChild(body);

        msgBody.parentNode.insertBefore(panel, msgBody);
      });

      var content = document.getElementById('layout-content') || document.body;
      observer.observe(content, { childList: true, subtree: true });
    },

    /**
     * Pre-fill the compose/reply area with a quick-reply phrase.
     * Uses Roundcube's rcmail.command() when available.
     */
    triggerQuickReply: function (phrase) {
      if (window.rcmail && typeof rcmail.command === 'function') {
        rcmail.command('reply', '', this);
      }
      /* Attempt to populate compose body after a short delay */
      setTimeout(function () {
        var editor = document.getElementById('composebody') ||
                     document.querySelector('.mce-content-body, [contenteditable="true"]');
        if (editor) {
          if (editor.tagName === 'TEXTAREA') {
            editor.value = phrase + '\n\n' + editor.value;
          } else {
            editor.textContent = phrase + '\n\n' + editor.textContent;
          }
          editor.focus();
        }
      }, 400);
    },

    /* ---------------------------------------------------------
       ATTACHMENT REMINDER
       --------------------------------------------------------- */

    /**
     * Watch the compose form; warn before sending if attachment
     * keywords appear in the body but no file is attached.
     */
    initAttachmentReminder: function () {
      /* Only run on compose page */
      if (!document.getElementById('compose-content') &&
          !document.getElementById('composebody')) return;

      var sendBtns = document.querySelectorAll(
        '#compose-toolbar .send, a.button.send, button.send'
      );

      sendBtns.forEach(function (btn) {
        btn.addEventListener('click', function (e) {
          if (FEZA.hasAttachmentKeyword() && !FEZA.hasAttachment()) {
            var msg = (window.rcmail && typeof rcmail.gettext === 'function')
              ? rcmail.gettext('noattachmentwarning')
              : 'It looks like you mentioned an attachment but haven\'t attached any file.\n\nSend anyway?';
            var confirmed = window.confirm(msg);
            if (!confirmed) {
              e.preventDefault();
              e.stopImmediatePropagation();
            }
          }
        }, true);
      });
    },

    /** Keywords that suggest an attachment was intended */
    hasAttachmentKeyword: function () {
      var keywords = ['attached', 'attachment', 'document', 'invoice', 'see file', 'find enclosed'];
      var body = '';
      var textarea = document.getElementById('composebody');
      if (textarea) {
        body = textarea.value.toLowerCase();
      } else {
        var ce = document.querySelector('.mce-content-body, [contenteditable="true"]');
        if (ce) body = (ce.textContent || ce.innerText || '').toLowerCase();
      }
      return keywords.some(function (kw) { return body.indexOf(kw) !== -1; });
    },

    /** Returns true if at least one file is queued in the attachment list */
    hasAttachment: function () {
      var list = document.getElementById('attachment-list');
      return list ? list.children.length > 0 : false;
    },

    /* ---------------------------------------------------------
       MOBILE BOTTOM ACTION BAR
       --------------------------------------------------------- */
    initMobileBar: function () {
      if (window.innerWidth > 480) return;

      var bar = document.createElement('nav');
      bar.id = 'feza-mobile-bar';
      bar.setAttribute('aria-label', 'Mobile navigation');

      /* Statically defined navigation items */
      var items = [
        { label: 'Inbox',    icon: '📥', cmd: 'mail'        },
        { label: 'Compose',  icon: '✏️',  cmd: 'compose'     },
        { label: 'Search',   icon: '🔍', cmd: 'search'      },
        { label: 'Contacts', icon: '👤', cmd: 'addressbook' },
        { label: 'Settings', icon: '⚙️',  cmd: 'settings'   }
      ];

      items.forEach(function (item) {
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.setAttribute('aria-label', item.label);

        var iconEl = document.createElement('span');
        iconEl.setAttribute('aria-hidden', 'true');
        iconEl.setAttribute('role', 'img');
        iconEl.textContent = item.icon;

        var labelEl = document.createElement('span');
        labelEl.textContent = item.label;

        btn.appendChild(iconEl);
        btn.appendChild(labelEl);

        btn.addEventListener('click', function () {
          if (window.rcmail && typeof rcmail.command === 'function') {
            rcmail.command(item.cmd, '', btn);
          }
        });

        bar.appendChild(btn);
      });

      document.body.appendChild(bar);
    },

    /* ---------------------------------------------------------
       FLOATING ACTION BUTTON (COMPOSE) — mobile
       --------------------------------------------------------- */
    initFab: function () {
      if (window.innerWidth > 768) return;
      /* Don't add FAB on compose page */
      if (document.body.classList.contains('action-compose')) return;

      var fab = document.createElement('button');
      fab.id = 'feza-fab';
      fab.type = 'button';
      fab.setAttribute('aria-label', 'Compose new message');
      fab.textContent = '✏';

      fab.addEventListener('click', function () {
        if (window.rcmail && typeof rcmail.command === 'function') {
          rcmail.command('compose', '', fab);
        }
      });

      document.body.appendChild(fab);
    },

    /* ---------------------------------------------------------
       MESSAGE ROW HOVER QUICK-ACTIONS
       --------------------------------------------------------- */
    initMessageHoverActions: function () {
      var list = document.getElementById('messagelist');
      if (!list) return;

      /* Use event delegation on the tbody */
      var tbody = list.querySelector('tbody');
      if (!tbody) return;

      /* Actions: label + rcmail command */
      var actions = [
        { icon: '↩', label: 'Reply',   cmd: 'reply'   },
        { icon: '→', label: 'Forward', cmd: 'forward' },
        { icon: '🗄', label: 'Archive', cmd: 'archive' },
        { icon: '⭐', label: 'Star',    cmd: 'flag'    }
      ];

      tbody.addEventListener('mouseover', function (e) {
        var row = e.target.closest('tr[id]');
        if (!row || row.querySelector('.feza-row-actions')) return;

        var wrap = document.createElement('div');
        wrap.className = 'feza-row-actions';

        actions.forEach(function (action) {
          var btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'feza-row-action-btn';
          btn.title = action.label;
          btn.textContent = action.icon;
          btn.addEventListener('click', function (ev) {
            ev.stopPropagation();
            if (window.rcmail && typeof rcmail.command === 'function') {
              rcmail.command(action.cmd, '', btn);
            }
          });
          wrap.appendChild(btn);
        });

        row.appendChild(wrap);
      });

      tbody.addEventListener('mouseout', function (e) {
        var row = e.target.closest('tr[id]');
        if (!row) return;
        /* Only remove if not hovering into wrap itself */
        if (!row.contains(e.relatedTarget)) {
          var wrap = row.querySelector('.feza-row-actions');
          if (wrap) wrap.parentNode.removeChild(wrap);
        }
      });
    },

    /* ---------------------------------------------------------
       EXPAND / COLLAPSE LONG MESSAGES
       --------------------------------------------------------- */
    initExpandLongMessages: function () {
      var observer = new MutationObserver(function () {
        var body = document.getElementById('messagebody') ||
                   document.querySelector('.message-part.text, .message-part.html');
        if (!body || body.dataset.fezaCollapse) return;
        body.dataset.fezaCollapse = '1';

        /* Only collapse if content is tall enough */
        if (body.scrollHeight <= 400) return;

        body.classList.add('feza-message-collapsed');

        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'feza-expand-btn';
        btn.textContent = '▼ Show full message';

        btn.addEventListener('click', function () {
          body.classList.remove('feza-message-collapsed');
          btn.parentNode.removeChild(btn);
        });

        body.parentNode.insertBefore(btn, body.nextSibling);
      });

      var content = document.getElementById('layout-content') || document.body;
      observer.observe(content, { childList: true, subtree: true });
    },

    /* ---------------------------------------------------------
       PRIORITY INDICATORS
       Adds a coloured dot to message rows based on X-Priority header
       reflected as a CSS class by Roundcube (e.g. .priority-high)
       --------------------------------------------------------- */
    initPriorityIndicators: function () {
      var list = document.getElementById('messagelist');
      if (!list) return;

      var observer = new MutationObserver(function () {
        list.querySelectorAll('tr.priority-high:not([data-feza-priority])').forEach(function (tr) {
          tr.dataset.fezaPriority = '1';
          var subjectCell = tr.querySelector('td.subject');
          if (!subjectCell) return;
          var dot = document.createElement('span');
          dot.className = 'feza-priority feza-priority-high';
          dot.title = 'High priority';
          subjectCell.insertBefore(dot, subjectCell.firstChild);
        });
      });

      observer.observe(list, { childList: true, subtree: true });
    },

    /* ---------------------------------------------------------
       SWIPE GESTURES (mobile)
       swipe-right → back to folder list
       swipe-left  → reveal archive/delete actions
       --------------------------------------------------------- */
    initSwipeGestures: function () {
      if (window.innerWidth > 768) return;

      var startX = 0;
      var startY = 0;
      var THRESHOLD = 60;

      document.addEventListener('touchstart', function (e) {
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
      }, { passive: true });

      document.addEventListener('touchend', function (e) {
        var dx = e.changedTouches[0].clientX - startX;
        var dy = e.changedTouches[0].clientY - startY;

        /* Ignore vertical swipes */
        if (Math.abs(dy) > Math.abs(dx)) return;
        if (Math.abs(dx) < THRESHOLD) return;

        if (dx > 0) {
          /* Swipe right — show folder sidebar */
          FEZA.expandSidebar();
        } else {
          /* Swipe left — trigger Roundcube back navigation if available */
          if (window.rcmail && typeof rcmail.command === 'function') {
            rcmail.command('list', '', null);
          }
        }
      }, { passive: true });
    },

    /* ---------------------------------------------------------
       UNDO SEND
       Wraps Roundcube's send command to show an 8-second undo toast.
       --------------------------------------------------------- */

    /**
     * Show the undo-send toast. The actual send is delayed 8 seconds;
     * if the user clicks Undo the timer is cancelled.
     *
     * @param {Function} sendFn  Callback that performs the actual send
     */
    showUndoToast: function (sendFn) {
      var existing = document.getElementById('feza-undo-toast');
      if (existing) existing.parentNode.removeChild(existing);

      var toast = document.createElement('div');
      toast.id = 'feza-undo-toast';

      var msg = document.createElement('span');
      msg.textContent = 'Message queued to send…';

      var undoBtn = document.createElement('button');
      undoBtn.type = 'button';
      undoBtn.className = 'feza-undo-btn';
      undoBtn.textContent = 'Undo';

      var progress = document.createElement('div');
      progress.id = 'feza-undo-progress';

      toast.appendChild(msg);
      toast.appendChild(undoBtn);
      toast.appendChild(progress);
      document.body.appendChild(toast);

      var timer = setTimeout(function () {
        dismiss();
        sendFn();
      }, 8000);

      function dismiss() {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
      }

      undoBtn.addEventListener('click', function () {
        clearTimeout(timer);
        dismiss();
        /* Notify user */
        if (window.rcmail && typeof rcmail.display_message === 'function') {
          rcmail.display_message('Send cancelled.', 'confirmation');
        }
      });
    },

    /* ---------------------------------------------------------
       EMAIL SNOOZE POPUP
       --------------------------------------------------------- */

    /**
     * Show a snooze-time picker near the given trigger element.
     * Actual snooze scheduling is a server-side concern; this UI
     * calls rcmail's flag/setflag command as a placeholder and logs
     * the selected duration for future integration.
     *
     * @param {HTMLElement} triggerEl  Element that was clicked
     */
    showSnoozePopup: function (triggerEl) {
      FEZA.hideSnoozePopup();

      var options = [
        { label: 'Later today (2 h)',     hours: 2  },
        { label: 'Tomorrow morning',      hours: 18 },
        { label: 'Next week',             hours: 168 },
        { label: 'In 3 days',             hours: 72  }
      ];

      var popup = document.createElement('div');
      popup.id = 'feza-snooze-popup';

      options.forEach(function (opt) {
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.textContent = opt.label;
        btn.addEventListener('click', function () {
          FEZA.hideSnoozePopup();
          /* Log snooze intent (server integration point) */
          if (window.console) console.info('[FEZA] Snooze for', opt.hours, 'hours');
          if (window.rcmail && typeof rcmail.display_message === 'function') {
            rcmail.display_message('Email snoozed: ' + opt.label, 'confirmation');
          }
        });
        popup.appendChild(btn);
      });

      /* Position relative to trigger */
      var rect = triggerEl.getBoundingClientRect();
      popup.style.top  = (rect.bottom + window.scrollY + 4) + 'px';
      popup.style.left = (rect.left  + window.scrollX)      + 'px';

      document.body.appendChild(popup);

      /* Close on outside click */
      setTimeout(function () {
        document.addEventListener('click', FEZA.hideSnoozePopup, { once: true });
      }, 0);
    },

    hideSnoozePopup: function () {
      var popup = document.getElementById('feza-snooze-popup');
      if (popup) popup.parentNode.removeChild(popup);
    }

  };

  // Expose FEZA globally for debug and extension
  window.FEZA = FEZA;

}());
