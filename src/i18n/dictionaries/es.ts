import type { DeepPartial } from "../types";
import type { Dictionary } from "./en";

const es: DeepPartial<Dictionary> = {
  meta: { tagline: "El conocimiento FTC, accesible en todos los idiomas." },
  nav: {
    manuals: "Manuales", guides: "Guías", ai: "Mavericks AI", initiative: "Nuestra iniciativa", about: "Nosotros",
    search: "Buscar", explore: "Explorar manuales", language: "Idioma de la interfaz", menu: "Menú", close: "Cerrar",
    skip: "Saltar al contenido",
  },
  hero: {
    subtitle: "El conocimiento FTC, accesible en todos los idiomas.", primary: "Explorar manuales",
    secondary: "Conoce nuestra iniciativa", pause: "Pausar vídeo de fondo", play: "Reproducir vídeo de fondo",
  },
  home: {
    featuredEyebrow: "Manual de competencia destacado",
    featuredEmpty: "Aún no se ha publicado ningún manual. El manual de la temporada actual aparecerá aquí cuando el equipo lo publique.",
    readInLanguageEyebrow: "Lee en tu idioma",
    readInLanguageTitle: "Un manual. Todas las traducciones publicadas por la comunidad.",
    readInLanguageBody: "Elige un idioma de documento para ver qué manuales están disponibles. Solo se muestran traducciones revisadas y publicadas.",
    noTranslations: "Todavía no hay manuales publicados en este idioma.",
    aiEyebrow: "Mavericks AI", aiTitle: "Respuestas que remiten a la página.",
    aiBody: "Mavericks AI es un asistente de documentación que busca en los manuales publicados y responde con citas a la página exacta. Es un proyecto comunitario: verifica siempre las reglas críticas en las fuentes oficiales.",
    aiStatus: "En desarrollo — se abrirá cuando el sistema de búsqueda esté conectado.",
    initiativeEyebrow: "FIRST for All",
    initiativeTitle: "El idioma nunca debería separar a un equipo de las reglas.",
    initiativeBody: "Muchos equipos FTC aprenden el juego con un manual escrito en un idioma que no hablan en casa. FIRST FOR ALL reúne traducciones comunitarias del manual, vinculadas a la fuente original en inglés, para que cada equipo pueda leer, comparar y citar las reglas con confianza.",
    communityEyebrow: "Nuestra comunidad", communityTitle: "Construido en abierto, por equipos para equipos.",
    communityBody: "Traductores, revisores e ingenieros contribuyen a esta plataforma. Las contribuciones verificadas se reconocerán aquí.",
    filmEyebrow: "Película MAVERICKS", filmEmpty: "La película aparecerá aquí cuando se suba a la biblioteca de medios.",
    partnersEyebrow: "Socios", partnersEmpty: "Los socios confirmados aparecerán aquí.", viewAll: "Ver todos los manuales",
  },
  manuals: {
    title: "Biblioteca de manuales",
    intro: "Documentación oficial de FTC y traducciones comunitarias, por temporada. Cada traducción enlaza con su fuente en inglés.",
    search: "Buscar manuales", season: "Temporada", language: "Idioma", category: "Categoría", sort: "Ordenar", all: "Todos",
    sortNewest: "Temporada más reciente", sortTitle: "Título A–Z", revision: "Revisión", available: "Disponible",
    unavailable: "Aún no disponible", read: "Leer en línea", download: "Descargar PDF", pages: "páginas",
    empty: "Ningún manual publicado coincide con estos filtros.",
    emptyLibrary: "La biblioteca está vacía. Los manuales aparecerán cuando el equipo los publique.",
    translations: "Traducciones", source: "Fuente oficial", translatedBy: "Traducción de", official: "Oficial",
    community: "Traducción comunitaria", notConfigured: "La base de datos no está conectada. Ver README → Configuration.",
  },
  reader: {
    toc: "Contenido", noToc: "Este documento no tiene índice incorporado.", page: "Página", of: "de",
    prev: "Página anterior", next: "Página siguiente", zoomIn: "Acercar", zoomOut: "Alejar", fitWidth: "Ajustar al ancho",
    fullscreen: "Pantalla completa", search: "Buscar en el documento", searchPlaceholder: "Buscar en el documento…",
    noMatches: "Sin coincidencias", matches: "coincidencias", download: "Descargar", print: "Imprimir",
    loading: "Cargando documento…", error: "No se pudo cargar el documento.", retry: "Reintentar",
    language: "Idioma del documento", back: "Volver a la descripción",
    pageReset: "Esta traducción tiene otra paginación, así que se abrió la primera página.",
  },
  footer: {
    documentation: "Documentación", project: "Proyecto",
    disclaimer: "FIRST FOR ALL es una iniciativa comunitaria de MAVERICKS FTC #24034. No está afiliada, respaldada ni es un producto oficial de FIRST®. FIRST®, FIRST® Tech Challenge y FTC® son marcas de FIRST. Verifica siempre las reglas en la documentación oficial publicada por FIRST.",
    rights: "Las traducciones comunitarias se acreditan a sus traductores.",
  },
  common: {
    comingSoon: "Esta parte de la plataforma está en construcción.",
    comingSoonBody: "Solo publicamos funciones que funcionan. Esta sección se abrirá cuando esté completa.",
    backHome: "Volver al inicio",
  },
  about: {
    intro: "Somos el equipo detrás de FIRST FOR ALL — MANUAL FOR ALL.", story: "Nuestra historia",
    storyBody: "La historia del equipo se gestiona en el panel de administración y será publicada por el equipo.",
    philosophy: "Nuestra filosofía",
    philosophyBody: "El conocimiento crece cuando se comparte. Creamos herramientas que eliminan barreras —empezando por el idioma— entre los estudiantes y la ingeniería.",
  },
  sponsors: { title: "Socios", intro: "Organizaciones que apoyan FIRST FOR ALL.", empty: "Aún no hay socios confirmados." },
  login: {
    title: "Acceso del equipo",
    intro: "Solo para miembros autorizados de MAVERICKS. No necesitas cuenta para leer o descargar manuales.",
    email: "Correo", password: "Contraseña", submit: "Entrar", error: "Error al iniciar sesión. Revisa tus datos.",
    notConfigured: "La autenticación no está configurada.",
  },
};
export default es;
