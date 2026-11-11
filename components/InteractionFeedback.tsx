"use client";

import { useEffect } from "react";

type ToneType = "tap" | "correct" | "incorrect";

const createTone = (type: ToneType) => {
  if (typeof window === "undefined") return;

  const AudioCtor = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtor) return;

  const context = new AudioCtor();
  const oscillator = context.createOscillator();
  const gainNode = context.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(context.destination);

  if (type === "tap") {
    oscillator.type = "triangle";
    oscillator.frequency.setValueAtTime(620, context.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(980, context.currentTime + 0.06);
    gainNode.gain.setValueAtTime(0.0001, context.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.05, context.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.12);
    oscillator.start();
    oscillator.stop(context.currentTime + 0.14);
  }

  if (type === "correct") {
    const notes = [
      { frequency: 523.25, start: 0, duration: 0.28 },
      { frequency: 659.25, start: 0.12, duration: 0.3 },
      { frequency: 783.99, start: 0.24, duration: 0.34 },
    ];

    notes.forEach(({ frequency, start, duration }) => {
      const noteOsc = context.createOscillator();
      const noteGain = context.createGain();
      noteOsc.type = "triangle";
      noteOsc.frequency.setValueAtTime(frequency, context.currentTime + start);
      noteGain.gain.setValueAtTime(0.0001, context.currentTime + start);
      noteGain.gain.exponentialRampToValueAtTime(0.08, context.currentTime + start + 0.04);
      noteGain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + start + duration);
      noteOsc.connect(noteGain);
      noteGain.connect(context.destination);
      noteOsc.start(context.currentTime + start);
      noteOsc.stop(context.currentTime + start + duration);
    });
  }

  if (type === "incorrect") {
    oscillator.type = "sawtooth";
    oscillator.frequency.setValueAtTime(180, context.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(90, context.currentTime + 0.14);
    gainNode.gain.setValueAtTime(0.0001, context.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.04, context.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.16);
    oscillator.start();
    oscillator.stop(context.currentTime + 0.17);
  }

  void context.resume();
  setTimeout(() => {
    void context.close();
  }, 250);
};

const playClickSound = () => createTone("tap");

export function InteractionFeedback() {
  useEffect(() => {
    const selector = "button, a, input, select, textarea, [role='button'], .btn";

    const getClosestInteractiveElement = (target: EventTarget | null) => {
      if (!(target instanceof Element)) return null;
      return target.closest(selector) as HTMLElement | null;
    };

    const clearPressedState = (element: HTMLElement | null) => {
      if (!element || element.closest("[data-no-feedback]")) return;
      element.classList.remove("interaction-pressed");
    };

    const setPressedState = (target: EventTarget | null) => {
      const element = getClosestInteractiveElement(target);
      if (!element || element.closest("[data-no-feedback]")) return;

      element.classList.add("interaction-pressed");
      playClickSound();
    };

    const handlePointerDown = (event: Event) => {
      setPressedState(event.target);
    };

    const handlePointerUp = (event: Event) => {
      const element = getClosestInteractiveElement(event.target);
      clearPressedState(element);
    };

    const handlePointerLeave = (event: Event) => {
      const element = getClosestInteractiveElement(event.target);
      clearPressedState(element);
    };

    const handlePointerCancel = (event: Event) => {
      const element = getClosestInteractiveElement(event.target);
      clearPressedState(element);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as EventTarget | null;
      const element = getClosestInteractiveElement(target);

      if (!element || !["Enter", " ", "Spacebar"].includes(event.key)) return;
      if (element.closest("[data-no-feedback]")) return;

      element.classList.add("interaction-pressed");
      playClickSound();
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      const target = event.target as EventTarget | null;
      const element = getClosestInteractiveElement(target);
      if (!element) return;
      element.classList.remove("interaction-pressed");
    };

    const handleResultSound = (event: Event) => {
      const customEvent = event as CustomEvent<{ type?: ToneType }>;
      const type = customEvent.detail?.type ?? "tap";
      if (type === "correct" || type === "incorrect") {
        createTone(type);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown, { passive: true });
    document.addEventListener("pointerup", handlePointerUp, { passive: true });
    document.addEventListener("pointerleave", handlePointerLeave, { passive: true });
    document.addEventListener("pointercancel", handlePointerCancel, { passive: true });
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("keyup", handleKeyUp);
    document.addEventListener("app:result-sound", handleResultSound as EventListener);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("pointerup", handlePointerUp);
      document.removeEventListener("pointerleave", handlePointerLeave);
      document.removeEventListener("pointercancel", handlePointerCancel);
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("keyup", handleKeyUp);
      document.removeEventListener("app:result-sound", handleResultSound as EventListener);
    };
  }, []);

  return null;
}
