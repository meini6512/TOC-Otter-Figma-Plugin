// TOC Otter Plugin - Backend Logic
// This runs in Figma's plugin sandbox and has access to the Figma API

figma.showUI(__html__, { 
  width: 320, 
  height: 500,
  title: "TOC Otter 🦦",
  themeColors: true
});

// Scan the current page for tagged nodes
function scanForTocItems(tagPrefix) {
  if (!tagPrefix) tagPrefix = "# ";
  
  const items = [];
  const currentPage = figma.currentPage;

  function traverse(node) {
    // Check if node is a FRAME or SECTION
    if (node.type === "FRAME" || node.type === "SECTION") {
      // Check if name starts with the tag prefix
      if (node.name.startsWith(tagPrefix)) {
        items.push({
          id: node.id,
          name: node.name,
          type: node.type
        });
      }
    }

    // Recursively traverse children if they exist
    if ("children" in node) {
      for (const child of node.children) {
        traverse(child);
      }
    }
  }

  // Start traversal from the current page
  for (const child of currentPage.children) {
    traverse(child);
  }

  return items;
}

// Focus viewport on a specific node
async function focusOnNode(nodeId) {
  try {
    const node = await figma.getNodeByIdAsync(nodeId);
    
    if (node && (node.type === "FRAME" || node.type === "SECTION")) {
      // Scroll and zoom into view with padding
      figma.viewport.scrollAndZoomIntoView([node]);
      
      // Send success message back to UI
      figma.ui.postMessage({ 
        type: 'focus-success', 
        nodeName: node.name 
      });
    } else {
      figma.ui.postMessage({ 
        type: 'focus-error', 
        message: 'Node not found or invalid type' 
      });
    }
  } catch (error) {
    figma.ui.postMessage({ 
      type: 'focus-error', 
      message: 'Failed to focus on node' 
    });
  }
}

// Handle messages from the UI
figma.ui.onmessage = async function(msg) {
  if (msg.type === 'scan-toc') {
    const tagPrefix = msg.tagPrefix || "# ";
    const items = scanForTocItems(tagPrefix);
    figma.ui.postMessage({ 
      type: 'toc-items', 
      items: items
    });
  } else if (msg.type === 'focus-node') {
    await focusOnNode(msg.nodeId);
  } else if (msg.type === 'close-plugin') {
    figma.closePlugin();
  }
};

// Initial scan on plugin load
const initialItems = scanForTocItems("# ");
figma.ui.postMessage({ 
  type: 'toc-items', 
  items: initialItems 
});