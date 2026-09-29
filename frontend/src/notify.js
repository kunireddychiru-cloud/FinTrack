import { Alert, Platform } from 'react-native';

export const notify = (title, msg) =>
  Platform.OS === 'web' ? window.alert(`${title}: ${msg}`) : Alert.alert(title, msg);

export const confirm = (title, msg) => {
  return new Promise((resolve) => {
    if (Platform.OS === 'web') {
      const res = window.confirm(`${title}\n\n${msg}`);
      resolve(res);
    } else {
      Alert.alert(
        title,
        msg,
        [
          { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
          { text: 'Delete', style: 'destructive', onPress: () => resolve(true) }
        ],
        { cancelable: true, onDismiss: () => resolve(false) }
      );
    }
  });
};
