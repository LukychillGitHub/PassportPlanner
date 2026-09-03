const { withProjectBuildGradle } = require('expo/config-plugins');

// Maven Central viene devolviendo 429 (Too Many Requests) en los servidores
// compartidos de EAS Build cuando resuelven las dependencias de expo-modules.
// Esto no es un problema de este proyecto: Maven Central empezó a limitar el
// tráfico agregado de infraestructuras de CI compartidas como la de EAS.
// Agregamos el espejo de Maven Central de Google Cloud como repositorio de
// respaldo: Gradle solo lo consulta si mavenCentral() falla para un artefacto
// puntual, así que no cambia nada cuando Maven Central responde con normalidad.
const MIRROR_URL = 'https://maven-central.storage-download.googleapis.com/maven2/';

function insertMirrorAfterMavenCentral(contents) {
  if (contents.includes(MIRROR_URL)) {
    return contents;
  }
  const mirrorBlock = `maven { url '${MIRROR_URL}' } // respaldo si Maven Central responde 429\n    `;
  return contents.replace(/mavenCentral\(\)\n/g, `mavenCentral()\n    ${mirrorBlock}`);
}

const withMavenCentralMirror = (config) => {
  return withProjectBuildGradle(config, (config) => {
    if (config.modResults.language === 'groovy') {
      config.modResults.contents = insertMirrorAfterMavenCentral(config.modResults.contents);
    }
    return config;
  });
};

module.exports = withMavenCentralMirror;
