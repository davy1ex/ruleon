import { Capacitor } from "@capacitor/core";
import { Keyboard } from "@capacitor/keyboard";
import { useEffect, useState, type CSSProperties } from "react";

export const MOBILE_NAV_HEIGHT = 56;
export const MOBILE_TOOLBAR_HEIGHT = 48;

const KEYBOARD_OPEN_THRESHOLD_PX = 50;

export interface MobileToolbarLayout {
  toolbarStyle: CSSProperties;
  keyboardOpen: boolean;
  mainPaddingBottom: number;
}

function getVisualViewportInset(): number {
  const vv = window.visualViewport;
  if (!vv) {
    return 0;
  }
  return Math.max(0, window.innerHeight - vv.offsetTop - vv.height);
}

function computeToolbarLayout(
  focused: boolean,
  nativeKeyboardHeight: number,
): MobileToolbarLayout {
  if (!focused) {
    return {
      toolbarStyle: { bottom: MOBILE_NAV_HEIGHT, top: "auto" },
      keyboardOpen: false,
      mainPaddingBottom: MOBILE_NAV_HEIGHT,
    };
  }

  const bottomInset = Math.max(getVisualViewportInset(), nativeKeyboardHeight);
  const keyboardOpen = bottomInset > KEYBOARD_OPEN_THRESHOLD_PX;

  if (keyboardOpen) {
    return {
      toolbarStyle: {
        bottom: bottomInset,
        top: "auto",
        transition: "bottom 0.1s ease-out",
      },
      keyboardOpen: true,
      mainPaddingBottom: bottomInset + MOBILE_TOOLBAR_HEIGHT + 8,
    };
  }

  return {
    toolbarStyle: {
      bottom: MOBILE_NAV_HEIGHT,
      top: "auto",
      transition: "bottom 0.1s ease-out",
    },
    keyboardOpen: false,
    mainPaddingBottom: MOBILE_NAV_HEIGHT + MOBILE_TOOLBAR_HEIGHT + 8,
  };
}

export function useMobileToolbarLayout(focused: boolean): MobileToolbarLayout {
  const [nativeKeyboardHeight, setNativeKeyboardHeight] = useState(0);
  const [layout, setLayout] = useState(() =>
    computeToolbarLayout(focused, 0),
  );

  useEffect(() => {
    const update = () => {
      setLayout(computeToolbarLayout(focused, nativeKeyboardHeight));
    };

    update();

    const vv = window.visualViewport;
    vv?.addEventListener("resize", update);
    vv?.addEventListener("scroll", update);
    window.addEventListener("resize", update);
    window.addEventListener("orientationchange", update);

    return () => {
      vv?.removeEventListener("resize", update);
      vv?.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
      window.removeEventListener("orientationchange", update);
    };
  }, [focused, nativeKeyboardHeight]);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    const showHandle = Keyboard.addListener("keyboardWillShow", (info) => {
      setNativeKeyboardHeight(info.keyboardHeight);
    });
    const hideHandle = Keyboard.addListener("keyboardWillHide", () => {
      setNativeKeyboardHeight(0);
    });

    return () => {
      void showHandle.then((handle) => handle.remove());
      void hideHandle.then((handle) => handle.remove());
    };
  }, []);

  return layout;
}
