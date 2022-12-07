import { basicSetup } from "codemirror"
import { EditorView, keymap } from "@codemirror/view"
import { indentWithTab } from "@codemirror/commands"
import { PostgreSQL, sql } from "@codemirror/lang-sql"
import { vscodeDark } from '@uiw/codemirror-theme-vscode';

function createEditor(editor, value) {
  const fixedHeightEditor = EditorView.theme({
    "&": { height: "300px" },
    ".cm-scroller": { overflow: "auto" }
  })
  return new EditorView({
    doc: value,
    extensions: [
      basicSetup,
      keymap.of([indentWithTab]),
      sql({ dialect: PostgreSQL }),
      fixedHeightEditor,
      vscodeDark
    ],
    parent: document.querySelector(editor)
  })
}

function codeEditorInit() {
  let codeEditor = {};
  let totalEditor = document.querySelectorAll("[id^=editor-]").length;
  for (let i = 1; i <= totalEditor; i++) {
    codeEditor["#editor-" + i] = createEditor("#editor-" + i, values[i - 1]);
  }
  return codeEditor;
}

let codeEditor = codeEditorInit();

export { codeEditor }