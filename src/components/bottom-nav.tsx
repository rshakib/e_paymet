import React from 'react';
import { View, Text, StyleSheet, Pressable, Platform, Image } from 'react-native';
import { SymbolView } from 'expo-symbols';
import { useSafeAreaInsets } from 'react-native-safe-area-context';


interface NavItemProps {
  label: string;
  iconName: { ios: string; android: string; web: string };
  isActive?: boolean;
  onPress?: () => void;
}

const NavItem = ({ label, iconName, isActive, onPress }: NavItemProps) => {
  const color = isActive ? '#007BFF' : '#8E8E93';
  
  return (
    <Pressable style={styles.navItem} onPress={onPress}>
      <SymbolView
        name={iconName}
        size={24}
        tintColor={color}
        fallback={null}
      />
      <Text style={[styles.navLabel, { color }]}>{label}</Text>
    </Pressable>
  );
};

export function BottomNav() {
  const insets = useSafeAreaInsets();
  
  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      {/* Main Navbar */}
      <View style={styles.navBar}>
        <View style={styles.navItemsGroup}>
          <NavItem 
            label="Home" 
            iconName={{ ios: 'house.fill', android: 'home', web: 'home' }} 
            isActive 
          />
          <NavItem 
            label="Transactions" 
            iconName={{ ios: 'arrow.left.arrow.right', android: 'swap-horiz', web: 'swap_horiz' }} 
          />
        </View>
        
        {/* Placeholder for center button overlap spacing */}
        <View style={styles.centerSpace} />
        
        <View style={styles.navItemsGroup}>
          <NavItem 
            label="Services" 
            iconName={{ ios: 'square.grid.2x2.fill', android: 'grid-view', web: 'grid_view' }} 
          />
          <NavItem 
            label="Profile" 
            iconName={{ ios: 'person.fill', android: 'person', web: 'person' }} 
          />
        </View>
      </View>

      {/* Floating Scan to Pay Button */}
      <View style={styles.floatingButtonContainer}>
        <Pressable style={styles.scanButton}>
          <Image
            source={require('../../assets/qr.png')}
            style={styles.scanIconImage}
          />
        </Pressable>
        <Text style={styles.scanLabel}>Scan to Pay</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    backgroundColor: 'transparent',
    alignItems: 'center',
  },
  navBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 35,
    borderTopRightRadius: 35,
    height: 75,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 10,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.08,
        shadowRadius: 10,
      },
      android: {
        elevation: 15,
      },
      web: {
        boxShadow: '0 -4px 15px rgba(0,0,0,0.05)',
      }
    }),
  },
  navItemsGroup: {
    flexDirection: 'row',
    flex: 1,
    justifyContent: 'space-around',
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  navLabel: {
    fontSize: 10,
    marginTop: 4,
    fontWeight: '500',
  },
  centerSpace: {
    width: 80,
  },
  floatingButtonContainer: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 35 : 25,
    alignItems: 'center',
    zIndex: 10,
  },
  scanButton: {
    width: 65,
    height: 65,
    borderRadius: 32.5,
    backgroundColor: '#0A1F44',
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#0A1F44',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
      web: {
        boxShadow: '0 6px 15px rgba(10,31,68,0.3)',
      }
    }),
  },
  scanLabel: {
    fontSize: 10,
    color: '#0A1F44',
    marginTop: 5,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  scanIconImage: {
    width: 30,
    height: 30,
    tintColor: '#FFFFFF',
  },
});
