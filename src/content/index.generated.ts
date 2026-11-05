import type { BlogMeta, LegalMeta, ProjectMeta } from "./schemas";
import type { ContentEntry } from "./types";
export const projects: ContentEntry<ProjectMeta>[] = [
  {
    slug: "3cat",
    meta: {
      title: "3Cat",
      slug: "3cat",
      kind: "app",
      status: "live",
      headline: "La app principal de 3Cat: funcionalidades en React Native dentro de un equipo.",
      description:
        "Caso 3Cat: desarrollo de funcionalidades en la app principal de 3Cat, la radiotelevisión pública catalana, en React Native. Trabajo en equipo vía Alten.",
      role: "Desarrollador React Native en el equipo de 3Cat, vía Alten",
      period: "Abr 2024 – actualidad",
      sector: "Medios de comunicación",
      team: true,
      stack: ["React Native", "TypeScript", "iOS", "Android"],
      links: {},
      relatedService: "freelance",
      featured: false,
      order: 2,
    },
    headings: [],
    words: 96,
    load: () => import("../../content/projects/3cat.mdx"),
  },
  {
    slug: "3catinfo",
    meta: {
      title: "3CatInfo",
      slug: "3catinfo",
      kind: "app",
      status: "live",
      headline:
        "La app de noticias de 3Cat, con la IA integrada en el producto y la accesibilidad como requisito.",
      description:
        "Caso 3CatInfo: app de noticias de 3Cat en React Native. Integración de IA en el producto y accesibilidad WCAG, en el equipo vía Alten.",
      role: "Desarrollador React Native en el equipo de 3Cat, vía Alten",
      period: "Abr 2024 – actualidad",
      sector: "Medios de comunicación",
      team: true,
      stack: ["React Native", "TypeScript", "iOS", "Android", "Accesibilidad (WCAG)"],
      links: {},
      relatedService: "freelance",
      featured: true,
      order: 1,
    },
    headings: [],
    words: 182,
    load: () => import("../../content/projects/3catinfo.mdx"),
  },
  {
    slug: "josecoded",
    meta: {
      title: "josecoded",
      slug: "josecoded",
      kind: "web",
      status: "wip",
      headline:
        "Esta web: mi escaparate y mi forma de trabajar, hecha de cero y con la calidad medida.",
      description:
        "Caso josecoded: mi web personal en Next 16 sobre Cloudflare Workers, con CSP con nonce, accesibilidad WCAG 2.2 AA y presupuesto de JS medido.",
      role: "Diseño y desarrollo de principio a fin",
      period: "2026 – actualidad",
      sector: "Web personal",
      team: false,
      stack: ["Next.js", "TypeScript", "Cloudflare Workers", "Supabase"],
      links: {},
      metric: {
        label: "de JavaScript comprimido en la home, con un presupuesto de 150 KB",
        value: "145 KB",
        source: "pnpm perf:budget sobre la build de esta web",
        date: "2026-11-05",
      },
      relatedService: "a-medida",
      featured: true,
      order: 4,
    },
    headings: [],
    words: 200,
    load: () => import("../../content/projects/josecoded.mdx"),
  },
  {
    slug: "nextraket",
    meta: {
      title: "NextRaket",
      slug: "nextraket",
      kind: "web",
      status: "live",
      headline:
        "Mi trabajo freelance: apps con React Native y webs con Next.js, de los requisitos al mantenimiento.",
      description:
        "Caso NextRaket: mi trabajo freelance para diversas empresas. Apps con React Native, webs con Next.js y Supabase, y automatización con n8n.",
      role: "Desarrollo full-stack freelance, de principio a fin",
      period: "2024 – actualidad",
      sector: "Negocios locales y empresas",
      team: false,
      stack: ["React Native", "Expo", "Next.js", "Supabase", "Firebase", "n8n"],
      links: {},
      relatedService: "a-medida",
      featured: false,
      order: 3,
    },
    headings: [],
    words: 108,
    load: () => import("../../content/projects/nextraket.mdx"),
  },
];
export const blog: ContentEntry<BlogMeta>[] = [
  {
    slug: "accesibilidad-apps-european-accessibility-act",
    meta: {
      title:
        "Accesibilidad en apps: qué exige la European Accessibility Act y cómo cumplirla con React Native",
      metaTitle: "European Accessibility Act en apps React Native",
      slug: "accesibilidad-apps-european-accessibility-act",
      description:
        "Qué servicios cubre la European Accessibility Act y la Ley 11/2023, qué comprobar en una app React Native y por dónde empezar, contado por un referente de WCAG.",
      date: "2026-11-05",
      updated: "2026-11-05",
      order: 2,
      category: "accesibilidad-ia",
      kind: "article",
      tags: ["accesibilidad", "WCAG", "React Native", "ley"],
      draft: false,
      faq: [
        {
          question: "¿La European Accessibility Act obliga a todas las apps?",
          answer:
            "No. Cubre productos y servicios concretos de consumo, como el comercio electrónico, los servicios bancarios a consumidores, los libros electrónicos o el transporte de pasajeros. Las microempresas que prestan servicios están exentas. Si tu caso entra o no lo decide un asesor legal; yo te digo qué hay que cambiar en la app.",
        },
        {
          question: "¿Con qué versión de WCAG debo medirme, la 2.1 o la 2.2?",
          answer:
            "La norma europea armonizada se actualiza más despacio que el W3C, así que lo exigible puede ir un paso por detrás. Yo audito contra WCAG 2.2 nivel AA, que recoge casi todo lo de 2.1, y señalo qué criterios son nuevos de la 2.2.",
        },
        {
          question: "¿Basta con una herramienta automática?",
          answer:
            "No. Las herramientas automáticas detectan una parte de los problemas, como etiquetas que faltan o contrastes bajos. Que el orden de lectura tenga sentido o que un flujo se pueda completar con un lector de pantalla solo lo ves probándolo.",
        },
        {
          question: "¿Cuánto tarda una auditoría de accesibilidad de una app?",
          answer:
            "Entre uno y dos días de trabajo para una app de tamaño normal, y entrego un informe WCAG 2.2 con un plan de corrección. El precio está en revisión; se acuerda por escrito antes de empezar.",
        },
      ],
      relatedService: "freelance",
      relatedPosts: ["plantilla-de-auditoria-react-native", "integrar-ia-en-una-app-de-noticias"],
    },
    headings: [
      { id: "qué-es-la-european-accessibility-act", label: "Qué es la European Accessibility Act" },
      { id: "contra-qué-se-mide-wcag", label: "Contra qué se mide: WCAG" },
      {
        id: "qué-compruebo-en-una-app-react-native",
        label: "Qué compruebo en una app React Native",
      },
      { id: "cómo-lo-compruebo", label: "Cómo lo compruebo" },
      {
        id: "por-dónde-empezar-si-ya-tienes-la-app",
        label: "Por dónde empezar si ya tienes la app",
      },
      { id: "lo-que-no-puedo-prometerte", label: "Lo que no puedo prometerte" },
    ],
    words: 846,
    load: () => import("../../content/blog/accesibilidad-apps-european-accessibility-act.mdx"),
  },
  {
    slug: "antes-de-pedir-presupuesto-de-una-app",
    meta: {
      title: "Antes de pedir presupuesto de una app: checklist",
      metaTitle: "Checklist antes de pedir presupuesto de app",
      slug: "antes-de-pedir-presupuesto-de-una-app",
      description:
        "Una lista para imprimir con lo que conviene tener claro antes de pedir presupuesto de una app, para que cada presupuesto responda sobre lo mismo.",
      date: "2026-11-05",
      updated: "2026-11-05",
      order: 5,
      category: "precios",
      kind: "resource",
      tags: ["checklist", "presupuesto", "app móvil"],
      draft: false,
      faq: [
        {
          question: "¿Tengo que tenerlo todo resuelto para pedir presupuesto?",
          answer:
            "No. La lista sirve para saber qué sabes y qué no. Lo que no sepas, dilo en la petición como duda; un buen presupuesto lo recoge como suposición.",
        },
        {
          question: "¿Para qué sirve imprimirla?",
          answer:
            "Para rellenarla con quien decide contigo y para enviar la misma información a varias personas. Así los presupuestos que recibas serán comparables.",
        },
        {
          question: "¿Tengo que dártela rellena para pedirte presupuesto?",
          answer:
            "No. Puedes escribirme con lo que tengas y yo te pregunto lo que falte. No hace falta enviarme nada que no quieras.",
        },
      ],
      relatedService: "a-medida",
      relatedPosts: [
        "cuanto-cuesta-una-app-movil-en-espana",
        "programador-freelance-por-horas-o-por-tarea",
      ],
    },
    headings: [
      { id: "1-qué-problema-resuelve", label: "1. Qué problema resuelve" },
      { id: "2-qué-debe-hacer-la-primera-versión", label: "2. Qué debe hacer la primera versión" },
      { id: "3-quién-entra-y-qué-ve", label: "3. Quién entra y qué ve" },
      { id: "4-cobros-avisos-y-otras-piezas", label: "4. Cobros, avisos y otras piezas" },
      { id: "5-plataformas-y-tiendas", label: "5. Plataformas y tiendas" },
      { id: "6-diseño-y-contenido", label: "6. Diseño y contenido" },
      { id: "7-plazo-y-presupuesto", label: "7. Plazo y presupuesto" },
      { id: "8-qué-pedir-en-el-presupuesto", label: "8. Qué pedir en el presupuesto" },
      { id: "9-para-comparar-varios-presupuestos", label: "9. Para comparar varios presupuestos" },
    ],
    words: 459,
    load: () => import("../../content/blog/antes-de-pedir-presupuesto-de-una-app.mdx"),
  },
  {
    slug: "cuanto-cuesta-una-app-movil-en-espana",
    meta: {
      title: "Cuánto cuesta una app móvil en España en 2026",
      slug: "cuanto-cuesta-una-app-movil-en-espana",
      description:
        "De qué depende el precio de una app móvil, qué costes se repiten cada año y cómo comparar presupuestos sin que una cifra suelta te confunda.",
      date: "2026-11-05",
      updated: "2026-11-05",
      order: 1,
      category: "precios",
      kind: "article",
      tags: ["precio", "presupuesto", "app móvil"],
      draft: false,
      faq: [
        {
          question: "¿Cuánto cuesta una app móvil?",
          answer:
            "Depende del alcance, y por eso no doy una cifra única. Una app sin cuentas ni panel y una app con usuarios, cobros y avisos son productos distintos. Mis precios están en revisión; cuando los publique llevarán fecha, y antes de empezar recibes un presupuesto cerrado por escrito.",
        },
        {
          question: "¿Sale a cuenta hacer la app solo para iOS o solo para Android?",
          answer:
            "Con React Native gran parte del código se comparte entre las dos plataformas, así que hacer solo una no ahorra la mitad. Cada plataforma sigue teniendo sus pruebas, su publicación y su revisión de tienda. Conviene empezar por una sola si todos tus usuarios usan la misma.",
        },
        {
          question: "¿Una web es más barata que una app?",
          answer:
            "Suele ser más sencilla de publicar, porque no pasa por la revisión de una tienda. Si tus usuarios la van a usar a diario desde el móvil o necesitas avisos en el teléfono, la app puede compensar. Se decide por el uso, no por el precio.",
        },
        {
          question: "¿Tengo que pagar algo después de publicarla?",
          answer:
            "Sí. Están las cuentas de desarrollador de las tiendas, los servicios de terceros que crecen con el uso y, si lo quieres, el mantenimiento. Un buen presupuesto te lo dice antes de empezar.",
        },
      ],
      relatedService: "a-medida",
      relatedPosts: [
        "antes-de-pedir-presupuesto-de-una-app",
        "programador-freelance-por-horas-o-por-tarea",
      ],
    },
    headings: [
      { id: "el-precio-sale-de-cuatro-cosas", label: "El precio sale de cuatro cosas" },
      { id: "qué-hace-subir-el-presupuesto", label: "Qué hace subir el presupuesto" },
      { id: "los-costes-que-no-son-desarrollo", label: "Los costes que no son desarrollo" },
      { id: "plazos-lo-que-sí-puedo-concretar", label: "Plazos: lo que sí puedo concretar" },
      { id: "cómo-comparar-dos-presupuestos", label: "Cómo comparar dos presupuestos" },
      { id: "cómo-calculo-yo-el-mío", label: "Cómo calculo yo el mío" },
    ],
    words: 869,
    load: () => import("../../content/blog/cuanto-cuesta-una-app-movil-en-espana.mdx"),
  },
  {
    slug: "integrar-ia-en-una-app-de-noticias",
    meta: {
      title: "Integrar IA en una app de noticias: lo que aprendí en producción",
      metaTitle: "Integrar IA en una app: lo que aprendí",
      slug: "integrar-ia-en-una-app-de-noticias",
      description:
        "Qué decidir antes de meter un modelo de lenguaje en una app de noticias: alcance, fuentes, coste, accesibilidad y qué hacer cuando la IA falla.",
      date: "2026-11-05",
      updated: "2026-11-05",
      order: 4,
      category: "accesibilidad-ia",
      kind: "article",
      tags: ["IA", "LLM", "app de noticias", "accesibilidad"],
      draft: false,
      faq: [
        {
          question: "¿Hace falta entrenar un modelo propio para añadir IA a una app?",
          answer:
            "Casi nunca. Lo habitual es usar un modelo ya entrenado a través de una API y darle el contenido de tu producto como contexto. Un modelo propio solo tiene sentido por privacidad, por coste a gran escala o por una tarea muy específica.",
        },
        {
          question: "¿Puede la IA inventarse datos en una app de noticias?",
          answer:
            "Sí, y es el riesgo principal. Se reduce dándole solo el texto de la fuente, pidiéndole que no salga de él y comprobando una muestra a mano. No se elimina del todo, así que el diseño debe asumir que alguna respuesta será mala.",
        },
        {
          question: "¿Cuánto cuesta añadir una función de IA a una app?",
          answer:
            "Hay dos costes distintos. El de integrarla, que en mis encargos suele ser de tres a cinco días de trabajo, y el de usarla, que paga el proveedor del modelo por consumo y crece con los usuarios. Mi precio está en revisión.",
        },
        {
          question: "¿Hay que avisar al usuario de que es IA?",
          answer:
            "Sí. Es una cuestión de honestidad con el lector y, además, el Reglamento europeo de IA incluye obligaciones de transparencia. Consulta con tu asesor cuáles te tocan.",
        },
      ],
      relatedService: "freelance",
      relatedPosts: [
        "accesibilidad-apps-european-accessibility-act",
        "programador-freelance-por-horas-o-por-tarea",
      ],
    },
    headings: [
      { id: "primero-qué-problema-resuelve", label: "Primero, qué problema resuelve" },
      {
        id: "que-el-modelo-hable-solo-de-lo-que-le-das",
        label: "Que el modelo hable solo de lo que le das",
      },
      { id: "qué-pasa-cuando-falla", label: "Qué pasa cuando falla" },
      { id: "coste-y-latencia", label: "Coste y latencia" },
      { id: "accesibilidad-de-lo-que-genera-la-ia", label: "Accesibilidad de lo que genera la IA" },
      { id: "transparencia-y-privacidad", label: "Transparencia y privacidad" },
      { id: "cómo-comprobar-que-funciona", label: "Cómo comprobar que funciona" },
      { id: "lo-que-me-llevo", label: "Lo que me llevo" },
    ],
    words: 818,
    load: () => import("../../content/blog/integrar-ia-en-una-app-de-noticias.mdx"),
  },
  {
    slug: "plantilla-de-auditoria-react-native",
    meta: {
      title: "Plantilla de auditoría de una app React Native",
      metaTitle: "Plantilla de auditoría de una app React Native",
      slug: "plantilla-de-auditoria-react-native",
      description:
        "Una plantilla para imprimir con las áreas que reviso al auditar una app React Native, qué comprobar en cada una y cómo priorizar lo que encuentres.",
      date: "2026-11-05",
      updated: "2026-11-05",
      order: 6,
      category: "react-native",
      kind: "resource",
      tags: ["auditoría", "React Native", "plantilla"],
      draft: false,
      faq: [
        {
          question: "¿Puedo usar la plantilla sin contratarte?",
          answer:
            "Sí, está pensada para eso. Imprímela o guárdala como PDF y repasa tu app con tu equipo. Si prefieres que lo haga otra persona con experiencia, puedes pedirme una auditoría.",
        },
        {
          question: "¿Cuánto se tarda en pasarla?",
          answer:
            "Depende del tamaño de la app. Una auditoría mía de una app de tamaño normal es una tarea de uno a dos días con un informe; con la plantilla, tu equipo puede hacer una primera pasada en menos tiempo y con menos detalle.",
        },
        {
          question: "¿Qué hago con lo que encuentre?",
          answer:
            "Priorízalo con la escala del final de la plantilla y conviértelo en tareas pequeñas con un entregable claro. Lo urgente es lo que rompe flujos o expone datos.",
        },
      ],
      relatedService: "freelance",
      relatedPosts: [
        "accesibilidad-apps-european-accessibility-act",
        "programador-freelance-por-horas-o-por-tarea",
      ],
    },
    headings: [
      { id: "cómo-usarla", label: "Cómo usarla" },
      { id: "1-estabilidad", label: "1. Estabilidad" },
      { id: "2-rendimiento", label: "2. Rendimiento" },
      { id: "3-accesibilidad", label: "3. Accesibilidad" },
      { id: "4-seguridad", label: "4. Seguridad" },
      { id: "5-dependencias-y-versiones", label: "5. Dependencias y versiones" },
      { id: "6-pruebas-e-integración-continua", label: "6. Pruebas e integración continua" },
      { id: "7-publicación-y-tiendas", label: "7. Publicación y tiendas" },
      { id: "cómo-priorizar-lo-que-encuentres", label: "Cómo priorizar lo que encuentres" },
    ],
    words: 603,
    load: () => import("../../content/blog/plantilla-de-auditoria-react-native.mdx"),
  },
  {
    slug: "programador-freelance-por-horas-o-por-tarea",
    meta: {
      title: "Programador freelance por horas o por tarea: cuál te conviene",
      metaTitle: "Programador freelance: por horas o por tarea",
      slug: "programador-freelance-por-horas-o-por-tarea",
      description:
        "Cuándo conviene pagar a un programador freelance por horas y cuándo por tarea cerrada, qué dejar por escrito antes de empezar y cómo reducir el riesgo.",
      date: "2026-11-05",
      updated: "2026-11-05",
      order: 3,
      category: "trabajar-con-freelance",
      kind: "article",
      tags: ["freelance", "horas", "tarea", "contratar"],
      draft: false,
      faq: [
        {
          question: "¿Qué conviene más para un MVP, horas o tarea?",
          answer:
            "Si todavía estás descubriendo qué construir, horas con un tope acordado, porque el alcance va a cambiar. Si ya sabes qué pantallas y qué flujo quieres, tarea cerrada. Y si dudas, empieza por una tarea pequeña y decide con lo que veas.",
        },
        {
          question: "¿Pagar por horas sale más caro?",
          answer:
            "No necesariamente. Por horas pagas el tiempo real, que puede ser menor o mayor que lo previsto. Por tarea pagas un precio fijo que ya incluye el margen de lo que pueda torcerse. Lo que cambia es quién asume ese riesgo.",
        },
        {
          question: "¿Qué pasa si el alcance crece a mitad de tarea?",
          answer:
            "Paro, te lo digo con lo que ha cambiado y lo reacordamos por escrito antes de seguir. Lo importante es que el cambio se vea y se decida, no que se acumule sin avisar.",
        },
        {
          question: "¿Qué necesitas de mí para empezar?",
          answer:
            "Acceso al repositorio y al gestor de tareas, una descripción de lo que quieres, y saber quién revisa los pull requests. Con eso puedo proponerte horas estimadas o un precio por tarea.",
        },
      ],
      relatedService: "freelance",
      relatedPosts: [
        "plantilla-de-auditoria-react-native",
        "antes-de-pedir-presupuesto-de-una-app",
      ],
    },
    headings: [
      { id: "por-horas-cuándo-encaja", label: "Por horas: cuándo encaja" },
      { id: "por-tarea-cuándo-encaja", label: "Por tarea: cuándo encaja" },
      { id: "la-comparación-en-una-tabla", label: "La comparación en una tabla" },
      {
        id: "qué-dejar-por-escrito-sea-cual-sea-el-modelo",
        label: "Qué dejar por escrito, sea cual sea el modelo",
      },
      {
        id: "cómo-reduzco-el-riesgo-una-tarea-piloto",
        label: "Cómo reduzco el riesgo: una tarea piloto",
      },
      { id: "qué-preguntar-a-cualquier-freelance", label: "Qué preguntar a cualquier freelance" },
      { id: "cómo-elegir-en-un-minuto", label: "Cómo elegir en un minuto" },
    ],
    words: 721,
    load: () => import("../../content/blog/programador-freelance-por-horas-o-por-tarea.mdx"),
  },
];
export const legal: ContentEntry<LegalMeta>[] = [
  {
    slug: "aviso-legal",
    meta: {
      title: "Aviso legal",
      updated: "2026-11-05",
      draft: false,
      summary: [
        "Este sitio lo edita y mantiene una persona física, José Carlos Sánchez García, desde Madrid (España).",
        "Puedes escribirme a hola@josecoded.com para cualquier asunto legal o de contenido.",
        "El acceso es gratuito y la información tiene carácter orientativo, no es una oferta vinculante.",
        "Los contenidos son propiedad del titular y no se pueden reutilizar sin permiso.",
        "Cómo trato tus datos y qué cookies uso está explicado en sus páginas propias.",
      ],
    },
    headings: [
      { id: "titular-del-sitio", label: "Titular del sitio" },
      { id: "objeto-del-sitio", label: "Objeto del sitio" },
      { id: "condiciones-de-uso", label: "Condiciones de uso" },
      {
        id: "carácter-orientativo-de-la-información",
        label: "Carácter orientativo de la información",
      },
      { id: "propiedad-intelectual-e-industrial", label: "Propiedad intelectual e industrial" },
      { id: "enlaces", label: "Enlaces" },
      { id: "responsabilidad", label: "Responsabilidad" },
      { id: "protección-de-datos-y-cookies", label: "Protección de datos y cookies" },
      { id: "legislación-aplicable-y-jurisdicción", label: "Legislación aplicable y jurisdicción" },
    ],
    words: 460,
    load: () => import("../../content/legal/aviso-legal.mdx"),
  },
  {
    slug: "cookies",
    meta: {
      title: "Política de cookies",
      updated: "2026-11-05",
      draft: false,
      summary: [
        "Solo uso cookies estrictamente necesarias, así que no hay banner que aceptar.",
        "Sirven para mantener tu sesión si entras y para recordar tu conversación con el asistente del chat si le escribes.",
        "No uso cookies de analítica, publicidad ni seguimiento.",
        "Si algún día las añado, te pediré consentimiento antes de activarlas.",
        "Puedes borrarlas desde tu navegador cuando quieras; el sitio seguirá funcionando.",
      ],
    },
    headings: [
      { id: "solo-cookies-necesarias", label: "Solo cookies necesarias" },
      { id: "qué-cookies-se-usan", label: "Qué cookies se usan" },
      { id: "cómo-gestionar-o-borrar-las-cookies", label: "Cómo gestionar o borrar las cookies" },
      { id: "cambios", label: "Cambios" },
      { id: "más-información", label: "Más información" },
    ],
    words: 399,
    load: () => import("../../content/legal/cookies.mdx"),
  },
  {
    slug: "privacidad",
    meta: {
      title: "Política de privacidad",
      updated: "2026-11-05",
      draft: false,
      summary: [
        "Guardo solo lo que me das: el formulario de contacto, el chat y, si entras, tu cuenta. No hay publicidad ni analítica.",
        "Lo uso para responderte y, si llega a haber trabajo, para gestionarlo; nada más.",
        "Un chat sin datos de contacto se borra a los 7 días; si dejas tu contacto, a los 60 días; si eres cliente, a los 90 días desde tu última respuesta.",
        "Intervienen proveedores con contrato de encargo de tratamiento, casi todos en la Unión Europea (lista abajo).",
        "Para acceder, corregir o borrar tus datos escribe a hola@josecoded.com.",
      ],
    },
    headings: [
      { id: "responsable-del-tratamiento", label: "Responsable del tratamiento" },
      { id: "qué-datos-trato-y-para-qué", label: "Qué datos trato y para qué" },
      { id: "cómo-se-trata-el-chat", label: "Cómo se trata el chat" },
      { id: "cuánto-tiempo-conservo-tus-datos", label: "Cuánto tiempo conservo tus datos" },
      { id: "quién-más-accede-a-tus-datos", label: "Quién más accede a tus datos" },
      { id: "transferencias-internacionales", label: "Transferencias internacionales" },
      { id: "seguridad", label: "Seguridad" },
      { id: "tus-derechos", label: "Tus derechos" },
      { id: "cambios-en-esta-política", label: "Cambios en esta política" },
    ],
    words: 965,
    load: () => import("../../content/legal/privacidad.mdx"),
  },
];
