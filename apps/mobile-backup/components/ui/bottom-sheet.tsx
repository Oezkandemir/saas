import React, { useCallback, useMemo, forwardRef } from 'react';
import { View, StyleSheet } from 'react-native';
import { BottomSheetModal, BottomSheetView, BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import { useTheme } from '../../lib/theme-context';

interface CustomBottomSheetProps {
  children: React.ReactNode;
  isVisible: boolean;
  onClose: () => void;
  snapPoints?: string[];
  enablePanDownToClose?: boolean;
  backgroundStyle?: any;
}

export const CustomBottomSheet = forwardRef<BottomSheetModal, CustomBottomSheetProps>(
  ({ 
    children, 
    isVisible, 
    onClose, 
    snapPoints = ['25%', '50%', '90%'],
    enablePanDownToClose = true,
    backgroundStyle 
  }, ref) => {
    const { colors, isDark } = useTheme();

    // Bottom Sheet snap points
    const bottomSheetSnapPoints = useMemo(() => snapPoints, [snapPoints]);

    // Handle sheet changes
    const handleSheetChanges = useCallback((index: number) => {
      if (index === -1) {
        onClose();
      }
    }, [onClose]);

    // Custom background style
    const customBackgroundStyle = useMemo(
      () => ({
        backgroundColor: colors.background,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        shadowColor: '#000',
        shadowOffset: {
          width: 0,
          height: -2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 8,
        ...backgroundStyle,
      }),
      [colors.background, backgroundStyle]
    );

    // Render custom backdrop
    const renderBackdrop = useCallback(
      (props: any) => (
        <BottomSheetBackdrop
          {...props}
          appearsOnIndex={0}
          disappearsOnIndex={-1}
          opacity={0.3}
        />
      ),
      []
    );

    // Handle opening/closing based on isVisible prop
    React.useEffect(() => {
      if (ref && 'current' in ref && ref.current) {
        if (isVisible) {
          ref.current.present();
        } else {
          ref.current.dismiss();
        }
      }
    }, [isVisible, ref]);

    return (
      <BottomSheetModal
        ref={ref}
        index={1}
        snapPoints={bottomSheetSnapPoints}
        onChange={handleSheetChanges}
        enablePanDownToClose={enablePanDownToClose}
        backgroundStyle={customBackgroundStyle}
        backdropComponent={renderBackdrop}
        handleIndicatorStyle={{
          backgroundColor: colors.border,
        }}
      >
        <BottomSheetView style={styles.contentContainer}>
          {children}
        </BottomSheetView>
      </BottomSheetModal>
    );
  }
);

const styles = StyleSheet.create({
  contentContainer: {
    flex: 1,
    zIndex: 9999,
  },
});

CustomBottomSheet.displayName = 'CustomBottomSheet'; 