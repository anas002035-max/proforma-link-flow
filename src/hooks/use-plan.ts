/** Plan gate. All premium tools are unlocked in this build. */
export function usePlan() {
  return {
    isLoading: false,
    signedIn: true,
    isPro: true,
    devPro: false,
  };
}
