const { withProjectBuildGradle } = require('expo/config-plugins');

// Maven Central viene devolviendo 429 (Too Many Requests) en los servidores
// compartidos de EAS Build al resolver las dependencias de expo-modules.
// No es un problema de este proyecto: Maven Central empezó a limitar el
// tráfico agregado de infraestructuras de CI compartidas como la de EAS.
//
// Gradle NO reintenta con el siguiente repositorio de la lista cuando el
// primero responde 429 (solo lo hace ante un 404 real) — así que un espejo
// agregado como respaldo *después* de mavenCentral() nunca llega a usarse.
// Por eso el espejo de Maven Central de Google Cloud va ANTES: si lo tiene
// sincronizado, resuelve ahí directamente sin tocar el Maven Central
// bloqueado; si todavía no sincronizó un paquete muy reciente, Gradle sí
// sigue con mavenCentral() como venía haciendo.
const MIRROR_URL = 'https://maven-central.storage-download.googleapis.com/maven2/';

function insertMirrorBeforeMavenCentral(contents) {
  if (contents.includes(MIRROR_URL)) {
    return contents;
  }
  const mirrorLine = `maven { url '${MIRROR_URL}' } // se prueba antes que mavenCentral() por los 429\n    `;
  return contents.replace(/mavenCentral\(\)\n/g, `${mirrorLine}mavenCentral()\n`);
}

const withMavenCentralMirror = (config) => {
  return withProjectBuildGradle(config, (config) => {
    if (config.modResults.language === 'groovy') {
      config.modResults.contents = insertMirrorBeforeMavenCentral(config.modResults.contents);
    }
    return config;
  });
};

module.exports = withMavenCentralMirror;
