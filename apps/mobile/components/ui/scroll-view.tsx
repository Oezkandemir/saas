import React from 'react';
import { ScrollView as RNScrollView, ScrollViewProps, Platform } from 'react-native';

interface AppScrollViewProps extends ScrollViewProps {
  children: React.ReactNode;
}

export function AppScrollView({ children, contentContainerStyle, ...props }: AppScrollViewProps) {
  return (
    <RNScrollView
      className="flex-1 bg-background"
      contentContainerStyle={{
        paddingBottom: 140, // Extra space for bottom tabs
        flexGrow: 1,
        ...(contentContainerStyle as any),
      }}
      showsVerticalScrollIndicator={false} // Hide on both iOS and Android
      indicatorStyle={Platform.OS === 'ios' ? 'white' : undefined}
      scrollIndicatorInsets={{ right: 1 }}
      nestedScrollEnabled={true}
      {...props}
    >
      {children}
    </RNScrollView>
  );
} 