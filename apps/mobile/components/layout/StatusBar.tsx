import React from 'react';
import { View, ScrollView } from 'react-native';
import { Text } from '~/components/ui/text';
import { useColorScheme } from '~/lib/useColorScheme';
import { cn } from '~/lib/utils';

export interface StatusBarItem {
  icon?: React.ReactNode;
  value: string | number;
  label: string;
}

interface StatusBarProps {
  items: StatusBarItem[];
}

export function StatusBar({ items }: StatusBarProps) {
  const { isDarkColorScheme } = useColorScheme();

  return (
    <View 
      className={cn(
        'border-b bg-muted/20',
        isDarkColorScheme ? 'border-gray-800' : 'border-gray-200'
      )}
    >
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          paddingVertical: 16,
          paddingLeft: 16,
          paddingRight: 16,
          gap: 24,
        }}
      >
        {items.map((item, index) => (
          <View
            key={index}
            className="items-center"
            style={{
              minWidth: 80,
            }}
          >
            {/* Icon Container */}
            {item.icon && (
              <View 
                className="mb-2 items-center justify-center rounded-lg bg-muted/30 w-8 h-8"
              >
                {item.icon}
              </View>
            )}
            
            {/* Value */}
            <Text className="text-2xl font-bold text-foreground mb-1">
              {item.value}
            </Text>
            
            {/* Label */}
            <Text className="text-xs text-muted-foreground text-center">
              {item.label}
            </Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}
