// EMDash Highlighter Content Script
// Detects em-dashes (—) and applies a fade effect directly on them

(function () {
  'use strict';

  // Em-dash detection pattern: U+2014 (—) only
  const EMDASH_PATTERN = /\u2014/g;

  // Class name to apply to highlighted spans
  const HIGHLIGHT_CLASS = 'emdash-highlight';
  
  // Marker attribute to identify already processed nodes
  const PROCESSED_ATTR = 'data-emdash-processed';

  // Number of characters to include in the fade effect (before and after)
  const FADE_CHARS = 5;

  // Elements to skip during traversal
  const EXCLUDED_ELEMENTS = new Set([
    'CODE',
    'PRE',
    'SCRIPT',
    'STYLE',
    'TEXTAREA',
    'INPUT',
    'SVG',
  ]);

  /**
   * Check if an element or its ancestors should be excluded from processing
   */
  function shouldExcludeElement(element) {
    if (!element) return true;
    
    let current = element;
    while (current && current !== document.body) {
      if (EXCLUDED_ELEMENTS.has(current.nodeName)) {
        return true;
      }
      // Skip if already inside a highlighted span
      if (
        current.classList &&
        current.classList.contains(HIGHLIGHT_CLASS)
      ) {
        return true;
      }
      current = current.parentElement;
    }
    return false;
  }

  /**
   * Process a text node to wrap em-dashes with fade effect
   */
  function processTextNode(textNode) {
    if (!textNode || !textNode.parentNode) {
      return;
    }

    // Skip if excluded element
    if (shouldExcludeElement(textNode.parentElement)) {
      return;
    }

    // Check if parent is already processed
    if (textNode.parentElement.hasAttribute(PROCESSED_ATTR)) {
      return;
    }

    // Check if text contains em-dash
    const text = textNode.textContent;
    if (!EMDASH_PATTERN.test(text)) {
      return;
    }

    // Reset regex lastIndex
    EMDASH_PATTERN.lastIndex = 0;

    // Find all em-dashes in the text
    const matches = [];
    let match;
    while ((match = EMDASH_PATTERN.exec(text)) !== null) {
      matches.push(match.index);
    }

    if (matches.length === 0) {
      return;
    }

    // Mark parent as processed to avoid re-processing
    textNode.parentElement.setAttribute(PROCESSED_ATTR, 'true');

    // Create a document fragment to hold the new nodes
    const fragment = document.createDocumentFragment();
    let lastIndex = 0;

    matches.forEach((emdashIndex) => {
      // Calculate the range to highlight (5 chars before and after)
      const startIndex = Math.max(0, emdashIndex - FADE_CHARS);
      const endIndex = Math.min(text.length, emdashIndex + 1 + FADE_CHARS);

      // Add text before the highlighted section
      if (startIndex > lastIndex) {
        fragment.appendChild(
          document.createTextNode(text.substring(lastIndex, startIndex))
        );
      }

      // Create span for the highlighted section
      const span = document.createElement('span');
      span.className = HIGHLIGHT_CLASS;
      span.textContent = text.substring(startIndex, endIndex);
      fragment.appendChild(span);

      lastIndex = endIndex;
    });

    // Add remaining text after the last match
    if (lastIndex < text.length) {
      fragment.appendChild(document.createTextNode(text.substring(lastIndex)));
    }

    // Replace the text node with the fragment
    try {
      textNode.parentNode.replaceChild(fragment, textNode);
    } catch (e) {
      // Silently fail if DOM manipulation fails
      console.debug('EMDash Highlighter: Failed to process node', e);
    }
  }

  /**
   * Scan all text nodes in a given root element
   */
  function scanForEmDashes(root) {
    if (!root) return;

    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: function (node) {
        // Filter out empty or whitespace-only nodes
        if (!node.textContent.trim()) {
          return NodeFilter.FILTER_REJECT;
        }
        // Skip if parent is already processed
        if (
          node.parentElement &&
          node.parentElement.hasAttribute(PROCESSED_ATTR)
        ) {
          return NodeFilter.FILTER_REJECT;
        }
        return NodeFilter.FILTER_ACCEPT;
      },
    });

    const nodesToProcess = [];
    let node;
    while ((node = walker.nextNode())) {
      nodesToProcess.push(node);
    }

    // Process all nodes
    nodesToProcess.forEach((node) => {
      processTextNode(node);
    });
  }

  /**
   * Initialize the highlighter on page load
   */
  function initialize() {
    // Scan the entire document initially
    scanForEmDashes(document.body);

    // Set up MutationObserver for dynamic content
    const observer = new MutationObserver(function (mutations) {
      mutations.forEach(function (mutation) {
        // Skip mutations on highlight spans
        if (
          mutation.target.classList &&
          mutation.target.classList.contains(HIGHLIGHT_CLASS)
        ) {
          return;
        }

        // Process added nodes
        mutation.addedNodes.forEach(function (node) {
          // Skip highlight spans
          if (
            node.nodeType === Node.ELEMENT_NODE &&
            node.classList &&
            node.classList.contains(HIGHLIGHT_CLASS)
          ) {
            return;
          }

          if (node.nodeType === Node.ELEMENT_NODE) {
            // Scan the entire subtree of added element
            scanForEmDashes(node);
          } else if (node.nodeType === Node.TEXT_NODE) {
            // Process single text node
            processTextNode(node);
          }
        });
      });
    });

    // Start observing the document for changes
    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }

  // Run when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
  } else {
    initialize();
  }
})();
