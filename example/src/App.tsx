import { useState } from "react";
import { ScrollView, StatusBar, StyleSheet, Text, View } from "react-native";
import { Focusable, FocusGroup, useGamepad } from "react-native-gamepad";

interface Platform {
  id: string;
  name: string;
  color: string;
}

const PLATFORMS: Platform[] = [
  { id: "nes", name: "NES", color: "#e60012" },
  { id: "snes", name: "SNES", color: "#7b2cbf" },
  { id: "megadrive", name: "MD", color: "#1d3557" },
  { id: "pcengine", name: "PCE", color: "#f4a261" },
  { id: "gb", name: "GB", color: "#2a9d8f" },
  { id: "gba", name: "GBA", color: "#e9c46a" },
  { id: "psx", name: "PS1", color: "#457b9d" },
  { id: "n64", name: "N64", color: "#264653" },
  { id: "saturn", name: "SS", color: "#5390d9" },
  { id: "dreamcast", name: "DC", color: "#fca311" },
  { id: "arcade", name: "ARC", color: "#ff006e" },
  { id: "chip8", name: "CHIP", color: "#8d99ae" },
];

export default function App() {
  const [launched, setLaunched] = useState<string | null>(null);
  const gamepad = useGamepad();

  const held = Object.entries(gamepad.pressed)
    .filter(([, isDown]) => isDown)
    .map(([name]) => name);

  const lastEvent =
    gamepad.lastEvent == null
      ? "—"
      : gamepad.lastEvent.kind === "key"
        ? `${gamepad.lastEvent.action} ${gamepad.lastEvent.name}`
        : "axes move";

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <Text style={styles.title}>React Native Gamepad</Text>
        <Text style={styles.subtitle}>
          {launched
            ? `Launched: ${launched}`
            : "D-pad / arrows: move · A / Enter: select · B: back"}
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.gridWrap}>
        <FocusGroup columns={4} count={PLATFORMS.length}>
          {PLATFORMS.map((platform, index) => (
            <Focusable
              key={platform.id}
              index={index}
              onPress={() => {
                gamepad.vibrate({
                  strength: 20,
                });
                setLaunched(platform.name);
              }}
              style={({ focused }) => [
                styles.cell,
                { backgroundColor: platform.color },
                focused && styles.cellFocused,
              ]}
            >
              <Text style={styles.cellLabel}>{platform.name}</Text>
            </Focusable>
          ))}
        </FocusGroup>
      </ScrollView>

      <View style={styles.gamepadPanel}>
        <Text style={styles.panelLine} numberOfLines={1}>
          pressed: [{held.length > 0 ? held.join(", ") : "—"}]
        </Text>
        <Text style={styles.panelLine} numberOfLines={1}>
          axes: L({gamepad.axes.leftX.toFixed(2)},{" "}
          {gamepad.axes.leftY.toFixed(2)}) R(
          {gamepad.axes.rightX.toFixed(2)}, {gamepad.axes.rightY.toFixed(2)}) L2{" "}
          {gamepad.axes.l2.toFixed(2)} R2 {gamepad.axes.r2.toFixed(2)}
        </Text>
        <Text style={styles.panelLine} numberOfLines={1}>
          last: {lastEvent}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#101014",
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 12,
  },
  title: {
    color: "#ffffff",
    fontSize: 22,
    fontWeight: "700",
  },
  subtitle: {
    color: "#9a9aa5",
    fontSize: 13,
    marginTop: 4,
  },
  gridWrap: {
    padding: 16,
  },
  cell: {
    width: 84,
    height: 84,
    margin: 6,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  cellFocused: {
    borderWidth: 3,
    borderColor: "#ffffff",
    shadowColor: "#ffffff",
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 8,
  },
  cellLabel: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 14,
  },
  gamepadPanel: {
    borderTopWidth: 1,
    borderTopColor: "#26262e",
    backgroundColor: "#16161c",
    padding: 16,
    gap: 4,
  },
  panelTitle: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  panelLine: {
    color: "#9a9aa5",
    fontSize: 12,
    fontFamily: "monospace",
  },
});
