# PassportPlanner

Aplicación móvil (Expo + React Native + TypeScript) para coleccionar planes en un "pasaporte" de actividades: sellalas con estrellas y una breve reseña, o dejá que la ruleta elija tu próximo plan.

## Navegación

La app tiene un menú inferior con tres secciones:

- **Cuenta** — nombre, foto de perfil, descripción y estadísticas (sellos y actividades totales). Desde acá también se activa el **modo administrador**.
- **Pasaporte** — lista de actividades. Cada una se puede "Sellar": elegís de 1 a 5 estrellas y escribís una breve descripción de la experiencia. En modo admin aparece un botón para agregar actividades nuevas y "Editar"/"Eliminar" en cada tarjeta.
- **Ruleta** — una ruleta gira entre las actividades del pasaporte (todas o solo las pendientes de sellar) y elige al azar el próximo plan.

## Modo administrador

Desde **Cuenta → Entrar como admin**, el PIN por defecto es `1234`. Se puede cambiar programáticamente con `changeAdminPin` del contexto de la app (`src/context/AppContext.tsx`) si se quiere exponer una pantalla para modificarlo.

## Datos

Todo se guarda localmente en el dispositivo con `AsyncStorage` (perfil, actividades y sellos), no requiere backend ni conexión a internet.

## Desarrollo

```bash
npm install
npm run start   # abre Expo Dev Tools / Metro
npm run android # o npm run ios / npm run web
```

Estructura principal:

```
src/
  context/AppContext.tsx   estado global + persistencia (AsyncStorage)
  screens/                 Cuenta, Pasaporte, Ruleta
  components/              StarRating, ActivityCard, StampModal,
                            ActivityFormModal, Wheel (ruleta con react-native-svg)
  theme.ts                 colores y estilos compartidos
  types.ts                 tipos (Activity, Stamp, Profile)
```
