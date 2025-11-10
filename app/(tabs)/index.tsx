// index.tsx
import React, { useMemo, useState, useRef } from "react";
import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Modal,
  Platform,
  BackHandler,
  Alert,
  Linking,
  KeyboardAvoidingView,
} from "react-native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeIn } from "react-native-reanimated";

/** Types */
type Figure = {
  id: string;
  name_fr: string;
  name_en: string;
  explanation_fr: string;
  explanation_en: string;
  example_fr: string;
  example_en: string;
};

/** (Conserve ton tableau FIGURES existant ou importe-le) */
const FIGURES: Figure[] = [
  
];

/** Utilitaires de conversion robustes */
const parseInputToDecimal = (value: string, base: "bin" | "oct" | "dec" | "hex") => {
  const v = value.trim();
  if (!v) throw new Error("Entrée vide");
  let dec: number;
  switch (base) {
    case "bin":
      if (!/^[01]+$/.test(v)) throw new Error("Binaire invalide");
      dec = parseInt(v, 2);
      break;
    case "oct":
      if (!/^[0-7]+$/.test(v)) throw new Error("Octal invalide");
      dec = parseInt(v, 8);
      break;
    case "hex":
      if (!/^[0-9a-fA-F]+$/.test(v)) throw new Error("Hexadécimal invalide");
      dec = parseInt(v, 16);
      break;
    default:
      if (!/^[0-9]+$/.test(v)) throw new Error("Décimal invalide");
      dec = parseInt(v, 10);
  }
  if (Number.isNaN(dec)) throw new Error("Valeur invalide");
  return dec;
};

