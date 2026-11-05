import type { ErrorCopy } from "@/types/errors";

export const errorCopies: Record<"es" | "en", ErrorCopy> = {
  es: {
    notFound: {
      title: "Esta pantalla no existe",
      text: "El enlace está roto o la página se ha movido. Puedes volver al inicio o ver los proyectos.",
    },
    serverError: {
      title: "Algo ha fallado",
      text: "Ha ocurrido un error inesperado. Puedes reintentar o volver al inicio.",
    },
    rateLimited: {
      title: "Demasiadas peticiones",
      text: "Has hecho muchas peticiones seguidas. Espera un momento y vuelve a intentarlo.",
    },
    maintenance: {
      title: "Volvemos enseguida",
      text: "La web está en mantenimiento. Vuelve en unos minutos.",
    },
    actions: {
      home: "Volver al inicio",
      projects: "Ver proyectos",
      chat: "Abrir el chat",
      retry: "Reintentar",
      retrying: "Reintentando",
    },
  },
  en: {
    notFound: {
      title: "This page does not exist",
      text: "The link is broken or the page has moved. You can go back home or see the projects.",
    },
    serverError: {
      title: "Something went wrong",
      text: "An unexpected error happened. You can try again or go back home.",
    },
    rateLimited: {
      title: "Too many requests",
      text: "You made many requests in a row. Wait a moment and try again.",
    },
    maintenance: {
      title: "Back soon",
      text: "The site is under maintenance. Come back in a few minutes.",
    },
    actions: {
      home: "Back to home",
      projects: "See projects",
      chat: "Open the chat",
      retry: "Try again",
      retrying: "Retrying",
    },
  },
};
