// Tiptap editor bundle for the admin editor page.
// Exposes window.TiptapEditor = { createEditor, highlightCodeBlocks }.
import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Highlight from '@tiptap/extension-highlight';
import TextStyle from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Youtube from '@tiptap/extension-youtube';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableHeader from '@tiptap/extension-table-header';
import TableCell from '@tiptap/extension-table-cell';
import TextAlign from '@tiptap/extension-text-align';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import Placeholder from '@tiptap/extension-placeholder';
import CharacterCount from '@tiptap/extension-character-count';
import { common, createLowlight } from 'lowlight';

const lowlight = createLowlight(common);

function createEditor({ element, content, placeholder, onUpdate, onSelection }) {
  return new Editor({
    element,
    content: content || '',
    extensions: [
      StarterKit.configure({ codeBlock: false, heading: { levels: [1, 2, 3, 4] } }),
      Underline,
      Highlight.configure({ multicolor: true }),
      TextStyle,
      Color,
      Link.configure({
        openOnClick: false,
        autolink: true,
        HTMLAttributes: { rel: 'noopener noreferrer nofollow', target: '_blank' },
      }),
      Image.configure({ inline: false, allowBase64: false }),
      Youtube.configure({ nocookie: true, controls: true, allowFullscreen: true, inline: false }),
      Table.configure({ resizable: false }),
      TableRow,
      TableHeader,
      TableCell,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      TaskList,
      TaskItem.configure({ nested: true }),
      CodeBlockLowlight.configure({ lowlight }),
      Placeholder.configure({ placeholder: placeholder || 'Start writing... type / for commands' }),
      CharacterCount,
    ],
    editorProps: { attributes: { class: 'prose-post', spellcheck: 'true' } },
    onUpdate: () => onUpdate && onUpdate(),
    onSelectionUpdate: () => onSelection && onSelection(),
  });
}

// --- Syntax highlighting baked into saved HTML (public pages need only CSS) ---
function esc(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
function hastToHtml(node) {
  if (node.type === 'text') return esc(node.value);
  if (node.type === 'element') {
    const cls = (node.properties && node.properties.className) || [];
    const inner = (node.children || []).map(hastToHtml).join('');
    return cls.length ? `<span class="${cls.join(' ')}">${inner}</span>` : inner;
  }
  return (node.children || []).map(hastToHtml).join('');
}
function highlightCodeBlocks(html) {
  const doc = new DOMParser().parseFromString(`<body>${html}</body>`, 'text/html');
  doc.querySelectorAll('pre > code').forEach((code) => {
    const m = /language-([\w-]+)/.exec(code.className || '');
    const lang = m && lowlight.registered(m[1]) ? m[1] : null;
    const text = code.textContent || '';
    try {
      const tree = lang ? lowlight.highlight(lang, text) : lowlight.highlightAuto(text);
      code.innerHTML = hastToHtml(tree);
    } catch (e) { /* keep plain text */ }
  });
  return doc.body.innerHTML;
}

window.TiptapEditor = { createEditor, highlightCodeBlocks };
