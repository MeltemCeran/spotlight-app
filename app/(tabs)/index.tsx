import { View } from "react-native";
import { styles } from "../../styles/auth.styles";
import { Link } from "expo-router";

export default function Index() {
  return (
    <View style={styles.container}>
      <Link href={"/notifications"}>Feed screen in tabs</Link>
      {/* <Text style={styles.title}>Hello</Text> */}
      {/* <TouchableOpacity onPress={() => alert("you touched")}>
        <Text>Press Me</Text>
      </TouchableOpacity>

      <Pressable onPress={() => alert("you touched")}>
        <Text>Press Me-pressable</Text>
      </Pressable> */}
      {/* touchable ve pressable arasındaki fark touchablede tıklandığında text üzerinde renk değişimi oluyor. */}

      {/* <Image
        source={require("../assets/images/icon.png")}
        style={{ width: 100, height: 100 }}
      /> */}

      {/* <Image
        source={{
          uri: "https://images.unsplash.com/photo-1741070487520-907d1359cb95?q=80&w=1374&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        }}
        style={{
          width: 200,
          height: 200,
          resizeMode: "cover",
        }} */}
      {/* /> */}
    </View>
  );
}
