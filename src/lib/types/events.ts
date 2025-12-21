/**
 * Типи для обробників подій
 */

export type ClickHandler = (event: MouseEvent) => void;
export type KeyboardHandler = (event: KeyboardEvent) => void;
export type SubmitHandler = (event: SubmitEvent) => void;
export type InputHandler = (event: Event & { currentTarget: EventTarget & HTMLInputElement }) => void;
export type ChangeHandler = (event: Event & { currentTarget: EventTarget & HTMLInputElement }) => void;
