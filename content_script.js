// EMDash Highlighter Content Script
// Detects em-dashes (—, –, --) and highlights the containing block-level line

(function () {
  'use strict';

  // Em-dash detection pattern: U+2014 (—), U+2013 (–), or double dash (--)
  const EMDASH_PATTERN = /[\u2014\u2013]|--/;

  // Class name to apply to highlighted elements
  const HIGHLIGHT_CLASS = 'emdash-highlight';

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

  // Block-level elements to consider as "lines"
  const BLOCK_ELEMENTS = new Set([
    'P',
    'DIV',
    'LI',
    'BLOCKQUOTE',
    'TD',
    'TH',
    'H1',
    'H2',
    'H3',
    'H4',
    'H5',
    'H6',
    'ARTICLE',
    'SECTION',
    'HEADER',
    'FOOTER',
    'NAV',
    'ASIDE',
    'DD',
    'DT',
    'FIGCAPTION',
    'FIGURE',
    'ADDRESS',
  ]);

  /**
   * Check if an element or its ancestors should be excluded from processing
   */
  function shouldExcludeElement(element) {
    let current = element;
    while (current && current !== document.body) {
      if (EXCLUDED_ELEMENTS.has(current.nodeName)) {
        return true;
      }
      current = current.parentElement;
    }
    return false;
  }

  /**
   * Find the closest block-level ancestor of a node
   */
  function findClosestBlockAncestor(node) {
    let current = node.nodeType === Node.TEXT_NODE ? node.parentElement : node;

    while (current && current !== document.body) {
      // Check if already highlighted to avoid duplicates
      if (current.classList && current.classList.contains(HIGHLIGHT_CLASS)) {
        return null;
      }

      // Check if it's a known block-level element
      if (BLOCK_ELEMENTS.has(current.nodeName)) {
        return current;
      }

      // Check computed style for block-level display
      if (current.nodeType === Node.ELEMENT_NODE) {
        const display = window.getComputedStyle(current).display;
        if (
          display === 'block' ||
          display === 'list-item' ||
          display === 'table-cell' ||
          display === 'table-row'
        ) {
          return current;
        }
      }

      current = current.parentElement;
    }

    return null;
  }

  /**
   * Process a text node to check for em-dashes
   */
  function processTextNode(textNode) {
    // Skip if excluded element
    if (shouldExcludeElement(textNode.parentElement)) {
      return;
    }

    // Check if text contains em-dash
    if (!EMDASH_PATTERN.test(textNode.textContent)) {
      return;
    }

    // Find closest block ancestor
    const blockElement = findClosestBlockAncestor(textNode);
    if (blockElement && blockElement.classList) {
      // Add highlight class
      blockElement.classList.add(HIGHLIGHT_CLASS);
    }
  }

  /**
   * Scan all text nodes in a given root element
   */
  function scanForEmDashes(root) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: function (node) {
        // Filter out empty or whitespace-only nodes
        if (!node.textContent.trim()) {
          return NodeFilter.FILTER_REJECT;
        }
        return NodeFilter.FILTER_ACCEPT;
      },
    });

    let node;
    while ((node = walker.nextNode())) {
      processTextNode(node);
    }
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
        // Process added nodes
        mutation.addedNodes.forEach(function (node) {
          if (node.nodeType === Node.ELEMENT_NODE) {
            // Scan the entire subtree of added element
            scanForEmDashes(node);
          } else if (node.nodeType === Node.TEXT_NODE) {
            // Process single text node
            processTextNode(node);
          }
        });

        // Handle character data changes in text nodes
        if (
          mutation.type === 'characterData' &&
          mutation.target.nodeType === Node.TEXT_NODE
        ) {
          processTextNode(mutation.target);
        }
      });
    });

    // Start observing the document for changes
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
    });
  }

  // Run when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
  } else {
    initialize();
  }
})();
