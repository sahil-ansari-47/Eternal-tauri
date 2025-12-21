import type { Extension } from "@codemirror/state";
import { json } from "@codemirror/lang-json";
import { css } from "@codemirror/lang-css";
import { html } from "@codemirror/lang-html";
import { javascript } from "@codemirror/lang-javascript";
import { markdown } from "@codemirror/lang-markdown";
import { python } from "@codemirror/lang-python";

function getLanguageExtension(filePath: string): Extension[] {
  const ext = filePath.split(".").pop()?.toLowerCase();

  switch (ext) {
    case "js":
      return [javascript({ jsx: false })];
    case "jsx":
      return [javascript({ jsx: true })];
    case "ts":
      return [javascript({ typescript: true, jsx: false })];
    case "tsx":
      return [javascript({ typescript: true, jsx: true })];
    case "json":
      return [json()];
    case "css":
      return [css()];
    case "html":
      return [html()];
    case "md":
    case "markdown":
      return [markdown()];
    case "py":
      return [python()];
    default:
      return [];
  }
}

export default getLanguageExtension;
