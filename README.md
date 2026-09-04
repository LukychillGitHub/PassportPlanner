# PassportPlanner

Aplicación móvil (Expo + React Native + TypeScript) para coleccionar planes en un "pasaporte" de actividades: sellalas con estrellas y una breve reseña, o dejá que la ruleta elija tu próximo plan.

## Navegación

La app tiene un menú inferior con tres secciones:

- **Cuenta** — nombre, foto de perfil, descripción y estadísticas (sellos y actividades totales). Desde acá también se activa el **modo administrador**.
- **Pasaporte** — una libreta con una página por actividad, que se desliza como un carrusel (`FlatList` nativo con paginación) o con las flechas ‹ ›. Cada actividad se puede "Sellar": elegís de 1 a 5 estrellas, escribís una breve descripción y opcionalmente agregás una foto (recortable con `ImageCropperModal`). En modo admin aparece un botón para agregar actividades nuevas y "Editar"/"Eliminar" en cada página.
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
  components/              StarRating, PassportBook/PassportPage (libreta deslizable),
                            StampModal, ActivityFormModal, ImageCropperModal (recorte de fotos),
                            Wheel (ruleta con react-native-svg)
  theme.ts                 colores y estilos compartidos
  types.ts                 tipos (Activity, Stamp, Profile)
```

## Producción (EAS Build)

El proyecto ya tiene `eas.json` con perfiles `development`, `preview` (APK interno de Android
para probar) y `production`, y `app.json` con `ios.bundleIdentifier` / `android.package`
(`com.lukychill.passportplanner` — cambialo antes del primer build si querés otro identificador,
porque no se puede modificar después de publicar en las tiendas).

Pasos para generar la build instalable:

```bash
npm install -g eas-cli   # o usar "npx eas-cli" sin instalar global
eas login                # con tu cuenta de Expo (gratis, se crea en expo.dev)
eas build:configure      # vincula el proyecto a tu cuenta (crea el projectId)

# Build de prueba (APK de Android que se instala directo, sin Play Store)
eas build --platform android --profile preview

# Build de producción para las tiendas
eas build --platform android --profile production
eas build --platform ios --profile production   # requiere cuenta de Apple Developer
```

Para publicarla en las tiendas hace falta además:

- **Google Play**: cuenta de Google Play Console (pago único de USD 25), y luego
  `eas submit --platform android`.
- **App Store**: cuenta de Apple Developer Program (USD 99/año), y luego
  `eas submit --platform ios`.

Ambas tiendas piden también: capturas de pantalla, descripción, ícono ya incluido en el proyecto,
y una política de privacidad (obligatoria porque la app pide acceso a fotos).
