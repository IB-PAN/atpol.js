import "../assets/css/hljs-themes.css";
import hljs from "highlight.js/lib/core";
import xml from "highlight.js/lib/languages/xml";
import json from "highlight.js/lib/languages/json";
import typescript from "highlight.js/lib/languages/typescript";
import hljsVuePlugin from "@highlightjs/vue-plugin";

hljs.registerLanguage("xml", xml);
hljs.registerLanguage("json", json);
hljs.registerLanguage("typescript", typescript);

export default defineNuxtPlugin((nuxtApp) => {
	nuxtApp.vueApp.use(hljsVuePlugin);
});
