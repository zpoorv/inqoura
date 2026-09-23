import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  fallbackTitle?: string;
  fallbackComponent?: ReactNode;
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

/**
 * Isolated component-level error boundary.
 * Prevents single faulty cards (e.g. nutrition grid) from crashing the entire Result screen.
 */
export class ComponentErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    if (__DEV__) {
      console.warn('[ComponentErrorBoundary] Caught component error:', error.message, errorInfo);
    }
  }

  public render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallbackComponent) {
        return this.props.fallbackComponent;
      }

      return (
        <View style={styles.errorContainer}>
          <View style={styles.headerRow}>
            <Ionicons name="information-circle-outline" size={18} color="#64748B" />
            <Text style={styles.title}>
              {this.props.fallbackTitle || 'Section Temporarily Unavailable'}
            </Text>
          </View>
          <Text style={styles.subtext}>
            Ingredient safety analysis remains active.
          </Text>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  errorContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    marginVertical: 6,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  title: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  subtext: {
    fontSize: 12,
    color: '#94A3B8',
  },
});