export default function FiguresApp() {
  const [lang, setLang] = useState<"fr" | "en">("fr");
  const [index, setIndex] = useState(0);
  const [showExplain, setShowExplain] = useState(false);
  const [favorites, setFavorites] = useState<Record<string, Figure>>({});
  const [showList, setShowList] = useState(false);
  const [query, setQuery] = useState("");

  // Conversion multi-base state
  const [input, setInput] = useState("");
  const [base, setBase] = useState<"bin" | "dec" | "hex" | "oct">("dec");
  const [result, setResult] = useState("");

  // Calculator modal
  const [calcVisible, setCalcVisible] = useState(false);
  const [calcExpr, setCalcExpr] = useState("");
  const [calcResult, setCalcResult] = useState<string | null>(null);

  const figures = useMemo(() => FIGURES, []);
  const current = figures[index] || figures[0];

  /** Navigation / carousel */
  const next = () => {
    setShowExplain(false);
    setIndex((p) => (p + 1) % figures.length);
  };
  const prev = () => {
    setShowExplain(false);
    setIndex((p) => (p - 1 + figures.length) % figures.length);
  };
  const randomize = () => {
    setShowExplain(false);
    let r = Math.floor(Math.random() * figures.length);
    while (r === index && figures.length > 1) r = Math.floor(Math.random() * figures.length);
    setIndex(r);
  };

  /** Favoris / partage */
  const toggleFavorite = (f: Figure) => {
    setFavorites((prev) => {
      const copy = { ...prev };
      if (copy[f.id]) delete copy[f.id];
      else copy[f.id] = f;
      return copy;
    });
  };
  const shareFigure = async (f: Figure) => {
    const text =
      lang === "fr"
        ? `${f.name_fr} — ${f.example_fr}\n\nExplication: ${f.explanation_fr}`
        : `${f.name_en} — ${f.example_en}\n\nExplanation: ${f.explanation_en}`;
    try {
      await (await import("react-native")).Share.share({ message: text });
    } catch (e) {
      Alert.alert("Share", "Impossible de partager pour le moment.");
    }
  };

  /** Filtre de recherche de la liste */
  const filtered = figures.filter((f) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (
      f.name_fr.toLowerCase().includes(q) ||
      f.name_en.toLowerCase().includes(q) ||
      f.explanation_fr.toLowerCase().includes(q) ||
      f.explanation_en.toLowerCase().includes(q)
    );
  });

  /** Conversion multi-base (bouton Convertir) */
  const convert = () => {
    try {
      const decimalValue = parseInputToDecimal(input, base);
      const res = {
        decimal: decimalValue.toString(10),
        binary: decimalValue.toString(2),
        octal: decimalValue.toString(8),
        hex: decimalValue.toString(16).toUpperCase(),
      };
      setResult(
        `${lang === "fr" ? "Décimal" : "Decimal"}: ${res.decimal}\n${lang === "fr" ? "Binaire" : "Binary"}: ${res.binary}\n${lang === "fr" ? "Octal" : "Octal"}: ${res.octal}\n${lang === "fr" ? "Hexadécimal" : "Hex"}: ${res.hex}`
      );
    } catch (e: any) {
      Alert.alert(lang === "fr" ? "Erreur" : "Error", e.message || "Entrée invalide");
    }
  };

  const reset = () => {
    setInput("");
    setResult("");
  };
  const supprimer = () => {
    setInput((p) => p.slice(0, -1));
  };

  /** Explication ouvre une modal et propose un lien externe */
  const openExplicationLink = async () => {
    // exemple : page wikipédia sur systèmes de numération
    const url = lang === "fr"
      ? "https://fr.wikipedia.org/wiki/Système_de_numération"
      : "https://en.wikipedia.org/wiki/Positional_notation";
    // ouvre le lien si possible
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) await Linking.openURL(url);
      else Alert.alert("Lien", lang === "fr" ? "Impossible d'ouvrir le lien." : "Cannot open the link.");
    } catch {
      Alert.alert("Lien", lang === "fr" ? "Erreur en ouvrant le lien." : "Error opening link.");
    }
  };

  /** À propos => montre modal avec lien vers profil */
  const openAboutLink = async () => {
    const url = "https://github.com/AnnixArt"; 
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) await Linking.openURL(url);
      else Alert.alert("À propos", lang === "fr" ? "Impossible d'ouvrir le lien." : "Cannot open link.");
    } catch {
      Alert.alert("À propos", lang === "fr" ? "Erreur en ouvrant le lien." : "Error opening link.");
    }
  };

  /** Quitter l'app (sur Android) */
  const quitter = () => {
    if (Platform.OS === "android") {
      Alert.alert(
        lang === "fr" ? "Quitter" : "Quit",
        lang === "fr" ? "Voulez-vous quitter l'application ?" : "Do you want to exit the app?",
        [
          { text: lang === "fr" ? "Annuler" : "Cancel", style: "cancel" },
          { text: lang === "fr" ? "Quitter" : "Exit", style: "destructive", onPress: () => BackHandler.exitApp() },
        ]
      );
    } else {
      // iOS: on ne peut pas forcer la fermeture — proposer un message
      Alert.alert(lang === "fr" ? "Quitter" : "Quit", lang === "fr" ? "Sur iOS, fermez l'application depuis le lanceur d'apps." : "On iOS, please close the app from the app switcher.");
    }
  };

  /** CALCULATRICE : fonctions */
  const calcAppend = (s: string) => {
    // empêche deux opérateurs consécutifs
    const last = calcExpr.slice(-1);
    if (/[+\-×÷*/.]/.test(last) && /[+\-×÷*/.]/.test(s)) return;
    setCalcExpr((p) => p + s);
  };
  const calcBack = () => setCalcExpr((p) => p.slice(0, -1));
  const calcClear = () => {
    setCalcExpr("");
    setCalcResult(null);
  };
  const calcEval = () => {
    try {
      if (!calcExpr) return;
      // Normalise : × -> *, ÷ -> /
      const sanitized = calcExpr.replace(/×/g, "*").replace(/÷/g, "/");
      // Sécurité simple: autorise uniquement chiffres, opérateurs basiques, parenthèses et points
      if (!/^[0-9+\-*/().\s]+$/.test(sanitized)) {
        throw new Error(lang === "fr" ? "Expression invalide" : "Invalid expression");
      }
      // eslint-disable-next-line no-new-func
      // NOTE: pour usage local uniquement. Alternative : parser d'expressions.
      const res = Function(`return (${sanitized})`)();
      setCalcResult(String(res));
    } catch (e) {
      Alert.alert(lang === "fr" ? "Erreur" : "Error", (e as any).message || (lang === "fr" ? "Expression invalide" : "Invalid expression"));
    }
  };

  /** UI principal */
  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={styles.root} keyboardShouldPersistTaps="handled">
        <Animated.View entering={FadeIn.duration(350)} style={{ width: "100%" }}>
          <LinearGradient colors={["#0ea5e9", "#6366f1"]} start={[0, 0]} end={[1, 1]} style={styles.header}>
            <Text style={styles.headerTitle}>Convertisseur — Binaire / Hex / Octal / Décimal</Text>
            <View style={styles.headerActions}>
              <TouchableOpacity onPress={() => setLang((l) => (l === "fr" ? "en" : "fr"))} style={styles.langToggle}>
                <Text style={styles.langText}>{lang === "fr" ? "FR" : "EN"}</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </Animated.View>

        <Animated.View entering={FadeIn.duration(400).delay(60)} style={styles.card}>
          <Text style={styles.title}>Veuillez saisir un nombre:  ({base.toUpperCase()})</Text>

          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder={lang === "fr" ? "Entrez un nombre..." : "Enter a number..."}
            placeholderTextColor="#9CA3AF"
            style={styles.input}
            autoCapitalize="none"
            keyboardType="default"
          />

          <View style={styles.row}>
            <TouchableOpacity style={[styles.selector, base === "bin" && styles.selectorActive]} onPress={() => setBase("bin")}>
              <Text style={styles.selectorText}>Binaire</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.selector, base === "oct" && styles.selectorActive]} onPress={() => setBase("oct")}>
              <Text style={styles.selectorText}>Octal</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.selector, base === "dec" && styles.selectorActive]} onPress={() => setBase("dec")}>
              <Text style={styles.selectorText}>Décimal</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.selector, base === "hex" && styles.selectorActive]} onPress={() => setBase("hex")}>
              <Text style={styles.selectorText}>Hexa</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.rowActions}>
            <TouchableOpacity style={styles.primaryBtn} onPress={convert}>
              <Ionicons name="arrow-up-circle" size={18} color="#fff" />
              <Text style={styles.primaryBtnText}>{lang === "fr" ? "Convertir" : "Convert"}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.ghostBtn} onPress={supprimer}>
              <Ionicons name="backspace" size={18} color="#e2404dff" />
              <Text style={[styles.ghostText,{ color: "red" }]}>{lang === "fr" ? "Supprimer" : "Delete"}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.ghostBtn} onPress={reset}>
              <Ionicons name="refresh" size={18} color="#1613b6ff" />
              <Text style={[styles.ghostText, { color: "blue" }]}>{lang === "fr" ? "Réinitialiser" : "Reset"}</Text>

            </TouchableOpacity>
          </View>

          {result ? (
            <View style={styles.resultBox}>
              <Text style={styles.resultTitle}>{lang === "fr" ? "Résultat" : "Result"}</Text>
              <Text style={styles.resultText}>{result}</Text>
            </View>
          ) : null}
        </Animated.View>

        {/* Liens / actions pro */}
        <Animated.View entering={FadeIn.duration(450).delay(120)} style={styles.linksCard}>
          <TouchableOpacity style={styles.linkRow} onPress={() => { setShowExplain(true); }}>
            <Ionicons name="book" size={18} color="#0b1220" />
            <Text style={styles.linkText}>{lang === "fr" ? "Explication (détails)" : "Explanation (details)"}</Text>
            <TouchableOpacity onPress={openExplicationLink}>
              <MaterialIcons name="open-in-new" size={18} color="#0b1220" />
            </TouchableOpacity>
          </TouchableOpacity>

          <TouchableOpacity style={styles.linkRow} onPress={openAboutLink}>
            <Ionicons name="information-circle" size={18} color="#0b1220" />
            <Text style={styles.linkText}>{lang === "fr" ? "À propos / Contact" : "About / Contact"}</Text>
            <MaterialIcons name="open-in-new" size={18} color="#0b1220" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.linkRow} onPress={() => setCalcVisible(true)}>
            <Ionicons name="calculator" size={18} color="#0b1220" />
            <Text style={styles.linkText}>{lang === "fr" ? "Calculatrice intégrée" : "Built-in Calculator"}</Text>
            <Text style={styles.badge}>{lang === "fr" ? "Nouveau" : "New"}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.linkRow} onPress={quitter}>
            <Ionicons name="exit" size={18} color="#ef4444" />
            <Text style={[styles.linkText, { color: "#ef4444" }]}>{lang === "fr" ? "Quitter" : "Exit"}</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Modal Explication (UI locale) */}
        <Modal visible={showExplain} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.modalBox}>
              <Text style={styles.modalTitle}>{lang === "fr" ? "Explication" : "Explanation"}</Text>
              <ScrollView style={{ maxHeight: 320 }}>
                <Text style={styles.modalText}>
                  {lang === "fr"
                    ? "Ce convertisseur permet de convertir les nombres entre systèmes: binaire (base 2), octal (base 8), décimal (base 10) et hexadécimal (base 16). Appuyez sur l'icône pour ouvrir une ressource externe pour en savoir plus."
                    : "This converter coners numbers between binary (base 2), octal (base 8), decimal (base 10) and hexadecimal (base 16). Tap the icon to open an external resource for more information."}
                </Text>
              </ScrollView>

              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.modalBtn} onPress={() => { setShowExplain(false); }}>
                  <Text style={styles.modalBtnText}>{lang === "fr" ? "Fermer" : "Close"}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.modalBtn, { backgroundColor: "#2563eb" }]} onPress={openExplicationLink}>
                  <Text style={styles.modalBtnText}>{lang === "fr" ? "Ouvrir ressource" : "Open resource"}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* CALCULATRICE MODAL */}
        <Modal visible={calcVisible} animationType="slide" transparent>
          <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === "ios" ? "padding" : undefined}>
            <View style={[styles.modalBox, { width: "94%", maxWidth: 820 }]}>
            <Text style={{textAlign: "center", textAlignVertical: "center", fontWeight: "900", fontSize: 22, color: "#071233",}}>{lang === "fr" ? "Calculatrice" : "Calculator"}
            </Text>
              <View style={styles.calcDisplay}>
                <Text style={styles.calcExpr} numberOfLines={1}>{calcExpr || "0"}</Text>
                <Text style={styles.calcResult}>{calcResult ?? ""}</Text>
              </View>

              {/* keypad */}
              <View style={styles.keypad}>
                {[
                  ["7", "8", "9", "÷"],
                  ["4", "5", "6", "×"],
                  ["1", "2", "3", "-"],
                  [".", "0", "⌫", "+"],
                ].map((row, rIdx) => (
                  <View key={rIdx} style={styles.keypadRow}>
                    {row.map((key) => (
                      <TouchableOpacity
                        key={key}
                        onPress={() => {
                          if (key === "⌫") calcBack();
                          else if (key === "+") calcAppend("+");
                          else if (key === "-") calcAppend("-");
                          else if (key === "×") calcAppend("×");
                          else if (key === "÷") calcAppend("÷");
                          else calcAppend(key);
                        }}
                        style={[styles.key]}
                      >
                        <Text style={styles.keyText}>{key}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                ))}
              </View>

              <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 12 }}>
                <TouchableOpacity style={[styles.modalBtn, { backgroundColor: "#ef4444" }]} onPress={calcClear}>
                  <Text style={styles.modalBtnText}>{lang === "fr" ? "C" : "C"}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.modalBtn, { backgroundColor: "#059669", flex: 1, marginLeft: 8 }]} onPress={calcEval}>
                  <Text style={{ textAlign: "center", textAlignVertical: "center", fontWeight: "bold", fontSize: 20, color: "#fff" }}>
               {lang === "fr" ? "=" : "="}
              </Text>
              </TouchableOpacity>
                <TouchableOpacity style={[styles.modalBtn, { backgroundColor: "#1f2937", marginLeft: 8 }]} onPress={() => { setCalcVisible(false); }}>
                  <Text style={styles.modalBtnText}>{lang === "fr" ? "Fermer" : "Close"}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </Modal>
      </ScrollView>
    </SafeAreaView>
  );
}

