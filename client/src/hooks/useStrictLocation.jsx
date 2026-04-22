import { useState, useCallback, useRef } from 'react';

/**
 * useStrictLocation — Centralized geolocation gating hook.
 *
 * Returns:
 *   - requestLocation(actionCallback): wraps any action requiring GPS coords.
 *     If coords are successfully obtained, calls actionCallback({ latitude, longitude }).
 *     Otherwise, surfaces modal state for the user to interact with.
 *   - locationModal: state object to drive the LocationPermissionModal component.
 *   - dismissModal(): hides the modal.
 */
export const useStrictLocation = () => {
    const [modalState, setModalState] = useState({
        visible: false,
        mode: null,        // 'prompt' | 'denied' | 'fetching' | 'error'
        errorMessage: null,
    });

    // Store the pending callback so we can retry without re-calling the parent
    const pendingCallbackRef = useRef(null);

    const dismissModal = useCallback(() => {
        setModalState({ visible: false, mode: null, errorMessage: null });
        pendingCallbackRef.current = null;
    }, []);

    /**
     * Attempt to acquire GPS and invoke actionCallback({ latitude, longitude }).
     */
    const acquirePosition = useCallback(async (actionCallback) => {
        // Guard: no geolocation support at all
        if (!navigator.geolocation) {
            setModalState({
                visible: true,
                mode: 'error',
                errorMessage: 'Your browser does not support geolocation. Please use a modern browser (Chrome, Firefox, Safari).',
            });
            return;
        }

        setModalState({ visible: true, mode: 'fetching', errorMessage: null });

        try {
            const position = await new Promise((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 0,
                });
            });

            const coords = {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
            };

            // Success — dismiss modal and fire the callback
            setModalState({ visible: false, mode: null, errorMessage: null });
            actionCallback(coords);
        } catch (err) {
            // err.code: 1 = PERMISSION_DENIED, 2 = POSITION_UNAVAILABLE, 3 = TIMEOUT
            if (err.code === 1) {
                setModalState({
                    visible: true,
                    mode: 'denied',
                    errorMessage: null,
                });
            } else {
                setModalState({
                    visible: true,
                    mode: 'error',
                    errorMessage: err.code === 3
                        ? 'Location request timed out. Please ensure GPS is enabled and try again.'
                        : 'Unable to determine your position. Please check your device location settings.',
                });
            }
        }
    }, []);

    /**
     * Main entry point. Wraps an action with GPS enforcement.
     * Usage:  requestLocation(({ latitude, longitude }) => { ... })
     */
    const requestLocation = useCallback(async (actionCallback) => {
        pendingCallbackRef.current = actionCallback;

        // If Permissions API is available, query state first to show the right modal
        if (navigator.permissions) {
            try {
                const permStatus = await navigator.permissions.query({ name: 'geolocation' });

                if (permStatus.state === 'denied') {
                    setModalState({ visible: true, mode: 'denied', errorMessage: null });
                    return;
                }

                if (permStatus.state === 'prompt') {
                    setModalState({ visible: true, mode: 'prompt', errorMessage: null });
                    return;
                }

                // 'granted' — go directly to acquisition
                await acquirePosition(actionCallback);
                return;
            } catch {
                // permissions.query might throw for 'geolocation' in some browsers (e.g. Safari)
                // Fall through to direct acquisition
            }
        }

        // Fallback: no Permissions API — jump straight to getCurrentPosition
        await acquirePosition(actionCallback);
    }, [acquirePosition]);

    /**
     * Called when the user clicks "Allow" in prompt mode, or "Retry" in error mode.
     */
    const handleAllow = useCallback(async () => {
        if (pendingCallbackRef.current) {
            await acquirePosition(pendingCallbackRef.current);
        }
    }, [acquirePosition]);

    return {
        requestLocation,
        locationModal: {
            ...modalState,
            onAllow: handleAllow,
            onDismiss: dismissModal,
        },
        dismissModal,
    };
};
