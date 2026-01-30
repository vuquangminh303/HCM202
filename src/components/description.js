import React from "react";

import { useStateValue } from "../state";
import Link from "./link";

export default function Description() {
  const [{ config }] = useStateValue();

  return (
    <>
      Khám phá hành trình vạn dặm và sự kết tinh của Tư tưởng Hồ Chí Minh qua
      không gian 3D.
    </>
  );
}