/** Styles modernes et pro */
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#071233" },
  root: {
   alignItems: "center",
  justifyContent: "center", // centre verticalement le contenu
  flexGrow: 1,               // permet au ScrollView de remplir l'espace
  padding: 16,
  paddingBottom: 40,
  paddingTop: 30,  
  
  },
  header: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 14,
  },
  headerTitle: { color: "#f1f2f7ff", fontSize: 19, fontWeight: "900", textAlign:"center" },
  headerActions: { flexDirection: "row", alignItems: "center" },
  langToggle: { backgroundColor: "#0b1220", padding: 6, borderRadius: 8 },
  langText: { color: "#fff", fontWeight: "800" },

  card: {
    width: "100%",
    backgroundColor: "#071233",
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 6,
  },
  title: { color: "#2fe74eff", fontSize: 18, fontWeight: "900", marginBottom: 10 ,textAlign:"center" },
  input: {
    backgroundColor: "#0b2236",
    color: "#fff",
    padding: 12,
    borderRadius: 10,
    fontSize: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#083344",
  },
  row: { flexDirection: "row", justifyContent: "space-between" },
  selector: {
    flex: 1,
    marginHorizontal: 4,
    padding: 10,
    backgroundColor: "#060d1dff",
    borderRadius: 8,
    alignItems: "center",
  },
  selectorActive: { backgroundColor: "#1e40af" },
  selectorText: { color: "#fff", fontWeight: "800" },

  rowActions: { flexDirection: "row", marginTop: 12, alignItems: "center", justifyContent: "space-between" },
  primaryBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#06b6d4",
    padding: 12,
    borderRadius: 10,
    justifyContent: "center",
    marginRight: 8,
  },
  primaryBtnText: { color: "#f8f3f6ff", marginLeft: 8, fontWeight: "900" },
  ghostBtn: {
    padding: 10,
    borderRadius: 10,
    backgroundColor: "#e6f6ff",
    alignItems: "center",
    justifyContent: "center",
    minWidth: 92,
    marginLeft: 4,
  },
  ghostText: { color: "#0369a1", fontWeight: "800" },

  resultBox: { marginTop: 12, backgroundColor: "#000207ff", padding: 12, borderRadius: 8, borderWidth: 1, borderColor: "#083344" },
  resultTitle: { color: "#e1e458ff", fontWeight: "900", marginBottom: 6 , fontSize:17},
  resultText: { color: "#cbeafe", fontWeight: "700",fontSize:16 },

  linksCard: {
    width: "100%",
    backgroundColor: "#eef2ff",
    borderRadius: 12,
    padding: 10,
    marginBottom: 16,
  },
  linkRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 8 },
  linkText: { color: "#071233", fontWeight: "800", flex: 1, marginLeft: 10 },
  badge: { backgroundColor: "#fde68a", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20, fontWeight: "800" },

  modalOverlay: { flex: 1, backgroundColor: "rgba(3,7,18,0.7)", justifyContent: "center", alignItems: "center", padding: 16 },
  modalBox: { width: "100%", maxWidth: 760, backgroundColor: "#fff", borderRadius: 12, padding: 14 },
  modalTitle: { fontSize: 18, fontWeight: "900", color: "#071233", marginBottom: 8 },
  modalText: { fontSize: 14, color: "#374151", lineHeight: 20 },
  modalActions: { flexDirection: "row", justifyContent: "flex-end", marginTop: 12, gap: 8 },
  modalBtn: { backgroundColor: "#0b1220", paddingVertical: 10, paddingHorizontal: 12, borderRadius: 10, marginLeft: 8 },
  modalBtnText: { color: "#fff", fontWeight: "800" },

  /* Calculatrice styles */
  calcDisplay: { backgroundColor: "#081124", padding: 12, borderRadius: 10, marginBottom: 12 },
  calcExpr: { color: "#cbd5e1", fontSize: 20, textAlign: "right", fontWeight: "700" },
  calcResult: { color: "#93c5fd", fontSize: 18, textAlign: "right", marginTop: 6 },

  keypad: { marginTop: 6 },
  keypadRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  key: { flex: 1, marginHorizontal: 6, backgroundColor: "#0f172a", padding: 14, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  keyText: { color: "#fff", fontSize: 18, fontWeight: "900" },

});
