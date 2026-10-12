/** Focusable descendants in DOM order, skipping hidden and inert subtrees. */
export declare function getFocusable(container: HTMLElement): HTMLElement[];
/** Keep Tab / Shift+Tab inside `container`. Returns a cleanup function. */
export declare function trapFocus(container: HTMLElement): () => void;
/** Prevent the page behind a modal from scrolling. Returns a cleanup function. */
export declare function lockScroll(): () => void;
