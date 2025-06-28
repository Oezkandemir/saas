import * as React from 'react';
import { View, Image, ViewProps, ImageProps, StyleSheet } from 'react-native';
import { Text } from './text';

interface AvatarProps extends ViewProps {
  size?: number;
  children?: React.ReactNode;
}

interface AvatarImageProps extends ImageProps {
  size?: number;
}

interface AvatarFallbackProps extends ViewProps {
  size?: number;
  children?: React.ReactNode;
}

const Avatar = React.forwardRef<View, AvatarProps>(
  ({ style, size = 40, children, ...props }, ref) => {
    return (
      <View
        ref={ref}
        style={[
          styles.avatar,
          { width: size, height: size, borderRadius: size / 2 },
          style,
        ]}
        {...props}
      >
        {children}
      </View>
    );
  }
);

const AvatarImage = React.forwardRef<Image, AvatarImageProps>(
  ({ style, size = 40, ...props }, ref) => {
    return (
      <Image
        ref={ref}
        style={[
          styles.avatarImage,
          { width: size, height: size, borderRadius: size / 2 },
          style,
        ]}
        {...props}
      />
    );
  }
);

const AvatarFallback = React.forwardRef<View, AvatarFallbackProps>(
  ({ style, size = 40, children, ...props }, ref) => {
    return (
      <View
        ref={ref}
        style={[
          styles.avatarFallback,
          { width: size, height: size, borderRadius: size / 2 },
          style,
        ]}
        {...props}
      >
        {typeof children === 'string' ? (
          <Text style={[styles.avatarFallbackText, { fontSize: size * 0.4 }]}>
            {children}
          </Text>
        ) : (
          children
        )}
      </View>
    );
  }
);

const styles = StyleSheet.create({
  avatar: {
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#f0f0f0',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarFallback: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e0e0e0',
  },
  avatarFallbackText: {
    fontWeight: '500',
    color: '#666666',
  },
});

Avatar.displayName = 'Avatar';
AvatarImage.displayName = 'AvatarImage';
AvatarFallback.displayName = 'AvatarFallback';

export { Avatar, AvatarImage, AvatarFallback };
