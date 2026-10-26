import { Alert, Platform } from 'react-native';

// En la web, Alert.alert de React Native no muestra nada. Lo reemplazamos por
// los diálogos del navegador para que los avisos y las confirmaciones
// (eliminar, salir, quitar fotos) también funcionen en la versión web.
if (Platform.OS === 'web') {
  Alert.alert = (title, message, buttons) => {
    const text = [title, message].filter(Boolean).join('\n\n');
    const actions = buttons ?? [];
    if (actions.length <= 1) {
      window.alert(text);
      actions[0]?.onPress?.();
      return;
    }
    const cancel = actions.find((b) => b.style === 'cancel');
    const confirm =
      actions.find((b) => b.style === 'destructive') ?? actions.filter((b) => b !== cancel).pop();
    if (window.confirm(text)) confirm?.onPress?.();
    else cancel?.onPress?.();
  };
}
