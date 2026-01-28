import type { ProfileSection, Category, Banner } from '../types';

export const PROFILE_SECTIONS: ProfileSection[] = [
  { id: '1', icon: 'person', title: 'Información Personal', subtitle: 'Gestiona tus datos personales', route: '/profile/info' },
  { id: '2', icon: 'shopping_bag', title: 'Mis Pedidos', subtitle: 'Revisa el estado de tus compras', route: '/profile/orders' },
  { id: '3', icon: 'favorite', title: 'Lista de Deseos', subtitle: 'Tus productos favoritos', route: '/profile/wishlist' },
  { id: '4', icon: 'credit_card', title: 'Métodos de Pago', subtitle: 'Cuentas para consignar', route: '/profile/payment-methods' },
  { id: '5', icon: 'settings', title: 'Configuración', subtitle: 'Preferencias de la aplicación', route: '/settings' },
];

export const CATEGORIES: Category[] = [
  { id: '1', name: 'Celulares y Tables', icon: 'smartphone', image: 'https://picsum.photos/seed/cat1/200/200' },
  { id: '2', name: 'Computadores', icon: 'computer', image: 'https://picsum.photos/seed/cat2/200/200' },
  { id: '3', name: 'Impresoras Scaners', icon: 'print', image: 'https://picsum.photos/seed/cat3/200/200' },
  { id: '4', name: 'Redes', icon: 'router', image: 'https://picsum.photos/seed/cat4/200/200' },
  { id: '5', name: 'Perifericos', icon: 'mouse', image: 'https://picsum.photos/seed/cat5/200/200' },
  { id: '6', name: 'Almacenamiento', icon: 'sd_storage', image: 'https://picsum.photos/seed/cat6/200/200' },
  { id: '7', name: 'Pantalla y Televisores', icon: 'tv', image: 'https://picsum.photos/seed/cat7/200/200' },
  { id: '8', name: 'Dispositivos de Sonido', icon: 'headphones', image: 'https://picsum.photos/seed/cat8/200/200' },
  { id: '9', name: 'Componentes', icon: 'memory', image: 'https://picsum.photos/seed/cat9/200/200' },
  { id: '10', name: 'Dispositivos de carga', icon: 'battery_charging_full', image: 'https://picsum.photos/seed/cat10/200/200' },
  { id: '11', name: 'Morrales', icon: 'backpack', image: 'https://picsum.photos/seed/cat11/200/200' }
];

export const BANNERS: Banner[] = [
  {
    id: '1',
    title: 'New iPhone 15 Pro',
    description: 'The ultimate iPhone experience.',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC5PAVsson3z1yvaAGNPMcYuMU6NL9AG-vcQlHHfsTWakHQPwU5QHdC2pYnAJQu0mw9msktoWWDhQ77Nd5S_0wepI4qrej0UtkJ1XbeH9Y--sYHDBkTjFGoBKvU89rT_ZjKV7976zUVm6tlq7sTU_pmVWQZbHn_7UWLRUOouxPOrhKafhKr6STAh9y0e7u98m7SqXvfb0u7-RRHGzTWHI_WXq95wg99K0Y8smts-UAbFgkI7HSNfSK8hEVA-OzhPMiBN4KgGtn235k',
    link: '/products?category=Celulares%20y%20Tables',
    order: 1,
    isActive: true,
    style: 'split'
  },
  {
    id: '2',
    title: 'Flash Sale: 40% Off',
    description: 'Limited time offer on top laptops.',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBFdxZAZnYYZlApBxPEh-YksdFWzzb22pfFu1Zk6Sz1emKl4dUbuL4ndun5np-jaLU_VRa7GheuPu_Fic3SNLHoTWzDnmV250IP_W4-53FqPNKYlJaHE1_7EbL588mVjZ8l2Iud6VJoOHQkfYpQb7y6AwRFwkBNGoDnOd-Y2IIuwltMbUzgpa_1SXNvIjKWI_CIwWDM4n70S7T6LSRn0HXwnauEFwLcWfABsd0jSviuVUOV8qtFOBLATUDb3sdKpXtoTAXSdJ8E72c',
    link: '/products?category=Computadores',
    order: 2,
    isActive: true,
    style: 'cover'
  }
];
