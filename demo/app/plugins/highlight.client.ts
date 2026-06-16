import "../assets/css/hljs-themes.css";
import hljs from "highlight.js/lib/core";
import xml from "highlight.js/lib/languages/xml";
import json from "highlight.js/lib/languages/json";
import hljsVuePlugin from "@highlightjs/vue-plugin";

hljs.registerLanguage("xml", xml);
hljs.registerLanguage("json", json);

export default defineNuxtPlugin((nuxtApp) => {
	nuxtApp.vueApp.use(hljsVuePlugin);
});
