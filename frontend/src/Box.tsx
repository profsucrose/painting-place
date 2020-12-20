import ReactDOM from "react-dom";
import React, { useRef, useState } from "react";
import { Canvas, useFrame } from "react-three-fiber";

export default function Box(props: object) {
  const mesh = useRef();

  const [hovered, setHover] = useState(false);
  const [active, setActive] = useState(false);

  useFrame(() => {
    if (mesh.current)
        mesh.current.rotation.x += 0.01
        mesh.current.rotation.x += 0.01
  });
}
