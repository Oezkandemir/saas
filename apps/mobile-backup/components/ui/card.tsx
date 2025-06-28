import * as React from 'react';
import { View, ViewProps, StyleSheet } from 'react-native';
import { Text } from './text';

interface CardProps extends ViewProps {
  children?: React.ReactNode;
}

const Card = React.forwardRef<View, CardProps>(({ style, children, ...props }, ref) => {
  return (
    <View ref={ref} style={[styles.card, style]} {...props}>
      {children}
    </View>
  );
});

const CardHeader = React.forwardRef<View, CardProps>(({ style, children, ...props }, ref) => {
  return (
    <View ref={ref} style={[styles.cardHeader, style]} {...props}>
      {children}
    </View>
  );
});

const CardTitle = ({ style, ...props }: React.ComponentProps<typeof Text>) => {
  return <Text style={[styles.cardTitle, style]} {...props} />;
};

const CardDescription = ({ style, ...props }: React.ComponentProps<typeof Text>) => {
  return <Text style={[styles.cardDescription, style]} {...props} />;
};

const CardContent = React.forwardRef<View, CardProps>(({ style, children, ...props }, ref) => {
  return (
    <View ref={ref} style={[styles.cardContent, style]} {...props}>
      {children}
    </View>
  );
});

const CardFooter = React.forwardRef<View, CardProps>(({ style, children, ...props }, ref) => {
  return (
    <View ref={ref} style={[styles.cardFooter, style]} {...props}>
      {children}
    </View>
  );
});

const styles = StyleSheet.create({
  card: {
    borderRadius: 8,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e5e5',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'column',
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 14,
    color: '#666666',
  },
  cardContent: {
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
});

Card.displayName = 'Card';
CardHeader.displayName = 'CardHeader';
CardTitle.displayName = 'CardTitle';
CardDescription.displayName = 'CardDescription';
CardContent.displayName = 'CardContent';
CardFooter.displayName = 'CardFooter';

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter };
