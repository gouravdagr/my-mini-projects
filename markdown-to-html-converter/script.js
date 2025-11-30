const markdownInput = document.getElementById("markdown-input");
const htmlOutput = document.getElementById("html-output");
const preview = document.getElementById("preview");

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
}

function convertMarkdown() {
  let md = markdownInput.value || '';

  md = md.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  const codeBlocks = [];
  md = md.replace(/```(\w+)?\n([\s\S]*?)```/g, function(_, lang, code) {
    const idx = codeBlocks.length;
    codeBlocks.push({
      lang: lang || '',
      code: code
    });
    return `\n\n{{{CODEBLOCK_${idx}}}}\n\n`;
  });


  md = md.replace(/^\s*([-*_])(?:\s*\1){2,}\s*$/gm, '<hr>');

  md = md.replace(/^######\s+(.*)$/gm, '<h6>$1</h6>');
  md = md.replace(/^#####\s+(.*)$/gm, '<h5>$1</h5>');
  md = md.replace(/^####\s+(.*)$/gm, '<h4>$1</h4>');
  md = md.replace(/^###\s+(.*)$/gm, '<h3>$1</h3>');
  md = md.replace(/^##\s+(.*)$/gm, '<h2>$1</h2>');
  md = md.replace(/^#\s+(.*)$/gm, '<h1>$1</h1>');

  md = md.replace(/(^|\n)(> ?[^\n]*(\n> ?[^\n]*)*)/g, function(_, prefix, block) {
    const content = block.split('\n').map(line => line.replace(/^> ?/, '')).join('\n');
    return `${prefix}<blockquote>${content}</blockquote>`;
  });

  function parseLists(text) {
    const lines = text.split('\n');
    let out = '';
    const stack = [];

    function closeToIndent(targetIndent) {
      while (stack.length && stack[stack.length - 1].indent >= targetIndent) {
        const top = stack.pop();
        out += `</li></${top.type}>`;
      }
    }

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const match = line.match(/^(\s*)([*\-]|\d+\.)\s+(.*)$/);
      
      if (match) {
        const indent = match[1].length;
        const marker = match[2];
        const content = match[3];
        const type = /^\d+\.$/.test(marker) ? 'ol' : 'ul';

        if (!stack.length || indent > stack[stack.length - 1].indent) {
          out += `<${type}><li>${content}`;
          stack.push({ type, indent });
        } 
        else if (indent === stack[stack.length - 1].indent && type === stack[stack.length - 1].type) {
          out += `</li><li>${content}`;
        } 
        else {
          closeToIndent(indent);
          if (!stack.length || stack[stack.length - 1].indent < indent) {
            out += `<${type}><li>${content}`;
            stack.push({ type, indent });
          } else if (stack[stack.length - 1].type === type) {
            out += `</li><li>${content}`;
          } else {
            closeToIndent(indent);
            out += `<${type}><li>${content}`;
            stack.push({ type, indent });
          }
        }
      } else {
        if (stack.length) {
          while (stack.length) {
            const top = stack.pop();
            out += `</li></${top.type}>`;
          }
        }
        out += (out && !out.endsWith('\n') ? '\n' : '') + line;
      }
    }

    while (stack.length) {
      const top = stack.pop();
      out += `</li></${top.type}>`;
    }

    return out;
  }

  md = parseLists(md);


  const inlineCodePlaceholders = [];
  md = md.replace(/`([^`]+)`/g, function(_, code) {
    const idx = inlineCodePlaceholders.length;
    inlineCodePlaceholders.push(code);
    return `{{{INLINECODE_${idx}}}}`;
  });

  md = md.replace(/!\[([^\]]*?)\]\(([^)]+?)\)/g, '<img alt="$1" src="$2">');

  md = md.replace(/\[([^\]]+?)\]\(([^)]+?)\)/g, '<a href="$2" target="_blank">$1</a>');

  md = md.replace(/(\*\*|__)(.*?)\1/g, '<strong>$2</strong>');

  md = md.replace(/(\*|_)(.*?)\1/g, '<em>$2</em>');

  md = md.replace(/~~(.*?)~~/g, '<del>$1</del>');

  const blocks = md.split(/\n{2,}/).map(b => b.trim()).filter(Boolean);
  const blockHtml = blocks.map(block => {
    if (/^<(h[1-6]|ul|ol|li|pre|code|blockquote|hr|img|a|p)/i.test(block)) {
      return block;
    }
    return `<p>${block}</p>`;
  }).join('\n\n');

  let result = blockHtml;

  result = result.replace(/{{{INLINECODE_(\d+)}}}/g, function(_, idx) {
    const code = inlineCodePlaceholders[Number(idx)] || '';
    return `<code>${escapeHtml(code)}</code>`;
  });

  result = result.replace(/{{{CODEBLOCK_(\d+)}}}/g, function(_, idx) {
    const cb = codeBlocks[Number(idx)];
    if (!cb) return '';
    const langClass = cb.lang ? ` class="language-${escapeHtml(cb.lang)}"` : '';
    return `<pre><code${langClass}>${escapeHtml(cb.code)}</code></pre>`;
  });

  result = result.replace(/<p>\s*<\/p>/g, '');

  return result;
}

markdownInput.addEventListener('input', () => {
  const htmlCode = convertMarkdown();
  htmlOutput.textContent = htmlCode; 
  preview.innerHTML = htmlCode;  
});

markdownInput.dispatchEvent(new Event('input'));