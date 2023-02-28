import {
  cursorTo,
  eraseDown,
  image,
  link,
} from "https://deno.land/x/cliffy@v0.25.7/ansi/ansi_escapes.ts";

const response = await fetch(
  "https://deno.land/images/artwork/ogdeno.png?__frsh_c=rg9bww10249g",
);
const imageBuffer: ArrayBuffer = await response.arrayBuffer();

console.log(
  cursorTo(0, 0) +
    eraseDown() +
    image(imageBuffer, {
      width: 29,
      preserveAspectRatio: true,
    }) +
    "\n          " +
    link("Deno Land", "https://deno.land") +
    "\n",
);
