import React from "react";
import { Canvas } from "react-three-fiber";
import Box from "./components/Box";
import styles from "./styles/App.module.scss";

function App() {
  return (
    <Canvas className={styles.canvas}>
      <ambientLight />
      <pointLight position={[10, 10, 10]} />
      <Box position={[-1.2, 0, 0]} />
      <Box position={[1.2, 0, 0]} />
    </Canvas>
  );
}

export default App;
