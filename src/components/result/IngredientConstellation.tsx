import React, { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View, ScrollView } from 'react-native';
import { triggerSelectionHaptic } from '../../utils/haptics';

export interface ConstellationNode {
  id: string;
  name: string;
  type: 'whole_food' | 'additive' | 'allergen';
  details?: string;
  hazardRisk?: string;
}

export interface IngredientConstellationProps {
  ingredients: Array<{ text: string; isAllergen?: boolean; isAdditive?: boolean }>;
}

export default function IngredientConstellation({ ingredients }: IngredientConstellationProps) {
  const [selectedNode, setSelectedNode] = useState<ConstellationNode | null>(null);

  const nodes: ConstellationNode[] = ingredients.slice(0, 16).map((ing, index) => {
    let type: ConstellationNode['type'] = 'whole_food';
    if (ing.isAllergen) type = 'allergen';
    else if (ing.isAdditive || ing.text.toLowerCase().match(/^(e\d{3,4}|preservative|artificial|flavor|color)/)) {
      type = 'additive';
    }

    return {
      id: `node-${index}`,
      name: ing.text,
      type,
      details: type === 'allergen'
        ? 'Identified allergen matching dietary risk profile.'
        : type === 'additive'
          ? 'Formulation additive, preservative, or stabilizer.'
          : 'Natural or agricultural whole food component.',
      hazardRisk: type === 'allergen' ? 'High Risk' : type === 'additive' ? 'Moderate Processing' : 'Clean & Safe',
    };
  });

  const handleSelectNode = (node: ConstellationNode) => {
    triggerSelectionHaptic();
    setSelectedNode(node);
  };

  const getNodeColors = (type: ConstellationNode['type']) => {
    switch (type) {
      case 'allergen':
        return { bg: 'rgba(239, 68, 68, 0.15)', border: '#ef4444', text: '#b91c1c' };
      case 'additive':
        return { bg: 'rgba(245, 158, 11, 0.15)', border: '#f59e0b', text: '#b45309' };
      case 'whole_food':
      default:
        return { bg: 'rgba(16, 185, 129, 0.15)', border: '#10b981', text: '#047857' };
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.constellationTitle}>Ingredient Chemistry Constellation</Text>
      <Text style={styles.constellationSubtitle}>Interactive molecular topology of product ingredients</Text>

      <View style={styles.orbitField}>
        {nodes.map((node) => {
          const colors = getNodeColors(node.type);

          return (
            <Pressable
              key={node.id}
              onPress={() => handleSelectNode(node)}
              style={[
                styles.nodePill,
                { backgroundColor: colors.bg, borderColor: colors.border },
              ]}
            >
              <View style={[styles.statusDot, { backgroundColor: colors.border }]} />
              <Text numberOfLines={1} style={[styles.nodeText, { color: colors.text }]}>
                {node.name}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Detail Inspector Modal */}
      <Modal
        animationType="fade"
        transparent
        visible={selectedNode !== null}
        onRequestClose={() => setSelectedNode(null)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setSelectedNode(null)}>
          <View style={styles.modalCard}>
            {selectedNode && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>{selectedNode.name}</Text>
                  <Text style={[styles.modalBadge, { color: getNodeColors(selectedNode.type).border }]}>
                    {selectedNode.hazardRisk}
                  </Text>
                </View>
                <Text style={styles.modalBody}>{selectedNode.details}</Text>
                <Pressable style={styles.closeBtn} onPress={() => setSelectedNode(null)}>
                  <Text style={styles.closeBtnText}>Close</Text>
                </Pressable>
              </>
            )}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
    padding: 16,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.06)',
  },
  constellationTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
  },
  constellationSubtitle: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 12,
  },
  orbitField: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    alignItems: 'center',
  },
  nodePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1.5,
    maxWidth: '48%',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  nodeText: {
    fontSize: 12,
    fontWeight: '700',
    flexShrink: 1,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 20,
    width: '100%',
    maxWidth: 360,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  modalHeader: {
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
    textTransform: 'capitalize',
  },
  modalBadge: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 4,
    textTransform: 'uppercase',
  },
  modalBody: {
    fontSize: 14,
    color: '#4b5563',
    lineHeight: 20,
    marginBottom: 18,
  },
  closeBtn: {
    backgroundColor: '#111827',
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  closeBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
});
