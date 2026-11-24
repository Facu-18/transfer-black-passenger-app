/**
 * Cuanto puede agrandar el texto el tamaño de fuente del sistema. Sin tope, con
 * "fuente muy grande" (1,3x o mas) los textos no entraban en botones, campos y
 * pastillas de alto fijo y se cortaban o se encimaban. Con 1,15x la app sigue
 * respetando la preferencia de quien lee con letra mas grande sin romperse.
 */
export const MAX_FONT_SCALE = 1.15;
