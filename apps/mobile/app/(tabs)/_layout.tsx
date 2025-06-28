import React from 'react';
import { Tabs } from 'expo-router';
import { View } from 'react-native';
import { AppHeader } from '~/components/layout/AppHeader';
import { LayoutPanelLeft } from '~/lib/icons/LayoutPanelLeft';
import { MenuSquare } from '~/lib/icons/MenuSquare';
import { Users } from '~/lib/icons/Users';
import { BarChart3 } from '~/lib/icons/BarChart3';
import { Settings } from '~/lib/icons/Settings';
import { Bell } from '~/lib/icons/Bell';
import { useColorScheme } from '~/lib/useColorScheme';

// Header components that can receive React state updates
const HomeHeader = () => <AppHeader title="Home" showLogo={true} />;
const DashboardHeader = () => <AppHeader title="Dashboard" showLogo={true} />;
const AnalyticsHeader = () => <AppHeader title="Analytics" showLogo={true} />;
const UsersHeader = () => <AppHeader title="Users" showLogo={true} />;
const NotificationsHeader = () => <AppHeader title="Notifications" showLogo={true} showNotifications={false} />;
const SettingsHeader = () => <AppHeader title="Settings" showLogo={true} />;
const BillingHeader = () => <AppHeader title="Billing & Plans" showBackButton={true} showLogo={false} />;
const ProfileHeader = () => <AppHeader title="Profile" showBackButton={true} showLogo={false} />;

export default function TabsLayout() {
  const { isDarkColorScheme } = useColorScheme();

  return (
    <>
      {/* Ultra-thin edge-to-edge border above tabs - exactly like header */}
      <View 
        style={{
          position: 'absolute',
          bottom: 85, // Height of the tab bar
          left: 0,
          right: 0,
          height: 0.5,
          backgroundColor: isDarkColorScheme ? '#374151' : '#d1d5db',
          width: '100%',
          zIndex: 1000,
        }}
      />
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: isDarkColorScheme ? '#fff' : '#000',
          tabBarInactiveTintColor: isDarkColorScheme ? '#9ca3af' : '#666',
          tabBarStyle: {
            backgroundColor: isDarkColorScheme ? '#000' : '#fff',
            // Remove border properties - we handle it with separate View
            borderTopWidth: 0,
            borderTopColor: 'transparent',
            paddingTop: 8,
            height: 85,
            // Remove all edge spacing
            paddingLeft: 0,
            paddingRight: 0,
            paddingHorizontal: 0,
            marginLeft: 0,
            marginRight: 0,
            marginHorizontal: 0,
            left: 0,
            right: 0,
            position: 'absolute',
            bottom: 0,
            width: '100%',
          },
          tabBarLabelStyle: {
            fontSize: 12,
            marginTop: 0,
          },
          tabBarItemStyle: {
            paddingHorizontal: 0,
          },
        }}
      >
        <Tabs.Screen
          name='home'
          options={{
            title: 'Home',
            tabBarIcon({ color, size }) {
              return <LayoutPanelLeft color={color} size={size} />;
            },
            header: HomeHeader,
          }}
        />
        <Tabs.Screen
          name='index'
          options={{
            title: 'Dashboard',
            tabBarIcon({ color, size }) {
              return <MenuSquare color={color} size={size} />;
            },
            header: DashboardHeader,
          }}
        />
        <Tabs.Screen
          name='analytics'
          options={{
            title: 'Analytics',
            tabBarIcon({ color, size }) {
              return <BarChart3 color={color} size={size} />;
            },
            header: AnalyticsHeader,
          }}
        />
        <Tabs.Screen
          name='users'
          options={{
            title: 'Users',
            tabBarIcon({ color, size }) {
              return <Users color={color} size={size} />;
            },
            header: UsersHeader,
          }}
        />
        <Tabs.Screen
          name='notifications'
          options={{
            title: 'Notifications',
            tabBarIcon({ color, size }) {
              return <Bell color={color} size={size} />;
            },
            header: NotificationsHeader,
          }}
        />
        <Tabs.Screen
          name='settings'
          options={{
            title: 'Settings',
            tabBarIcon({ color, size }) {
              return <Settings color={color} size={size} />;
            },
            header: SettingsHeader,
          }}
        />
        <Tabs.Screen
          name='billing'
          options={{
            href: null, // This hides the tab from the tab bar
            header: BillingHeader,
          }}
        />
        <Tabs.Screen
          name='profile'
          options={{
            href: null, // This hides the tab from the tab bar
            header: ProfileHeader,
          }}
        />
      </Tabs>
    </>
  );
}
