import { useEffect, useRef, type ReactNode } from 'react';
import {
  Animated,
  Easing,
  Modal,
  Pressable,
  View,
  Text,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { pick } from './theme';

export function Drawer({
  open,
  onClose,
  title,
  dark,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  dark: boolean;
  children: ReactNode;
}) {
  const c = pick(dark);
  const { width } = useWindowDimensions();
  const drawerWidth = Math.min(340, Math.round(width * 0.88));
  const tx = useRef(new Animated.Value(-drawerWidth)).current;
  const backdrop = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (open) {
      Animated.parallel([
        Animated.timing(tx, {
          toValue: 0,
          duration: 220,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(backdrop, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(tx, {
          toValue: -drawerWidth,
          duration: 200,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(backdrop, {
          toValue: 0,
          duration: 160,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [open, drawerWidth, tx, backdrop]);

  return (
    <Modal
      visible={open}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.root}>
        <Animated.View
          style={[
            StyleSheet.absoluteFillObject,
            {
              backgroundColor: 'rgba(0,0,0,0.45)',
              opacity: backdrop,
            },
          ]}
        >
          <Pressable style={{ flex: 1 }} onPress={onClose} accessibilityLabel="Close drawer" />
        </Animated.View>
        <Animated.View
          style={[
            styles.panel,
            {
              width: drawerWidth,
              backgroundColor: c.sidebarBg,
              borderRightColor: c.sidebarBorder,
              transform: [{ translateX: tx }],
            },
          ]}
        >
          <SafeAreaView edges={['top', 'bottom', 'left']} style={{ flex: 1 }}>
            <View
              style={[
                styles.header,
                { borderBottomColor: c.sidebarBorder, backgroundColor: c.sidebarBg },
              ]}
            >
              <Text style={{ color: c.text, fontWeight: '700', fontSize: 16 }}>{title}</Text>
              <Pressable
                onPress={onClose}
                accessibilityLabel="Close"
                style={({ pressed }) => [
                  styles.closeBtn,
                  {
                    borderColor: c.sidebarBorder,
                    backgroundColor: dark ? '#1F1F27' : '#ffffff',
                    opacity: pressed ? 0.7 : 1,
                  },
                ]}
              >
                <Text style={{ color: c.text, fontSize: 18, lineHeight: 18 }}>×</Text>
              </Pressable>
            </View>
            <View style={{ flex: 1 }}>{children}</View>
          </SafeAreaView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  panel: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    borderRightWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 8, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderBottomWidth: 1,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
