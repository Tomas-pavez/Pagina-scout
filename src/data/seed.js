// Datos iniciales. Se cargan una sola vez cuando la base de datos está vacía.

export const RAMAS_BASE = [
  {
    id: 'manada',
    name: 'Manada',
    ages: '7 a 11 años',
    color: '#F59E0B',
    icon: 'PawPrint',
    order: 1,
    description:
      'Juego, imaginación, naturaleza y primeras experiencias scout. Los lobatos descubren el mundo a través de la aventura y la vida en grupo.',
    objetivo:
      'Que cada lobato desarrolle su autonomía, aprenda a convivir en grupo y descubra la naturaleza a través del juego y la fantasía del Libro de la Selva.',
    actividades:
      'Juegos de selva, cuentos, manualidades, salidas al aire libre, acantonamientos y pequeños servicios a la comunidad.',
    lema: 'Siempre lo mejor',
  },
  {
    id: 'golondrinas',
    name: 'Golondrinas',
    ages: '7 a 11 años',
    color: '#EC4899',
    icon: 'Bird',
    order: 2,
    description:
      'Exploración, creatividad, servicio y desarrollo de habilidades. Las golondrinas crecen juntas descubriendo sus talentos.',
  },
  {
    id: 'compania',
    name: 'Compañía',
    ages: '11 a 14 años',
    color: '#3B82F6',
    icon: 'Compass',
    order: 3,
    description:
      'Aventura, autonomía, proyectos y campamentos. Las guías viven la vida de patrulla y asumen sus primeros desafíos.',
  },
  {
    id: 'tropa',
    name: 'Tropa',
    ages: '11 a 14 años',
    color: '#EF4444',
    icon: 'Tent',
    order: 4,
    description:
      'Patrullas, técnicas scout, aventura y liderazgo. Los scouts aprenden haciendo, con campamentos, pionerismo y vida en la naturaleza.',
  },
  {
    id: 'avanzada',
    name: 'Avanzada',
    ages: '15 a 17 años',
    color: '#9333EA',
    icon: 'Mountain',
    order: 5,
    description:
      'Desafíos, expediciones, proyectos de servicio e identidad personal. Pioneras y pioneros construyen su propio camino.',
  },
  {
    id: 'clan',
    name: 'Clan',
    ages: '17 a 19 años',
    color: '#0D9488',
    icon: 'HeartHandshake',
    order: 6,
    description:
      'Servicio comunitario, proyectos de impacto y apoyo a las ramas menores. Caminantes que se preparan para servir a la sociedad.',
  },
];

export const RAMA_IDS = RAMAS_BASE.map((r) => r.id);

// Etapas de progresión por rama, según las insignias oficiales de la
// Asociación de Guías y Scouts de Chile (tienda Camping Scout).
// Los administradores pueden cambiar nombres, orden, imágenes y textos.
export const ETAPAS_BASE = {
  manada: ['Lobezno', 'Saltador', 'Diestro', 'Cazador'],
  golondrinas: ['Pichón', 'Aprendiz', 'Viajera', 'Guía de Vuelo'],
  compania: ['Alba', 'Amanecer', 'Luz', 'Resplandor'],
  tropa: ['Cernícalo', 'Halcón', 'Águila', 'Cóndor'],
  avanzada: ['Sendero', 'Cumbre'],
  clan: ['Antorcha', 'Fuego'],
};

// Recuadros iniciales de la sección Pañolines (se pueden agregar o quitar).
export const PANOLINES_BASE = ['Pañolín del grupo', 'Pañolín de la rama', 'Pañolín de promesa'];

export const FAQS_BASE = [
  {
    q: '¿Desde qué edad pueden participar?',
    a: 'Recibimos niñas, niños y jóvenes desde los 7 hasta los 19 años. Según su edad se integran a Manada o Golondrinas (7–11), Compañía o Tropa (11–14), Avanzada (15–17) o Clan (17–19).',
  },
  {
    q: '¿Cuándo y dónde se realizan las actividades?',
    a: 'Nos reunimos los sábados en la tarde en nuestra sede en Las Condes. Además realizamos salidas, campamentos y actividades especiales durante el año.',
  },
  {
    q: '¿Cómo puedo inscribir a mi hijo o hija?',
    a: 'Escríbenos desde la página de Contacto eligiendo el motivo "Quiero inscribirme". Te invitaremos a una reunión de prueba y te explicaremos el proceso de inscripción.',
  },
  {
    q: '¿Cuánto cuesta participar?',
    a: 'Existe una cuota anual de inscripción en la Asociación de Guías y Scouts de Chile y una cuota del grupo. Los campamentos y salidas tienen costos aparte. Nunca dejamos fuera a nadie por motivos económicos: conversémoslo.',
  },
  {
    q: '¿Qué necesito para la primera reunión?',
    a: 'Solo ropa cómoda, zapatillas, una botella de agua y muchas ganas de pasarlo bien. El uniforme se adquiere más adelante.',
  },
  {
    q: '¿Las actividades son seguras?',
    a: 'Sí. Nuestros dirigentes son voluntarios capacitados por la Asociación y seguimos sus políticas de protección y seguridad en todas las actividades.',
  },
].map((f, i) => ({ ...f, order: i + 1, active: true }));

export const LEY_SCOUT = [
  'La guía y el scout aman a Dios y viven su fe.',
  'La guía y el scout son dignos de confianza.',
  'La guía y el scout son leales.',
  'La guía y el scout sirven sin esperar recompensa.',
  'La guía y el scout comparten con todos.',
  'La guía y el scout son cortés y aman la naturaleza.',
  'La guía y el scout saben obedecer y no hacen nada a medias.',
  'La guía y el scout son optimistas aun en las dificultades.',
  'La guía y el scout son económicos, trabajadores y respetuosos del bien ajeno.',
  'La guía y el scout son puros y llevan una vida sana.',
];

export const SETTINGS_BASE = {
  id: 'site',
  videoUrl: '',
  address: 'Las Condes, Santiago de Chile',
  schedule: 'Sábados de 15:00 a 19:00 hrs.',
  instagram: 'https://www.instagram.com/',
  facebook: 'https://www.facebook.com/',
  email: 'contacto@scoutsalcazar.cl',
};

export const EVENT_TYPES = [
  { id: 'campamento', label: 'Campamento' },
  { id: 'salida', label: 'Salida' },
  { id: 'reunion', label: 'Reunión' },
  { id: 'ceremonia', label: 'Ceremonia' },
  { id: 'servicio', label: 'Servicio' },
  { id: 'apoderados', label: 'Actividad para apoderados' },
  { id: 'otro', label: 'Otro' },
];

export const COMM_TYPES = [
  { id: 'comunicado', label: 'Comunicado' },
  { id: 'noticia', label: 'Noticia' },
  { id: 'autorizacion', label: 'Autorización' },
  { id: 'circular', label: 'Circular' },
  { id: 'aviso', label: 'Aviso' },
];

export const CONTACT_REASONS = [
  'Quiero inscribirme',
  'Información general',
  'Quiero ser dirigente',
  'Apoderados',
  'Otro',
];
