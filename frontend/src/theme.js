import { StyleSheet } from 'react-native';

export const colors = {
  primary: '#4F46E5', bg: '#F5F6FA', card: '#FFFFFF', text: '#111827',
  muted: '#6B7280', income: '#16A34A', expense: '#DC2626', border: '#E5E7EB', warn: '#F59E0B',
};

export const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  pad: { padding: 16 },
  card: { backgroundColor: colors.card, borderRadius: 14, padding: 16, marginBottom: 12, elevation: 1,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } },
  h1: { fontSize: 24, fontWeight: '700', color: colors.text, marginBottom: 12 },
  h2: { fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 8 },
  muted: { color: colors.muted, fontSize: 13 },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: colors.border, borderRadius: 10,
    padding: 12, marginBottom: 12, fontSize: 16 },
  btn: { backgroundColor: colors.primary, padding: 14, borderRadius: 10, alignItems: 'center', marginTop: 4 },
  btnText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  chip: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 20, borderWidth: 1,
    borderColor: colors.border, marginRight: 8, marginBottom: 8, backgroundColor: '#fff' },
  chipOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  wrap: { flexDirection: 'row', flexWrap: 'wrap' },
});
